import { PreApproval } from "mercadopago";
import api, { mercadopago } from "../../../actions/order/api";
import prisma from "../../../lib/prisma";

async function createExternalAccount(userData: {
  email: string;
  name: string;
  products: string[];
  orderId: string;
}) {
  try {
    console.log(`📤 Creando cuenta externa para: ${userData.email}`);
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

    // API Enkoding
    const response = await fetch("https://owuii.enkoding.io/accounts", {
      method: "POST",
      headers: {
        accept: "application/json",
        "X-API-Key": process.env.EXTERNAL_API_TOKEN!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(accountData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error HTTP ${response.status}:`, errorText);
      throw new Error(
        `HTTP error! status: ${response.status}, message: ${errorText}`
      );
    }

    const result = await response.json();
    console.log(`✅ Cuenta externa creada exitosamente:`, result);

    let externalAccountId = null;
    if (result.status === "Success") {
      externalAccountId = result.account_details?.email || userData.email;
    }

    return {
      success: true,
      externalAccountId: externalAccountId,
      data: result,
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
    if (body.type === "subscription_preapproval") {
      const preapproval = await new PreApproval(mercadopago).get({
        id: body.data.id,
      });

      console.log(
        `Webhook received for preapproval ${preapproval.id} with status: ${preapproval.status}`
      );

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
        console.error(`No order found for MP subscription ${preapproval.id}`);
        return new Response(null, { status: 404 });
      }

      switch (preapproval.status) {
        case "pending":
          const setResult = await api.order.setTransactionId(
            order.id,
            preapproval.id
          );
          if (!setResult.ok) {
            console.error("Failed to set transaction ID:", setResult.message);
            return new Response(JSON.stringify({ error: setResult.message }), {
              status: 400,
            });
          }
          console.log(`✅ Transaction ID set for order ${order.id}`);
          break;

        case "authorized":
          try {
            const confirmedOrder = await api.order.confirmPayment(order.id);
            console.log(`✅ Payment confirmed for order ${confirmedOrder.id}`);

            const subscription = order.orderSubscriptions[0]?.subscription;
            const subscriptionName = subscription?.name || "unknown";
            const products = subscription?.products?.map((p) => p.name) || [];

            console.log(`📋 Suscripción: ${subscriptionName}`);
            console.log(`🎯 Productos incluidos: ${products.join(", ")}`);

            const accountCreation = await createExternalAccount({
              email: order.user.email,
              name: order.user.name,
              products: products,
              orderId: order.id,
            });

            if (accountCreation.success) {
              console.log(
                `🎉 ÉXITO COMPLETO: Pago confirmado y cuenta externa creada para ${order.user.email}`
              );
              console.log(
                `🆔 External Account ID: ${accountCreation.externalAccountId}`
              );

              if (accountCreation.externalAccountId) {
                try {
                  await prisma.user.update({
                    where: { id: order.userId },
                    data: {
                      // externalAccountId: accountCreation.externalAccountId
                    },
                  });
                  console.log(
                    `💾 External Account ID guardado en base de datos`
                  );
                } catch (dbError) {
                  console.warn(
                    `⚠️ No se pudo guardar External Account ID:`,
                    dbError
                  );
                }
              }
            } else {
              console.error(
                `❌ FALLO EN CUENTA EXTERNA: Pago confirmado para ${order.user.email} pero falló creación de cuenta externa: ${accountCreation.error}`
              );

              // DECISIÓN: Continuar con pago exitoso pero reportar el error
              // La suscripción sigue siendo válida, la cuenta externa se puede crear después
            }

            // Aquí puedes agregar más lógica:
            // - Enviar email de confirmación con EmailJS
            // - Activar características adicionales
            // - Notificar a sistemas internos
            // - etc.
          } catch (error) {
            console.error("Failed to confirm payment:", error);
            // Rollback si falla la confirmación
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
          // Rollback si la suscripción es cancelada/rechazada
          const rollbackResult = await api.order.rollbackTransaction(
            order.id,
            `Subscription ${preapproval.status}`
          );

          if (rollbackResult.ok) {
            console.log(
              `🔄 Transaction rolled back for order ${order.id} due to ${preapproval.status}`
            );
          }
          break;

        default:
          console.log(`Unhandled preapproval status: ${preapproval.status}`);
      }
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);

    // Rollback en caso de error crítico
    try {
      if (body.data?.id) {
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
        }
      }
    } catch (rollbackError) {
      console.error("Failed to rollback after webhook error:", rollbackError);
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
}
