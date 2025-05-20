"use client";

import { useEffect } from "react";

export default function BackToTop() {
  useEffect(() => {
    const scrollTop = document.querySelector(".rainbow-back-top");

    const handleScroll = () => {
      const topPos = window.scrollY || document.documentElement.scrollTop;
      if (topPos > 150) {
        scrollTop.style.opacity = "1";
      } else {
        scrollTop.style.opacity = "0";
      }
    };

    const scrollToTop = (event) => {
      event.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: "smooth", // Linear easing replacement
      });
    };

    // Add scroll and click event listeners
    window.addEventListener("scroll", handleScroll);
    scrollTop.addEventListener("click", scrollToTop);

    // Cleanup function to remove event listeners
    return () => {
      window.removeEventListener("scroll", handleScroll);
      scrollTop.removeEventListener("click", scrollToTop);
    };
  }, []);

  return (
    <div className="rainbow-back-top">
      <i className="feather-arrow-up " />
    </div>
  );
}
