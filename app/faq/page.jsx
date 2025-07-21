import React from "react";
import Footer3 from "../../components/footers/Footer3";
import Header2 from "../../components/headers/Header2";
import Accordions from "../../components/elements/Accordions";

export const metadata = {
  title: "Taxlight | Soluciones tributarias",
  description:
    "Soluciones tributarias adaptadas a la era digital. Hemos desarrollado una plataforma especializada que combina la experiencia tributaria con el conocimiento de criptoactivos. Bienvenidos a Taxlight",
};
export default function page() {
  return (
    <>
      <Header2 />
      <div>
        <div className="rainbow-gradient-circle" />
        <div className="rainbow-gradient-circle theme-pink" />
      </div>
      <Accordions />

      <Footer3 />
    </>
  );
}
