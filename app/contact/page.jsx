import Footer3 from "../../components/footers/Footer3";
import Header2 from "../../components/headers/Header2";

import Contact from "../../components/othersPages/Contact";

export const metadata = {
  title: "Contacto || Tax Light | soluciones tributarias",
  description:
    "Soluciones tributarias adaptadas a la era digital. Hemos desarrollado una plataforma especializada que combina la experiencia tributaria con el conocimiento de criptoactivos. Bienvenidos a Taxlight",
};
export default function page() {
  return (
    <>
      <Header2 />
      {/* <BreadCumb /> */}
      <div>
        <div className="rainbow-gradient-circle" />
        <div className="rainbow-gradient-circle theme-pink" />
      </div>
      <Contact />
      <Footer3 />
    </>
  );
}
