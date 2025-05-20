"use client";

import Image from "next/image";
import { useEffect } from "react";

export default function ModeSwitcher() {
  const handleClick = () => {
    if (document.body.classList.contains("active-light-mode")) {
      document.body.setAttribute("class", "active-dark-mode");
      localStorage.setItem("isDarkmode", true);
    } else {
      document.body.setAttribute("class", "active-light-mode");
      localStorage.setItem("isDarkmode", false);
    }
  };

  return (
    <div id="my_switcher" onClick={handleClick} className="my_switcher">
      <ul>
        <li>
          <a data-theme="light" className="setColor light">
            <Image
              className="sun-image"
              alt="Sun images"
              src="/assets/images/icons/sun-01.svg"
              width={18}
              height={18}
            />
          </a>
        </li>
        <li>
          <a data-theme="dark" className="setColor dark">
            <Image
              className="Victor Image"
              alt="Vector Images"
              src="/assets/images/icons/vector.svg"
              width={18}
              height={18}
            />
          </a>
        </li>
      </ul>
    </div>
  );
}
