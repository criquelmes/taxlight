import React from "react";
import Image from "next/image";
import { teamMembersThree } from "@/data/team";
export default function Team() {
  return (
    <div className="rainbow-team-area rainbow-section-gap">
      <div className="container">
        <div className="row mb--20">
          <div className="col-lg-12">
            <div
              className="section-title text-center"
              data-sal="slide-up"
              data-sal-duration={400}
              data-sal-delay={150}
            >
              <h4 className="subtitle">
                <span className="theme-gradient">Our Corporate Team.</span>
              </h4>
              <h2 className="title w-600 mb--20">Corporate Team Member.</h2>
            </div>
          </div>
        </div>
        <div className="row row--15">
          {teamMembersThree.map((member) => (
            <div
              key={member.id}
              data-sal="slide-up"
              data-sal-duration={700}
              data-sal-delay={member.salDelay}
              className="col-lg-6 col-xl-3 col-md-6 col-12 mt--30"
            >
              <div className="rainbow-team team-style-three">
                <div className="inner">
                  <div className="thumbnail">
                    <Image
                      alt="Corporate Template"
                      src={member.imgSrc}
                      width={member.width}
                      height={member.height}
                    />
                  </div>
                  <div className="content">
                    <div className="team-info">
                      <h2 className="title">{member.name}</h2>
                      <h6 className="subtitle theme-gradient">
                        {member.title}
                      </h6>
                      <div className="team-form">
                        <span className="location">{member.location}</span>
                      </div>
                    </div>
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
