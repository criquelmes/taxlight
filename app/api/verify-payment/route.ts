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

    // Calcular detalles del plan con prioridad para parámetros explícitos
    let finalPlanType = plan || "annual"; // Default a annual para preapprovals
    let finalIncludesBite = bite === true || bite === "true";

    // Para preapprovals sin parámetros explícitos, usar lógica de inferencia
    if (preapprovalId && !plan && bite === undefined) {
      // ✅ MEJORA: Los parámetros del backend ahora deberían estar presentes
      // pero si no están, usar fallback inteligente
      finalPlanType = "annual"; // La mayoría son anuales
      finalIncludesBite = true; // Asumir que incluye Bite por defecto

      console.log(
        "🔍 Usando inferencia para preapproval sin parámetros explícitos"
      );
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

              // ✅ PRIORIDAD: Usar parámetros de URL si están disponibles
              let detectedPlanDetails;
              if (plan || bite !== undefined) {
                console.log("🎯 Usando parámetros explícitos de URL");
                detectedPlanDetails = calculatePlanDetails(
                  finalPlanType,
                  finalIncludesBite
                );
              } else {
                // Fallback: detectar desde la orden
                console.log("🔍 Detectando plan desde la orden en BD");
                detectedPlanDetails =
                  detectPlanFromOrder(matchingOrder) || planDetails;
              }

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
          nextBilling: getNextBillingDate(finalPlanType === "annual"),
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

// ✅ FUNCIÓN MEJORADA - Detectar plan desde la orden
function detectPlanFromOrder(order: any) {
  if (!order) return null;

  try {
    // Si la orden tiene información de suscripciones
    if (order.orderSubscriptions && order.orderSubscriptions.length > 0) {
      const subscription = order.orderSubscriptions[0].subscription;

      // Detectar productos para determinar si incluye Bite
      const products = subscription.products?.map((p: any) => p.name) || [];
      const includesBite = products.some((p: string) =>
        p.toLowerCase().includes("bite")
      );

      // Detectar tipo de plan desde múltiples fuentes
      let planType = "monthly";
      if (
        subscription.frequency === 12 ||
        subscription.name?.includes("annual") ||
        subscription.name?.includes("Anual") ||
        subscription.type === "YEARLY"
      ) {
        planType = "annual";
      }

      console.log(
        `🔍 Plan detectado desde orden: ${planType}, Bite: ${includesBite}`
      );
      return calculatePlanDetails(planType, includesBite);
    }

    // Si no hay información de suscripción, intentar desde el monto total
    if (order.totalAmount || order.total) {
      const amount = order.totalAmount || order.total;

      console.log(`🔍 Detectando plan desde monto: ${amount}`);

      // Detectar el plan basado en el monto (Bite no afecta el precio)
      if (amount === 85000) {
        // Plan anual - detectar Bite desde otros campos
        const includesBite = detectBiteFromOrder(order);
        console.log(`🎯 Plan anual detectado, Bite: ${includesBite}`);
        return calculatePlanDetails("annual", includesBite);
      } else if (amount === 10000) {
        // Plan mensual - detectar Bite desde otros campos
        const includesBite = detectBiteFromOrder(order);
        console.log(`🎯 Plan mensual detectado, Bite: ${includesBite}`);
        return calculatePlanDetails("monthly", includesBite);
      }
    }

    console.log("⚠️ No se pudo detectar plan desde la orden");
    return null;
  } catch (error) {
    console.error("❌ Error detectando plan desde orden:", error);
    return null;
  }
}

// ✅ FUNCIÓN MEJORADA - Detectar Bite desde múltiples fuentes
function detectBiteFromOrder(order: any): boolean {
  try {
    // 1. Buscar en notes de la orden
    if (order.notes && order.notes.toLowerCase().includes("bite")) {
      console.log("🎯 Bite detectado en notes de la orden");
      return true;
    }

    // 2. Buscar en description
    if (order.description && order.description.toLowerCase().includes("bite")) {
      console.log("🎯 Bite detectado en description");
      return true;
    }

    // 3. Buscar en transactionId (formato: subscriptionType-bite|astro-...)
    if (order.transactionId) {
      const transactionParts = order.transactionId.split("-");
      if (transactionParts.length > 1 && transactionParts[1] === "bite") {
        console.log("🎯 Bite detectado en transactionId");
        return true;
      }
    }

    // 4. Buscar en productos de la suscripción
    if (order.orderSubscriptions) {
      for (const orderSub of order.orderSubscriptions) {
        if (orderSub.subscription?.products) {
          const hasBite = orderSub.subscription.products.some((p: any) =>
            p.name.toLowerCase().includes("bite")
          );
          if (hasBite) {
            console.log("🎯 Bite detectado en productos de suscripción");
            return true;
          }
        }
      }
    }

    // 5. Buscar en el reason del preapproval (si está disponible)
    if (
      order.mpSubscriptionReason &&
      order.mpSubscriptionReason.toLowerCase().includes("bite")
    ) {
      console.log("🎯 Bite detectado en mpSubscriptionReason");
      return true;
    }

    console.log("ℹ️ Bite no detectado en la orden");
    return false;
  } catch (error) {
    console.error("❌ Error detectando Bite:", error);
    return false;
  }
}

// Función helper para extraer método de pago del resultado
function getPaymentMethodFromResult(statusResult: any): string | undefined {
  if (statusResult.paymentMethod) {
    return statusResult.paymentMethod;
  }

  if (statusResult.order?.paymentMethod) {
    return statusResult.order.paymentMethod;
  }

  return undefined;
}

// Función helper para extraer email del resultado
function getEmailFromResult(
  statusResult: any,
  matchingOrder: any
): string | undefined {
  if (statusResult.email) {
    return statusResult.email;
  }

  if (statusResult.order?.user?.email) {
    return statusResult.order.user.email;
  }

  if (matchingOrder?.user?.email) {
    return matchingOrder.user.email;
  }

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
    // Buscar por preapprovalId (suscripciones) - PRIORIDAD ALTA
    if (preapprovalId) {
      if (
        order.mpSubscriptionId === preapprovalId ||
        order.transactionId === preapprovalId ||
        order.id === preapprovalId
      ) {
        console.log(`✅ Orden encontrada por preapprovalId: ${order.id}`);
        return true;
      }
    }

    // Buscar por mpSubscriptionId
    if (paymentId && order.mpSubscriptionId === paymentId) {
      console.log(`✅ Orden encontrada por mpSubscriptionId: ${order.id}`);
      return true;
    }

    // Buscar por transactionId que contenga el paymentId
    if (paymentId && order.transactionId?.includes(paymentId)) {
      console.log(`✅ Orden encontrada por transactionId: ${order.id}`);
      return true;
    }

    // Buscar por external reference (ID de la orden)
    if (externalReference && order.id === externalReference) {
      console.log(`✅ Orden encontrada por externalReference: ${order.id}`);
      return true;
    }

    // Buscar por merchantOrderId
    if (
      merchantOrderId &&
      (order.merchantOrderId === merchantOrderId ||
        order.transactionId?.includes(merchantOrderId))
    ) {
      console.log(`✅ Orden encontrada por merchantOrderId: ${order.id}`);
      return true;
    }

    // Buscar por preferenceId
    if (
      preferenceId &&
      (order.preferenceId === preferenceId ||
        order.mpSubscriptionId === preferenceId)
    ) {
      console.log(`✅ Orden encontrada por preferenceId: ${order.id}`);
      return true;
    }

    return false;
  });
}

// Función para calcular detalles del plan
function calculatePlanDetails(planType: string, includesBite: boolean) {
  // Precios fijos según tu base de datos - Bite NO afecta el precio
  const planPrices = {
    annual: 85000,
    monthly: 10000,
    mensual: 10000,
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

// Función para calcular próxima fecha de facturación
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
