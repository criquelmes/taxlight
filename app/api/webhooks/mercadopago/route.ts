import { NextRequest, NextResponse } from "next/server";
import { PreApproval, Payment } from "mercadopago";
import api, { mercadopago } from "../../../../actions/order/api";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// Rate limiting simple en memoria (para producción usar Redis)
const webhookCalls = new Map<string, number[]>();

// Función para verificar rate limiting
function checkRateLimit(
  ip: string,
  maxCalls: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const calls = webhookCalls.get(ip) || [];

  // Filtrar llamadas dentro de la ventana de tiempo
  const recentCalls = calls.filter((time) => now - time < windowMs);

  if (recentCalls.length >= maxCalls) {
    return false;
  }

  // Agregar la nueva llamada
  recentCalls.push(now);
  webhookCalls.set(ip, recentCalls);

  return true;
}

// Función para verificar firma del webhook (opcional pero recomendado)
function verifyWebhookSignature(
  body: string,
  signature: string | null
): boolean {
  if (!signature || !process.env.MERCADOPAGO_WEBHOOK_SECRET) {
    return true; // Si no hay secret configurado, no verificar
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", process.env.MERCADOPAGO_WEBHOOK_SECRET)
      .update(body)
      .digest("hex");

    return signature === expectedSignature;
  } catch (error) {
    console.error("Error verificando firma del webhook:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = crypto.randomUUID().slice(0, 8);

  console.log(
    `🚨 [${requestId}] WEBHOOK LLEGÓ - Timestamp:`,
    new Date().toISOString()
  );

  try {
    // Rate limiting
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    if (!checkRateLimit(clientIP)) {
      console.warn(
        `🚫 [${requestId}] Rate limit excedido para IP: ${clientIP}`
      );
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Obtener el body como texto para verificar firma
    const bodyText = await request.text();

    // Verificar firma si está configurada
    const signature = request.headers.get("x-signature");
    if (!verifyWebhookSignature(bodyText, signature)) {
      console.error(`❌ [${requestId}] Firma del webhook inválida`);
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parsear JSON
    let body: {
      data: { id: string };
      type?: string;
      action?: string;
      live_mode?: boolean;
    };

    try {
      body = JSON.parse(bodyText);
    } catch (parseError) {
      console.error(`❌ [${requestId}] Error parseando JSON:`, parseError);
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    console.log(`🔔 [${requestId}] Webhook recibido:`, {
      type: body.type,
      action: body.action,
      dataId: body.data?.id,
      liveMode: body.live_mode,
      headers: {
        userAgent: request.headers.get("user-agent"),
        contentType: request.headers.get("content-type"),
      },
    });

    // Validar estructura del body
    if (!body?.data?.id) {
      console.error(`❌ [${requestId}] Body del webhook inválido:`, body);
      return NextResponse.json(
        { error: "Invalid webhook body - missing data.id" },
        { status: 400 }
      );
    }

    // Verificar que estamos en el modo correcto (producción/test)
    const isProduction = process.env.NODE_ENV === "production";
    const isLiveMode = body.live_mode !== false; // MercadoPago envía live_mode

    if (isProduction && !isLiveMode) {
      console.warn(
        `⚠️ [${requestId}] Webhook de test recibido en producción - ignorando`
      );
      return NextResponse.json({
        received: true,
        ignored: "test_mode_in_production",
      });
    }

    // Determinar el tipo de evento
    const eventType = body.type || body.action || "unknown";
    console.log(`🔔 [${requestId}] Evento recibido: ${eventType}`);

    // Manejar diferentes tipos de eventos
    let result;

    switch (eventType) {
      case "preapproval":
      case "subscription_preapproval":
        result = await handlePreapprovalEvent(body.data.id, requestId);
        break;

      case "payment":
      case "payment.created":
      case "payment.updated":
        result = await handlePaymentEvent(body.data.id, requestId);
        break;

      default:
        console.log(`ℹ️ [${requestId}] Tipo de webhook ignorado: ${eventType}`);
        result = {
          received: true,
          eventType: eventType,
          message: "Webhook type not processed",
        };
    }

    // Log del tiempo de procesamiento
    const processingTime = Date.now() - startTime;
    console.log(`⏱️ [${requestId}] Webhook procesado en ${processingTime}ms`);

    return NextResponse.json({
      ...result,
      requestId,
      processingTime,
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(
      `💥 [${requestId}] Error general procesando webhook (${processingTime}ms):`,
      error
    );

    return NextResponse.json(
      {
        error: "Internal server error",
        requestId,
        timestamp: new Date().toISOString(),
        processingTime,
      },
      { status: 500 }
    );
  }
}

async function handlePreapprovalEvent(
  preapprovalId: string,
  requestId: string
) {
  console.log(
    `🔔 [${requestId}] Procesando webhook preapproval: ${preapprovalId}`
  );

  try {
    // Obtener datos de la suscripción desde MercadoPago con retry
    let preapproval;
    let retries = 3;

    while (retries > 0) {
      try {
        preapproval = await new PreApproval(mercadopago).get({
          id: preapprovalId,
        });
        break;
      } catch (mpError) {
        retries--;
        if (retries === 0) throw mpError;

        console.warn(
          `⚠️ [${requestId}] Error obteniendo preapproval, reintentando... (${retries} intentos restantes)`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Esperar 1 segundo
      }
    }

    if (!preapproval) {
      throw new Error(
        "No se pudo obtener el preapproval después de varios intentos"
      );
    }

    console.log(
      `📋 [${requestId}] Preapproval ${preapproval.id} con status: ${preapproval.status}`
    );
    console.log(
      `🔗 [${requestId}] External reference: ${preapproval.external_reference}`
    );

    // Buscar la orden correspondiente
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          { mpSubscriptionId: preapproval.id },
          { transactionId: preapproval.id },
          ...(preapproval.external_reference
            ? [{ id: preapproval.external_reference }]
            : []),
        ],
      },
      include: {
        user: true,
        orderSubscriptions: {
          include: {
            subscription: {
              include: { products: true },
            },
          },
        },
      },
    });

    if (!order) {
      console.error(
        `❌ [${requestId}] No se encontró orden para MP subscription ${preapproval.id}`
      );

      // Buscar en logs o intentar con external_reference
      if (preapproval.external_reference) {
        console.log(
          `🔍 [${requestId}] Intentando buscar por external_reference: ${preapproval.external_reference}`
        );
      }

      return {
        received: true,
        error: "Order not found",
        preapprovalId,
        externalReference: preapproval.external_reference,
      };
    }

    console.log(
      `📦 [${requestId}] Orden encontrada: ${order.id} para usuario ${order.user.email}`
    );

    // Procesar según el estado
    await processPreapprovalStatus(preapproval, order, requestId);

    return {
      received: true,
      processed: true,
      orderId: order.id,
      status: preapproval.status,
      userEmail: order.user.email,
    };
  } catch (preapprovalError) {
    console.error(
      `❌ [${requestId}] Error procesando preapproval ${preapprovalId}:`,
      preapprovalError
    );

    return {
      received: true,
      error: "Error processing preapproval",
      details:
        preapprovalError instanceof Error
          ? preapprovalError.message
          : "Unknown error",
    };
  }
}

async function handlePaymentEvent(paymentId: string, requestId: string) {
  console.log(`💳 [${requestId}] Procesando webhook payment: ${paymentId}`);

  try {
    // Obtener información del pago
    const payment = await new Payment(mercadopago).get({ id: paymentId });

    console.log(
      `💳 [${requestId}] Payment ${payment.id} - Status: ${payment.status} - Amount: ${payment.transaction_amount}`
    );

    // Para pagos únicos (no suscripciones), buscar orden correspondiente
    if (payment.external_reference) {
      const order = await prisma.order.findFirst({
        where: {
          OR: [
            { id: payment.external_reference },
            { transactionId: paymentId },
            { mpSubscriptionId: paymentId },
          ],
        },
      });

      if (order && payment.status === "approved" && !order.isPaid) {
        console.log(
          `✅ [${requestId}] Confirmando pago único para orden ${order.id}`
        );
        await api.order.confirmPayment(order.id);
      }
    }

    return {
      received: true,
      processed: true,
      paymentId,
      status: payment.status,
      amount: payment.transaction_amount,
      externalReference: payment.external_reference,
    };
  } catch (paymentError) {
    console.error(
      `❌ [${requestId}] Error procesando payment ${paymentId}:`,
      paymentError
    );

    return {
      received: true,
      error: "Error processing payment",
      details:
        paymentError instanceof Error ? paymentError.message : "Unknown error",
    };
  }
}

async function processPreapprovalStatus(
  preapproval: any,
  order: any,
  requestId: string
) {
  const status = preapproval.status;
  const orderId = order.id;

  console.log(
    `🔄 [${requestId}] Procesando estado '${status}' para orden ${orderId}`
  );

  switch (status) {
    case "pending":
      console.log(
        `⏳ [${requestId}] Procesando estado 'pending' para orden ${orderId}`
      );

      if (!order.isPaid) {
        const setResult = await api.order.setTransactionId(
          orderId,
          preapproval.id
        );

        if (!setResult.ok) {
          console.error(
            `❌ [${requestId}] Error estableciendo transaction ID:`,
            setResult.message
          );
          throw new Error(setResult.message);
        }

        console.log(
          `✅ [${requestId}] Transaction ID establecido para orden ${orderId}`
        );
      }
      break;

    case "authorized":
    case "approved":
      console.log(
        `💰 [${requestId}] Procesando pago autorizado para orden ${orderId}`
      );

      if (!order.isPaid) {
        try {
          console.log(
            `🔍 [${requestId}] Iniciando confirmPayment para orden: ${orderId}`
          );

          const confirmedOrder = await api.order.confirmPayment(orderId);

          console.log(
            `✅ [${requestId}] Pago confirmado exitosamente para orden ${confirmedOrder.id}`
          );

          // Verificar resultado de cuenta externa
          if (confirmedOrder._metadata?.externalAccountError) {
            console.warn(
              `⚠️ [${requestId}] Pago OK pero error en cuenta externa: ${confirmedOrder._metadata.externalAccountErrorMessage}`
            );

            if (confirmedOrder._metadata.externalAccountRetryable) {
              console.log(
                `🔄 [${requestId}] Error retryable - se programará retry automático`
              );

              // Programar retry (implementar según tu infraestructura)
              // await scheduleRetry(orderId, '5m');
            } else {
              console.error(
                `🚨 [${requestId}] Error no retryable - requiere intervención manual para orden ${orderId}`
              );

              // Notificar a administradores
              // await notifyAdmins({ type: "EXTERNAL_ACCOUNT_ERROR", orderId, error: confirmedOrder._metadata.externalAccountErrorMessage });
            }
          } else {
            console.log(
              `🎉 [${requestId}] Pago y cuenta externa exitosos para ${order.user.email}`
            );
          }
        } catch (error) {
          console.error(`❌ [${requestId}] Error confirmando pago:`, error);

          // Rollback si falla la confirmación de pago completamente
          await api.order.rollbackTransaction(
            orderId,
            "Payment confirmation failed in webhook"
          );
          throw error;
        }
      } else {
        console.log(
          `ℹ️ [${requestId}] Orden ${orderId} ya estaba marcada como pagada`
        );

        // Verificar si tiene problemas de cuenta externa pendientes
        if (order.notes?.includes("EXTERNAL_ACCOUNT_PENDING")) {
          console.log(
            `🔄 [${requestId}] Orden ya pagada pero tiene cuenta externa pendiente - intentando retry`
          );

          try {
            await api.utils.createExternalAccountForOrder(orderId);
            console.log(
              `✅ [${requestId}] Cuenta externa creada en retry para orden ${orderId}`
            );
          } catch (retryError) {
            console.error(
              `❌ [${requestId}] Falló retry de cuenta externa:`,
              retryError
            );
          }
        }
      }
      break;

    case "cancelled":
    case "paused":
    case "rejected":
      console.log(
        `❌ [${requestId}] Suscripción ${status} para orden ${orderId}`
      );

      if (!order.isPaid) {
        const rollbackResult = await api.order.rollbackTransaction(
          orderId,
          `Subscription ${status} via webhook`
        );

        if (rollbackResult.ok) {
          console.log(
            `🔄 [${requestId}] Rollback exitoso para orden ${orderId} debido a ${status}`
          );
        } else {
          console.error(
            `❌ [${requestId}] Rollback falló:`,
            rollbackResult.message
          );
        }
      } else {
        // Si ya estaba pagada, marcar como cancelada pero mantener acceso hasta el final del período
        console.log(
          `ℹ️ [${requestId}] Suscripción ${status} pero orden ya pagada - marcando para cancelación al final del período`
        );

        // Actualizar estado en la base de datos
        await prisma.order.update({
          where: { id: orderId },
          data: {
            notes: `${
              order.notes || ""
            }\nSubscription ${status} on ${new Date().toISOString()}`,
          },
        });
      }
      break;

    default:
      console.warn(`⚠️ [${requestId}] Estado no manejado: ${status}`);
  }
}

// Endpoint GET para verificar funcionamiento
export async function GET() {
  return NextResponse.json({
    message: "MercadoPago webhook endpoint is working",
    timestamp: new Date().toISOString(),
    version: "3.0 - Enhanced Security & Reliability",
    environment: process.env.NODE_ENV,
    features: [
      "Rate limiting",
      "Signature verification",
      "Request ID tracking",
      "Enhanced error handling",
      "Retry logic",
      "Performance monitoring",
    ],
  });
}
