import Link from "next/link";
import React from "react";

export default function Cta() {
  return (
    <div className="rainbow-callto-action-area">
      <div className="wrapper">
        <div
          className="rainbow-callto-action clltoaction-style-default bg-image bg-image2 bg_image_fixed"
          data-black-overlay={7}
        >
          <div className="container">
            <div className="row">
              <div className="col-lg-8 offset-lg-2">
                <div className="inner">
                  <div className="content text-center">
                    <h2
                      className="title"
                      data-sal="slide-up"
                      data-sal-duration={400}
                      data-sal-delay={200}
                    >
                      Get started. It's easy
                    </h2>
                    <h6
                      className="subtitle"
                      data-sal="slide-up"
                      data-sal-duration={400}
                      data-sal-delay={300}
                    >
                      Everything you need to attain the next level of growth in
                      your career is available on Doob
                    </h6>
                    <div
                      className="call-to-btn"
                      data-sal="slide-up"
                      data-sal-duration={400}
                      data-sal-delay={350}
                    >
                      <Link className="btn-default" href="/login">
                        Create Account
                      </Link>
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
