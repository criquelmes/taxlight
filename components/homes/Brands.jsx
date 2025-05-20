import React from "react";
import Image from "next/image";
import { brandImages } from "@/data/brands";
export default function Brands() {
  return (
    <div className="rainbow-brand-area pt--80 pb--80">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div
              className="section-title text-center"
              data-sal="slide-up"
              data-sal-duration={700}
              data-sal-delay={100}
            >
              <h3 className="title">
                Conoce a nuestros aliados, juntos te apoyaremos con tus dudas
                criptotributarias.
              </h3>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-lg-12">
            <ul className="brand-list brand-style-2">
              {brandImages.map((image, index) => (
                <li key={index}>
                  <a href="https://ledgifi.com/chile" target="_blank">
                    <Image
                      alt={image.alt}
                      src={image.src}
                      width={232}
                      height={110}
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
