import { useState, useEffect } from "react";

export const useTheme = () => {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const body = document.body;
    const isDark =
      body.classList.contains("active-dark-mode") ||
      !body.classList.contains("active-light-mode");
    setTheme(isDark ? "dark" : "light");

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          const isDark =
            body.classList.contains("active-dark-mode") ||
            !body.classList.contains("active-light-mode");
          setTheme(isDark ? "dark" : "light");
        }
      });
    });

    observer.observe(body, { attributes: true });

    return () => observer.disconnect();
  }, []);

  return theme;
};
