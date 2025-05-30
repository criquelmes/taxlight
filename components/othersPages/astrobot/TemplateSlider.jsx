"use client";
import React from "react";
import Slider from "react-slick";
import Image from "next/image";
import { NextArrow, PrevArrow } from "../../common/SliderArrows";
import { services4 } from "../../../data/service";

export default function TemplateSlider() {
  const options = {
    infinite: true,
    slidesToShow: 3,
    slidesToScroll: 1,
    dots: true,
    arrows: true,
    // adaptiveHeight: true,
    cssEase: "linear",
    centerMode: false,
    prevArrow: <PrevArrow />, // Use the custom component here
    nextArrow: <NextArrow />, // Use the custom component here
    responsive: [
      {
        breakpoint: 769,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 2,
        },
      },
      {
        breakpoint: 581,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };
  return (
    <div className="template-slider mb--90">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="bg-color-lessdark bg-lessdark-gradient theme-shape rbt-alignwide rainbow-section-gap radius">
              <div className="rbt-inner-alignwide">
                <div className="wrapper template-slider-wrapper mb--60">
                  <h2 className="theme-gradient">Astrobot</h2>
                  <h3 className="title">
                    Una herramienta digital automatizada, disponible las 24
                    horas del día
                  </h3>
                  <p className="description">
                    Conoce las ventajas de tener un asistente legal online
                  </p>
                </div>
                {/* Start main Template Slider  */}
                <Slider
                  {...options}
                  className="rbt-temaplte-gallery-wrapper template-galary-activation rainbow-slick-arrow rainbow-slick-dot slick-gutter-15 position-relative"
                >
                  <div className="single-gallery">
                    <div className="thumbnail">
                      <Image
                        alt="Template Gallery"
                        src="/assets/images/screen/screen-01.png"
                        width={600}
                        height={885}
                      />
                    </div>
                  </div>
                  <div className="single-gallery">
                    <div className="thumbnail">
                      <Image
                        alt="Template Gallery"
                        src="/assets/images/screen/screen-02.png"
                        width={600}
                        height={885}
                      />
                    </div>
                  </div>
                </Slider>
                {/* End main Template Slider  */}
              </div>
              {/* Start Service Area  */}
              <div className="row row--15 service-wrapper rbt-inner-alignwide pt--100">
                {services4.map((service, index) => (
                  <div
                    className="col-lg-4 col-md-6 col-sm-6 col-12 sal-animate"
                    data-sal="slide-up"
                    data-sal-duration={700}
                    data-sal-delay={service.delay}
                    key={index}
                  >
                    <div className="service service__style--1 icon-circle-style text-center">
                      <div className="content">
                        <h4 className="title w-600">
                          <a href={service.href}>{service.title}</a>
                        </h4>
                        <p className="description b1 color-gray mb--0">
                          {service.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* End Service Area  */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
