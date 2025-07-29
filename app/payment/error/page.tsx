"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "../../../hooks/useTheme";
import { useEffect, useState } from "react";

// Componente que usa useSearchParams - DEBE estar en Suspense
function PaymentErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);

  const errorType = searchParams.get("type") || "general";
  const errorMessage =
    searchParams.get("message") || "Ocurrió un error procesando tu pago";
  const plan = searchParams.get("plan");
  const bite = searchParams.get("bite") === "true";

  const getErrorIcon = () => {
    switch (errorType) {
      case "rejected":
        return (
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#EF4444" />
            <path
              d="m15 9-6 6m0-6 6 6"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case "cancelled":
        return (
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#F59E0B" />
            <path
              d="M12 8v4m0 4h.01"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      default:
        return (
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#EF4444" />
            <path
              d="m15 9-6 6m0-6 6 6"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
    }
  };

  const getErrorTitle = () => {
    switch (errorType) {
      case "rejected":
        return "Pago rechazado";
      case "cancelled":
        return "Pago cancelado";
      case "insufficient_funds":
        return "Fondos insuficientes";
      case "invalid_card":
        return "Tarjeta inválida";
      case "expired_card":
        return "Tarjeta vencida";
      default:
        return "Error en el pago";
    }
  };

  const getErrorDescription = () => {
    switch (errorType) {
      case "rejected":
        return "Tu entidad bancaria rechazó el pago. Intenta con otro método de pago o contacta a tu banco.";
      case "cancelled":
        return "El pago fue cancelado. Puedes intentar nuevamente cuando lo desees.";
      case "insufficient_funds":
        return "No tienes fondos suficientes en tu cuenta. Verifica tu saldo e intenta nuevamente.";
      case "invalid_card":
        return "Los datos de la tarjeta son incorrectos. Verifica los datos e intenta nuevamente.";
      case "expired_card":
        return "Tu tarjeta ha vencido. Usa una tarjeta vigente para completar el pago.";
      default:
        return errorMessage;
    }
  };

  const getRetryUrl = () => {
    const params = new URLSearchParams();
    if (plan) params.set("plan", plan);
    if (bite) params.set("bite", "true");

    return `/pricing${params.toString() ? `?${params.toString()}` : ""}`;
  };

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
        className="result-card error"
        style={{
          textAlign: "center",
          maxWidth: "600px",
          width: "100%",
        }}
      >
        <div className="result-icon">{getErrorIcon()}</div>

        <h1>{getErrorTitle()}</h1>
        <p className="subtitle">{getErrorDescription()}</p>

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

        <div className="error-details">
          <h3>¿Qué puedes hacer?</h3>
          <ul>
            {errorType === "rejected" && (
              <>
                <li>Verifica que los datos de tu tarjeta sean correctos</li>
                <li>Contacta a tu banco para autorizar el pago</li>
                <li>Intenta con otra tarjeta o método de pago</li>
              </>
            )}
            {errorType === "cancelled" && (
              <>
                <li>Intenta el proceso de pago nuevamente</li>
                <li>Asegúrate de completar todos los pasos</li>
              </>
            )}
            {errorType === "insufficient_funds" && (
              <>
                <li>Verifica el saldo de tu cuenta</li>
                <li>Intenta con otra tarjeta</li>
                <li>Contacta a tu banco si crees que es un error</li>
              </>
            )}
            {!["rejected", "cancelled", "insufficient_funds"].includes(
              errorType
            ) && (
              <>
                <li>Verifica tu conexión a internet</li>
                <li>Intenta nuevamente en unos minutos</li>
                <li>Contacta a soporte si el problema persiste</li>
              </>
            )}
          </ul>
        </div>

        <div className="action-buttons">
          <button
            onClick={() => router.push(getRetryUrl())}
            className="btn-primary"
          >
            Intentar nuevamente
          </button>
          <button onClick={() => router.push("/")} className="btn-secondary">
            Ir al inicio
          </button>
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
            ? "rgba(59, 130, 246, 0.1)"
            : "rgba(59, 130, 246, 0.05)"};
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.5rem;
          font-size: 1rem;
        }

        .plan-info p {
          margin: 0.25rem 0;
          color: ${theme === "dark" ? "#93c5fd" : "#1d4ed8"};
        }

        .error-details {
          background: ${theme === "dark"
            ? "rgba(255,255,255,0.05)"
            : "#f9fafb"};
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          text-align: left;
        }

        .error-details h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: ${theme === "dark" ? "white" : "#1f2937"};
          text-align: center;
        }

        .error-details ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .error-details li {
          padding: 0.5rem 0;
          position: relative;
          padding-left: 1.5rem;
          color: ${theme === "dark" ? "#d1d5db" : "#4b5563"};
          font-size: 1.125rem;
        }

        .error-details li::before {
          content: "•";
          color: var(--color-primary);
          position: absolute;
          left: 0;
          font-weight: bold;
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

        .btn-primary:hover {
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
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid var(--color-primary, #3b82f6);
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
function PaymentErrorLoading() {
  return (
    <div className="payment-loading">
      <div className="loading-spinner"></div>
      <p>Cargando información del error...</p>

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
          border-top: 4px solid #3b82f6;
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
export default function PaymentError() {
  return (
    <Suspense fallback={<PaymentErrorLoading />}>
      <PaymentErrorContent />
    </Suspense>
  );
}
