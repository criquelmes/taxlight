"use client";

import React from "react";
import { scrollToSection } from "../../../utlis/scrollToSection";

export default function MoreInfo() {
  return (
    <div className="service-area rainbow-section-gap">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-6">
            <div className="content">
              <h3 className="subtitle">
                Fortaleciendo tus decisiones financieras.
              </h3>
            </div>
          </div>
          <div className="col-lg-6">
            <p className="mb--10">
              Con nuestra experiencia en el mundo de los criptoactivos y más de
              15 años en el ámbito tributario, combinamos lo mejor de ambos
              mundos para ofrecerte soluciones personalizadas. Nuestros
              servicios especializados te permitirán conocer los efectos
              tributarios de tus operaciones para que puedas tomar decisiones
              financieras acertadas.
            </p>
            <div className="readmore-btn">
              <a
                className="btn-read-more"
                onClick={() => scrollToSection("nuestra-mision")}
              >
                <span>Ver más</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
