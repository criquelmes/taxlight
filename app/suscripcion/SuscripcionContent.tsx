"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { add, suscribe } from "../../actions";
import OrderSummary from "../../components/order/OrderSummary";

interface SuscripcionContentProps {
  initialPlan?: string;
  initialTitle?: string;
  initialType?: string;
  hasPreapprovalId: boolean;
}

export default function SuscripcionContent({
  initialPlan,
  initialTitle,
  initialType,
  hasPreapprovalId,
}: SuscripcionContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const preapprovalId = searchParams.get("preapproval_id");

    if (preapprovalId) {
      console.log(`✅ Pago exitoso! Suscripción ID: ${preapprovalId}`);

      const params = new URLSearchParams(searchParams.toString());
      params.delete("preapproval_id");

      const newUrl = params.toString() ? `?${params.toString()}` : "";

      router.replace(`/suscripcion${newUrl}`, { scroll: false });
    }
  }, [searchParams, router]);

  const plan = searchParams.get("plan") || initialPlan;
  const title = searchParams.get("title") || initialTitle;
  const type = searchParams.get("type") || initialType;

  return (
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
  );
}
