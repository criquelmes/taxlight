import React from "react";
import Image from "next/image";
import Link from "next/link";
const items = [
  "Optimiza tu carga fiscal y reduce tus impuestos legalmente.",
  "Minimiza el riesgo de contingencias fiscales y procesos de fiscalización.",
  "Diseña una estrategia tributaria que se alinee con tus objetivos a largo plazo.",
  "Maximiza tus beneficios en el mundo de los criptoactivos de manera responsable y ética.",
];
export default function Info() {
  return (
    <div className="rainbow-about-area rainbow-section-gap">
      <div className="container">
        <div className="row row--30 align-items-center">
          <div className="col-lg-5">
            <div
              className="thumbnail rounded"
              data-sal="slide-right"
              data-sal-duration={700}
            >
              <Image
                className="w-100"
                alt="About Images"
                src="/assets/images/IMG_9909.jpg"
                width={543}
                height={642}
              />
            </div>
          </div>
          <div className="col-lg-7 mt_md--40 mt_sm--40">
            <div
              className="content"
              data-sal="slide-left"
              data-sal-duration={700}
            >
              <div className="section-title">
                <h4 className="subtitle">
                  <span className="theme-gradient">
                    Beneficios de la Estructuración Tributaria
                  </span>
                </h4>
                <h2 className="title mt--10">Ventajas de Nuestra Estrategia</h2>

                <p>
                  Obtén ventajas tributarias en tus operaciones de
                  criptoactivos, asegurando un camino más rentable y sin
                  complicaciones en este emocionante mercado digital.
                </p>
                <ul className="list-icon">
                  {items.map((item, index) => (
                    <li key={index}>
                      <span className="icon">
                        <i className="feather-check" />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="button-group mt--40">
                  <a
                    className="btn-default btn-medium round btn-icon"
                    target="_blank"
                    href="#"
                  >
                    Contratar <i className="icon feather-arrow-right" />
                  </a>
                  <Link
                    className="btn-default btn-medium btn-border round btn-icon text-white border border-white "
                    href="#"
                  >
                    Más información
                    <i className="icon feather-arrow-right" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
