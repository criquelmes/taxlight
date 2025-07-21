import React from "react";

import { faqData } from "../../data/faq";

export default function Accordions() {
  const getAccordionId = (category) => `accordion-${category}`;

  return (
    <div className="main-content">
      {/* Start Accordion Area  */}
      <div className="rainbow-accordion-area rainbow-section-gap">
        <div className="container">
          <div className="row">
            <div className="col-lg-10 offset-lg-1">
              <div
                className="section-title text-center"
                data-sal="slide-up"
                data-sal-duration={700}
                data-sal-delay={100}
              >
                <h4 className="subtitle">
                  <span className="theme-gradient">FAQ</span>
                </h4>
                <h2 className="title w-600 mb--20">Preguntas Frecuentes</h2>
              </div>
            </div>
          </div>

          {/* Iterar sobre cada categoría */}
          {Object.entries(faqData).map(
            ([categoryKey, category], categoryIndex) => (
              <>
                <div key={categoryKey} className="row mt--35 row--20">
                  <div className="col-lg-10 offset-lg-1">
                    {/* Título de la categoría */}
                    <div className="category-header mb--30">
                      <div className="category-title-wrapper">
                        <h3 className="category-title">{category.title}</h3>
                      </div>
                      <p className="category-description">
                        {category.description}
                      </p>
                    </div>

                    {/* Acordeones de la categoría */}
                    <div className="rainbow-accordion-style accordion">
                      <div
                        className="accordion"
                        id={getAccordionId(categoryKey)}
                      >
                        {category.questions.map((item, questionIndex) => (
                          <div key={item.id} className="accordion-item card">
                            <h2
                              className="accordion-header card-header"
                              id={item.id}
                            >
                              <button
                                className={`accordion-button ${
                                  !item.isOpen ? "collapsed" : ""
                                }`}
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target={`#${item.targetId}`}
                                aria-expanded={item.isOpen}
                                aria-controls={item.targetId}
                              >
                                {item.question}
                              </button>
                            </h2>
                            <div
                              id={item.targetId}
                              className={`accordion-collapse collapse ${
                                item.isOpen ? "show" : ""
                              }`}
                              aria-labelledby={item.id}
                              data-bs-parent={`#${getAccordionId(categoryKey)}`}
                            >
                              <div className="accordion-body card-body">
                                {item.answer}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Start Seperator Area  */}
                <div className="rbt-separator-mid">
                  <div className="container">
                    <hr className="rbt-separator mt--80" />
                  </div>
                </div>
                {/* End Seperator Area  */}
              </>
            )
          )}
        </div>
      </div>
      {/* End Accordion Area  */}
    </div>
  );
}
