"use client";

import { useRef, useState } from "react";
import { Bot } from "lucide-react";
import Link from "next/link";
import { useTheme } from "../../hooks/useTheme";

export default function Topbar() {
  const theme = useTheme();
  const [isHovered, setIsHovered] = useState(false);
  const topbarRef = useRef();
  const closeTopbar = () => {
    topbarRef.current.classList.add("deactive");
  };
  return (
    <div className="header-top-news bg-image1" ref={topbarRef}>
      <div className="wrapper">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="inner">
                <div className="content">
                  <Link
                    href="https://astrobot.enkoding.io"
                    target="_blank"
                    className="rainbow-link"
                  >
                    <span className="rainbow-badge">
                      Accede a Astrobot <Bot />
                    </span>
                  </Link>
                  <span className="news-text">
                    Suscripción mensual a partir de $10.000 CLP.
                  </span>
                </div>
                <div className="right-button">
                  <a
                    className={`btn-read-more ${
                      theme === "light" ? "light-theme-underline" : ""
                    }`}
                    href="/suscripcion"
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                  >
                    <span
                      style={{
                        color:
                          theme === "light"
                            ? isHovered
                              ? "#059DFF"
                              : "#acacac"
                            : "inherit",
                      }}
                    >
                      ¡Suscribete ahora! <i className="feather-arrow-right" />
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
