// app/api/cron/subscription-maintenance/route.ts
import { NextRequest, NextResponse } from "next/server";

// 🆕 FUNCIÓN COMPARTIDA PARA LA LÓGICA PRINCIPAL
async function processCronMaintenance(request: NextRequest) {
  try {
    // ✅ Autenticación - adaptada para GET (sin Authorization header requerido en cron automático)
    const cronAuth = request.headers.get("authorization");
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    // Para cron automático de Vercel, la autenticación puede ser más flexible
    const isVercelCronExecution =
      !cronAuth && request.headers.get("user-agent")?.includes("vercel");

    if (!process.env.CRON_SECRET) {
      console.error("❌ CRON_SECRET no configurado");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Autenticación más flexible para cron automático
    if (!isVercelCronExecution && cronAuth !== expectedAuth) {
      console.error("❌ Unauthorized cron request");
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 🆕 FILTROS PARA PRODUCCIÓN SEGURA
    const dryRunHeader = request.headers.get("x-dry-run");
    const testUsersOnlyHeader = request.headers.get("x-test-users-only");
    const specificEmailHeader = request.headers.get("x-specific-email");
    const maxProcessCountHeader = request.headers.get("x-max-process-count");
    const forceRealHeader = request.headers.get("x-force-real");

    // 🛡️ LÓGICA DE SEGURIDAD
    const isProduction = process.env.NODE_ENV === "production";

    // En producción, configuración por defecto para cron automático
    const isDryRun = isProduction ? false : dryRunHeader !== "false";
    const testUsersOnly = isProduction ? false : testUsersOnlyHeader === "true";
    const specificEmail = specificEmailHeader || null;

    // Límites de seguridad
    const maxProcessCount = isProduction
      ? Math.min(parseInt(maxProcessCountHeader || "5"), 10)
      : parseInt(maxProcessCountHeader || "999");

    console.log(
      `🔍 Cron ejecutado en ${process.env.NODE_ENV} via ${request.method}:`,
      {
        isDryRun,
        testUsersOnly,
        specificEmail,
        maxProcessCount,
        isProduction,
        isVercelCronExecution,
        safetyMode: isProduction,
      }
    );

    // 🆕 WARNING PARA EJECUCIÓN REAL EN PRODUCCIÓN
    if (isProduction && !isDryRun) {
      console.warn(
        `🚨 EJECUCIÓN REAL EN PRODUCCIÓN - testUsersOnly: ${testUsersOnly}, maxCount: ${maxProcessCount}`
      );
    }

    // 🆕 USAR FUNCIÓN FILTRADA SIEMPRE
    const api = await import("../../../../actions/order/api");

    const results = await api.default.order.processExpiredSubscriptionsFiltered(
      {
        dryRun: isDryRun,
        testUsersOnly,
        specificEmail,
        maxProcessCount,
      }
    );

    return NextResponse.json({
      success: true,
      message: `Revisión de suscripciones ${
        isDryRun ? "(DRY RUN) " : ""
      }completada`,
      data: {
        ...results,
        environment: process.env.NODE_ENV,
        executionMethod: request.method,
        safetyMode: {
          dryRunEnabled: isDryRun,
          testUsersOnly,
          maxProcessCount,
          productionSafeguards: isProduction,
          realExecutionInProduction: isProduction && !isDryRun,
          vercelCronExecution: isVercelCronExecution,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error en cron:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          process.env.NODE_ENV === "production"
            ? "Internal server error"
            : error.message,
        timestamp: new Date().toISOString(),
        method: request.method,
      },
      { status: 500 }
    );
  }
}

// 🎯 GET AHORA EJECUTA LA LÓGICA PRINCIPAL (para cron automático)
export async function GET(request: NextRequest) {
  console.log("🤖 GET ejecutado - probablemente cron automático de Vercel");
  return await processCronMaintenance(request);
}

// 🎯 POST MANTIENE LA LÓGICA (para uso manual)
export async function POST(request: NextRequest) {
  console.log("📱 POST ejecutado - probablemente llamada manual");
  return await processCronMaintenance(request);
}

// ✅ OPTIONS para manejo completo
export async function OPTIONS() {
  return NextResponse.json(
    {
      methods: ["GET", "POST"],
      note: "GET para cron automático, POST para uso manual",
    },
    { status: 200 }
  );
}
