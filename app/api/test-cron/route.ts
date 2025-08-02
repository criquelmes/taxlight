import { NextRequest, NextResponse } from "next/server";
import { testSubscriptionCheck } from "../../../lib/cron";

export async function GET() {
  return NextResponse.json({
    success: true,
    info: {
      environment: process.env.NODE_ENV,
      cronType: "Vercel Cron",
      schedule: "0 5 * * * (UTC)",
      endpoint: "/api/cron/subscription-maintenance",
      testEndpoint: "/api/test-cron",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Solo permitir en desarrollo o con secret
    const isAuthorized =
      process.env.NODE_ENV === "development" ||
      request.headers.get("x-cron-secret") === process.env.CRON_SECRET;

    if (!isAuthorized) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { type } = body;

    let result;

    if (type === "vercel") {
      // Test llamando al endpoint de Vercel Cron
      const { testVercelCron } = await import("../../../lib/cron");
      result = await testVercelCron();
    } else {
      // Test directo (tu función original)
      result = await testSubscriptionCheck();
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error("Error in test-cron API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
