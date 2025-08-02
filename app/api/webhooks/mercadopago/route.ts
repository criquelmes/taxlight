import { NextRequest, NextResponse } from "next/server";
import { PreApproval } from "mercadopago";
import api, { mercadopago } from "../../../../actions/order/api";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ✅ FUNCIÓN CORREGIDA PARA CREAR CUENTA EXTERNA
async function createExternalAccount(userData: {
  email: string;
  name: string;
  products: string[];
}) {
  try {
    console.log(`🔧 Creando cuenta externa para: ${userData.email}`);
    console.log(`🎯 Productos: ${userData.products.join(", ")}`);

    const backendUrl = process.env.NEXT_PUBLIC_API_URL
      ? `https://${process.env.NEXT_PUBLIC_API_URL}/accounts/`
      : "https://backend.taxlight.cl/accounts/";

    const accountData = {
      email: userData.email,
      name: userData.name,
      product: userData.products.map((product) => product.toLowerCase()),
    };

    console.log(`📦 Creando con datos:`, JSON.stringify(accountData, null, 2));
    console.log(`🌐 URL: ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: "POST",
      headers: {
        accept: "application/json",
        "X-API-Key": process.env.EXTERNAL_API_TOKEN!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(accountData),
    });

    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      const textResponse = await response.text();
      console.error(`❌ Respuesta de creación no es JSON:`, textResponse);
      throw new Error(
        `Respuesta inválida del servicio externo: ${textResponse}`
      );
    }

    if (response.status === 200 || response.status === 201) {
      // ✅ Cuenta creada exitosamente
      console.log(
        `✅ Cuenta externa creada exitosamente para ${userData.email}`
      );
      return {
        success: true,
        message: "Cuenta creada exitosamente",
        data: result,
        alreadyExisted: false,
      };
    }

    if (response.status === 409) {
      // ✅ Cuenta ya existe - esto es OK
      console.log(`ℹ️ Cuenta externa ya existe para ${userData.email} (409)`);
      return {
        success: true,
        message: "Cuenta ya existía",
        data: result,
        alreadyExisted: true,
      };
    }

    // ❌ Otros errores sí son problemáticos
    console.error(
      `❌ Error creando cuenta externa (${response.status}):`,
      result
    );
    throw new Error(
      `Error al crear cuenta externa: ${response.status} - ${JSON.stringify(
        result
      )}`
    );
  } catch (error) {
    console.error(`❌ Error durante creación de cuenta externa:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: { data: { id: string }; type: string } = await request.json();

    console.log(
      "🔔 Webhook recibido de MercadoPago:",
      JSON.stringify(body, null, 2)
    );

    // ✅ Validar estructura del body
    if (!body?.data?.id || !body?.type) {
      console.error("❌ Body del webhook inválido:", body);
      return NextResponse.json(
        { error: "Invalid webhook body" },
        { status: 400 }
      );
    }

    // ✅ Manejar tipo 'preapproval'
    if (body.type === "preapproval") {
      console.log(`🔔 Procesando webhook preapproval: ${body.data.id}`);

      try {
        // Obtener datos de la suscripción desde MercadoPago
        const preapproval = await new PreApproval(mercadopago).get({
          id: body.data.id,
        });

        console.log(
          `📋 Preapproval ${preapproval.id} con status: ${preapproval.status}`
        );
        console.log(`🔗 External reference: ${preapproval.external_reference}`);

        // Buscar la orden correspondiente
        const order = await prisma.order.findFirst({
          where: {
            mpSubscriptionId: preapproval.id,
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
            `❌ No se encontró orden para MP subscription ${preapproval.id}`
          );
          return NextResponse.json(
            { error: "Order not found" },
            { status: 404 }
          );
        }

        console.log(
          `📦 Orden encontrada: ${order.id} para usuario ${order.user.email}`
        );

        // Procesar según el estado
        await processPreapprovalStatus(preapproval, order);

        return NextResponse.json({
          received: true,
          processed: true,
          orderId: order.id,
          status: preapproval.status,
        });
      } catch (preapprovalError) {
        console.error(
          `❌ Error procesando preapproval ${body.data.id}:`,
          preapprovalError
        );
        return NextResponse.json(
          { received: true, error: "Error processing preapproval" },
          { status: 500 }
        );
      }
    } else {
      console.log(`ℹ️ Tipo de webhook ignorado: ${body.type}`);
      return NextResponse.json({ received: true });
    }
  } catch (error) {
    console.error("💥 Error general procesando webhook:", error);
    return NextResponse.json(
      { error: "Internal server error", timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

async function processPreapprovalStatus(preapproval: any, order: any) {
  const status = preapproval.status;
  const orderId = order.id;

  console.log(`🔄 Procesando estado '${status}' para orden ${orderId}`);

  switch (status) {
    case "pending":
      console.log(`⏳ Procesando estado 'pending' para orden ${orderId}`);

      if (!order.isPaid) {
        const setResult = await api.order.setTransactionId(
          orderId,
          preapproval.id
        );

        if (!setResult.ok) {
          console.error(
            "❌ Error estableciendo transaction ID:",
            setResult.message
          );
          throw new Error(setResult.message);
        }

        console.log(`✅ Transaction ID establecido para orden ${orderId}`);
      }
      break;

    case "authorized":
    case "approved":
      console.log(`💰 Procesando pago autorizado para orden ${orderId}`);

      if (!order.isPaid) {
        try {
          console.log(
            `🔍 [WEBHOOK] Iniciando confirmPayment para orden: ${orderId}`
          );

          const confirmedOrder = await api.order.confirmPayment(orderId);

          console.log(
            `✅ [WEBHOOK] Pago confirmado exitosamente para orden ${confirmedOrder.id}`
          );

          // ✅ VERIFICAR RESULTADO DE CUENTA EXTERNA
          if (confirmedOrder._metadata?.externalAccountError) {
            console.warn(
              `⚠️ [WEBHOOK] Pago OK pero error en cuenta externa: ${confirmedOrder._metadata.externalAccountErrorMessage}`
            );

            // ✅ SI ES RETRYABLE, PROGRAMAR UN RETRY
            if (confirmedOrder._metadata.externalAccountRetryable) {
              console.log(
                `🔄 [WEBHOOK] Error retryable - se programará retry automático`
              );

              // Opcionalmente, puedes programar un job para retry más tarde
              // setTimeout(() => {
              //   api.order.retryPendingExternalAccounts();
              // }, 5 * 60 * 1000); // Retry en 5 minutos
            } else {
              console.error(
                `🚨 [WEBHOOK] Error no retryable - requiere intervención manual para orden ${orderId}`
              );

              // Enviar notificación a administradores
              // await sendAdminNotification({
              //   type: "EXTERNAL_ACCOUNT_ERROR",
              //   orderId,
              //   userEmail: order.user.email,
              //   error: confirmedOrder._metadata.externalAccountErrorMessage
              // });
            }
          } else {
            console.log(
              `🎉 [WEBHOOK] Pago y cuenta externa exitosos para ${order.user.email}`
            );
          }
        } catch (error) {
          console.error("❌ [WEBHOOK] Error confirmando pago:", error);

          // Rollback si falla la confirmación de pago completamente
          await api.order.rollbackTransaction(
            orderId,
            "Payment confirmation failed in webhook"
          );
          throw error;
        }
      } else {
        console.log(
          `ℹ️ [WEBHOOK] Orden ${orderId} ya estaba marcada como pagada`
        );

        // ✅ VERIFICAR SI TIENE PROBLEMAS DE CUENTA EXTERNA PENDIENTES
        if (order.notes?.includes("EXTERNAL_ACCOUNT_PENDING")) {
          console.log(
            `🔄 [WEBHOOK] Orden ya pagada pero tiene cuenta externa pendiente - intentando retry`
          );

          try {
            await api.utils.createExternalAccountForOrder(orderId);
            console.log(
              `✅ [WEBHOOK] Cuenta externa creada en retry para orden ${orderId}`
            );
          } catch (retryError) {
            console.error(
              `❌ [WEBHOOK] Falló retry de cuenta externa:`,
              retryError
            );
          }
        }
      }
      break;

    case "cancelled":
    case "paused":
    case "rejected":
      console.log(`❌ [WEBHOOK] Suscripción ${status} para orden ${orderId}`);

      if (!order.isPaid) {
        const rollbackResult = await api.order.rollbackTransaction(
          orderId,
          `Subscription ${status} via webhook`
        );

        if (rollbackResult.ok) {
          console.log(
            `🔄 [WEBHOOK] Rollback exitoso para orden ${orderId} debido a ${status}`
          );
        } else {
          console.error(`❌ [WEBHOOK] Rollback falló:`, rollbackResult.message);
        }
      }
      break;

    default:
      console.warn(`⚠️ [WEBHOOK] Estado no manejado: ${status}`);
  }
}

// ✅ Endpoint GET para verificar funcionamiento
export async function GET() {
  return NextResponse.json({
    message: "MercadoPago webhook endpoint is working",
    timestamp: new Date().toISOString(),
    version: "2.1 - Fixed",
    environment: process.env.NODE_ENV,
  });
}
