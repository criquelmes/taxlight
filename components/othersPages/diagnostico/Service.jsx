import React from "react";
import Link from "next/link";

import { serviceData2 } from "../../../data/service";
import Image from "next/image";

export default function Service() {
  return (
    <>
      <div className="service-area rainbow-section-gap">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <div className="content">
                <h3 className="title">
                  ¿Operas en el mundo de los criptoactivos?
                </h3>
              </div>
            </div>
            <div className="col-lg-6">
              <p className="mb--10">
                Nuestro servicio de Diagnóstico Tributario es la clave para
                tener claridad y seguridad a tus operaciones pasadas y futuras
                con criptoactivos. Con nuestro enfoque especializado, te
                ayudaremos a comprender tu situación tributaria y para que
                puedas tomar decisiones informadas.
              </p>
              <div className="readmore-btn">
                <div className="button-group">
                  <Link className="btn-default" href="/">
                    Contratar
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <br />
      <div className="rainbow-service-area rainbow-section-gap">
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
                  <span className="theme-gradient">
                    ¡Obtén un diagnóstico completo de tu situación tributaria
                    hoy mismo!
                  </span>
                </h4>
                <h2 className="title w-600 mb--20">
                  ¿Qué incluye el diagnóstico tributario?
                </h2>
              </div>
            </div>
          </div>
          <div className="row row--15 service-wrapper">
            {serviceData2.map((service) => (
              <div
                key={service.id}
                className="col-lg-4 col-md-6 col-sm-6 col-12"
                data-sal="slide-up"
                data-sal-duration={service.salDuration}
                data-sal-delay={service.salDelay || 0} // Default to 0 if not provided
              >
                <div className="service service__style--2 text-center">
                  <div className="inner">
                    <div className="image">
                      {/* <Image
                        alt="card Images"
                        src={service.imageSrc}
                        width={service.width}
                        height={service.height}
                        style={{ width: "fit-content" }}
                      /> */}
                    </div>
                    <div className="content">
                      <h4 className="title">
                        <a href="#">{service.title}</a>
                      </h4>
                      <p
                        className="description b1 color-gray mb--0"
                        // style={{ textAlign: "left" }}
                      >
                        {service.description}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
