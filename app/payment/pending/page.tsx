"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "../../../hooks/useTheme";
import { useEffect, useState } from "react";

// Componente que usa useSearchParams - DEBE estar en Suspense
function PaymentPendingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const [checking, setChecking] = useState(false);
  const [loading, setLoading] = useState(true);

  const plan = searchParams.get("plan");
  const bite = searchParams.get("bite") === "true";
  const paymentId = searchParams.get("payment_id");
  const orderId = searchParams.get("order_id");

  const checkPaymentStatus = async () => {
    if (!paymentId && !orderId) return;

    setChecking(true);
    try {
      const response = await fetch("/api/check-payment-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId,
          orderId,
        }),
      });

      const data = await response.json();

      if (data.success) {
        if (data.status === "approved") {
          router.push(data.redirectUrl || "/payment/success");
        } else if (data.status === "rejected" || data.status === "cancelled") {
          router.push(data.redirectUrl || "/payment/error");
        }
        // Si sigue pendiente, no hacemos nada
      }
    } catch (error) {
      console.error("Error verificando estado:", error);
    } finally {
      setChecking(false);
    }
  };

  // Auto-verificar cada 30 segundos
  useEffect(() => {
    const interval = setInterval(checkPaymentStatus, 30000);
    return () => clearInterval(interval);
  }, [paymentId, orderId]);

  // Simular carga inicial para evitar pestañeo
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
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
        className="result-card pending"
        style={{
          textAlign: "center",
          maxWidth: "600px",
          width: "100%",
        }}
      >
        <div className="result-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#F59E0B" />
            <path
              d="M12 6v6l4 2"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1>Pago en proceso</h1>
        <p className="subtitle">
          Tu pago está siendo procesado. Esto puede tomar unos minutos.
        </p>

        {plan && (
          <div className="plan-info">
            <p>
              Plan seleccionado:{" "}
              <strong>
                {plan === "annual" ? "Anual" : "Mensual"}
                {bite ? " + Bite" : ""}
              </strong>
            </p>
            <p>
              Monto:{" "}
              <strong>${plan === "annual" ? "85.000" : "10.000"} CLP</strong>
            </p>
          </div>
        )}

        <div className="status-info">
          <h3>¿Qué está pasando?</h3>
          <div className="status-steps">
            <div className="step completed">
              <div className="step-icon">✓</div>
              <div className="step-text">
                <strong>Datos recibidos</strong>
                <p>Hemos recibido tu información de pago</p>
              </div>
            </div>
            <div className="step processing">
              <div className="step-icon">
                <div className="processing-spinner"></div>
              </div>
              <div className="step-text">
                <strong>Procesando pago</strong>
                <p>Tu banco está verificando la transacción</p>
              </div>
            </div>
            <div className="step pending">
              <div className="step-icon">○</div>
              <div className="step-text">
                <strong>Confirmación</strong>
                <p>Te notificaremos cuando esté completo</p>
              </div>
            </div>
          </div>
        </div>

        <div className="auto-check-info">
          <p>
            {checking ? (
              <>
                <span className="checking-spinner"></span>
                Verificando estado...
              </>
            ) : (
              "Verificamos automáticamente el estado cada 30 segundos"
            )}
          </p>
        </div>

        <div className="action-buttons">
          <button
            onClick={checkPaymentStatus}
            disabled={checking}
            className="btn-primary"
          >
            {checking ? "Verificando..." : "Verificar ahora"}
          </button>
          <button onClick={() => router.push("/")} className="btn-secondary">
            Ir al inicio
          </button>
        </div>

        <div className="important-info">
          <h4>Importante:</h4>
          <ul>
            <li>No cierres esta página hasta recibir confirmación</li>
            <li>Recibirás un email cuando el pago sea procesado</li>
            <li>Los pagos pueden tomar hasta 24 horas en confirmarse</li>
            <li>Si tienes dudas, contacta a tu banco</li>
          </ul>
        </div>

        <div className="support-info">
          <p>¿Necesitas ayuda?</p>
          <p>
            Contacta a nuestro soporte en <strong>soporte@tudominio.com</strong>
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
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: ${theme === "dark" ? "white" : "#1f2937"};
        }

        .subtitle {
          font-size: 1.5rem;
          color: ${theme === "dark" ? "#9ca3af" : "#6b7280"};
          margin-bottom: 2rem;
          line-height: 1.5;
        }

        .plan-info {
          background: ${theme === "dark"
            ? "rgba(249, 115, 22, 0.1)"
            : "rgba(249, 115, 22, 0.05)"};
          border: 1px solid rgba(249, 115, 22, 0.2);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          font-size: 1rem;
        }

        .plan-info p {
          margin: 0.25rem 0;
          color: ${theme === "dark" ? "#fbbf24" : "#d97706"};
        }

        .status-info {
          background: ${theme === "dark"
            ? "rgba(255,255,255,0.05)"
            : "#f9fafb"};
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          text-align: left;
        }

        .status-info h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: ${theme === "dark" ? "white" : "#1f2937"};
          text-align: center;
        }

        .status-steps {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .step {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }

        .step-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .step.completed .step-icon {
          background: #10b981;
          color: white;
        }

        .step.processing .step-icon {
          background: #f59e0b;
          color: white;
        }

        .step.pending .step-icon {
          background: ${theme === "dark" ? "#374151" : "#e5e7eb"};
          color: ${theme === "dark" ? "#9ca3af" : "#6b7280"};
        }

        .step-text strong {
          display: block;
          color: ${theme === "dark" ? "white" : "#1f2937"};
          margin-bottom: 0.25rem;
          font-size: 1.125rem;
        }

        .step-text p {
          margin: 0;
          font-size: 1rem;
          color: ${theme === "dark" ? "#9ca3af" : "#6b7280"};
        }

        .processing-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid transparent;
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .auto-check-info {
          background: ${theme === "dark"
            ? "rgba(59, 130, 246, 0.1)"
            : "rgba(59, 130, 246, 0.05)"};
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          font-size: 1rem;
          color: ${theme === "dark" ? "#93c5fd" : "#1d4ed8"};
        }

        .auto-check-info p {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          justify-content: center;
        }

        .checking-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .action-buttons {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-direction: column;
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

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary:hover:not(:disabled) {
          opacity: 0.9;
        }

        .btn-secondary {
          background: transparent;
          color: ${theme === "dark" ? "#9ca3af" : "#6b7280"};
          border: 1px solid ${theme === "dark" ? "#374151" : "#d1d5db"};
          padding: 0.875rem 1.75rem;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-secondary:hover {
          background: ${theme === "dark"
            ? "rgba(255,255,255,0.05)"
            : "#f9fafb"};
        }

        .important-info {
          background: ${theme === "dark"
            ? "rgba(255,255,255,0.05)"
            : "#f9fafb"};
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          text-align: left;
        }

        .important-info h4 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: ${theme === "dark" ? "white" : "#1f2937"};
        }

        .important-info ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .important-info li {
          padding: 0.5rem 0;
          position: relative;
          padding-left: 1.5rem;
          color: ${theme === "dark" ? "#d1d5db" : "#4b5563"};
          font-size: 1.125rem;
        }

        .important-info li::before {
          content: "ℹ";
          color: #f59e0b;
          position: absolute;
          left: 0;
          font-weight: bold;
        }

        .support-info {
          font-size: 1.125rem;
          color: ${theme === "dark" ? "#9ca3af" : "#6b7280"};
          border-top: 1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"};
          padding-top: 1rem;
        }

        .support-info p {
          margin: 0.25rem 0;
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
            flex-direction: row;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}

// Componente de loading para Suspense
function PaymentPendingLoading() {
  return (
    <div className="payment-loading">
      <div className="loading-spinner"></div>
      <p>Cargando estado del pago...</p>

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
          border-top: 4px solid #f59e0b;
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
export default function PaymentPending() {
  return (
    <Suspense fallback={<PaymentPendingLoading />}>
      <PaymentPendingContent />
    </Suspense>
  );
}
