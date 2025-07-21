import { NextResponse } from "next/server";

let systemInitialized = false;

export async function GET() {
  try {
    if (!systemInitialized) {
      console.log("🔧 Inicializando sistema...");

      const { initializeCronJob } = await import("../../../lib/cron");
      const { initializeSubscriptionsAndProducts } = await import(
        "../../../actions/order/api"
      );

      // Inicializar suscripciones
      await initializeSubscriptionsAndProducts();

      // Inicializar cron job
      await initializeCronJob();

      systemInitialized = true;
      console.log("✅ Sistema inicializado correctamente");
    }

    return NextResponse.json({
      success: true,
      message: "Sistema inicializado correctamente",
      initialized: systemInitialized,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error inicializando sistema:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Error inicializando sistema",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Auto-inicializar cuando se carga el módulo (solo en servidor)
if (!systemInitialized && typeof window === "undefined") {
  console.log("🚀 Auto-inicializando sistema...");

  Promise.resolve().then(async () => {
    try {
      const { initializeCronJob } = await import("../../../lib/cron");
      const { initializeSubscriptionsAndProducts } = await import(
        "../../../actions/order/api"
      );

      await initializeSubscriptionsAndProducts();
      await initializeCronJob();
      systemInitialized = true;
      console.log("✅ Auto-inicialización completada");
    } catch (error) {
      console.error("❌ Error en auto-inicialización:", error);
    }
  });
}
