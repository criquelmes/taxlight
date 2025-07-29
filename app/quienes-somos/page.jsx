import Footer3 from "../../components/footers/Footer3";
import Header2 from "../../components/headers/Header2";
import Hero from "../../components/othersPages/about/Hero";
import Cta from "../../components/othersPages/about/Cta";
import Qualities from "../../components/othersPages/about/Qualities";
import Split from "../../components/othersPages/about/Split";
import Objectives from "../../components/othersPages/about/Objectives";
import CryptoPay from "../../components/othersPages/about/CryptoPay";
import Why from "../../components/othersPages/about/Why";

import MoreInfo from "../../components/othersPages/about/MoreInfo";
import React from "react";

export const metadata = {
  title: "Taxlight | Soluciones tributarias",
  description:
    "Soluciones tributarias adaptadas a la era digital. Hemos desarrollado una plataforma especializada que combina la experiencia tributaria con el conocimiento de criptoactivos. Bienvenidos a Taxlight",
};
export default function page() {
  return (
    <>
      <Header2 parentClass="rainbow-header header-default header-sticky" />
      <div>
        <div className="rainbow-gradient-circle" />
        <div className="rainbow-gradient-circle theme-pink" />
      </div>
      <Hero />
      <MoreInfo />
      <Cta />
      <Qualities />
      <CryptoPay />
      <Split />
      <Objectives />
      <Why />

      <Footer3 />
    </>
  );
}
