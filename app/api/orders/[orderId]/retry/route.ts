// src/app/api/orders/[orderId]/retry/route.ts

import { NextRequest, NextResponse } from "next/server";
import api from "../../../../../actions/order/api"; // Ajusta según tu estructura

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId;

    if (!orderId) {
      return NextResponse.json(
        {
          success: false,
          error: "Order ID is required",
        },
        { status: 400 }
      );
    }

    console.log(`🔄 Retry manual para orden: ${orderId}`);

    const result = await api.utils.createExternalAccountForOrder(orderId);

    if (result.success) {
      console.log(`✅ Retry exitoso para orden ${orderId}`);
      return NextResponse.json({
        success: true,
        message: "Cuenta externa creada exitosamente",
        orderId: orderId,
        email: result.email,
        products: result.products,
      });
    } else {
      console.error(`❌ Retry falló para orden ${orderId}: ${result.message}`);
      return NextResponse.json(
        {
          success: false,
          error: result.message,
          orderId: orderId,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(
      `❌ Error en retry manual para orden ${params.orderId}:`,
      error
    );
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
        orderId: params.orderId,
      },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId;

    // Verificar estado de la orden
    const order = await api.order.findById(orderId);

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: "Orden no encontrada",
        },
        { status: 404 }
      );
    }

    const hasExternalIssue = order.notes?.includes("EXTERNAL_ACCOUNT_PENDING");
    const isResolved = order.notes?.includes("MANUALLY_RESOLVED");

    return NextResponse.json({
      success: true,
      orderId: order.id,
      userEmail: order.user.email,
      isPaid: order.isPaid,
      isActive: order.isActive,
      hasExternalIssue: hasExternalIssue,
      isManuallyResolved: isResolved,
      paidAt: order.paidAt,
      notes: order.notes,
      canRetry: order.isPaid && hasExternalIssue && !isResolved,
    });
  } catch (error) {
    console.error(`❌ Error verificando orden ${params.orderId}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      },
      { status: 500 }
    );
  }
}
