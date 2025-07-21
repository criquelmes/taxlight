"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { add, suscribe } from "../../actions";
import Header2 from "../../components/headers/Header2";
import OrderSummary from "../../components/order/OrderSummary";

interface SuscripcionPageProps {
  searchParams: {
    plan?: string;
    title?: string;
    type?: string;
    preapproval_id?: string;
  };
}

export default function SuscripcionPage({
  searchParams,
}: SuscripcionPageProps) {
  const router = useRouter();
  const searchParamsHook = useSearchParams();

  const { plan, title, type, preapproval_id } = searchParams;

  useEffect(() => {
    const preapprovalId = searchParamsHook.get("preapproval_id");

    if (preapprovalId) {
      console.log(`✅ Pago exitoso! Suscripción ID: ${preapprovalId}`);

      const params = new URLSearchParams(searchParamsHook.toString());
      params.delete("preapproval_id");

      const newUrl = params.toString() ? `?${params.toString()}` : "";

      router.replace(`/suscripcion${newUrl}`, { scroll: false });
    }
  }, [searchParamsHook, router]);

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

      {/* Main Checkout Area */}
      <div className="rainbow-prfile-area rainbow-section-gap">
        <div className="container">
          <OrderSummary
            onSubscribe={suscribe}
            onAdd={add}
            selectedPlan={plan}
            selectedTitle={title}
            selectedType={type}
          />
        </div>
      </div>
    </>
  );
}
