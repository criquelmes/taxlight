import Footer3 from "../../components/footers/Footer3";
import Header2 from "../../components/headers/Header2";
import Hero from "../../components/othersPages/diagnostico/Hero";
import Service from "../../components/othersPages/diagnostico/Service";
import ListadoBeneficios from "../../components/othersPages/diagnostico/ListadoBeneficios";

export const metadata = {
  title: "Diagnostico Tributario || Tax Light | soluciones tributarias",
  description:
    "Soluciones tributarias adaptadas a la era digital. Hemos desarrollado una plataforma especializada que combina la experiencia tributaria con el conocimiento de criptoactivos. Bienvenidos a Taxlight",
};

export default function DiagnosticoTributarioPage() {
  return (
    <>
      <Header2 />
      <div>
        <div className="rainbow-gradient-circle" />
        <div className="rainbow-gradient-circle theme-pink" />
      </div>
      <Hero />
      <Service />
      <ListadoBeneficios />
      <Footer3 />
    </>
  );
}
