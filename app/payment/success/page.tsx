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

  // Obtener parámetros de la URL
  const paymentId = searchParams.get("payment_id");
  const status = searchParams.get("status");
  const merchantOrderId = searchParams.get("merchant_order_id");
  const plan = searchParams.get("plan");
  const bite = searchParams.get("bite") === "true";

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        if (!paymentId && !merchantOrderId) {
          // Si no hay IDs de pago, mostrar información básica desde URL params
          setPaymentDetails({
            planName: plan
              ? `Plan ${plan === "annual" ? "Anual" : "Mensual"}${
                  bite ? " + Bite" : ""
                }`
              : "Plan seleccionado",
            amount: plan === "annual" ? "85.000" : "10.000",
            products: bite ? ["Astrobot", "Bite"] : ["Astrobot"],
          });
          setLoading(false);
          return;
        }

        // Verificar el pago con el backend
        const response = await fetch("/api/verify-payment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentId,
            status,
            merchantOrderId,
            plan,
            bite,
          }),
        });

        if (!response.ok) {
          throw new Error("Error verificando el pago");
        }

        const data = await response.json();

        if (data.success) {
          setPaymentDetails(data.details);
        } else {
          setError(data.message || "Error verificando el pago");
        }
      } catch (error) {
        console.error("Error verificando pago:", error);
        setError("Error de conexión al verificar el pago");

        // Fallback: mostrar información básica
        setPaymentDetails({
          planName: plan
            ? `Plan ${plan === "annual" ? "Anual" : "Mensual"}${
                bite ? " + Bite" : ""
              }`
            : "Plan seleccionado",
          amount: plan === "annual" ? "85.000" : "10.000",
          products: bite ? ["Astrobot", "Bite"] : ["Astrobot"],
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [paymentId, status, merchantOrderId, plan, bite]);

  // Simular carga inicial para evitar pestañeo
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const formatDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return today.toLocaleDateString("es-CL", options);
  };

  const getNextBillingDate = () => {
    const today = new Date();
    if (plan === "annual") {
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
  };

  if (initialLoading) {
    return (
      <div
        className={`payment-result-container ${
          theme === "dark" ? "dark-theme" : "light-theme"
        }`}
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <div
          className="result-card"
          style={{
            textAlign: "center",
            maxWidth: "600px",
            width: "100%",
          }}
        >
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

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
            <p>Verificando tu pago...</p>
          </div>
        </div>
      </div>
    );
  }

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
          <div className="error-notice">
            <p>⚠️ {error}</p>
            <p>
              Tu pago fue procesado exitosamente, pero no pudimos verificar
              todos los detalles.
            </p>
          </div>
        )}

        {paymentDetails && (
          <div className="payment-summary">
            <div className="detail-row">
              <span>Fecha:</span>
              <span>{formatDate()}</span>
            </div>
            <div className="detail-row">
              <span>Plan:</span>
              <span>{paymentDetails.planName}</span>
            </div>
            {paymentDetails.products && (
              <div className="detail-row">
                <span>Productos:</span>
                <span>{paymentDetails.products.join(" + ")}</span>
              </div>
            )}
            <div className="detail-row">
              <span>Monto:</span>
              <span>${paymentDetails.amount} CLP</span>
            </div>
            {paymentDetails.transactionId && (
              <div className="detail-row">
                <span>ID de transacción:</span>
                <span>{paymentDetails.transactionId}</span>
              </div>
            )}
            <div className="detail-row">
              <span>Suscripción activa hasta:</span>
              <span>{paymentDetails.nextBilling || getNextBillingDate()}</span>
            </div>
          </div>
        )}

        <div className="action-buttons">
          <button onClick={() => router.push("/")} className="btn-primary">
            Volver
          </button>
        </div>

        <p className="footer-text">
          Recibirás un email de confirmación en los próximos minutos.
        </p>
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
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: ${theme === "dark" ? "white" : "#1f2937"};
        }

        .subtitle {
          font-size: 1.5rem;
          color: ${theme === "dark" ? "#9ca3af" : "#6b7280"};
          margin-bottom: 2rem;
        }

        .error-notice {
          background: rgba(249, 115, 22, 0.1);
          border: 1px solid rgba(249, 115, 22, 0.3);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          font-size: 1rem;
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

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.75rem;
          font-size: 1.5rem;
        }

        .detail-row:last-child {
          margin-bottom: 0;
        }

        .detail-row span:first-child {
          color: ${theme === "dark" ? "#9ca3af" : "#6b7280"};
        }

        .detail-row span:last-child {
          font-weight: 600;
          color: ${theme === "dark" ? "white" : "#1f2937"};
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          justify-content: center;
        }

        .btn-primary {
          background: var(--color-primary);
          color: white;
          border: none;
          padding: 0.875rem 1.75rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          opacity: 0.9;
        }

        .btn-secondary {
          background: transparent;
          color: ${theme === "dark" ? "#9ca3af" : "#6b7280"};
          border: 1px solid ${theme === "dark" ? "#374151" : "#d1d5db"};
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: ${theme === "dark"
            ? "rgba(255,255,255,0.05)"
            : "#f9fafb"};
        }

        .footer-text {
          font-size: 1.125rem;
          color: ${theme === "dark" ? "#9ca3af" : "#6b7280"};
          margin: 0;
        }

        .loading-spinner {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          color: ${theme === "dark" ? "white" : "#1f2937"};
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

        @media (min-width: 640px) {
          .action-buttons {
            justify-content: center;
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
          font-size: 1rem;
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
