"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { pricingPlans2 } from "../../data/pricing";
import { formatPrice } from "./../../utlis/formatPrice";

export default function Pricing() {
  const router = useRouter();

  const handlePlanSelection = (planIndex, plan) => {
    let subscriptionType = "annual";

    const priceString = plan.price.toString();

    if (
      plan.title.toLowerCase().includes("mensual") ||
      plan.subtitle.toLowerCase().includes("mes") ||
      priceString === "10000"
    ) {
      subscriptionType = "monthly";
    } else if (
      plan.title.toLowerCase().includes("anual") ||
      plan.subtitle.toLowerCase().includes("año") ||
      priceString === "85000"
    ) {
      subscriptionType = "annual";
    }

    router.push(
      `/suscripcion?plan=${planIndex}&title=${encodeURIComponent(
        plan.title
      )}&type=${subscriptionType}`
    );
  };

  return (
    <div className="rainbow-pricing-area rainbow-section-gap">
      <div className="container">
        <div className="row mb--40 mb_sm--0">
          <div className="col-lg-12">
            <div
              className="section-title text-center"
              data-sal="slide-up"
              data-sal-duration={400}
              data-sal-delay={100}
            >
              <h4 className="subtitle">
                <span className="theme-gradient">
                  Nuestros planes y precios
                </span>
              </h4>
              <h2 className="title w-600 mb--20">Suscribete a AstroBot®.</h2>
              <p className="description b1">
                AstroBot® es una herramienta digital automatizada, disponible
                las 24 horas del día.
                <br />
                Conoce las ventajas de tener un asistente legal online.
              </p>
            </div>
          </div>
        </div>
        <div className="row">
          <div
            className="col-lg-8 offset-lg-2"
            data-sal="slide-up"
            data-sal-duration={700}
          >
            <div className="row row--0">
              {pricingPlans2.slice(0, 2).map((plan, index) => (
                <div key={index} className="col-lg-6 col-md-6 col-12">
                  <div
                    className={`rainbow-pricing style-2 ${
                      plan.active ? "active" : ""
                    }`}
                  >
                    <div className="pricing-table-inner">
                      <div className="pricing-header">
                        <h4 className="title">{plan.title}</h4>
                        <div className="pricing">
                          <div className="price-wrapper">
                            <span className="currency">$</span>
                            <span className="price">
                              {plan.price.toLocaleString("es-CL")}
                            </span>
                          </div>
                          <span className="subtitle">{plan.subtitle}</span>
                        </div>
                      </div>
                      <div className="pricing-body">
                        <ul className="list-style--1">
                          {plan.features.map((feature, idx) => (
                            <li key={idx}>
                              <i className="feather-check" /> {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="pricing-footer">
                        <button
                          className={`btn-default ${
                            plan.active ? "" : "btn-border"
                          }`}
                          onClick={() => handlePlanSelection(index, plan)}
                        >
                          Contratar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
