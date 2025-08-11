import { NextRequest, NextResponse } from "next/server";
import api from "../../../actions/order/api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      paymentId,
      preapprovalId,
      status,
      merchantOrderId,
      preferenceId,
      externalReference,
      plan,
      bite,
      collectionId,
      collectionStatus,
      paymentType,
      merchantOrderStatus,
    } = body;

    console.log("🔍 Verificando pago:", {
      paymentId,
      preapprovalId,
      collectionId,
      status,
      collectionStatus,
      merchantOrderId,
      preferenceId,
      externalReference,
      plan,
      bite,
      paymentType,
      merchantOrderStatus,
    });

    // Determinar el ID de pago principal (preapproval tiene prioridad para suscripciones)
    const primaryPaymentId = preapprovalId || paymentId || collectionId;
    const primaryStatus = status || collectionStatus;

    // Validar que tenemos información mínima
    if (
      !primaryPaymentId &&
      !merchantOrderId &&
      !preferenceId &&
      !externalReference
    ) {
      console.error("❌ No se encontró ningún identificador de pago");
      return NextResponse.json(
        {
          success: false,
          message: "No se encontró información del pago en la solicitud",
        },
        { status: 400 }
      );
    }

    // Verificar que el estado sea exitoso (para preapprovals, puede no tener status)
    const successStatuses = ["approved", "authorized", "success", "completed"];
    const isPaymentSuccessful =
      successStatuses.includes(primaryStatus?.toLowerCase() || "") ||
      !!preapprovalId;

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
    const includesBite = bite === true || bite === "true";

    // Para preapprovals, intentar inferir desde el contexto si no hay parámetros explícitos
    let finalPlanType = planType;
    let finalIncludesBite = includesBite;

    // Si es un preapproval sin información explícita, usar lógica de inferencia
    if (preapprovalId && !plan && bite === undefined) {
      // Asumir anual (la mayoría de preapprovals son anuales)
      finalPlanType = "annual";
      // No asumir Bite por defecto, será detectado por el monto
      finalIncludesBite = false;
    }

    const planDetails = calculatePlanDetails(finalPlanType, finalIncludesBite);

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
          preapprovalId,
          merchantOrderId,
          preferenceId,
          externalReference,
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

              // Intentar detectar el plan real desde la orden o el monto
              const detectedPlanDetails =
                detectPlanFromOrder(matchingOrder) || planDetails;

              return NextResponse.json({
                success: true,
                details: {
                  orderId: matchingOrder.id,
                  planName: detectedPlanDetails.name,
                  amount: detectedPlanDetails.formattedAmount,
                  transactionId: primaryPaymentId,
                  nextBilling: getNextBillingDate(
                    detectedPlanDetails.name.includes("Anual")
                  ),
                  products: detectedPlanDetails.products,
                  status: "approved",
                  paymentMethod:
                    getPaymentMethodFromResult(statusResult) || "mercadopago",
                  email: getEmailFromResult(statusResult, matchingOrder),
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
              getErrorFromResult(statusResult)
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
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Unknown error"
            : undefined,
      },
      { status: 500 }
    );
  }
}

// Función para detectar plan desde la orden
function detectPlanFromOrder(order: any) {
  if (!order) return null;

  try {
    // Si la orden tiene información de suscripciones
    if (order.orderSubscriptions && order.orderSubscriptions.length > 0) {
      const subscription = order.orderSubscriptions[0].subscription;

      // Detectar productos
      const products = subscription.products?.map((p: any) => p.name) || [];
      const includesBite = products.some((p: string) =>
        p.toLowerCase().includes("bite")
      );

      // Detectar tipo de plan desde la frecuencia o el monto
      let planType = "monthly";
      if (
        subscription.frequency === 12 ||
        subscription.name?.includes("Anual") ||
        subscription.type === "YEARLY"
      ) {
        planType = "annual";
      }

      return calculatePlanDetails(planType, includesBite);
    }

    // Si no hay información de suscripción, intentar desde el monto total
    if (order.totalAmount) {
      const amount = order.totalAmount;

      // Detectar el plan basado en el monto (Bite no afecta el precio)
      if (amount === 85000) {
        // Plan anual - necesitamos detectar si incluye Bite desde otros campos
        const includesBite = detectBiteFromOrder(order);
        return calculatePlanDetails("annual", includesBite);
      } else if (amount === 10000) {
        // Plan mensual - necesitamos detectar si incluye Bite desde otros campos
        const includesBite = detectBiteFromOrder(order);
        return calculatePlanDetails("monthly", includesBite);
      }
    }

    return null;
  } catch (error) {
    console.error("Error detectando plan desde orden:", error);
    return null;
  }
}

