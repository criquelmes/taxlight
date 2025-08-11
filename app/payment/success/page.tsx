"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "../../../hooks/useTheme";

interface PaymentDetails {
  orderId?: string;
  planName?: string;
  amount?: string;
  transactionId?: string;
  nextBilling?: string;
  products?: string[];
  status?: string;
  paymentMethod?: string;
  email?: string;
  isPreapproval?: boolean;
}

// Función para inferir detalles del plan desde el preapproval
function inferPlanFromPreapproval(
  preapprovalId: string | null,
  externalReference: string | null
) {
  if (!preapprovalId) return null;

  // Para preapprovals, NO asumir valores por defecto
  // Dejar que los parámetros de URL o el backend determinen los valores correctos
  return {
    planType: null, // No asumir, usar parámetros de URL
    includesBite: null, // No asumir, usar parámetros de URL
    needsVerification: true,
  };
}

// Función para crear detalles de fallback
function createFallbackDetails(
  planDetails: any,
  paymentId: string | null,
  collectionId: string | null,
  preapprovalId: string | null
) {
  const planType = planDetails?.planType || "annual";
  const includesBite = planDetails?.includesBite || false;

  // Función auxiliar para obtener nombre del plan
  const getPlanDisplayName = (planType: string, includesBite: boolean) => {
    const planNames = {
      annual: "Plan Anual",
      monthly: "Plan Mensual",
      mensual: "Plan Mensual",
    };

    const baseName =
      planNames[planType as keyof typeof planNames] || `Plan ${planType}`;
    return includesBite ? `${baseName} + Bite` : baseName;
  };

  // Función auxiliar para obtener monto del plan (Bite NO afecta el precio)
  const getPlanAmount = (planType: string) => {
    const planPrices = {
      annual: 85000, // Precio fijo para anual
      monthly: 10000, // Precio fijo para mensual
      mensual: 10000, // Precio fijo para mensual
    };

    const amount = planPrices[planType as keyof typeof planPrices] || 10000;
    return amount.toLocaleString("es-CL");
  };

  return {
    planName: getPlanDisplayName(planType, includesBite),
    amount: getPlanAmount(planType), // Solo depende del tipo de plan
    products: includesBite ? ["Astrobot", "Bite"] : ["Astrobot"],
    transactionId: paymentId || collectionId || preapprovalId || "N/A",
    status: "approved",
    isPreapproval: !!preapprovalId,
  };
}

