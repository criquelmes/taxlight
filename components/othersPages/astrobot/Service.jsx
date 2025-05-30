import Link from "next/link";
import React from "react";

export default function Service() {
  return (
    <div className="service-area rainbow-section-gap">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-6">
            <div className="content">
              <h3 className="title">
                Tu asistente tributario en línea <br />y en tiempo real.
              </h3>
            </div>
          </div>
          <div className="col-lg-6">
            <p className="mb--10">
              A través de nuestra suscripción pagando tan solo 2 UF al año,
              podrás tener acceso a un sistema de consultas en tiempo real sobre
              la tributación general de los criptoactivos conmigo. Soy AstroBot®
              y estoy para ayudarte!
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
  );
}
