let cronJobInitialized = false;

export async function initializeCronJob() {
  // ✅ En Vercel, no inicializar node-cron (no funciona)
  if (typeof window !== "undefined" || cronJobInitialized) {
    return;
  }

  // ✅ Solo mostrar información en desarrollo local
  if (process.env.NODE_ENV === "development") {
    console.log("🚀 Desarrollo local detectado - Cron configurado en Vercel");
    console.log(
      "⏰ El cron job se ejecutará automáticamente en Vercel a las 5:00 AM UTC"
    );
    console.log(
      "🔧 Para testing local, usa: /api/cron/subscription-maintenance"
    );
    cronJobInitialized = true;
  } else {
    console.log("✅ Producción - Vercel Cron configurado automáticamente");
    cronJobInitialized = true;
  }
}

// ✅ MANTENER TU FUNCIÓN DE TESTING EXISTENTE
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

// ✅ NUEVA FUNCIÓN PARA TESTING EN VERCEL
export async function testVercelCron() {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL
      ? process.env.NEXT_PUBLIC_APP_URL
      : "http://localhost:3000";

    const response = await fetch(
      `${baseUrl}/api/cron/subscription-maintenance`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.CRON_SECRET}`,
          "Content-Type": "application/json",
        },
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${result.error || result.message}`
      );
    }

    console.log("✅ Test de Vercel Cron exitoso:", result);
    return result;
  } catch (error) {
    console.error("❌ Error en test de Vercel Cron:", error);
    throw error;
  }
}
