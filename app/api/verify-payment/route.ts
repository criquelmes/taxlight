import { NextRequest, NextResponse } from "next/server";
import api from "../../../actions/order/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentId, status, merchantOrderId, plan, bite } = body;

    console.log("🔍 Verificando pago:", {
      paymentId,
      status,
      merchantOrderId,
      plan,
      bite,
    });

    // Si tenemos un paymentId, intentar verificar con MercadoPago
    if (paymentId) {
      try {
        // Buscar la orden por mpSubscriptionId o external_reference
        const orders = await api.order.getPendingTransactions();
        const matchingOrder = orders.find(
          (order) =>
            order.mpSubscriptionId === paymentId ||
            order.transactionId?.includes(paymentId)
        );

        if (matchingOrder) {
          // Verificar estado en MercadoPago usando las funciones utils
          const statusResult = await api.utils.checkAndUpdatePaymentStatus(
            matchingOrder.id
          );

          if (statusResult.success && statusResult.status === "approved") {
            return NextResponse.json({
              success: true,
              details: {
                orderId: matchingOrder.id,
                planName: `Plan ${plan === "annual" ? "Anual" : "Mensual"}${
                  bite === "true" ? " + Bite" : ""
                }`,
                amount: plan === "annual" ? "85.000" : "10.000",
                transactionId: paymentId,
                nextBilling: getNextBillingDate(plan === "annual"),
                products: bite === "true" ? ["Astrobot", "Bite"] : ["Astrobot"],
              },
            });
          }
        }
      } catch (error) {
        console.error("Error verificando con MercadoPago:", error);
      }
    }

    // Si llegamos aquí, crear respuesta básica con la información disponible
    if (status === "approved" || status === "authorized") {
      return NextResponse.json({
        success: true,
        details: {
          planName: plan
            ? `Plan ${plan === "annual" ? "Anual" : "Mensual"}${
                bite === "true" ? " + Bite" : ""
              }`
            : "Plan seleccionado",
          amount: plan === "annual" ? "85.000" : "10.000",
          transactionId: paymentId || "N/A",
          nextBilling: getNextBillingDate(plan === "annual"),
          products: bite === "true" ? ["Astrobot", "Bite"] : ["Astrobot"],
        },
      });
    }

    // Estado no aprobado
    return NextResponse.json({
      success: false,
      message: `Pago en estado: ${status || "desconocido"}`,
    });
  } catch (error) {
    console.error("Error en verify-payment:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}

function getNextBillingDate(isAnnual: boolean): string {
  const today = new Date();
  if (isAnnual) {
    today.setFullYear(today.getFullYear() + 1);
  } else {
    today.setMonth(today.getMonth() + 1);
  }

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };

  return today.toLocaleDateString("es-CL", options);
}
