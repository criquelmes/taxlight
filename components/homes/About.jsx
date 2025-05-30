import React from "react";
import Image from "next/image";
import TyperComponent from "../common/TyperComponent";
import Link from "next/link";
export default function About() {
  return (
    <div className="rainbow-about-area rainbow-section-gap">
      <div className="container">
        <div className="row row--30 align-items-center">
          <div className="col-lg-5">
            <div
              className="thumbnail"
              data-sal="slide-right"
              data-sal-duration={800}
            >
              <Image
                className="w-100"
                alt="About Images"
                src="/assets/images/about/about-1.png"
                width={543}
                height={642}
              />
            </div>
          </div>
          <div className="col-lg-7 mt_md--40 mt_sm--40">
            <div
              className="content"
              data-sal="slide-left"
              data-sal-duration={800}
            >
              <div className="section-title">
                <h2 className="title">
                  Quiénes Somos <br />
                  <span className="header-caption">
                    <span className="theme-gradient">
                      Fortaleciendo tus decisiones financieras
                    </span>
                  </span>
                </h2>
                <p>
                  Con nuestra{" "}
                  <span className="font-bold text-white">
                    experiencia en el mundo de los criptoactivos y más de 15
                    años en el ámbito tributario
                  </span>
                  , combinamos lo mejor de ambos mundos para ofrecerte
                  soluciones personalizadas. Nuestros servicios especializados
                  te permitirán conocer los efectos tributarios de tus
                  operaciones para que puedas tomar decisiones financieras
                  acertadas.
                </p>
                <p>
                  Entendemos que las criptoactivos pueden ser un territorio
                  desconocido en lo que respecta a la tributación. Nuestra
                  misión es iluminar ese camino, ofreciendo orientación y
                  estrategias inteligentes para garantizar que tus operaciones
                  sean transparentes y eficientes desde el punto de vista
                  tributario.
                </p>
                <div className="read-more-btn mt--40">
                  <Link className="btn-default" href={"#"}>
                    <span>Más información</span>
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
