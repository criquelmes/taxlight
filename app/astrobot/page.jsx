import Footer3 from "../../components/footers/Footer3";
import Header2 from "../../components/headers/Header2";

import Hero from "../../components/othersPages/about/Hero";
import HowWorks from "../../components/othersPages/about/HowWorks";
import Service from "../../components/othersPages/astrobot/Service";
import TemplateSlider from "../../components/othersPages/astrobot/TemplateSlider";
import React from "react";

export const metadata = {
  title: "Astrobot || Tax Light | soluciones tributarias",
  description:
    "Soluciones tributarias adaptadas a la era digital. Hemos desarrollado una plataforma especializada que combina la experiencia tributaria con el conocimiento de criptoactivos. Bienvenidos a Taxlight",
};
export default function page() {
  return (
    <>
      <Header2 parentClass="rainbow-header header-default header-transparent header-sticky" />
      <div>
        <div className="rainbow-gradient-circle" />
        <div className="rainbow-gradient-circle theme-pink" />
      </div>
      <Hero />
      <Service />
      <HowWorks />
      <TemplateSlider />

      <Footer3 />
    </>
  );
}
