<<<<<<< HEAD
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
=======
import React from "react";
import Link from "next/link";
import TyperComponent from "@/components/common/TyperComponent";
export default function Hero() {
  return (
    <div className="slider-area slider-style-1 bg-transparent height-850">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="inner text-center">
              <span className="subtitle">SOLUCIONES TRIBUTARIAS</span>
              <h1 className="title display-one">
                <span className="theme-gradient">Tu brújula en el mundo</span>{" "}
                <br />
                <span className="header-caption">
                  <span className="cd-headline clip is-full-width">
                    <TyperComponent
                      strings={["Cripto.", "Tributario.", "En un solo lugar."]}
                    />
                  </span>
                </span>
              </h1>
              <p className="description">
                Descubre soluciones tributarias para tus criptoactivos con
                Taxlight. Claridad y eficiencia en un solo lugar.
              </p>
              <div className="button-group">
                <a
                  className="btn-default btn-medium round btn-icon"
                  target="_blank"
                  href="#"
                >
                  Más información <i className="icon feather-arrow-right"> </i>
                </a>
                <Link
                  className="btn-default btn-medium btn-border round btn-icon"
                  href={`/contact`}
                >
                  Contáctanos <i className="icon feather-arrow-right" />
>>>>>>> ca9b783 (first commit)
                </Link>
              </div>
            </div>
          </div>
<<<<<<< HEAD
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
=======
>>>>>>> ca9b783 (first commit)
        </div>
      </div>
    </div>
  );
}
