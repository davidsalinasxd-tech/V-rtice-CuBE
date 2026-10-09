"use client";

import { useEffect } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";

/**
 * Aparición (fade + subida corta) de los elementos [data-reveal] que están debajo del primer
 * pantallazo, una sola vez por elemento. data-reveal-delay agrega un retraso en ms.
 * Los elementos ya visibles al cargar no se tocan, y con prefers-reduced-motion no hace nada.
 */
export function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const alto = window.innerHeight;
    const ocultos: HTMLElement[] = [];

    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return;
          const el = entrada.target as HTMLElement;
          observador.unobserve(el);
          const delay = Number(el.dataset.revealDelay ?? 0);
          el.animate(
            [
              { opacity: 0, translate: "0 22px" },
              { opacity: 1, translate: "0 0" },
            ],
            { duration: 700, delay, easing: EASE, fill: "backwards" },
          );
          el.style.opacity = "";
          el.style.translate = "";
        });
      },
      { rootMargin: "0px 0px -8% 0px" },
    );

    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => {
      if (el.getBoundingClientRect().top < alto * 0.92) return;
      el.style.opacity = "0";
      el.style.translate = "0 22px";
      ocultos.push(el);
      observador.observe(el);
    });

    return () => {
      observador.disconnect();
      ocultos.forEach((el) => {
        el.style.opacity = "";
        el.style.translate = "";
      });
    };
  }, []);

  return null;
}
