"use client";
import { useEffect, useState } from "react";
import "../public/assets/scss/main.scss";
import "react-modal-video/scss/modal-video.scss";
import "photoswipe/dist/photoswipe.css";
import { usePathname } from "next/navigation";
import sal from "sal.js";

import BackToTop from "../components/common/BackToTop";
import MobileMenu from "../components/headers/MobileMenu";
import { closeMenu } from "../utlis/toggleMenu";
import Topbar from "../components/topBar/Topbar";

export default function RootLayout({ children }) {
  const [showFloatingTopbar, setShowFloatingTopbar] = useState(false);
  const [isTopbarClosed, setIsTopbarClosed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      import("bootstrap/dist/js/bootstrap.esm").then(() => {});
    }
  }, []);

  const pathname = usePathname();
  useEffect(() => {
    sal({
      threshold: 0.01,
      once: true,
    });
  }, [pathname]);

  useEffect(() => {
    closeMenu();
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 250) {
        document.querySelector(".header-sticky")?.classList.add("sticky");
      } else {
        document.querySelector(".header-sticky")?.classList.remove("sticky");
      }

      if (window.scrollY > 400 && !isTopbarClosed) {
        setShowFloatingTopbar(true);
      } else if (window.scrollY <= 400) {
        setShowFloatingTopbar(false);
        setIsTopbarClosed(false); // Reset cuando vuelve arriba
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isTopbarClosed]);

  const closeFloatingTopbar = () => {
    setShowFloatingTopbar(false);
    setIsTopbarClosed(true);
  };

  useEffect(() => {
    const handleTopbarClick = (e) => {
      if (
        e.target.classList.contains("close") ||
        e.target.classList.contains("btn-close") ||
        e.target.closest(".close") ||
        e.target.closest(".btn-close")
      ) {
        closeFloatingTopbar();
      }
    };

    const topbarElement = document.querySelector(".floating-topbar");
    if (topbarElement) {
      topbarElement.addEventListener("click", handleTopbarClick);
      return () =>
        topbarElement.removeEventListener("click", handleTopbarClick);
    }
  }, [showFloatingTopbar]);

  return (
    <html lang="en">
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              try {
                const isDarkmode = localStorage.getItem('isDarkmode');
                
                if (isDarkmode === 'true') {
                  document.body.className = 'active-dark-mode';
                } else {
                  // Por defecto light mode
                  document.body.className = 'active-light-mode';
                }
              } catch (e) {
                // Fallback
                document.body.className = 'active-light-mode';
              }
            })();
          `,
          }}
        />

        <main className="page-wrapper">
          {/* Topbar */}
          <Topbar />
          {children}
        </main>

        <MobileMenu />
        <BackToTop />

        {/* Topbar flotante */}
        {showFloatingTopbar && !isTopbarClosed && (
          <div
            className="floating-topbar show"
            style={{
              position: "fixed",
              width: "80%",
              bottom: "45px",
              left: "50%",
              marginLeft: "-40%",
              zIndex: 9998,
              backgroundColor: "rgba(0, 0, 0, 0.8)",
              borderRadius: "8px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              transition: "all 0.3s ease",
              transform: "translateY(0)",
              opacity: 1,
              visibility: "visible",
              padding: "0",
              overflow: "hidden",
            }}
          >
            <button
              onClick={closeFloatingTopbar}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "50%",
                width: "30px",
                height: "30px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 10,
                fontSize: "18px",
                color: "#fff",
              }}
            >
              ×
            </button>

            <div style={{ transform: "scale(1)" }}>
              <Topbar />
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
