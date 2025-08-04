// api/test-cron/route.ts - Versión con filtros de seguridad
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    service: "Subscription Maintenance Test",
    methods: ["POST"],
    auth: "x-cron-secret header required",
    note: "Use POST method with proper authentication",
  });
}

export async function POST(request: NextRequest) {
  try {
    const isAuthorized = validateAccess(request);

    if (!isAuthorized.valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const {
      type = "direct",
      dryRun = true,
      testUsersOnly = true, // 🆕 Solo usuarios de prueba por defecto
      specificEmail = null, // 🆕 Email específico para procesar
      maxProcessCount = 5, // 🆕 Límite de seguridad
    } = body;

    console.log(
      `🧪 Test cron en PRODUCCIÓN - DryRun: ${dryRun}, TestUsersOnly: ${testUsersOnly}`
    );

    let result;

    if (type === "vercel") {
      result = await testVercelCronEndpoint(
        dryRun,
        testUsersOnly,
        specificEmail,
        maxProcessCount
      );
    } else {
      result = await testDirectCronLogic(
        dryRun,
        testUsersOnly,
        specificEmail,
        maxProcessCount
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        safetyFilters: {
          testUsersOnly,
          specificEmail,
          maxProcessCount,
          productionMode: process.env.NODE_ENV === "production",
        },
      },
    });
  } catch (error) {
    console.error("❌ Error in production test-cron:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 🆕 TEST DIRECTO CON FILTROS DE SEGURIDAD
async function testDirectCronLogic(
  dryRun: boolean,
  testUsersOnly: boolean,
  specificEmail: string | null,
  maxProcessCount: number
) {
  try {
    const api = await import("../../../actions/order/api");

    console.log(`🔍 Procesando con filtros de seguridad:`, {
      dryRun,
      testUsersOnly,
      specificEmail,
      maxProcessCount,
    });

    // 🆕 Usar función con filtros
    const result = await api.default.order.processExpiredSubscriptionsFiltered({
      dryRun,
      testUsersOnly,
      specificEmail,
      maxProcessCount,
    });

    const logPrefix = dryRun ? "🧪 DRY RUN" : "✅ REAL";

    console.log(`${logPrefix} Test filtrado completado:`, {
      totalFound: result.totalExpired,
      processed: result.processed,
      errors: result.errors,
      skipped: result.skipped || 0,
    });

    // Log detallado pero seguro
    if (result.results && result.results.length > 0) {
      console.log("📋 Resultados del test filtrado:");
      result.results.forEach((item, index) => {
        const status =
          item.status === "processed"
            ? "✅"
            : item.status === "skipped"
            ? "⏭️"
            : "❌";
        const prefix = dryRun ? "🧪" : status;
        console.log(
          `  ${index + 1}. ${prefix} ${item.userEmail} (${
            item.subscriptionName
          }) - ${item.action || "process"}`
        );
      });
    }

    return {
      testType: "direct",
      success: true,
      filtersApplied: { testUsersOnly, specificEmail, maxProcessCount },
      ...result,
    };
  } catch (error) {
    console.error("❌ Error en test directo filtrado:", error);
    return {
      testType: "direct",
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// 🆕 TEST DEL ENDPOINT CON HEADERS DE FILTRO
async function testVercelCronEndpoint(
  dryRun: boolean,
  testUsersOnly: boolean,
  specificEmail: string | null,
  maxProcessCount: number
) {
  try {
    // ✅ FORZAR LOCALHOST EN DESARROLLO
    let baseUrl;

    if (process.env.NODE_ENV === "development") {
      // En desarrollo, siempre usar localhost
      baseUrl = "http://localhost:3000";
      console.log(`🏠 Desarrollo detectado - usando localhost`);
    } else {
      // En producción, usar las URLs configuradas
      baseUrl = process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.NEXT_PUBLIC_APP_URL || "https://taxlight.cl";
      console.log(`🌍 Producción detectada - usando: ${baseUrl}`);
    }

    const cronEndpoint = `${baseUrl}/api/cron/subscription-maintenance`;

    console.log(`🌐 Testeando endpoint: ${cronEndpoint}`);
    console.log(
      `🔑 CRON_SECRET configurado: ${process.env.CRON_SECRET ? "SÍ" : "NO"}`
    );
    console.log(`🏃 Entorno: ${process.env.NODE_ENV}`);

    // ✅ CORREGIR MEDICIÓN DE TIEMPO
    const startTime = Date.now();

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.CRON_SECRET}`,
      "X-Dry-Run": dryRun.toString(),
      "X-Test-Users-Only": testUsersOnly.toString(),
      "X-Specific-Email": specificEmail || "",
      "X-Max-Process-Count": maxProcessCount.toString(),
      "X-Test-Source": "filtered-test-cron",
    };

    console.log(`📋 Headers enviados:`, {
      Authorization: process.env.CRON_SECRET
        ? `Bearer ***${process.env.CRON_SECRET.slice(-4)}`
        : "NO SECRET",
      "X-Dry-Run": headers["X-Dry-Run"],
      "X-Test-Users-Only": headers["X-Test-Users-Only"],
      "X-Max-Process-Count": headers["X-Max-Process-Count"],
    });

    const response = await fetch(cronEndpoint, {
      method: "POST",
      headers: headers,
    });

    // ✅ CORREGIR CÁLCULO DE TIEMPO
    const responseTime = Date.now() - startTime;

    let responseBody;
    try {
      responseBody = await response.json();
    } catch (jsonError) {
      console.error("❌ Error parsing JSON response:", jsonError);
      const textResponse = await response.text();
      responseBody = {
        error: "Invalid JSON response",
        rawResponse: textResponse,
      };
    }

    console.log(`📊 Respuesta recibida:`, {
      status: response.status,
      success: responseBody.success,
      responseTimeMs: responseTime,
      hasData: !!responseBody.data,
    });

    // ✅ VALIDACIONES MEJORADAS
    const validations = {
      httpStatusOk: response.ok,
      statusCode200: response.status === 200,
      authenticationWorked: response.status !== 401,
      hasCorrectContentType:
        response.headers.get("content-type")?.includes("application/json") ||
        false,
      hasSuccessField: typeof responseBody.success === "boolean",
      hasDataField: !!responseBody.data,
      responseTimeOk: responseTime < 30000,
      noNetworkError: true,
    };

    const allValidationsPassed = Object.values(validations).every(Boolean);

    return {
      testType: "endpoint",
      endpointUrl: cronEndpoint,
      method: "POST",
      dryRun,
      httpStatus: response.status,
      responseTimeMs: responseTime,
      success: response.ok,
      filtersApplied: { testUsersOnly, specificEmail, maxProcessCount },
      data: responseBody,
      validations,
      allValidationsPassed,
      debugInfo: {
        baseUrlUsed: baseUrl,
        cronSecretConfigured: !!process.env.CRON_SECRET,
        headersUsed: Object.keys(headers),
        authHeaderSent: headers.Authorization
          ? `Bearer ***${headers.Authorization.slice(-4)}`
          : "NONE",
      },
      warnings: generateWarnings(responseBody, responseTime),
    };
  } catch (error) {
    console.error("❌ Error testeando endpoint Vercel:", error);

    return {
      testType: "endpoint",
      success: false,
      httpStatus: 0,
      responseTimeMs: 0,
      filtersApplied: { testUsersOnly, specificEmail, maxProcessCount },
      error: error instanceof Error ? error.message : "Network or server error",
      validations: {
        networkError: true,
        authenticationWorked: false,
        httpStatusOk: false,
      },
      allValidationsPassed: false,
      debugInfo: {
        cronSecretConfigured: !!process.env.CRON_SECRET,
        errorType:
          error instanceof Error ? error.constructor.name : "UnknownError",
      },
    };
  }
}

// ✅ FUNCIÓN GENERATEWARNINGS MEJORADA
function generateWarnings(responseBody: any, responseTime: number): string[] {
  const warnings: string[] = [];

  if (responseTime > 20000) {
    warnings.push(
      `Slow response time: ${responseTime}ms. Consider optimization.`
    );
  }

  if (responseBody?.data?.errors > 0) {
    warnings.push(`${responseBody.data.errors} processing errors detected.`);
  }

  if (responseBody?.data?.totalExpired > 20) {
    warnings.push(
      `High number of expired subscriptions (${responseBody.data.totalExpired}). Consider running cron more frequently.`
    );
  }

  if (!responseBody?.data?.timestamp && !responseBody?.data?.executedAt) {
    warnings.push("Response missing timestamp. Check cron implementation.");
  }

  if (responseBody?.success === undefined) {
    warnings.push("Response missing success field. Check response structure.");
  }

  // 🆕 WARNING ESPECÍFICO PARA AUTENTICACIÓN
  if (responseBody?.error === "Unauthorized") {
    warnings.push(
      "Authentication failed. Check CRON_SECRET configuration and ensure it matches between endpoints."
    );
  }

  if (responseBody?.error === "Internal server error") {
    warnings.push(
      "Internal server error. Check server logs for detailed error information."
    );
  }

  return warnings;
}

function validateAccess(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const cronSecretHeader = request.headers.get("x-cron-secret");
  const authHeader = request.headers.get("authorization");

  if (
    cronSecretHeader === cronSecret ||
    authHeader === `Bearer ${cronSecret}`
  ) {
    return { valid: true, source: "valid-secret" };
  }

  return { valid: false, reason: "invalid-auth" };
}
