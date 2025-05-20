"use client";
import React, { useEffect, useRef, useState } from "react";
const demostrings = ["Bank Account", "Web Payment"];
export default function TyperComponent({
  className = "theme-gradient",
  strings = demostrings,
}) {
  const [activeSctingIndex, setActiveSctingIndex] = useState(0);
  const typeitRef = useRef(null);

  useEffect(() => {
    typeitRef.current.style.width =
      typeitRef.current.querySelector(".is-visible").scrollWidth + "px";

    const reapetTyping = setInterval(() => {
      typeitRef.current.style.width = "0px";
      setTimeout(() => {
        setActiveSctingIndex((pre) => {
          if (pre == strings.length - 1) {
            return 0;
          } else {
            return pre + 1;
          }
        });
        setTimeout(() => {
          if (typeitRef.current) {
            typeitRef.current.style.width =
              typeitRef.current.querySelector(".is-visible").scrollWidth + "px";
          }
        }, 10);
      }, 600);
    }, 3000);

    // Cleanup function to destroy the Typed instance
    return () => {
      clearInterval(reapetTyping);
    };
  }, []);
  return (
    <span ref={typeitRef} className="cd-words-wrapper typeanimation">
      {strings.map((elm, i) => (
        <b
          key={i}
          className={`${className} ${
            activeSctingIndex == i ? "is-visible" : "is-hidden"
          } `}
        >
          {elm}
        </b>
      ))}
    </span>
  );
}
