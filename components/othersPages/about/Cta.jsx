import React from "react";

export default function Cta() {
  return (
    <div className="main-content">
      <div
        id="nuestra-mision"
        className="rainbow-callto-action-area"
        style={{ paddingBottom: 0 }}
      >
        <div className="rainbow-callto-action clltoaction-style-default style-3 bg-image bg-image3 bg_image_fixed">
          <div className="container">
            <div className="row row--0 align-items-center content-wrapper">
              <div className="col-lg-12">
                <div className="inner">
                  <div className="content text-left">
                    <h2
                      className="title"
                      data-sal="slide-up"
                      data-sal-duration={400}
                      data-sal-delay={200}
                    >
                      Nuestra Misión
                    </h2>
                    <h5
                      className="subtitle"
                      data-sal="slide-up"
                      data-sal-duration={400}
                      data-sal-delay={300}
                    >
                      "Brindar claridad y lograr eficiencias para los dueños de
                      criptoactivos"
                    </h5>
                    <p
                      className="description mt--20"
                      data-sal="slide-up"
                      data-sal-duration={400}
                      data-sal-delay={400}
                    >
                      Entendemos que las criptoactivos pueden ser un territorio
                      desconocido en lo que respecta a la tributación. Nuestra
                      misión es iluminar ese camino, ofreciendo orientación y
                      estrategias inteligentes para garantizar que tus
                      operaciones sean transparentes y eficientes desde el punto
                      de vista tributario.
                    </p>
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
