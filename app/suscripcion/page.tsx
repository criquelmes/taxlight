import { Suspense } from "react";
import Header2 from "../../components/headers/Header2";
import SuscripcionContent from "./SuscripcionContent";

interface SuscripcionPageProps {
  searchParams: {
    plan?: string;
    title?: string;
    type?: string;
    preapproval_id?: string;
  };
}

// Componente de loading
function SuscripcionLoading() {
  return (
    <div className="rainbow-prfile-area rainbow-section-gap">
      <div className="container">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="sr-only">Cargando...</span>
          </div>
          <p>Procesando información de suscripción...</p>
        </div>
      </div>
    </div>
  );
}

export default function SuscripcionPage({
  searchParams,
}: SuscripcionPageProps) {
  const { plan, title, type, preapproval_id } = searchParams;

  return (
    <>
      <Header2 />
      <div>
        <div className="rainbow-gradient-circle" />
        <div className="rainbow-gradient-circle theme-pink" />
      </div>

      {/* Breadcrumb Area */}
      <div className="breadcrumb-area breadcarumb-style-1 ptb--120">
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="breadcrumb-inner text-center">
                <h1 className="title theme-gradient h2">
                  Suscripción Astrobot
                </h1>
                <ul id="breadcrumbs" className="page-list">
                  <li className="item-home">
                    <a className="bread-link bread-home" href="/" title="Home">
                      Inicio
                    </a>
                  </li>
                  <li className="item-current">
                    <span className="bread-current">Suscripción</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Checkout Area con Suspense */}
      <Suspense fallback={<SuscripcionLoading />}>
        <SuscripcionContent
          initialPlan={plan}
          initialTitle={title}
          initialType={type}
          hasPreapprovalId={!!preapproval_id}
        />
      </Suspense>
    </>
  );
}
