import { NextResponse } from "next/server";
import api from "../../../actions/order/api";

export async function GET() {
  try {
    console.log("🧪 TEST ENDPOINT GET - Ejecutando revisión manual...");

    const results = await api.order.processExpiredSubscriptions();

    return NextResponse.json({
      success: true,
      message: "Test GET ejecutado correctamente",
      data: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error en test endpoint GET:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Error ejecutando test GET",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    console.log("🧪 TEST ENDPOINT POST - Ejecutando revisión manual...");

    const results = await api.order.processExpiredSubscriptions();

    const stats = await api.subscription.getStats();
    const expiredSubscriptions = await api.order.getExpiredSubscriptions();

    return NextResponse.json({
      success: true,
      message: "Test POST ejecutado correctamente",
      data: {
        processResults: results,
        currentStats: stats,
        currentExpired: expiredSubscriptions,
        expiredCount: expiredSubscriptions.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error en test endpoint POST:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Error ejecutando test POST",
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
