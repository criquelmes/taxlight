import React from "react";

export default function Hero() {
  return (
    <div
      className="slider-area slider-style-1 variation-default height-850 bg_image bg_image--12"
      data-black-overlay={7}
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
              <div>
                <h3 className="rainbow-sub-badge">
                  <span className="theme-gradient">
                    Our Company's About Details.
                  </span>
                </h3>
              </div>
              <h1 className="title display-one">
                We are a Corporate <br />
                Business Agency.
              </h1>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
