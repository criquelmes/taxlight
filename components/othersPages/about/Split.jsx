import React from "react";
import Image from "next/image";

export default function Split() {
  return (
    <div className="main-content">
      {/* Start Split Area  */}
      <div className="rainbow-split-area rainbow-section-gap">
        <div className="wrapper">
          <div className="rainbow-splite-style">
            <div className="split-wrapper">
              <div className="row g-0 radius-10 align-items-center">
                <div className="col-lg-12 col-xl-6 col-12">
                  <div className="thumbnail image-left-content">
                    <Image
                      alt="split Images"
                      src="/assets/images/split/split-01.jpg"
                      width={945}
                      height={709}
                    />
                  </div>
                </div>
                <div className="col-lg-12 col-xl-6 col-12">
                  <div className="split-inner">
                    <h4
                      className="title"
                      data-sal="slide-up"
                      data-sal-duration={400}
                      data-sal-delay={200}
                    >
                      Nuestro Equipo
                    </h4>
                    <p
                      className="description"
                      data-sal="slide-up"
                      data-sal-duration={400}
                      data-sal-delay={300}
                    >
                      En un mundo digital en constante evolución, la claridad y
                      la confianza son esenciales. No solo nos especializamos en
                      tributación y criptomonedas; vivimos y respiramos este
                      universo.
                    </p>
                    <p
                      className="description"
                      data-sal="slide-up"
                      data-sal-duration={400}
                      data-sal-delay={300}
                    >
                      Nuestro equipo está formado por entusiastas y
                      profesionales de las criptoactivos, contables, juristas y
                      estrategas financieros que comparten una pasión:
                      desmitificar el complejo panorama tributario para que tú,
                      inversor, puedas centrarte en lo que mejor sabes hacer.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* End Split Area  */}
    </div>
  );
}