// Función auxiliar para detectar Bite desde la orden
function detectBiteFromOrder(order: any): boolean {
  // Buscar en diferentes lugares donde podría estar la información de Bite
  if (order.notes && order.notes.toLowerCase().includes("bite")) {
    return true;
  }

  if (order.description && order.description.toLowerCase().includes("bite")) {
    return true;
  }

  // Buscar en productos de la orden
  if (order.orderSubscriptions) {
    for (const orderSub of order.orderSubscriptions) {
      if (orderSub.subscription?.products) {
        const hasBite = orderSub.subscription.products.some((p: any) =>
          p.name.toLowerCase().includes("bite")
        );
        if (hasBite) return true;
      }
    }
  }

  return false;
}
function getPaymentMethodFromResult(statusResult: any): string | undefined {
  // Intentar obtener el método de pago de diferentes lugares posibles
  if (statusResult.paymentMethod) {
    return statusResult.paymentMethod;
  }

  if (statusResult.order?.paymentMethod) {
    return statusResult.order.paymentMethod;
  }

  // Si no hay método específico, retornar undefined para usar el fallback
  return undefined;
}

// Función helper para extraer email del resultado
function getEmailFromResult(
  statusResult: any,
  matchingOrder: any
): string | undefined {
  // Intentar obtener el email de diferentes lugares
  if (statusResult.email) {
    return statusResult.email;
  }

  if (statusResult.order?.user?.email) {
    return statusResult.order.user.email;
  }

  if (matchingOrder?.user?.email) {
    return matchingOrder.user.email;
  }

  // Si no hay email disponible, retornar undefined
  return undefined;
}

// Función helper para extraer error del resultado
function getErrorFromResult(statusResult: any): string {
  if (statusResult.error) {
    return statusResult.error;
  }

  if (statusResult.message) {
    return statusResult.message;
  }

  return "Error desconocido en la verificación";
}

// Función para encontrar orden coincidente
function findMatchingOrder(
  orders: any[],
  criteria: {
    paymentId?: string;
    preapprovalId?: string;
    merchantOrderId?: string;
    preferenceId?: string;
    externalReference?: string;
  }
) {
  const {
    paymentId,
    preapprovalId,
    merchantOrderId,
    preferenceId,
    externalReference,
  } = criteria;

  return orders.find((order) => {
    // Buscar por preapprovalId (suscripciones)
    if (
      preapprovalId &&
      (order.mpSubscriptionId === preapprovalId ||
        order.transactionId === preapprovalId ||
        order.id === preapprovalId)
    ) {
      return true;
    }

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

    // Buscar por external reference (ID de la orden)
    if (externalReference && order.id === externalReference) {
      return true;
    }

    return false;
  });
}

// Función para calcular detalles del plan
function calculatePlanDetails(planType: string, includesBite: boolean) {
  // Precios fijos según tu base de datos - Bite NO afecta el precio
  const planPrices = {
    annual: 85000, // Precio fijo para plan anual
    monthly: 10000, // Precio fijo para plan mensual
    mensual: 10000, // Precio fijo para plan mensual
  };

  const totalPrice =
    planPrices[planType as keyof typeof planPrices] || planPrices.monthly;

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
    basePrice: totalPrice,
    bitePrice: 0, // Bite no añade costo adicional
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
