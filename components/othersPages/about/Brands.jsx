import React from "react";
import Image from "next/image";
import { brandImages } from "@/data/brands";
export default function Brands() {
  return (
    <div
      className="rainbow-brand-area pb--60 pt-0 pb-0"
      style={{ marginTop: "-80px" }}
    >
      <div className="container">
        <div className="row">
          <div className="col-lg-12 mt--10">
            <ul className="brand-list brand-style-2">
              {brandImages.slice(0, 9).map((image, index) => (
                <li key={index}>
                  <a href="#">
                    <Image
                      alt={image.alt}
                      src={image.src}
                      width={232}
                      height={110}
                    />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
