import React from "react";
import Footer3 from "../../components/footers/Footer3";
import Header2 from "../../components/headers/Header2";
import TermsConditions from "../../components/elements/TermsConditions";

export const metadata = {
  title: "Términos y Condiciones || Tax Light | soluciones tributarias",
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
      <TermsConditions />

      <Footer3 />
    </>
  );
}
