"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useTheme } from "../../hooks/useTheme";
import MercadoPagoIcon from "/public/assets/images/logo/Mercado-Pago.svg";
import DuplicateAccountModal from "../modal/DuplicateAccountModal";

interface OrderSummaryProps {
  onSubscribe: (formData: FormData) => Promise<{
    success: boolean;
    redirectUrl?: string;
    orderId?: string;
    mpSubscriptionId?: string;
    error?: string;
  }>;
  onAdd?: (formData: FormData) => void;
  selectedPlan?: string;
  selectedTitle?: string;
  selectedType?: string;
}

export default function OrderSummary({
  onSubscribe,
  onAdd,
  selectedPlan,
  selectedTitle,
  selectedType,
}: OrderSummaryProps) {
  const [subscriptionType, setSubscriptionType] = useState<
    "monthly" | "annual"
  >("annual");
  const [includeBite, setIncludeBite] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [showDuplicateModal, setShowDuplicateModal] = useState<boolean>(false);
  const [duplicateEmail, setDuplicateEmail] = useState<string>("");

  const theme = useTheme();

  useEffect(() => {
    if (selectedType) {
      setSubscriptionType(selectedType as "monthly" | "annual");
    } else if (selectedTitle) {
      const title = selectedTitle.toLowerCase();
      if (title.includes("mensual") || title.includes("mes")) {
        setSubscriptionType("monthly");
      } else if (title.includes("anual") || title.includes("año")) {
        setSubscriptionType("annual");
      }
    }
  }, [selectedType, selectedTitle]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showDuplicateModal) {
        handleCloseDuplicateModal();
      }
    };

    if (showDuplicateModal) {
      document.addEventListener("keydown", handleEscape);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [showDuplicateModal]);

  const formatDate = () => {
    const today = new Date();
    const day = today.getDate();
    const month = today.toLocaleDateString("es-CL", { month: "long" });
    const year = today.getFullYear();

    return `${day} de ${month} de ${year}`;
  };

  const getSubscriptionDetails = () => {
    if (subscriptionType === "monthly") {
      return {
        periodo: "1 mes",
        precio: "$10.000",
        descripcion: "Mensual",
      };
    } else {
      return {
        periodo: "12 meses",
        precio: "$85.000",
        descripcion: "Anual",
      };
    }
  };

  const details = getSubscriptionDetails();

  const getDisplayTitle = () => {
    if (selectedTitle) {
      return selectedTitle;
    }

    return subscriptionType === "monthly" ? "Plan Mensual" : "Plan Anual";
  };

  const getSelectedProducts = () => {
    const products = ["Astrobot"];
    if (includeBite) {
      products.push("Bite");
    }
    return products;
  };

  const isDark = theme === "dark";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Evitar múltiples envíos
    if (isLoading) return;

    setIsLoading(true);
    const formData = new FormData(e.currentTarget);

    formData.set("includeBite", includeBite.toString());
    formData.set("selectedProducts", getSelectedProducts().join(","));

    try {
      const result = await onSubscribe(formData);

      if (result.success && result.redirectUrl) {
        console.log(`🚀 Redirigiendo a MercadoPago: ${result.redirectUrl}`);
        window.location.href = result.redirectUrl;
      } else {
        console.error("Error en suscripción:", result.error);

        // 🔥 NUEVA LÓGICA: Verificar si es error de cuenta duplicada
        if (
          result.error &&
          result.error.includes("Ya tienes una cuenta activa")
        ) {
          const email = formData.get("email") as string;
          setDuplicateEmail(email);
          setShowDuplicateModal(true);
        } else {
          // Otros errores -> alert o redirigir a página de error
          alert(`Error: ${result.error}`);
        }

        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error enviando formulario:", error);

      // 🔥 NUEVA LÓGICA: También manejar errores de catch (por si acaso)
      if (
        error instanceof Error &&
        error.message.includes("Ya tienes una cuenta activa")
      ) {
        const email = formData.get("email") as string;
        setDuplicateEmail(email);
        setShowDuplicateModal(true);
      } else {
        alert("Error procesando la suscripción");
      }

      setIsLoading(false);
    }
  };

  const handleTryAgain = () => {
    setShowDuplicateModal(false);
    setDuplicateEmail("");

    // Limpiar el campo de email
    const emailInput = document.querySelector(
      'input[name="email"]'
    ) as HTMLInputElement;
    if (emailInput) {
      emailInput.value = "";
      emailInput.focus();
    }
  };

  const handleCloseDuplicateModal = () => {
    setShowDuplicateModal(false);
    setDuplicateEmail("");
  };

  return (
    <form onSubmit={handleSubmit} className="w-100">
      <div className="row gy-5 row--30">
        <div className="col-lg-6">
          <div className="edu-contact-form contact-form-style-1 w-100">
            <div className="section-title">
              <h4 className="title w-600 mb--20">Información de contacto</h4>
            </div>
            <span className="subtitle">
              Usaremos esta información para enviarte detalles de tu
              transacción.
            </span>

            <div className="form-group position-relative mt--40">
              <label
                style={{
                  color: theme === "light" ? "#000" : "inherit",
                }}
              >
                Email *
              </label>
              <input
                required
                name="email"
                type="email"
                placeholder="tu@email.com"
                disabled={isLoading}
              />
              <span className="focus-border" />
            </div>

            <div className="form-group position-relative mt--20">
              <label
                style={{
                  color: theme === "light" ? "#000" : "inherit",
                }}
              >
                Nombre completo *
              </label>
              <input
                required
                name="name"
                type="text"
                placeholder="Tu nombre completo"
                disabled={isLoading}
              />
              <span className="focus-border" />
            </div>

            <div className="form-group position-relative mt--20">
              <label
                style={{
                  color: theme === "light" ? "#000" : "inherit",
                }}
              >
                Tipo de suscripción *
              </label>
              <select
                name="subscriptionType"
                value={subscriptionType}
                onChange={(e) =>
                  setSubscriptionType(e.target.value as "monthly" | "annual")
                }
                className="select-field"
                required
                disabled={isLoading}
                style={{
                  color: theme === "light" ? "#000" : "inherit",
                  borderColor: theme === "light" ? "#ccc" : "#555",
                }}
              >
                <option value="annual">Anual - $85.000 CLP</option>
                <option value="monthly">Mensual - $10.000 CLP</option>
              </select>
              <span className="focus-border" />
            </div>

            {/* Checkbox para agregar BITE */}
            <div className="form-group position-relative mt--30">
              <label className="bite-checkbox-container">
                <input
                  type="checkbox"
                  name="bite"
                  checked={includeBite}
                  onChange={(e) => setIncludeBite(e.target.checked)}
                  disabled={isLoading}
                />
                <span className="bite-checkmark"></span>
                <span className="bite-text">Agregar Bite al plan</span>
              </label>
              <div className="bite-subtitle">Producto adicional opcional</div>
            </div>

            {/* Mostrar información del plan seleccionado si está disponible */}
            <div className="form-group position-relative mt--20">
              <div className="selected-plan-info">
                <small className="text-muted">
                  Plan seleccionado: <strong>{getDisplayTitle()}</strong>
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="order-summary-section">
            <h4
              className="title w-600 mb--30"
              style={{
                color: theme === "light" ? "#000" : "inherit",
                borderColor: theme === "light" ? "#ccc" : "#555",
              }}
            >
              Resumen de orden
            </h4>

            <div
              className={`rainbow-order-summary ${
                isDark ? "theme-dark" : "theme-light"
              }`}
              style={{
                background: isDark
                  ? "var(--color-blackest)"
                  : "rgba(0, 0, 0, 0.1)",
                backdropFilter: isDark ? "none" : "blur(10px)",
                border: isDark ? "none" : "1px solid rgba(255, 255, 255, 0.2)",
                position: "relative",
                zIndex: "auto",
              }}
            >
              <div className="single-list-wrapper">
                <div className="single-list">
                  <label>Fecha:</label>
                  <span
                    style={{
                      color: theme === "light" ? "#000" : "inherit",
                      borderColor: theme === "light" ? "#ccc" : "#555",
                    }}
                  >
                    {formatDate()}
                  </span>
                </div>
                <div className="single-list">
                  <label>Productos:</label>
                  <span
                    style={{
                      color: theme === "light" ? "#000" : "inherit",
                      borderColor: theme === "light" ? "#ccc" : "#555",
                    }}
                  >
                    {getSelectedProducts().join(" + ")}
                  </span>
                </div>
                <div className="single-list">
                  <label>Tipo:</label>
                  <span
                    style={{
                      color: theme === "light" ? "#000" : "inherit",
                      borderColor: theme === "light" ? "#ccc" : "#555",
                    }}
                  >
                    {details.descripcion}
                  </span>
                </div>
                <div className="single-list">
                  <label>Periodo:</label>
                  <span
                    style={{
                      color: theme === "light" ? "#000" : "inherit",
                      borderColor: theme === "light" ? "#ccc" : "#555",
                    }}
                  >
                    {details.periodo}
                  </span>
                </div>
                <div className="single-list">
                  <label>Subtotal:</label>
                  <span
                    style={{
                      color: theme === "light" ? "#000" : "inherit",
                      borderColor: theme === "light" ? "#ccc" : "#555",
                    }}
                  >
                    {details.precio} IVA incluido
                  </span>
                </div>

                <div className="single-list total-row no-border-bottom">
                  <label>Total:</label>
                  <span className="total-amount">{details.precio} CLP</span>
                </div>
              </div>

              {/* Security Badge */}
              <div className="security-badge theme-adaptive">
                <div className="security-icon">
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div className="security-text">
                  <p className="security-title">Pago seguro</p>
                  <p className="security-subtitle">
                    Tu información está protegida
                  </p>
                </div>
              </div>
            </div>

            {/* Botón de pago */}
            <div className="form-submit-group mt--30">
              <button
                type="submit"
                disabled={isLoading}
                className={`btn-default btn-large w-100 payment-button ${
                  isLoading ? "loading" : ""
                }`}
              >
                {isLoading ? (
                  <span className="loading-content">
                    <span className="spinner"></span>
                    <span>Procesando...</span>
                  </span>
                ) : (
                  <>
                    <span>Ir a pagar</span>
                    <Image
                      src={MercadoPagoIcon}
                      alt="Mercado Pago"
                      width={32}
                      height={24}
                      className="ml--10"
                    />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .bite-checkbox-container {
          display: flex !important;
          align-items: center !important;
          cursor: pointer;
          gap: 12px;
          color: ${theme === "light" ? "#000" : "inherit"};
          flex-direction: row !important;
          opacity: ${isLoading ? "0.6" : "1"};
          pointer-events: ${isLoading ? "none" : "auto"};
        }

        .bite-checkbox-container input[type="checkbox"] {
          position: absolute !important;
          opacity: 0 !important;
          width: 0 !important;
          height: 0 !important;
        }

        .bite-checkmark {
          width: 20px !important;
          height: 20px !important;
          border: 2px solid ${theme === "light" ? "#ccc" : "#555"} !important;
          border-radius: 4px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          flex-shrink: 0 !important;
          transition: all 0.2s ease;
          position: relative;
        }

        .bite-checkbox-container
          input[type="checkbox"]:checked
          + .bite-checkmark {
          background-color: var(--color-primary) !important;
          border-color: var(--color-primary) !important;
        }

        .bite-checkbox-container
          input[type="checkbox"]:checked
          + .bite-checkmark::after {
          content: "✓";
          color: white !important;
          font-size: 14px !important;
          font-weight: bold !important;
          position: absolute;
        }

        .bite-title {
          font-weight: 600 !important;
          font-size: 16px !important;
          line-height: 1.2 !important;
          display: inline-block !important;
        }

        .bite-subtitle {
          font-size: 14px !important;
          opacity: 0.7 !important;
          font-style: italic !important;
          margin-top: 4px !important;
          margin-left: 32px !important;
          color: ${theme === "light" ? "#666" : "#aaa"} !important;
        }

        .bite-checkbox-container:hover .bite-checkmark {
          border-color: var(--color-primary) !important;
        }

        /* Estilos para el estado de carga */
        .payment-button.loading {
          opacity: 0.8;
          cursor: not-allowed;
        }

        .loading-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
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

        /* Deshabilitar inputs cuando está cargando */
        input:disabled,
        select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>

      <DuplicateAccountModal
        isOpen={showDuplicateModal}
        onClose={handleCloseDuplicateModal}
        email={duplicateEmail}
        onTryAgain={handleTryAgain}
      />
    </form>
  );
}
