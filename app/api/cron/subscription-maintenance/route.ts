// app/api/cron/subscription-maintenance/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // ✅ Verificar que el request viene de Vercel Cron
    const cronAuth = request.headers.get("authorization");
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET) {
      console.error("❌ CRON_SECRET no configurado");
      return NextResponse.json(
        {
          success: false,
          error: "Server configuration error",
        },
        { status: 500 }
      );
    }

    if (cronAuth !== expectedAuth) {
      console.error("❌ Unauthorized cron request");
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    console.log(
      `🔍 [${new Date().toISOString()}] Iniciando revisión automática de suscripciones (Vercel Cron)...`
    );

    // ✅ USAR TU LÓGICA EXISTENTE
    const api = await import("../../../../actions/order/api");
    const results = await api.default.order.processExpiredSubscriptions();

    console.log("✅ Revisión automática completada:", {
      timestamp: new Date().toISOString(),
      totalExpired: results.totalExpired,
      processed: results.processed,
      errors: results.errors,
    });

    // ✅ TU LOGGING EXISTENTE
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

    // ✅ Respuesta exitosa para Vercel
    return NextResponse.json({
      success: true,
      message: "Revisión de suscripciones completada exitosamente",
      data: {
        timestamp: new Date().toISOString(),
        totalExpired: results.totalExpired,
        processed: results.processed,
        errors: results.errors,
        results: results.results,
      },
    });
  } catch (error) {
    console.error("❌ Error en revisión automática de suscripciones:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Error durante la revisión de suscripciones",
        error: error instanceof Error ? error.message : "Error desconocido",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// ✅ Opcional: GET para información
export async function GET() {
  return NextResponse.json({
    message: "Cron endpoint para mantenimiento de suscripciones",
    schedule: "0 5 * * * (UTC)",
    method: "POST con Authorization Bearer token",
  });
}

// ✅ Opcional: Manejar otros métodos
export async function OPTIONS() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}
