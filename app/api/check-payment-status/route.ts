import { NextRequest, NextResponse } from "next/server";
import api from "../../../actions/order/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, orderId } = body;

    console.log("🔍 Verificando estado de pago:", { paymentId, orderId });

    let targetOrderId = orderId;

    // Si solo tenemos paymentId, buscar la orden correspondiente
    if (!targetOrderId && paymentId) {
      const orders = await api.order.getPendingTransactions();
      const matchingOrder = orders.find(
        (order) =>
          order.mpSubscriptionId === paymentId ||
          order.transactionId?.includes(paymentId)
      );

      if (matchingOrder) {
        targetOrderId = matchingOrder.id;
      } else {
        return NextResponse.json({
          success: false,
          message: "No se encontró la orden asociada al pago",
        });
      }
    }

    if (!targetOrderId) {
      return NextResponse.json({
        success: false,
        message: "Se requiere orderId o paymentId",
      });
    }

    // Usar la función utils para verificar y actualizar el estado
    const result = await api.utils.checkAndUpdatePaymentStatus(targetOrderId);

    if (result.success) {
      return NextResponse.json({
        success: true,
        status: result.status,
        redirectUrl: result.redirectUrl,
        message: getStatusMessage(result.status),
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.message || "Error verificando el estado del pago",
      });
    }
  } catch (error) {
    console.error("Error en check-payment-status:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

function getStatusMessage(status: string): string {
  switch (status) {
    case "approved":
    case "authorized":
      return "Pago aprobado y suscripción activada";
    case "pending":
    case "in_process":
      return "Pago aún en proceso de verificación";
    case "rejected":
      return "Pago rechazado por la entidad bancaria";
    case "cancelled":
      return "Pago cancelado por el usuario";
    default:
      return `Estado del pago: ${status}`;
  }
}
