import { rainbowTimelines } from "@/data/process";
import React from "react";

export default function Timeline() {
  return (
    <div className="rainbow-timeline-area rainbow-section-gapBottom">
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="timeline-style-two bg-color-blackest">
              <div className="row row--0">
                {rainbowTimelines.map((item, index) => (
                  <div
                    key={index}
                    className="col-lg-3 col-md-3 rainbow-timeline-single no-gradient"
                  >
                    <div className="rainbow-timeline">
                      <h6
                        className="title"
                        data-sal="slide-up"
                        data-sal-duration={700}
                        data-sal-delay={item.delay}
                      >
                        {item.title}
                      </h6>
                      <div className="progress-line">
                        <div className="line-inner" />
                      </div>
                      <div className="progress-dot">
                        <div className="dot-level">
                          <div className="dot-inner" />
                        </div>
                      </div>
                      <p
                        className="description"
                        data-sal="slide-up"
                        data-sal-duration={700}
                        data-sal-delay={item.delay + 100} // Slight delay for description
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
