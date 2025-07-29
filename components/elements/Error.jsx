"use client";
import Link from "next/link";
import React from "react";

export default function Error() {
  return (
    <div className="error-area ptb--200 ptb_sm--60 ptb_md--80">
      <div className="container">
        <div className="row align-item-center">
          <div className="col-lg-12">
            <div className="error-inner">
              <h1>404</h1>
              <h2 className="title">Algo no está bien.</h2>
              <p className="description">
                Parece que la página que estás buscando no existe o ha sido
                movida.
              </p>
              <div className="view-more-button">
                <Link className="btn-default" href={`/`}>
                  Volver a la página principal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
