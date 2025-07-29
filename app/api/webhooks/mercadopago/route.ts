import { NextRequest, NextResponse } from "next/server";
import { PreApproval } from "mercadopago";
import api, { mercadopago } from "../../../../actions/order/api";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Función para crear logs de auditoría (mantener tu implementación)
async function createSubscriptionLog(
  action:
    | "CREATED"
    | "ACTIVATED"
    | "RENEWED"
    | "EXPIRED"
    | "CANCELLED"
    | "SUSPENDED"
    | "REACTIVATED",
  orderId: string,
  userId: string,
  details?: string
) {
  try {
    await prisma.subscriptionLog.create({
      data: {
        action,
        orderId,
        userId,
        details,
      },
    });
    console.log(`📝 Log creado: ${action} para order ${orderId}`);
  } catch (error) {
    console.error("❌ Error creando log:", error);
  }
}

// Función para verificar/crear cuenta externa (mantener tu implementación mejorada)
async function createExternalAccount(userData: {
  email: string;
  name: string;
  products: string[];
  orderId: string;
}) {
  try {
    console.log(
      `📤 Verificando/Creando cuenta externa para: ${userData.email}`
    );
    console.log(`🎯 Productos: ${userData.products.join(", ")}`);

    const productNames = userData.products.map((product) =>
      product.toLowerCase()
    );

    const accountData = {
      email: userData.email,
      name: userData.name,
      product: productNames,
    };

    console.log(`📦 Datos a enviar:`, JSON.stringify(accountData, null, 2));

    const backendUrl = process.env.NEXT_PUBLIC_API_URL
      ? `https://${process.env.NEXT_PUBLIC_API_URL}/accounts/`
      : "https://backend.taxlight.cl/accounts/";

    console.log(`🌐 Enviando request a: ${backendUrl}`);

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
      console.error(`❌ Respuesta no es JSON válido:`, textResponse);
      throw new Error(`Invalid JSON response: ${textResponse}`);
    }

    if (response.status === 409) {
      console.log(
        `✅ Cuenta ya existe para ${userData.email} (pre-validada):`,
        result
      );
      return {
        success: true,
        externalAccountId: userData.email,
        data: result,
        alreadyExisted: true,
      };
    }

    if (!response.ok) {
      console.error(`❌ Error HTTP ${response.status}:`, result);
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${JSON.stringify(
          result
        )}`
      );
    }

    console.log(`✅ Cuenta externa creada exitosamente:`, result);

    let externalAccountId = userData.email;
    if (result?.status === "Success") {
      externalAccountId =
        result.account_details?.email ||
        result.account_details?.id ||
        userData.email;
    }

    return {
      success: true,
      externalAccountId: externalAccountId,
      data: result,
      alreadyExisted: false,
    };
  } catch (error) {
    console.error(`❌ Error creando cuenta externa:`, error);
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

    // CORRECCIÓN: Validar estructura del body
    if (!body?.data?.id || !body?.type) {
      console.error("❌ Body del webhook inválido:", body);
      return NextResponse.json(
        { error: "Invalid webhook body" },
        { status: 400 }
      );
    }

    // CORRECCIÓN: El tipo correcto es 'preapproval', no 'subscription_preapproval'
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

        // Manejar diferentes estados de la suscripción
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
          {
            received: true,
            error: "Error processing preapproval",
          },
          { status: 500 }
        );
      }
    } else {
      // Otros tipos de notificación
      console.log(`ℹ️ Tipo de webhook ignorado: ${body.type}`);
      return NextResponse.json({ received: true });
    }
  } catch (error) {
    console.error("💥 Error general procesando webhook:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      },
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

      // Solo establecer transaction ID si no está ya pagado
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
    case "approved": // Agregar 'approved' como estado válido
      console.log(`💰 Procesando pago autorizado para orden ${orderId}`);

      // Solo procesar si no está ya pagado
      if (!order.isPaid) {
        try {
          // Confirmar el pago en nuestra base de datos
          const confirmedOrder = await api.order.confirmPayment(orderId);
          console.log(`✅ Pago confirmado para orden ${confirmedOrder.id}`);

          // Extraer información de la suscripción
          const subscription = order.orderSubscriptions[0]?.subscription;
          const subscriptionName = subscription?.name || "unknown";
          const products = subscription?.products?.map((p) => p.name) || [];

          console.log(`📋 Suscripción: ${subscriptionName}`);
          console.log(`🎯 Productos incluidos: ${products.join(", ")}`);

          // Verificar/crear cuenta en API externa
          console.log(`🔍 Verificando estado de cuenta externa...`);

          const accountCreation = await createExternalAccount({
            email: order.user.email,
            name: order.user.name,
            products: products,
            orderId: order.id,
          });

          if (accountCreation.success) {
            const statusMessage = accountCreation.alreadyExisted
              ? "cuenta externa ya existía (pre-validada)"
              : "cuenta externa creada";

            console.log(
              `🎉 ÉXITO: Pago confirmado - ${statusMessage} para ${order.user.email}`
            );

            await createSubscriptionLog(
              "ACTIVATED",
              order.id,
              order.userId,
              `Suscripción ${subscriptionName} activada - ${statusMessage} - Productos: ${products.join(
                ", "
              )}`
            );
          } else {
            console.error(
              `❌ FALLO EN CUENTA EXTERNA: Pago confirmado para ${order.user.email} pero falló verificación: ${accountCreation.error}`
            );

            await createSubscriptionLog(
              "ACTIVATED",
              order.id,
              order.userId,
              `Suscripción activada pero cuenta externa falló: ${accountCreation.error}`
            );
          }
        } catch (error) {
          console.error("❌ Error confirmando pago:", error);

          // Rollback si falla la confirmación del pago
          await api.order.rollbackTransaction(
            orderId,
            "Payment confirmation failed"
          );
          throw error;
        }
      } else {
        console.log(`ℹ️ Orden ${orderId} ya estaba marcada como pagada`);
      }
      break;

    case "cancelled":
    case "paused":
    case "rejected":
      console.log(`❌ Suscripción ${status} para orden ${orderId}`);

      // Solo hacer rollback si no está pagado
      if (!order.isPaid) {
        const rollbackResult = await api.order.rollbackTransaction(
          orderId,
          `Subscription ${status}`
        );

        if (rollbackResult.ok) {
          console.log(
            `🔄 Rollback exitoso para orden ${orderId} debido a ${status}`
          );
        } else {
          console.error(
            `❌ Rollback falló para orden ${orderId}:`,
            rollbackResult.message
          );
        }
      }

      await createSubscriptionLog(
        "CANCELLED",
        order.id,
        order.userId,
        `Suscripción ${status} por MercadoPago`
      );
      break;

    default:
      console.warn(`⚠️ Estado de preapproval no manejado: ${status}`);

      await createSubscriptionLog(
        "CREATED",
        order.id,
        order.userId,
        `Estado no manejado recibido: ${status}`
      );
  }
}

// Endpoint GET para verificar que el webhook está funcionando
export async function GET() {
  return NextResponse.json({
    message: "MercadoPago webhook endpoint is working",
    timestamp: new Date().toISOString(),
    version: "2.0",
  });
}
