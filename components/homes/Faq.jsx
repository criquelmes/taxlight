import React from "react";
import Link from "next/link";
import TyperComponent from "@/components/common/TyperComponent";
export default function Faq() {
  return (
    <div className="rainbow-company-mission-are rainbow-section-gap">
      <div className="container">
        <div className="row row--30">
          <div className="col-lg-6">
            <div
              className="mission-title"
              data-sal="slide-up"
              data-sal-duration={800}
            >
              <h5 className="subtitle">
                <span className="theme-gradient">¿Tienes dudas?</span>
              </h5>
              <h2 className="title">
                Preguntas Frecuentes <br />
                <span className="header-caption">
                  <span className="cd-headline clip is-full-width">
                    <TyperComponent
                      strings={[
                        "Astrobot.",
                        "Estructuración Tributaria.",
                        "Diagnóstico Tributario.",
                      ]}
                    />
                  </span>
                </span>
              </h2>
              <p>
                Aquí encontraras las principales respuestas de cada uno de
                nuestros servicios.
              </p>

              <div className="read-more-btn mt--50">
                <Link className="btn-default btn-icon" href={`#`}>
                  Ver más <i className="icon feather-arrow-right" />
                </Link>
              </div>
            </div>
          </div>
          <div className="col-lg-6 mt_md--30 mt_sm--30">
            <div
              className="rainbow-accordion-style accordion"
              data-sal="slide-up"
              data-sal-duration={800}
            >
              <div className="accordion" id="accordionExamplea">
                <div className="accordion-item card">
                  <h2 className="accordion-header card-header" id="headingOne">
                    <button
                      className="accordion-button"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseOne"
                      aria-expanded="true"
                      aria-controls="collapseOne"
                    >
                      ¿En qué consiste el servicio de Chatbot Legal de Taxlight?
                    </button>
                  </h2>
                  <div
                    id="collapseOne"
                    className="accordion-collapse collapse show"
                    aria-labelledby="headingOne"
                    data-bs-parent="#accordionExamplea"
                  >
                    <div className="accordion-body card-body">
                      Consiste en un bot, llamado AstroBot®, que te responderá
                      en tiempo real todas las preguntas que tengas de
                      tributación general de los criptoactivos. Para acceder a
                      este servicio, debes contratar la suscripción anual y
                      luego de ello la funcionalidad del bot quedará habilitada
                      en tu panel de usuario.
                    </div>
                  </div>
                </div>
                <div className="accordion-item card">
                  <h2 className="accordion-header card-header" id="headingTwo">
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseTwo"
                      aria-expanded="false"
                      aria-controls="collapseTwo"
                    >
                      ¿Cómo funciona el Chatbot Legal?
                    </button>
                  </h2>
                  <div
                    id="collapseTwo"
                    className="accordion-collapse collapse"
                    aria-labelledby="headingTwo"
                    data-bs-parent="#accordionExamplea"
                  >
                    <div className="accordion-body card-body">
                      AstroBot® está entrenado por el equipo de expertos de
                      Taxlight y adicionalmente está apalancado con inteligencia
                      artificial. AstroBot® está entrenado sólo para contestar
                      preguntas generales de tributación de criptoactivos, en
                      base a la las consultas que formule el usuario. En caso de
                      realizar preguntas específicas de tu situación, te debiese
                      derivar a algún otro servicio disponible en Taxlight.
                      Finalmente, en caso de que AstroBot​​® no conozca la
                      respuesta, te derivará con alguna persona de nuestro
                      equipo para que pueda resolver tus consultas
                    </div>
                  </div>
                </div>
                <div className="accordion-item card">
                  <h2
                    className="accordion-header card-header"
                    id="headingThree"
                  >
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseThree"
                      aria-expanded="false"
                      aria-controls="collapseThree"
                    >
                      ¿El Chatbot Legal puede proporcionar asesoramiento
                      personalizado?
                    </button>
                  </h2>
                  <div
                    id="collapseThree"
                    className="accordion-collapse collapse"
                    aria-labelledby="headingThree"
                    data-bs-parent="#accordionExamplea"
                  >
                    <div className="accordion-body card-body">
                      No, sólo contesta preguntas generales de tributación de
                      los criptoactivos en base a las consultas que hagan los
                      usuarios. Aún si se conecta alguien del equipo, las
                      respuestas que pueden dar están relacionadas al
                      entrenamiento del chatbot.
                    </div>
                  </div>
                </div>
                <div className="accordion-item card">
                  <h2 className="accordion-header card-header" id="headingFour">
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#collapseFour"
                      aria-expanded="false"
                      aria-controls="collapseFour"
                    >
                      ¿Cuál es el costo de suscripción al servicio de Chatbot
                      Legal?
                    </button>
                  </h2>
                  <div
                    id="collapseFour"
                    className="accordion-collapse collapse"
                    aria-labelledby="headingFour"
                    data-bs-parent="#accordionExamplea"
                  >
                    <div className="accordion-body card-body">
                      La suscripción por un año tiene el precio de $85.000 IVA
                      incluido. A partir del 01 de marzo de 2024 estará
                      disponible un plan por dos años por $145.000 IVA incluido.
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
