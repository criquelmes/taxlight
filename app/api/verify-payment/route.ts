import { NextRequest, NextResponse } from "next/server";
import api from "../../../actions/order/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      paymentId,
      status,
      merchantOrderId,
      preferenceId,
      plan,
      bite,
      collectionId,
      collectionStatus,
      paymentType,
      merchantOrderStatus,
    } = body;

    console.log("🔍 Verificando pago:", {
      paymentId,
      collectionId,
      status,
      collectionStatus,
      merchantOrderId,
      preferenceId,
      plan,
      bite,
      paymentType,
      merchantOrderStatus,
    });

    // Determinar el ID de pago principal
    const primaryPaymentId = paymentId || collectionId;
    const primaryStatus = status || collectionStatus;

    // Validar que tenemos información mínima
    if (!primaryPaymentId && !merchantOrderId && !preferenceId) {
      console.error("❌ No se encontró ningún identificador de pago");
      return NextResponse.json(
        {
          success: false,
          message: "No se encontró información del pago en la solicitud",
        },
        { status: 400 }
      );
    }

    // Verificar que el estado sea exitoso
    const successStatuses = ["approved", "authorized", "success", "completed"];
    const isPaymentSuccessful = successStatuses.includes(
      primaryStatus?.toLowerCase() || ""
    );

    if (!isPaymentSuccessful && primaryStatus) {
      console.warn(`⚠️ Pago no exitoso. Estado: ${primaryStatus}`);
      return NextResponse.json(
        {
          success: false,
          message: `El pago no fue completado. Estado: ${primaryStatus}`,
          status: primaryStatus,
        },
        { status: 400 }
      );
    }

    // Calcular detalles del plan
    const planType = plan || "monthly";
    const includesBite = bite === true || bite === "true" || bite === true;
    const planDetails = calculatePlanDetails(planType, includesBite);

    let orderData = null;
    let verificationError = null;

    // Intentar verificar con MercadoPago si tenemos un paymentId
    if (primaryPaymentId) {
      try {
        console.log("🔄 Buscando orden en base de datos...");

        // Buscar la orden por diferentes criterios
        const orders = await api.order.getPendingTransactions();
        const matchingOrder = findMatchingOrder(orders, {
          paymentId: primaryPaymentId,
          merchantOrderId,
          preferenceId,
        });

        if (matchingOrder) {
          console.log("✅ Orden encontrada:", matchingOrder.id);

          // Verificar estado en MercadoPago
          const statusResult = await api.utils.checkAndUpdatePaymentStatus(
            matchingOrder.id
          );

          if (statusResult.success) {
            console.log(
              "✅ Estado verificado con MercadoPago:",
              statusResult.status
            );

            if (statusResult.status === "approved") {
              orderData = matchingOrder;

              return NextResponse.json({
                success: true,
                details: {
                  orderId: matchingOrder.id,
                  planName: planDetails.name,
                  amount: planDetails.formattedAmount,
                  transactionId: primaryPaymentId,
                  nextBilling: getNextBillingDate(planType === "annual"),
                  products: planDetails.products,
                  status: "approved",
                  paymentMethod:
                    "paymentMethod" in statusResult &&
                    statusResult.paymentMethod
                      ? statusResult.paymentMethod
                      : "mercadopago",
                  email:
                    "email" in statusResult ? statusResult.email : undefined,
                  verified: true,
                },
                message: "Pago verificado exitosamente con MercadoPago",
              });
            } else {
              console.warn(
                `⚠️ Estado no aprobado en MercadoPago: ${statusResult.status}`
              );
              verificationError = `Pago en estado: ${statusResult.status}`;
            }
          } else {
            console.error(
              "❌ Error verificando con MercadoPago:",
              statusResult.message
            );
            verificationError = "Error verificando el pago con MercadoPago";
          }
        } else {
          console.warn("⚠️ No se encontró orden coincidente en base de datos");
          verificationError = "Orden no encontrada en base de datos";
        }
      } catch (error) {
        console.error("❌ Error verificando con MercadoPago:", error);
        verificationError =
          error instanceof Error ? error.message : "Error de verificación";
      }
    }

    // Si llegamos aquí y el estado indica éxito, crear respuesta de fallback
    if (isPaymentSuccessful) {
      console.log("ℹ️ Creando respuesta de fallback para pago exitoso");

      return NextResponse.json({
        success: true,
        details: {
          orderId: primaryPaymentId || merchantOrderId || "unknown",
          planName: planDetails.name,
          amount: planDetails.formattedAmount,
          transactionId: primaryPaymentId || merchantOrderId || "N/A",
          nextBilling: getNextBillingDate(planType === "annual"),
          products: planDetails.products,
          status: primaryStatus || "approved",
          verified: false,
        },
        message: verificationError
          ? `Pago procesado (${verificationError})`
          : "Pago procesado exitosamente",
        warning:
          verificationError ||
          "No se pudo verificar completamente con el backend",
      });
    }

    // Estado no exitoso
    console.error("❌ Pago no exitoso:", { primaryStatus, verificationError });
    return NextResponse.json(
      {
        success: false,
        message:
          verificationError ||
          `Pago en estado: ${primaryStatus || "desconocido"}`,
        status: primaryStatus,
      },
      { status: 400 }
    );
  } catch (error) {
    console.error("❌ Error en verify-payment:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
        error:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Función para encontrar orden coincidente
function findMatchingOrder(
  orders: any[],
  criteria: {
    paymentId?: string;
    merchantOrderId?: string;
    preferenceId?: string;
  }
) {
  const { paymentId, merchantOrderId, preferenceId } = criteria;

  return orders.find((order) => {
    // Buscar por mpSubscriptionId
    if (paymentId && order.mpSubscriptionId === paymentId) {
      return true;
    }

    // Buscar por transactionId que contenga el paymentId
    if (paymentId && order.transactionId?.includes(paymentId)) {
      return true;
    }

    // Buscar por merchantOrderId
    if (
      merchantOrderId &&
      (order.merchantOrderId === merchantOrderId ||
        order.transactionId?.includes(merchantOrderId))
    ) {
      return true;
    }

    // Buscar por preferenceId
    if (
      preferenceId &&
      (order.preferenceId === preferenceId ||
        order.mpSubscriptionId === preferenceId)
    ) {
      return true;
    }

    return false;
  });
}

// Función para calcular detalles del plan
function calculatePlanDetails(planType: string, includesBite: boolean) {
  const planPrices = {
    annual: 85000,
    monthly: 10000,
    mensual: 10000,
  };

  const bitePrice = 5000; // Precio del addon Bite
  const basePrice =
    planPrices[planType as keyof typeof planPrices] || planPrices.monthly;
  const totalPrice = basePrice + (includesBite ? bitePrice : 0);

  const planNames = {
    annual: "Plan Anual",
    monthly: "Plan Mensual",
    mensual: "Plan Mensual",
  };

  const baseName =
    planNames[planType as keyof typeof planNames] || "Plan Mensual";
  const fullName = includesBite ? `${baseName} + Bite` : baseName;

  return {
    name: fullName,
    amount: totalPrice,
    formattedAmount: totalPrice.toLocaleString("es-CL"),
    products: includesBite ? ["Astrobot", "Bite"] : ["Astrobot"],
    basePrice,
    bitePrice: includesBite ? bitePrice : 0,
  };
}

// Función mejorada para calcular próxima fecha de facturación
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
