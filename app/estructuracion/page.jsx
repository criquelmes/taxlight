import Footer3 from "../../components/footers/Footer3";
import Header2 from "../../components/headers/Header2";
import Hero from "../../components/othersPages/estructuracion/Hero";
import Service from "../../components/othersPages/estructuracion/Service";
import Info from "../../components/othersPages/estructuracion/Info";

export const metadata = {
  title: "Estructuración tributaria",
  description:
    "Asesoría en estructuración tributaria para optimizar tu carga fiscal.",
};
export default function EstructuracionTributariaPage() {
  return (
    <>
      <Header2 />
      <div>
        <div className="rainbow-gradient-circle" />
        <div className="rainbow-gradient-circle theme-pink" />
      </div>
      <Hero />
      <Info />
      <Service />
      <Footer3 />
    </>
  );
}
