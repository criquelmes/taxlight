"use client";
import React from "react";

import { services4 } from "../../../data/service";
import { Clock, CheckCircle, RotateCw } from "lucide-react";

const iconMap = {
  "lucide-clock": Clock,
  "lucide-check-circle": CheckCircle,
  "lucide-rotate-cw": RotateCw,
};

export default function TemplateSlider() {
  return (
    <div className="template-slider mb--90">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="bg-color-lessdark bg-lessdark-gradient theme-shape rbt-alignwide rainbow-section-gap radius">
              <div className="rbt-inner-alignwide">
                <div className="wrapper template-slider-wrapper">
                  <h2 className="theme-gradient">Astrobot</h2>
                  <h3 className="title">
                    Una herramienta digital automatizada, disponible las 24
                    horas del día
                  </h3>
                  <p className="description">
                    Conoce las ventajas de tener un asistente legal online
                  </p>
                </div>
              </div>
              {/* Start Service Area  */}
              <div className="row row--15 service-wrapper rbt-inner-alignwide pt--100">
                {services4.map((service, index) => {
                  const IconComponent = iconMap[service.icon];
                  return (
                    <div
                      className="col-lg-4 col-md-6 col-sm-6 col-12 sal-animate"
                      data-sal="slide-up"
                      data-sal-duration={700}
                      data-sal-delay={service.delay}
                      key={index}
                    >
                      <div className="service service__style--1 icon-circle-style text-center">
                        <div className="content">
                          <div className="icon-wrapper mb--20">
                            {IconComponent && (
                              <IconComponent
                                size={48}
                                className="service-icon theme-gradient"
                                style={{ color: "var(--color-primary)" }}
                              />
                            )}
                          </div>
                          <h4 className="title w-600">
                            <a href={service.href}>{service.title}</a>
                          </h4>
                          <p className="description b1 color-gray mb--0">
                            {service.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* End Service Area  */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
