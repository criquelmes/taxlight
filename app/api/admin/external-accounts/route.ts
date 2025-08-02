import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import api from "../../../../actions/order/api"; // Ajusta la ruta según tu estructura

const prisma = new PrismaClient();

// ✅ ENDPOINT GET PARA MONITOREO Y ACCIONES
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("action");

    switch (action) {
      case "pending":
        // Obtener órdenes con cuentas externas pendientes
        const pendingOrders = await getOrdersWithExternalAccountIssues();
        return NextResponse.json({
          success: true,
          count: pendingOrders.length,
          orders: pendingOrders,
        });

      case "retry":
        // Retry automático de cuentas externas pendientes
        const retryResults = await retryPendingExternalAccounts();
        return NextResponse.json({
          success: true,
          ...retryResults,
        });

      case "stats":
        // Estadísticas generales
        const stats = await getExternalAccountStats();
        return NextResponse.json({
          success: true,
          stats,
        });

      default:
        return NextResponse.json({
          message: "External account monitoring endpoint",
          timestamp: new Date().toISOString(),
          actions: {
            pending:
              "?action=pending - Lista órdenes con cuentas externas pendientes",
            retry:
              "?action=retry - Reintenta crear cuentas externas pendientes",
            stats: "?action=stats - Estadísticas generales",
          },
          examples: [
            "/api/admin/external-accounts?action=pending",
            "/api/admin/external-accounts?action=retry",
            "/api/admin/external-accounts?action=stats",
          ],
        });
    }
  } catch (error) {
    console.error("❌ Error en endpoint de monitoreo:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// ✅ ENDPOINT POST PARA ACCIONES ESPECÍFICAS
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, orderId } = body;

    switch (action) {
      case "retry-specific":
        if (!orderId) {
          return NextResponse.json(
            {
              success: false,
              error: "orderId is required for retry-specific action",
            },
            { status: 400 }
          );
        }

        const result = await retrySpecificOrder(orderId);
        return NextResponse.json(result);

      case "mark-resolved":
        if (!orderId) {
          return NextResponse.json(
            {
              success: false,
              error: "orderId is required for mark-resolved action",
            },
            { status: 400 }
          );
        }

        const markResult = await markOrderAsResolved(orderId);
        return NextResponse.json(markResult);

      default:
        return NextResponse.json(
          {
            success: false,
            error:
              "Invalid action. Available actions: retry-specific, mark-resolved",
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("❌ Error en POST del endpoint de monitoreo:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}

// ✅ FUNCIONES AUXILIARES

async function getOrdersWithExternalAccountIssues() {
  const ordersWithIssues = await prisma.order.findMany({
    where: {
      isPaid: true,
      notes: {
        contains: "EXTERNAL_ACCOUNT_PENDING",
      },
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
    orderBy: {
      createdAt: "desc",
    },
  });

  return ordersWithIssues.map((order) => {
    const errorMessage =
      order.notes?.match(/EXTERNAL_ACCOUNT_PENDING: (.+)/)?.[1] ||
      "Error desconocido";
    const transactionInfo = order.transactionId?.split("-");
    const includeBite = transactionInfo?.[1] === "bite";
    const products = includeBite ? ["ASTROBOT", "BITE"] : ["ASTROBOT"];

    return {
      orderId: order.id,
      userEmail: order.user.email,
      userName: order.user.name,
      products: products,
      subscriptionName: order.orderSubscriptions[0]?.subscription.name,
      paidAt: order.paidAt,
      errorMessage: errorMessage,
      daysSincePayment: order.paidAt
        ? Math.floor(
            (Date.now() - order.paidAt.getTime()) / (1000 * 60 * 60 * 24)
          )
        : null,
      transactionId: order.transactionId,
      mpSubscriptionId: order.mpSubscriptionId,
    };
  });
}

async function retryPendingExternalAccounts() {
  console.log("🔄 Ejecutando retry de cuentas externas pendientes...");

  const ordersWithPendingAccounts = await prisma.order.findMany({
    where: {
      isPaid: true,
      isActive: true,
      notes: {
        contains: "EXTERNAL_ACCOUNT_PENDING",
      },
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

  console.log(
    `🔍 Encontradas ${ordersWithPendingAccounts.length} órdenes con cuentas externas pendientes`
  );

  const retryResults = [];

  for (const order of ordersWithPendingAccounts) {
    try {
      console.log(`🔄 Reintentando cuenta externa para orden ${order.id}...`);

      const result = await api.utils.createExternalAccountForOrder(order.id);

      if (result.success) {
        // Limpiar la marca de pendiente
        await prisma.order.update({
          where: { id: order.id },
          data: {
            notes:
              order.notes?.replace(/EXTERNAL_ACCOUNT_PENDING:.*/, "").trim() ||
              null,
          },
        });

        retryResults.push({
          orderId: order.id,
          userEmail: order.user.email,
          status: "success",
        });

        console.log(
          `✅ Cuenta externa creada en retry para ${order.user.email}`
        );
      } else {
        retryResults.push({
          orderId: order.id,
          userEmail: order.user.email,
          status: "failed",
          error: result.message,
        });
      }
    } catch (retryError) {
      console.error(`❌ Error en retry para orden ${order.id}:`, retryError);

      retryResults.push({
        orderId: order.id,
        userEmail: order.user.email,
        status: "failed",
        error:
          retryError instanceof Error
            ? retryError.message
            : "Error desconocido",
      });
    }
  }

  const summary = {
    totalPending: ordersWithPendingAccounts.length,
    successful: retryResults.filter((r) => r.status === "success").length,
    failed: retryResults.filter((r) => r.status === "failed").length,
    results: retryResults,
  };

  console.log("📊 Resumen de retry de cuentas externas:", summary);
  return summary;
}

async function getExternalAccountStats() {
  const totalPaid = await prisma.order.count({
    where: { isPaid: true },
  });

  const totalWithExternalIssues = await prisma.order.count({
    where: {
      isPaid: true,
      notes: { contains: "EXTERNAL_ACCOUNT_PENDING" },
    },
  });

  const recentIssues = await prisma.order.count({
    where: {
      isPaid: true,
      notes: { contains: "EXTERNAL_ACCOUNT_PENDING" },
      paidAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24 horas
      },
    },
  });

  const oldestIssue = await prisma.order.findFirst({
    where: {
      isPaid: true,
      notes: { contains: "EXTERNAL_ACCOUNT_PENDING" },
    },
    orderBy: {
      paidAt: "asc",
    },
    select: {
      paidAt: true,
      user: { select: { email: true } },
    },
  });

  return {
    totalPaidOrders: totalPaid,
    totalWithExternalIssues: totalWithExternalIssues,
    recentIssues: recentIssues,
    successRate:
      totalPaid > 0
        ? (((totalPaid - totalWithExternalIssues) / totalPaid) * 100).toFixed(
            2
          ) + "%"
        : "N/A",
    oldestIssue: oldestIssue
      ? {
          email: oldestIssue.user.email,
          paidAt: oldestIssue.paidAt,
          daysAgo: oldestIssue.paidAt
            ? Math.floor(
                (Date.now() - oldestIssue.paidAt.getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : null,
        }
      : null,
  };
}

async function retrySpecificOrder(orderId: string) {
  try {
    console.log(
      `🔄 Reintentando cuenta externa para orden específica: ${orderId}`
    );

    const order = await prisma.order.findUnique({
      where: { id: orderId },
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
      return { success: false, message: "Orden no encontrada" };
    }

    if (!order.isPaid) {
      return { success: false, message: "Orden no está pagada" };
    }

    const result = await api.utils.createExternalAccountForOrder(orderId);

    if (result.success) {
      // Limpiar la marca de pendiente
      await prisma.order.update({
        where: { id: orderId },
        data: {
          notes:
            order.notes?.replace(/EXTERNAL_ACCOUNT_PENDING:.*/, "").trim() ||
            null,
        },
      });
    }

    return result;
  } catch (error) {
    console.error(`❌ Error en retry específico para orden ${orderId}:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}

async function markOrderAsResolved(orderId: string) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      return { success: false, message: "Orden no encontrada" };
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        notes:
          order.notes
            ?.replace(/EXTERNAL_ACCOUNT_PENDING:.*/, "MANUALLY_RESOLVED")
            .trim() || "MANUALLY_RESOLVED",
      },
    });

    console.log(`✅ Orden ${orderId} marcada como resuelta manualmente`);

    return {
      success: true,
      message: "Orden marcada como resuelta manualmente",
      orderId: orderId,
      userEmail: order.user.email,
    };
  } catch (error) {
    console.error(`❌ Error marcando orden ${orderId} como resuelta:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
