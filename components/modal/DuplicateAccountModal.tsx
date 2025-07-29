import React, { useState } from "react";
import { X, Mail, ArrowRight } from "lucide-react";

interface DuplicateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onTryAgain: () => void;
}

const DuplicateAccountModal: React.FC<DuplicateAccountModalProps> = ({
  isOpen,
  onClose,
  email,
  onTryAgain,
}) => {
  // Simulamos el hook useTheme con estado local para la demo
  const [theme, setTheme] = useState("dark");
  const isDark = theme === "dark";

  // Si el modal no está abierto, no renderizar nada
  if (!isOpen) {
    return null;
  }

  // Función para manejar el click en el overlay
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Solo cerrar si se hace click directamente en el overlay
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Función para manejar la tecla Escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "system-ui, sans-serif" }}>
      {/* Toggle para demo */}
      <div
        style={{
          marginBottom: "20px",
          textAlign: "center",
          padding: "10px",
          backgroundColor: isDark ? "#1f2937" : "#f3f4f6",
          borderRadius: "8px",
        }}
      >
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          style={{
            padding: "8px 16px",
            backgroundColor: isDark ? "#374151" : "#e5e7eb",
            color: isDark ? "white" : "black",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Cambiar a modo {theme === "dark" ? "claro" : "oscuro"}
        </button>
        <p
          style={{ margin: "10px 0 0", color: isDark ? "#d1d5db" : "#6b7280" }}
        >
          Tema actual: <strong>{theme === "dark" ? "Oscuro" : "Claro"}</strong>
        </p>
      </div>

      {/* Overlay con click handler */}
      <div
        className="modal-overlay"
        onClick={handleOverlayClick}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      />

      {/* Modal */}
      <div className="duplicate-account-modal">
        {/* Close button - ahora llama correctamente a onClose */}
        <button
          onClick={onClose}
          className="modal-close-btn"
          type="button"
          aria-label="Cerrar modal"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="modal-icon">
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
        </div>

        {/* Title */}
        <h2 className="modal-title">Cuenta ya existe</h2>

        {/* Message */}
        <div className="modal-content">
          <p className="modal-text">
            Ya tienes una cuenta activa con el email:
          </p>
          <div className="modal-email-box">
            <Mail className="modal-email-icon" />
            <span className="modal-email-text">
              {email || "test-duplicate@ejemplo.com"}
            </span>
          </div>
          <p className="modal-subtitle">
            No puedes crear una nueva suscripción con este email.
          </p>
        </div>

        {/* Actions */}
        <div className="modal-actions">
          <button
            onClick={onTryAgain}
            className="modal-btn-primary"
            type="button"
          >
            <span>Intentar con otro email</span>
            <ArrowRight size={16} />
          </button>

          <button
            onClick={onClose}
            className="modal-btn-secondary"
            type="button"
          >
            Cancelar
          </button>
        </div>

        {/* Optional: Link to login/recovery */}
        <div className="modal-footer">
          <p className="modal-footer-text">
            ¿Ya tienes acceso?{" "}
            <a
              href="http://astrobot.taxlight.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="modal-footer-link"
            >
              Iniciar sesión
            </a>
          </p>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: ${isDark ? "rgba(0, 0, 0, 0.8)" : "rgba(0, 0, 0, 0.5)"};
          z-index: 9998;
          backdrop-filter: blur(4px);
        }

        .duplicate-account-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: ${isDark ? "#000000" : "white"};
          border: ${isDark ? "1px solid var(--color-border)" : "none"};
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          max-width: 600px;
          width: 90%;
          padding: 3rem;
          z-index: 9999;
          animation: modalEnter 0.2s ease-out;
        }

        @keyframes modalEnter {
          from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
          }
        }

        .modal-close-btn {
          position: absolute;
          top: 16px;
          right: 16px;
          background: none;
          border: none;
          color: ${isDark ? "#9ca3af" : "#6b7280"};
          cursor: pointer;
          padding: 8px;
          border-radius: 4px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-close-btn:hover {
          color: ${isDark ? "#d1d5db" : "#4b5563"};
          background: ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"};
        }

        .modal-close-btn:focus {
          outline: 2px solid var(--color-primary, #3b82f6);
          outline-offset: 2px;
        }

        .modal-icon {
          display: flex;
          justify-content: center;
          margin-bottom: 1.5rem;
        }

        .modal-title {
          font-size: 2.5rem;
          font-weight: 700;
          color: ${isDark ? "white" : "#1f2937"};
          text-align: center;
          margin: 0 0 0.5rem 0;
        }

        .modal-content {
          text-align: center;
          margin-bottom: 2rem;
          background: ${isDark ? "rgba(255, 255, 255, 0.05)" : "transparent"};
          padding: ${isDark ? "1.5rem" : "0"};
          border-radius: ${isDark ? "12px" : "0"};
        }

        .modal-text {
          color: ${isDark ? "#d1d5db" : "#4b5563"};
          margin: 0 0 1.5rem 0;
          font-size: 1.25rem;
          line-height: 1.5;
        }

        .modal-email-box {
          background: ${isDark
            ? "rgba(59, 130, 246, 0.1)"
            : "rgba(59, 130, 246, 0.05)"};
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 8px;
          padding: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 1.5rem;
        }

        .modal-email-icon {
          width: 20px;
          height: 20px;
          color: ${isDark ? "#93c5fd" : "#1d4ed8"};
        }

        .modal-email-text {
          font-weight: 600;
          color: ${isDark ? "#93c5fd" : "#1d4ed8"};
          font-size: 1.25rem;
        }

        .modal-subtitle {
          font-size: 1.125rem;
          color: ${isDark ? "#d1d5db" : "#4b5563"};
          margin: 0;
          line-height: 1.5;
        }

        .modal-actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 1.5rem;
          justify-content: center;
        }

        .modal-btn-primary {
          width: 100%;
          background: var(--color-primary, #3b82f6);
          color: white;
          font-weight: 600;
          padding: 0.875rem 1.75rem;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 1.5rem;
        }

        .modal-btn-primary:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .modal-btn-primary:focus {
          outline: 2px solid var(--color-primary, #3b82f6);
          outline-offset: 2px;
        }

        .modal-btn-secondary {
          width: 100%;
          background: transparent;
          color: ${isDark ? "#9ca3af" : "#6b7280"};
          border: 1px solid ${isDark ? "#374151" : "#d1d5db"};
          font-weight: 600;
          padding: 0.875rem 1.75rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 1.5rem;
        }

        .modal-btn-secondary:hover {
          background: ${isDark ? "rgba(255,255,255,0.05)" : "#f9fafb"};
          transform: translateY(-1px);
        }

        .modal-btn-secondary:focus {
          outline: 2px solid var(--color-primary, #3b82f6);
          outline-offset: 2px;
        }

        .modal-footer {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid ${isDark ? "#374151" : "#e5e7eb"};
          text-align: center;
        }

        .modal-footer-text {
          font-size: 1.125rem;
          color: ${isDark ? "#9ca3af" : "#6b7280"};
          margin: 0.25rem 0;
        }

        .modal-footer-link {
          color: var(--color-primary, #3b82f6);
          text-decoration: none;
          font-weight: 600;
          transition: opacity 0.2s;
        }

        .modal-footer-link:hover {
          opacity: 0.8;
          text-decoration: underline;
        }

        .modal-footer-link:focus {
          outline: 2px solid var(--color-primary, #3b82f6);
          outline-offset: 2px;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .duplicate-account-modal {
            margin: 1rem;
            width: calc(100% - 2rem);
            max-width: none;
            padding: 2rem;
          }

          .modal-title {
            font-size: 1.75rem;
          }

          .modal-text {
            font-size: 1rem;
          }
        }

        @media (min-width: 640px) {
          .modal-actions {
            flex-direction: row;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default DuplicateAccountModal;
