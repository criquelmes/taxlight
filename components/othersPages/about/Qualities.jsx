import React from "react";
import { services2 } from "../../../data/service";
import { IconRenderer } from "../../../utlis/iconMapper";

export default function Qualities() {
  return (
    <div className="container">
      <div className="row row--15 service-wrapper justify-content-center">
        {services2.map((service, index) => (
          <div
            className="col-lg-6 col-md-6 col-sm-6 col-12"
            key={index}
            data-sal="slide-up"
            data-sal-delay={service.delay}
            data-sal-duration={800}
          >
            <div className="service service__style--1 bg-color-blackest radius mt--25 text-center rbt-border-none">
              <div className="icon">
                <IconRenderer
                  iconName={service.icon}
                  size={45}
                  color="var(--color-primary)"
                  className="service-icon"
                />
              </div>
              <div className="content">
                <h4 className="title w-600">
                  <a href="#">{service.title}</a>
                </h4>
                <p className="description b1 color-gray mb--0">
                  {service.description}{" "}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
