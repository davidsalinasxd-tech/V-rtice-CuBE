"use client";

import { useEffect, useRef } from "react";

/**
 * Lista de box-shadow: cada sombra es una estrella de 1px. Se genera en un
 * efecto (nunca durante el render) para no romper la hidratación con Math.random.
 * x en vw; y en vh escalado por la altura real del hero, así cubre todo el hero
 * aunque sea más alto que la ventana.
 */
function campo(cantidad: number, blur: number, alfaMin: number, alfaMax: number, altoEnVh: number) {
  return Array.from({ length: cantidad }, () => {
    const x = (Math.random() * 100).toFixed(2);
    const y = (Math.random() * altoEnVh).toFixed(2);
    const alfa = (alfaMin + Math.random() * (alfaMax - alfaMin)).toFixed(2);
    return `${x}vw ${y}vh ${blur}px ${blur ? 0.4 : 0}px rgba(255,255,255,${alfa})`;
  }).join(",");
}

export function Starfield() {
  const raiz = useRef<HTMLDivElement>(null);
  const capaA = useRef<HTMLDivElement>(null);
  const capaB = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = raiz.current;
    const a = capaA.current;
    const b = capaB.current;
    if (!el || !a || !b) return;

    const generar = () => {
      const movil = window.innerWidth < 768;
      const altoEnVh = (el.offsetHeight / Math.max(window.innerHeight, 1)) * 100;
      a.style.boxShadow = campo(movil ? 75 : 150, 0, 0.05, 0.3, altoEnVh);
      b.style.boxShadow = campo(movil ? 9 : 18, 1.2, 0.35, 0.7, altoEnVh);
    };

    generar();

    let temporizador: number | undefined;
    const alCambiarTamano = () => {
      window.clearTimeout(temporizador);
      temporizador = window.setTimeout(generar, 150);
    };
    window.addEventListener("resize", alCambiarTamano);

    return () => {
      window.clearTimeout(temporizador);
      window.removeEventListener("resize", alCambiarTamano);
    };
  }, []);

  return (
    <div ref={raiz} aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div ref={capaA} className="twinkle-a absolute top-0 left-0 h-px w-px rounded-full" />
      <div ref={capaB} className="twinkle-b absolute top-0 left-0 h-px w-px rounded-full" />
    </div>
  );
}