// Componente que usa useSearchParams - DEBE estar en Suspense
function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Obtener parámetros de la URL - MercadoPago envía diferentes parámetros según el tipo de pago
  const paymentId = searchParams.get("payment_id");
  const status = searchParams.get("status");
  const merchantOrderId = searchParams.get("merchant_order_id");
  const preferenceId = searchParams.get("preference_id");

  // Parámetros específicos de suscripciones (preapproval)
  const preapprovalId = searchParams.get("preapproval_id");
  const collectionId = searchParams.get("collection_id");
  const collectionStatus = searchParams.get("collection_status");
  const paymentType = searchParams.get("payment_type");
  const externalReference = searchParams.get("external_reference");

  // Parámetros del plan desde la URL o inferir del preapproval
  const plan = searchParams.get("plan");
  const bite = searchParams.get("bite") === "true";

  // Función para mapear el nombre del plan
  const getPlanDisplayName = (
    planType: string | null,
    includesBite: boolean
  ) => {
    if (!planType) return "Plan seleccionado";

    const planNames = {
      annual: "Plan Anual",
      monthly: "Plan Mensual",
      mensual: "Plan Mensual",
    };

    const baseName =
      planNames[planType as keyof typeof planNames] || `Plan ${planType}`;
    return includesBite ? `${baseName} + Bite` : baseName;
  };

  // Función para obtener el monto según el plan (Bite NO afecta el precio)
  const getPlanAmount = (planType: string | null, includesBite: boolean) => {
    const baseAmounts = {
      annual: 85000, // Precio fijo
      monthly: 10000, // Precio fijo
      mensual: 10000, // Precio fijo
    };

    const amount = baseAmounts[planType as keyof typeof baseAmounts] || 10000;
    // Bite NO afecta el precio, solo indica qué productos activar externamente

    return amount.toLocaleString("es-CL");
  };

  // Función para determinar si el pago fue exitoso
  const isPaymentSuccessful = (
    status: string | null,
    collectionStatus: string | null
  ) => {
    const successStatuses = ["approved", "success", "completed"];
    return (
      successStatuses.includes(status?.toLowerCase() || "") ||
      successStatuses.includes(collectionStatus?.toLowerCase() || "")
    );
  };

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Verificar si tenemos al menos un ID de pago o preapproval
        const hasPaymentId =
          paymentId || collectionId || merchantOrderId || preapprovalId;

        if (!hasPaymentId) {
          setError("No se encontró información del pago en la URL");
          setPaymentDetails(null);
          setLoading(false);
          return;
        }

        // Determinar el estado del pago
        const paymentSuccessful = isPaymentSuccessful(status, collectionStatus);

        // Para preapprovals, si no hay status específico pero tenemos preapprovalId, asumir éxito
        const isPreapprovalFlow = !!preapprovalId;
        const shouldProcessAsSuccess =
          paymentSuccessful || (isPreapprovalFlow && !status);

        if (!shouldProcessAsSuccess && (status || collectionStatus)) {
          setError("El pago no fue completado exitosamente");
          setPaymentDetails(null);
          setLoading(false);
          return;
        }

        // Inferir detalles del plan desde el preapproval o usar parámetros de URL
        const inferredPlanDetails = inferPlanFromPreapproval(
          preapprovalId,
          externalReference
        );

        // ✅ PRIORIZAR PARÁMETROS DE URL SOBRE CUALQUIER INFERENCIA
        const planType = plan || inferredPlanDetails?.planType || "monthly"; // Default a monthly si no hay info
        const includesBite =
          bite !== undefined
            ? bite
            : inferredPlanDetails?.includesBite || false;

        // Verificar el pago con el backend
        const response = await fetch("/api/verify-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentId: paymentId || collectionId,
            preapprovalId,
            status,
            collectionStatus,
            merchantOrderId,
            preferenceId,
            externalReference,
            plan: planType,
            bite: includesBite,
            paymentType,
          }),
        });

        if (!response.ok) {
          throw new Error(`Error del servidor: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.details) {
          setPaymentDetails(data.details);
        } else {
          // Si el backend no puede verificar, usar información de fallback
          console.warn("Backend verification failed, using fallback data");

          // Para preapprovals, necesitamos ser más cuidadosos con los montos
          let fallbackPlanType = planType;
          let fallbackIncludesBite = includesBite;

          // Si es un preapproval sin información clara del plan, inferir desde el contexto
          if (preapprovalId && !plan && bite === undefined) {
            // ✅ NO ASUMIR VALORES - usar fallback conservador
            fallbackPlanType = "monthly"; // Cambiar default a monthly
            fallbackIncludesBite = false; // Sin Bite por defecto
          }

          const fallbackDetails = createFallbackDetails(
            { planType: fallbackPlanType, includesBite: fallbackIncludesBite },
            paymentId,
            collectionId,
            preapprovalId
          );
          setPaymentDetails(fallbackDetails);
        }
      } catch (error) {
        console.error("Error verificando pago:", error);
        setError("Error de conexión al verificar el pago");

        // Fallback más robusto: mostrar información básica si tenemos parámetros válidos
        const paymentSuccessful = isPaymentSuccessful(status, collectionStatus);
        const hasValidPayment =
          (paymentSuccessful && (paymentId || collectionId)) || preapprovalId;

        if (hasValidPayment) {
          const inferredPlanDetails = inferPlanFromPreapproval(
            preapprovalId,
            externalReference
          );

          // Para preapprovals, asumir que incluye Bite por defecto
          let fallbackPlanType = "annual";
          let fallbackIncludesBite = true; // Cambiar por defecto a true para preapprovals

          // Si tenemos parámetros explícitos, usarlos
          if (plan) fallbackPlanType = plan;
          if (bite !== undefined) fallbackIncludesBite = bite;

          const fallbackDetails = createFallbackDetails(
            { planType: fallbackPlanType, includesBite: fallbackIncludesBite },
            paymentId,
            collectionId,
            preapprovalId
          );
          setPaymentDetails(fallbackDetails);
        }
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [
    paymentId,
    collectionId,
    preapprovalId,
    status,
    collectionStatus,
    merchantOrderId,
    preferenceId,
    externalReference,
    plan,
    bite,
    paymentType,
  ]);

  // Simular carga inicial para evitar pestañeo
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const formatDate = (date?: string) => {
    const targetDate = date ? new Date(date) : new Date();
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return targetDate.toLocaleDateString("es-CL", options);
  };

  const getNextBillingDate = () => {
    const today = new Date();

    // ✅ USAR PARÁMETROS DE URL PARA DETERMINAR EL TIPO DE PLAN
    const isAnnual =
      plan === "annual" ||
      (paymentDetails?.planName && paymentDetails.planName.includes("Anual"));

    if (isAnnual) {
      today.setFullYear(today.getFullYear() + 1);
    } else {
      today.setMonth(today.getMonth() + 1);
    }
    return formatDate(today.toISOString());
  };

  // Estado de carga inicial
  if (initialLoading) {
    return (
      <div
        className={`payment-result-container ${
          theme === "dark" ? "dark-theme" : "light-theme"
        }`}
      >
        <div className="result-card">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Procesando información del pago...</p>
          </div>
        </div>
      </div>
    );
  }

  // Estado de carga de verificación
  if (loading) {
    return (
      <div
        className={`payment-result-container ${
          theme === "dark" ? "dark-theme" : "light-theme"
        }`}
      >
        <div className="result-card">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Verificando tu pago con MercadoPago...</p>
          </div>
        </div>
      </div>
    );
  }

  // Estado de error sin detalles de pago
  if (error && !paymentDetails) {
    return (
      <div
        className={`payment-result-container ${
          theme === "dark" ? "dark-theme" : "light-theme"
        }`}
      >
        <div className="result-card error">
          <div className="result-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#ef4444" />
              <path
                d="m15 9-6 6M9 9l6 6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1>Error en el pago</h1>
          <p className="subtitle">{error}</p>
          <div className="action-buttons">
            <button
              onClick={() => router.push("/pricing")}
              className="btn-primary"
            >
              Intentar nuevamente
            </button>
            <button onClick={() => router.push("/")} className="btn-secondary">
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Estado de éxito con detalles
  return (
    <div
      className={`payment-result-container ${
        theme === "dark" ? "dark-theme" : "light-theme"
      }`}
    >
      <div className="result-card success">
        <div className="result-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#10B981" />
            <path
              d="m9 12 2 2 4-4"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1>¡Pago exitoso!</h1>
        <p className="subtitle">
          Tu suscripción ha sido activada correctamente
        </p>

        {error && (
          <div className="warning-notice">
            <p>⚠️ {error}</p>
            <p>
              Tu pago fue procesado exitosamente, pero algunos detalles podrían
              no estar completos.
            </p>
          </div>
        )}

        {paymentDetails && (
          <div className="payment-summary">
            <h3>Detalles de la suscripción</h3>

            <div className="detail-row">
              <span>Fecha de compra:</span>
              <span>{formatDate()}</span>
            </div>

            <div className="detail-row">
              <span>Plan:</span>
              <span>{paymentDetails.planName}</span>
            </div>

            {paymentDetails.products && (
              <div className="detail-row">
                <span>Productos incluidos:</span>
                <span>{paymentDetails.products.join(" + ")}</span>
              </div>
            )}

            <div className="detail-row highlight">
              <span>Monto pagado:</span>
              <span>${paymentDetails.amount} CLP</span>
            </div>

            {paymentDetails.transactionId && (
              <div className="detail-row">
                <span>ID de transacción:</span>
                <span className="transaction-id">
                  {paymentDetails.transactionId}
                </span>
              </div>
            )}

            <div className="detail-row">
              <span>Próxima renovación:</span>
              <span>{paymentDetails.nextBilling || getNextBillingDate()}</span>
            </div>

            {paymentDetails.status && (
              <div className="detail-row">
                <span>Estado:</span>
                <span className="status-badge">
                  {paymentDetails.status === "approved"
                    ? "Aprobado"
                    : paymentDetails.status}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="action-buttons">
          <button
            onClick={() => router.push("http://astrobot.taxlight.cl")}
            className="btn-primary"
          >
            Ir a Astrobot
          </button>
          <button onClick={() => router.push("/")} className="btn-secondary">
            Volver al inicio
          </button>
        </div>

        <div className="footer-info">
          <p className="footer-text">
            ✉️ Recibirás un email de confirmación en los próximos minutos.
          </p>
          <p className="footer-text small">
            Si tienes algún problema, contacta a nuestro soporte.
          </p>
        </div>
      </div>

      <style jsx>{`
        .payment-result-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          background: ${theme === "dark" ? "var(--color-blackest)" : "#f8fafc"};
        }

        .result-card {
          background: ${theme === "dark" ? "var(--color-dark)" : "white"};
          border-radius: 16px;
          padding: 3rem;
          text-align: center;
          max-width: 600px;
          width: 100%;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          border: ${theme === "dark"
            ? "1px solid var(--color-border)"
            : "none"};
        }

        .result-icon {
          margin-bottom: 1.5rem;
          display: flex;
          justify-content: center;
        }

        h1 {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: ${theme === "dark" ? "white" : "#1f2937"};
        }

        .subtitle {
          font-size: 1.75rem;
          color: ${theme === "dark" ? "#9ca3af" : "#6b7280"};
          margin-bottom: 2rem;
        }

        .warning-notice {
          background: rgba(249, 115, 22, 0.1);
          border: 1px solid rgba(249, 115, 22, 0.3);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          font-size: 1.125rem;
          color: ${theme === "dark" ? "#fbbf24" : "#d97706"};
        }

        .payment-summary {
          background: ${theme === "dark"
            ? "rgba(255,255,255,0.05)"
            : "#f9fafb"};
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          text-align: left;
        }

        .payment-summary h3 {
          margin: 0 0 1.5rem 0;
          font-size: 1.75rem;
          font-weight: 600;
          color: ${theme === "dark" ? "white" : "#1f2937"};
          text-align: center;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.75rem;
          font-size: 1.25rem;
          padding: 0.5rem 0;
        }

        .detail-row:last-child {
          margin-bottom: 0;
        }

        .detail-row.highlight {
          background: ${theme === "dark"
            ? "rgba(16, 185, 129, 0.1)"
            : "rgba(16, 185, 129, 0.05)"};
          border-radius: 6px;
          padding: 0.75rem;
          margin: 0.5rem -0.25rem;
          font-weight: 600;
        }

        .detail-row span:first-child {
          color: ${theme === "dark" ? "#9ca3af" : "#6b7280"};
          font-weight: 500;
        }

        .detail-row span:last-child {
          font-weight: 600;
          color: ${theme === "dark" ? "white" : "#1f2937"};
          text-align: right;
        }

        .transaction-id {
          font-family: monospace;
          font-size: 1.125rem;
          background: ${theme === "dark" ? "rgba(255,255,255,0.1)" : "#e5e7eb"};
          padding: 0.375rem 0.75rem;
          border-radius: 6px;
        }

        .status-badge {
          background: #10b981;
          color: white;
          padding: 0.375rem 1rem;
          border-radius: 20px;
          font-size: 1.125rem;
          font-weight: 600;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-primary {
          background: var(--color-primary);
          color: white;
          border: none;
          padding: 0.875rem 1.75rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1.25rem;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 140px;
        }

        .btn-primary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .btn-secondary {
          background: transparent;
          color: ${theme === "dark" ? "#9ca3af" : "#6b7280"};
          border: 1px solid ${theme === "dark" ? "#374151" : "#d1d5db"};
          padding: 0.875rem 1.75rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1.25rem;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 140px;
        }

        .btn-secondary:hover {
          background: ${theme === "dark"
            ? "rgba(255,255,255,0.05)"
            : "#f9fafb"};
          transform: translateY(-1px);
        }

        .footer-info {
          border-top: 1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"};
          padding-top: 1.5rem;
        }

        .footer-text {
          font-size: 1.25rem;
          color: ${theme === "dark" ? "#9ca3af" : "#6b7280"};
          margin: 0.5rem 0;
        }

        .footer-text.small {
          font-size: 1rem;
          opacity: 0.8;
        }

        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: ${theme === "dark" ? "white" : "#1f2937"};
          padding: 2rem;
          font-size: 1.125rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid transparent;
          border-top: 3px solid var(--color-primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 640px) {
          .result-card {
            padding: 2rem;
          }

          h1 {
            font-size: 2.5rem;
          }

          .subtitle {
            font-size: 1.5rem;
          }

          .detail-row {
            font-size: 1.125rem;
          }

          .detail-row.highlight {
            font-size: 1.25rem;
          }

          .payment-summary h3 {
            font-size: 2.5rem;
          }

          .btn-primary,
          .btn-secondary {
            font-size: 1.125rem;
            padding: 1rem 2rem;
          }

          .action-buttons {
            flex-direction: column;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

// Componente de loading para Suspense
function PaymentSuccessLoading() {
  return (
    <div className="payment-loading">
      <div className="loading-spinner"></div>
      <p>Cargando confirmación del pago...</p>

      <style jsx>{`
        .payment-loading {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          background: #f8fafc;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #10b981;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        p {
          color: #6b7280;
          font-size: 1.125rem;
          margin: 0;
        }
      `}</style>
    </div>
  );
}

// Componente principal - ENVUELTO EN SUSPENSE
export default function PaymentSuccess() {
  return (
    <Suspense fallback={<PaymentSuccessLoading />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
