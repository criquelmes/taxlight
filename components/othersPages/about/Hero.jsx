import React from "react";

export default function Hero() {
  return (
    <div
      className="slider-area slider-style-1 variation-default height-950"
      data-black-overlay={7}
      style={{
        backgroundImage: "url('/assets/images/bg/hero-about.jpg')",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        backgroundPosition: "center top",
      }}
    >
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div
              className="inner pt--80 text-center"
              data-sal="slide-up"
              data-sal-duration={400}
              data-sal-delay={150}
            >
              <h1 className="title display-one">Quiénes Somos</h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
