import React from "react";
import Link from "next/link";
import TyperComponent from "@/components/common/TyperComponent";
export default function Hero() {
  return (
    <div className="slider-area slider-style-1 bg-transparent height-850">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="inner text-center">
              <span className="subtitle">SOLUCIONES TRIBUTARIAS</span>
              <h1 className="title display-one">
                <span className="theme-gradient">Tu brújula en el mundo</span>{" "}
                <br />
                <span className="header-caption">
                  <span className="cd-headline clip is-full-width">
                    <TyperComponent
                      strings={["Cripto.", "Tributario.", "En un solo lugar."]}
                    />
                  </span>
                </span>
              </h1>
              <p className="description">
                Descubre soluciones tributarias para tus criptoactivos con
                Taxlight. Claridad y eficiencia en un solo lugar.
              </p>
              <div className="button-group">
                <a
                  className="btn-default btn-medium round btn-icon"
                  target="_blank"
                  href="#"
                >
                  Más información <i className="icon feather-arrow-right"> </i>
                </a>
                <Link
                  className="btn-default btn-medium btn-border round btn-icon"
                  href={`/contact`}
                >
                  Contáctanos <i className="icon feather-arrow-right" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
