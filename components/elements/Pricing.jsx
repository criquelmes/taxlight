import { pricingPlans } from "@/data/pricing";
import React from "react";

export default function Pricing() {
  return (
    <div className="rainbow-pricingtable-area rainbow-section-gap">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div
              className="section-title text-center"
              data-sal="slide-up"
              data-sal-duration={700}
              data-sal-delay={100}
            >
              <h4 className="subtitle">
                <span className="theme-gradient">Precios</span>
              </h4>
              <h2 className="title w-600 mb--20">Suscribete a Astrobot.</h2>
            </div>
          </div>
        </div>
        <div className="row mt--30">
          <div className="col-lg-9 offset-lg-2">
            <div className="advance-pricing">
              <div className="inner">
                <div className="row row--0">
                  <div className="col-lg-5">
                    <div className="pricing-left advance-pricing-left">
                      <h3 className="main-title">Astrobot.</h3>
                      <p className="description">
                        Tu asistente tributario en línea y en tiempo real.
                      </p>
                      <div className="price-wrapper">
                        <span className="price-amount">$85.000</span>
                        <div className="text-center w-full">
                          <sup>IVA incluido</sup>
                        </div>
                      </div>
                      <div className="pricing-btn-group">
                        <button className="btn-default">Contratar</button>
                        <button className="btn-default btn-border">
                          ¿Necesitas Ayuda?
                        </button>
                      </div>
                      <span className="subtitle">Válido por 12 meses</span>
                    </div>
                  </div>
                  <div className="col-lg-7">
                    <div className="pricing-right">
                      <div className="pricing-offer">
                        <div className="single-list">
                          <h4 className="price-title">
                            Que incluye tu suscripción
                          </h4>
                          <ul className="plan-offer-list">
                            <li>
                              <i className="feather-check" /> Acceso ilimitado a
                              AstroBot
                            </li>
                            <li>
                              <i className="feather-check" /> Responde tus
                              consultas cripto-tributarias generales
                            </li>
                            <li>
                              <i className="feather-check" /> Respuestas 24/7
                            </li>
                            <li>
                              <i className="feather-check" /> Posibilidad de
                              conectarse con alguien de nuestro equipo
                            </li>
                            <li>
                              <i className="feather-check" /> Recibe las
                              certezas que faltan en el mundo cripto-tributario
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
