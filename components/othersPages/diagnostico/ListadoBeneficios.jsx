import React from "react";
import Image from "next/image";
import Link from "next/link";
export default function Hero() {
  return (
    <div className="slider-area slider-style-1 bg-transparent banner-company height-750">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-7 col-xl-6 order-2 order-lg-1 mt_md--40 mt_sm--40">
            <div className="inner text-left">
              <span className="subtitle">Beneficios</span>
              <h1 className="title theme-gradient display-one">
                Diagnóstico Tributario.
              </h1>
              <ul className="list-icon">
                <li>
                  <span className="icon">
                    <i className="feather-check" />
                  </span>
                  Toma decisiones informadas y estratégicas en tus operaciones
                  con criptoactivos.
                </li>
                <li>
                  <span className="icon">
                    <i className="feather-check" />
                  </span>
                  Minimiza riesgos fiscales y contingencias que podrían afectar
                  tu situación financiera.
                </li>
                <li>
                  <span className="icon">
                    <i className="feather-check" />
                  </span>
                  Optimiza tu enfoque tributario para maximizar eficiencias.
                </li>
                <li>
                  <span className="icon">
                    <i className="feather-check" />
                  </span>
                  Obtén tranquilidad al tener a expertos en criptoactivos
                  cuidando tus intereses tributarios.
                </li>
              </ul>
              <div className="button-group mt--40">
                <a
                  className="btn-default btn-medium round btn-icon"
                  target="_blank"
                  href="#"
                >
                  Contratar directamente{" "}
                  <i className="icon feather-arrow-right" />
                </a>
                <Link
                  className="btn-default btn-medium btn-border round btn-icon"
                  href="#"
                >
                  Reunión de diagnóstico{" "}
                  <i className="icon feather-arrow-right" />
                </Link>
              </div>
            </div>
          </div>
          <div className="col-lg-5 col-xl-6 order-1 order-lg-2">
            <div className="frame-image">
              <Image
                alt="Banner Images"
                src="/assets/images/IMG_9870.jpg"
                width={590}
                height={394}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
