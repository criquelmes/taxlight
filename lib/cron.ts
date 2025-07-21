let cronJobInitialized = false;

export async function initializeCronJob() {
  if (typeof window !== "undefined" || cronJobInitialized) {
    return;
  }

  try {
    console.log("🚀 Inicializando sistema de revisión de suscripciones...");

    const cron = await import("node-cron");
    const api = await import("../actions/order/api");

    // ⏰ EJECUTAR TODOS LOS DÍAS A LAS 05:00 AM (ZONA HORARIA DE SANTIAGO)
    cron.default.schedule(
      "0 5 * * *",
      async () => {
        console.log(
          `🔍 [${new Date().toISOString()}] Iniciando revisión automática de suscripciones vencidas...`
        );

        try {
          const results = await api.default.order.processExpiredSubscriptions();

          console.log("✅ Revisión automática completada:", {
            timestamp: new Date().toISOString(),
            totalExpired: results.totalExpired,
            processed: results.processed,
            errors: results.errors,
          });

          if (results.results.length > 0) {
            console.log("📋 Suscripciones procesadas:");
            results.results.forEach((result, index) => {
              const status = result.status === "processed" ? "✅" : "❌";
              console.log(
                `  ${index + 1}. ${status} ${result.userEmail} (${
                  result.subscriptionName
                }) - ${result.daysExpired || 0} días vencida`
              );
            });
          } else {
            console.log("ℹ️ No hay suscripciones vencidas para procesar");
          }
        } catch (error) {
          console.error(
            "❌ Error en revisión automática de suscripciones:",
            error
          );
        }
      },
      {
        timezone: "America/Santiago",
      }
    );

    cronJobInitialized = true;
    console.log(
      "⏰ Cron job configurado exitosamente - revisará suscripciones diariamente a las 5:00 AM (hora de Santiago)"
    );
  } catch (error) {
    console.error("❌ Error inicializando cron job:", error);
  }
}

// Función para testing manual inmediato
export async function testSubscriptionCheck() {
  if (typeof window !== "undefined") {
    throw new Error("Esta función solo puede ejecutarse en el servidor");
  }

  console.log("🧪 EJECUTANDO TEST MANUAL INMEDIATO...");

  try {
    const api = await import("../actions/order/api");
    const results = await api.default.order.processExpiredSubscriptions();

    console.log("✅ TEST MANUAL completado:", {
      timestamp: new Date().toISOString(),
      totalExpired: results.totalExpired,
      processed: results.processed,
      errors: results.errors,
      results: results.results,
    });

    return results;
  } catch (error) {
    console.error("❌ Error en test manual:", error);
    throw error;
  }
}
