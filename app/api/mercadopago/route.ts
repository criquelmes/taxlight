import { PreApproval } from "mercadopago";
import api, { mercadopago } from "../../../actions/order/api";
import prisma from "../../../lib/prisma";

// Función para crear logs de auditoría
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

// Función para verificar/crear cuenta externa
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

    // Intentar crear/verificar la cuenta
    const response = await fetch("https://owuii.enkoding.io/accounts", {
      method: "POST",
      headers: {
        accept: "application/json",
        "X-API-Key": process.env.EXTERNAL_API_TOKEN!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(accountData),
    });

    // MEJORA: Manejar casos donde el response no es JSON válido
    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      const textResponse = await response.text();
      console.error(`❌ Respuesta no es JSON válido:`, textResponse);
      throw new Error(`Invalid JSON response: ${textResponse}`);
    }

    if (response.status === 409) {
      // Cuenta ya existe - esto es esperado si se pre-validó
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

    // Cuenta creada exitosamente
    console.log(`✅ Cuenta externa creada exitosamente:`, result);

    // MEJORA: Mejor extracción del ID
    let externalAccountId = userData.email; // Fallback
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

export async function POST(request: Request) {
  const body: { data: { id: string }; type: string } = await request.json();

  try {
    // MEJORA: Validar estructura del body
    if (!body?.data?.id || !body?.type) {
      console.error("❌ Body del webhook inválido:", body);
      return new Response(JSON.stringify({ error: "Invalid webhook body" }), {
        status: 400,
      });
    }

    // Solo procesar notificaciones de suscripciones
    if (body.type === "subscription_preapproval") {
      console.log(`🔔 Webhook recibido: ${body.data.id} (${body.type})`);

      // Obtener datos de la suscripción desde MercadoPago
      const preapproval = await new PreApproval(mercadopago).get({
        id: body.data.id,
      });

      console.log(
        `📋 Preapproval ${preapproval.id} con status: ${preapproval.status}`
      );

      // Buscar la orden correspondiente
      const order = await prisma.order.findFirst({
        where: {
          mpSubscriptionId: preapproval.id,
          isPaid: false,
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
        return new Response(JSON.stringify({ error: "Order not found" }), {
          status: 404,
        });
      }

      console.log(
        `📦 Orden encontrada: ${order.id} para usuario ${order.user.email}`
      );

      // Manejar diferentes estados de la suscripción
      switch (preapproval.status) {
        case "pending":
          console.log(`⏳ Procesando estado 'pending' para orden ${order.id}`);

          const setResult = await api.order.setTransactionId(
            order.id,
            preapproval.id
          );

          if (!setResult.ok) {
            console.error(
              "❌ Error estableciendo transaction ID:",
              setResult.message
            );
            return new Response(JSON.stringify({ error: setResult.message }), {
              status: 400,
            });
          }

          console.log(`✅ Transaction ID establecido para orden ${order.id}`);
          break;

        case "authorized":
          console.log(`💰 Procesando pago autorizado para orden ${order.id}`);

          try {
            // Confirmar el pago en nuestra base de datos
            const confirmedOrder = await api.order.confirmPayment(order.id);
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
              // ÉXITO: Cuenta externa manejada correctamente
              const statusMessage = accountCreation.alreadyExisted
                ? "cuenta externa ya existía (pre-validada)"
                : "cuenta externa creada";

              console.log(
                `🎉 ÉXITO: Pago confirmado - ${statusMessage} para ${order.user.email}`
              );
              console.log(
                `🆔 External Account ID: ${accountCreation.externalAccountId}`
              );

              // MEJORA: Log de éxito con más detalles
              await createSubscriptionLog(
                "ACTIVATED",
                order.id,
                order.userId,
                `Suscripción ${subscriptionName} activada - ${statusMessage} - Productos: ${products.join(
                  ", "
                )}`
              );

              // Guardar ID de cuenta externa si está configurado el campo
              if (accountCreation.externalAccountId) {
                try {
                  // NOTA: Descomenta si tienes el campo externalAccountId en tu modelo User
                  /*
                  await prisma.user.update({
                    where: { id: order.userId },
                    data: {
                      externalAccountId: accountCreation.externalAccountId
                    },
                  });
                  console.log(`💾 External Account ID guardado en base de datos`);
                  */
                } catch (dbError) {
                  console.warn(
                    `⚠️ No se pudo guardar External Account ID:`,
                    dbError
                  );
                }
              }
            } else {
              // FALLO: Cuenta externa falló pero pago ya confirmado
              console.error(
                `❌ FALLO EN CUENTA EXTERNA: Pago confirmado para ${order.user.email} pero falló verificación de cuenta externa: ${accountCreation.error}`
              );

              // Log de investigación (no rollback porque el pago ya está confirmado)
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
              order.id,
              "Payment confirmation failed"
            );

            return new Response(
              JSON.stringify({ error: "Payment confirmation failed" }),
              { status: 500 }
            );
          }
          break;

        case "cancelled":
        case "paused":
        case "rejected":
          console.log(
            `❌ Suscripción ${preapproval.status} para orden ${order.id}`
          );

          // Rollback para suscripciones canceladas/rechazadas
          const rollbackResult = await api.order.rollbackTransaction(
            order.id,
            `Subscription ${preapproval.status}`
          );

          if (rollbackResult.ok) {
            console.log(
              `🔄 Rollback exitoso para orden ${order.id} debido a ${preapproval.status}`
            );
          } else {
            console.error(
              `❌ Rollback falló para orden ${order.id}:`,
              rollbackResult.message
            );
          }
          break;

        default:
          console.warn(
            `⚠️ Estado de preapproval no manejado: ${preapproval.status}`
          );
          // MEJORA: Log para estados desconocidos
          await createSubscriptionLog(
            "CREATED", // Usar CREATED como fallback
            order.id,
            order.userId,
            `Estado no manejado recibido: ${preapproval.status}`
          );
      }
    } else {
      // Otros tipos de notificación (no de suscripción)
      console.log(`ℹ️ Tipo de webhook ignorado: ${body.type}`);
    }

    // Respuesta exitosa para MercadoPago
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("💥 Error procesando webhook:", error);

    // Intentar rollback en caso de error crítico
    try {
      if (body?.data?.id) {
        const order = await prisma.order.findFirst({
          where: {
            mpSubscriptionId: body.data.id,
            isPaid: false,
          },
        });

        if (order) {
          await api.order.rollbackTransaction(
            order.id,
            "Webhook processing error"
          );
          console.log(
            `🔄 Rollback de emergencia ejecutado para orden ${order.id}`
          );
        }
      }
    } catch (rollbackError) {
      console.error("💥 Rollback de emergencia falló:", rollbackError);
    }

    // Respuesta de error para MercadoPago
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
      }
    );
  }
}
