"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

import { useTheme } from "../../hooks/useTheme";

export default function Hero() {
  const theme = useTheme();

  return (
    <div className="slider-area rainbow-section-gap">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-6 col-md-6 col-sm-6 col-sm-12 order-2 order-lg-1">
            <div className="inner collaborate text-left">
              <h1 className="display-one">Tu asistente tributario</h1>
              <p className="description">
                A través de nuestra suscripción pagando tan solo 2 UF al año,
                podrás tener acceso a un sistema de consultas en tiempo real
                sobre la tributación general de los criptoactivos conmigo. Soy
                AstroBot® y estoy para ayudarte!
              </p>
              <div className="button-group">
                <Link className="btn-default" href="/suscripcion">
                  Contratar
                </Link>
                <Link
                  className="btn-default btn-border"
                  href="/astrobot"
                  style={{
                    color: theme === "light" ? "#65676b" : "var(--color-white)",
                    borderColor:
                      theme === "light"
                        ? "var(--color-secondary)"
                        : "var(--color-border)",
                  }}
                >
                  Más información
                </Link>
              </div>
            </div>
          </div>
          <div className="col-lg-6 col-md-6 col-sm-12 order-1 order-lg-2">
            <div className="thumbnail">
              <Image
                className="image-light-hero"
                alt="astrobot-blanco"
                src="/assets/images/hero/astrobot-front.png"
                width={1000}
                height={1000}
              />
              <Image
                className="image-dark-hero"
                alt="astrobot-color"
                src="/assets/images/hero/astrobot-front.png"
                width={1000}
                height={1000}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
