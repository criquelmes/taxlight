import { useState, useEffect } from "react";

export const useTheme = () => {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const body = document.body;

    const getCurrentTheme = () => {
      if (body.classList.contains("active-dark-mode")) {
        return "dark";
      } else if (body.classList.contains("active-light-mode")) {
        return "light";
      } else {
        return "dark";
      }
    };

    setTheme(getCurrentTheme());

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          setTheme(getCurrentTheme());
        }
      });
    });

    observer.observe(body, { attributes: true });

    return () => observer.disconnect();
  }, []);

  return theme;
};
