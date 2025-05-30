import React from "react";
import Image from "next/image";
import { testimonials } from "@/data/testimonials";
export default function Testimonials() {
  return (
    <div className="rainbow-testimonial-area rainbow-section-gap">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div
              className="section-title text-center sal-animate"
              data-sal="slide-up"
              data-sal-duration={700}
              data-sal-delay={100}
            >
              <h4 className="subtitle">
                <span className="theme-gradient">Client Feedback</span>
              </h4>
              <h2 className="title w-600 mb--20">Nuestro Equipo.</h2>
            </div>
          </div>
        </div>
        <div className="row row--15">
          {testimonials.map((elm, i) => (
            <div
              key={i}
              className="col-lg-6 col-md-6 col-12 mt--30 sal-animate"
              data-sal="slide-up"
              data-sal-duration={elm.salDelay}
            >
              <div className="rainbow-box-card card-style-default testimonial-style-one">
                <div className="inner">
                  <div className="thumbnail">
                    <Image
                      alt="Corporate Template"
                      src={elm.imgSrc}
                      width={645}
                      height={645}
                    />
                  </div>
                  <div className="content">
                    <p className="description">{elm.description}</p>
                    <h2 className="title">{elm.title}</h2>
                    <h6 className="subtitle theme-gradient">{elm.subtitle}</h6>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
