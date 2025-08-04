// app/api/cron/subscription-maintenance/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // ✅ Autenticación
    const cronAuth = request.headers.get("authorization");
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (!process.env.CRON_SECRET) {
      console.error("❌ CRON_SECRET no configurado");
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (cronAuth !== expectedAuth) {
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
    const forceRealHeader = request.headers.get("x-force-real"); // 🆕 Para permitir ejecución real

    // 🛡️ LÓGICA DE SEGURIDAD CORREGIDA
    const isProduction = process.env.NODE_ENV === "production";

    // En producción, por defecto es dry run, EXCEPTO si se fuerza lo contrario
    const isDryRun = isProduction
      ? dryRunHeader === "false" && forceRealHeader === "true"
        ? false
        : true // En prod: dry run por defecto
      : dryRunHeader !== "false"; // En dev: respeta el header

    // En producción, por defecto solo usuarios de prueba
    const testUsersOnly = isProduction
      ? testUsersOnlyHeader !== "false" // En prod: test users por defecto
      : testUsersOnlyHeader === "true"; // En dev: respeta el header

    const specificEmail = specificEmailHeader || null;

    // Límites de seguridad
    const maxProcessCount = isProduction
      ? Math.min(parseInt(maxProcessCountHeader || "5"), 10) // Max 10 en producción
      : parseInt(maxProcessCountHeader || "999"); // Sin límite en dev

    console.log(`🔍 Cron ejecutado en ${process.env.NODE_ENV}:`, {
      isDryRun,
      testUsersOnly,
      specificEmail,
      maxProcessCount,
      isProduction,
      safetyMode: isProduction,
    });

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
        safetyMode: {
          dryRunEnabled: isDryRun,
          testUsersOnly,
          maxProcessCount,
          productionSafeguards: isProduction,
          realExecutionInProduction: isProduction && !isDryRun,
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
      },
      { status: 500 }
    );
  }
}

// ✅ GET mejorado con información de seguridad
export async function GET() {
  const isProduction = process.env.NODE_ENV === "production";

  return NextResponse.json({
    message: "Cron endpoint para mantenimiento de suscripciones",
    schedule: "0 5 * * * (UTC)",
    method: "POST con Authorization Bearer token",
    environment: process.env.NODE_ENV,
    safetyFeatures: {
      productionMode: isProduction,
      defaultDryRun: isProduction,
      defaultTestUsersOnly: isProduction,
      maxProcessLimit: isProduction ? 10 : 999,
    },
    headers: {
      required: ["Authorization"],
      optional: [
        "X-Dry-Run (true/false)",
        "X-Test-Users-Only (true/false)",
        "X-Specific-Email",
        "X-Max-Process-Count",
        "X-Force-Real (required for real execution in production)",
      ],
    },
  });
}

// ✅ Opcional: Manejar otros métodos
export async function OPTIONS() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}
