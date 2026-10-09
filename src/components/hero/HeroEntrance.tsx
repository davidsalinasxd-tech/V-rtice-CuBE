"use client";

import { useEffect } from "react";

const EASE = "cubic-bezier(.16,1,.3,1)";

type Paso = { keyframes: Keyframe[]; delay: number; duration: number };

const subir = (y: number): Keyframe[] => [
  { opacity: 0, translate: `0 ${y}px` },
  { opacity: 1, translate: "0 0" },
];

// Cada línea del titular sube desde su base, recortada con clip-path.
const linea: Keyframe[] = [
  { clipPath: "inset(100% -10% -30% -10%)", translate: "0 .35em" },
  { clipPath: "inset(-30% -10% -30% -10%)", translate: "0 0" },
];

// Se usan las propiedades individuales translate/scale/opacity/clip-path (no transform)
// para no chocar con el anillo 3D ni con la inclinación del panel.
const PLAN: Record<string, Paso> = {
  nav: { keyframes: subir(-12), delay: 0, duration: 700 },
  bar: { keyframes: subir(-8), delay: 140, duration: 700 },
  eyebrow: { keyframes: subir(10), delay: 300, duration: 700 },
  l1: { keyframes: linea, delay: 380, duration: 900 },
  l2: { keyframes: linea, delay: 500, duration: 900 },
  lead: { keyframes: subir(14), delay: 720, duration: 800 },
  cta: { keyframes: subir(14), delay: 840, duration: 800 },
  ring: {
    keyframes: [
      { opacity: 0, translate: "0 60px", scale: ".94" },
      { opacity: 1, translate: "0 0", scale: "1" },
    ],
    delay: 980,
    duration: 1500,
  },
  panel: {
    keyframes: [
      { opacity: 0, translate: "0 26px", scale: ".97" },
      { opacity: 1, translate: "0 0", scale: "1" },
    ],
    delay: 1250,
    duration: 1000,
  },
};

/**
 * Entrada del hero, una sola vez, con la Web Animations API sobre los elementos [data-enter].
 * Sin JS (o con prefers-reduced-motion) no hay estado inicial oculto: el contenido se ve igual.
 * Un temporizador de seguridad termina cualquier animación pendiente a los 4 s.
 */
export function HeroEntrance() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!Element.prototype.animate) return;

    const animaciones: Animation[] = [];
    document.querySelectorAll<HTMLElement>("[data-enter]").forEach((el) => {
      const paso = PLAN[el.dataset.enter ?? ""];
      if (!paso) return;
      try {
        animaciones.push(
          el.animate(paso.keyframes, {
            duration: paso.duration,
            delay: paso.delay,
            easing: EASE,
            fill: "backwards",
          }),
        );
      } catch {
        // Si el navegador no soporta alguna propiedad, el elemento queda visible tal cual.
      }
    });

    const seguridad = window.setTimeout(() => {
      animaciones.forEach((a) => {
        try {
          a.finish();
        } catch {
          // Ya terminada.
        }
      });
    }, 4000);

    return () => {
      window.clearTimeout(seguridad);
      animaciones.forEach((a) => a.cancel());
    };
  }, []);

  return null;
}
