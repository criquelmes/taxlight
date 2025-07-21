import { BitcoinIcon } from "lucide-react";
import React from "react";

export default function CryptoPay() {
  return (
    <div className="service-area rainbow-section-gap">
      <div className="container">
        <div className="row align-items-center">
          <div className="col-lg-6">
            <div className="content">
              <h3 className="subtitle">
                Pago en Criptomonedas
                <BitcoinIcon height={48} width={48} color="gold" />
              </h3>
            </div>
          </div>
          <div className="col-lg-6">
            <p className="mb--10">
              ¿Para qué pagar en fiat si puedes pagar con cripto?, te ofrecemos
              la opción de pagar por nuestros servicios con criptomonedas (BTC o
              ETH) para mayor comodidad.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
