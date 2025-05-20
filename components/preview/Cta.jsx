import React from "react";

export default function Cta() {
  return (
    <div className="rainbow-callto-action rainbow-call-to-action content-wrapper rainbow-section-gap">
      <div className="container">
        <div className="row row--0 align-items-center">
          <div className="col-lg-12">
            <div className="inner">
              <div className="content text-center">
                {/* <div className="react-image relative">
                  <img
                    className="nextjs-svg"
                    src="\assets\images\logo\taxlight-light.png"
                  />
                </div> */}
                <h2 className="title display-two">
                  ¡Contrata a nuestro{" "}
                  <span className="theme-gradient">
                    Chatbot Legal
                    <br />
                  </span>
                  ahora mismo y obtén respuestas{" "}
                  <span className="theme-gradient">claras y precisas!</span>
                </h2>
                <h6 className="subtitle">
                  Navega en el mundo de los criptoactivos con respuestas
                  inmediatas y precisas.
                </h6>
                <div className="call-to-btn text-center mt--30">
                  <a className="btn-default btn-icon" target="_blank" href="#">
                    Contratar <i className="icon feather-arrow-right"> </i>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
