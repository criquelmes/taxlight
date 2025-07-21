import React from "react";
import { services5 } from "../../../data/service";

export default function Why() {
  return (
    <div className="container mb--80">
      <div className="row mb--20">
        <div className="col-lg-10 offset-lg-1">
          <div
            className="section-title text-center"
            data-sal="slide-up"
            data-sal-duration={700}
            data-sal-delay={100}
          >
            <h4 className="subtitle">
              <span className="theme-gradient">Nosotros nos encargamos</span>
            </h4>
            <h2 className="title w-600 mb--20">¿Por qué Taxlight?.</h2>
            <p className="description b2">
              Nuestro equipo está formado por entusiastas y profesionales de las
              criptomonedas, contables, juristas y estrategas financieros que
              comparten una pasión: desmitificar el complejo panorama tributario
              para que tú, inversor, puedas centrarte en lo que mejor sabes
              hacer.
            </p>
          </div>
        </div>
      </div>
      <div className="row row--15 service-wrapper justify-content-center">
        {services5.map((service, index) => (
          <div
            className="col-lg-6 col-md-6 col-sm-6 col-12 d-flex"
            key={index}
            data-sal="slide-up"
            data-sal-delay={service.delay}
            data-sal-duration={800}
          >
            <div className="service service__style--1 bg-color-blackest radius mt--25 text-center rbt-border-none">
              <div className="content">
                <h4 className="title w-600">
                  <a href="#">{service.title}</a>
                </h4>
                <p className="description b1 color-gray mb--0">
                  {service.description}{" "}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
