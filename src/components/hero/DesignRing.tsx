"use client";

import { useEffect, useRef } from "react";
import { HexIcon } from "@/components/HexIcon";
import { codigoDeDiseno } from "@/lib/codigo";

export type ItemAnillo = { id: string; nombre: string; imagen_url: string | null };

const TARJETAS_ESCRITORIO = 37;
const TARJETAS_MOVIL = 21;
/** Más allá de este ángulo (en grados) la tarjeta queda atrás del anillo y se oculta. */
const ANGULO_MAX = 42;
/** Velocidad de giro en grados por segundo. */
const VELOCIDAD = 1.9;

function alFallarImagen(e: React.SyntheticEvent<HTMLImageElement>) {
  e.currentTarget.parentElement?.setAttribute("data-fallo", "1");
}

/**
 * Anillo 3D decorativo de diseños que gira detrás del hero.
 * Un único requestAnimationFrame actualiza el DOM directamente (sin setState por frame).
 * Las posiciones iniciales las pone el efecto: hasta entonces las tarjetas están ocultas,
 * así el HTML del servidor y el del cliente son idénticos.
 */
export function DesignRing({ items }: { items: ItemAnillo[] }) {
  const envoltorio = useRef<HTMLDivElement>(null);
  const anillo = useRef<HTMLDivElement>(null);
  const tarjetas = useRef<(HTMLDivElement | null)[]>([]);
  const sombras = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const wrap = envoltorio.current;
    const ring = anillo.current;
    if (!wrap || !ring) return;

    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conHover = window.matchMedia("(hover: hover)").matches;

    let fase = 0;
    let ultimo = performance.now();
    let raf = 0;
    let visible = true;
    // Parallax suave con el mouse: objetivo (tx, ty) y valor actual (px, py).
    let px = 0;
    let py = 0;
    let tx = 0;
    let ty = 0;
    let radio = 0;
    let paso = 0;
    let cantidad = TARJETAS_ESCRITORIO;
    let mostrada: (boolean | undefined)[] = [];

    const colocar = () => {
      for (let i = 0; i < TARJETAS_ESCRITORIO; i++) {
        const el = tarjetas.current[i];
        const sombra = sombras.current[i];
        if (!el || !sombra || i >= cantidad) continue;

        const a = ((((i * paso + fase) % 360) + 540) % 360) - 180;
        const ab = Math.abs(a);

        if (ab > ANGULO_MAX) {
          if (mostrada[i] !== false) {
            el.style.visibility = "hidden";
            mostrada[i] = false;
          }
          continue;
        }

        const r = (a * Math.PI) / 180;
        const c = Math.cos(r);
        if (mostrada[i] !== true) {
          el.style.visibility = "visible";
          mostrada[i] = true;
        }
        el.style.transform = `translate3d(${(radio * Math.sin(r)).toFixed(2)}px,0,${(radio * (1 - c)).toFixed(2)}px) rotateY(${(-a).toFixed(2)}deg)`;
        // Desvanece en el borde del arco para que no "salte" al ocultarse.
        el.style.opacity = Math.min(1, (ANGULO_MAX - ab) / 5).toFixed(3);
        // brillo = 0.84 + 0.5·(1/c − 1). Como es ≤ 1 en casi todo el arco, se logra
        // con una capa negra de opacidad (1 − brillo): así solo se anima opacity.
        const brillo = 0.84 + 0.5 * (1 / c - 1);
        sombra.style.opacity = Math.min(1, Math.max(0, 1 - brillo)).toFixed(3);
      }

      px += (tx - px) * 0.06;
      py += (ty - py) * 0.06;
      ring.style.transform = `rotateX(${py.toFixed(3)}deg) rotateY(${px.toFixed(3)}deg)`;
    };

    const medir = () => {
      const vw = window.innerWidth;
      const w = Math.max(88, Math.min(150, vw * 0.11));
      radio = w * 6.85;
      cantidad = vw < 768 ? TARJETAS_MOVIL : TARJETAS_ESCRITORIO;
      paso = 360 / cantidad;
      wrap.style.setProperty("--w", `${w}px`);
      tarjetas.current.forEach((el, i) => {
        if (el) el.style.display = i < cantidad ? "" : "none";
      });
      mostrada = [];
      colocar();
    };

    const tick = (t: number) => {
      if (!visible) return;
      const dt = Math.min(Math.max((t - ultimo) / 1000, 0), 0.1);
      ultimo = t;
      fase -= VELOCIDAD * dt;
      colocar();
      raf = requestAnimationFrame(tick);
    };

    const arrancar = () => {
      cancelAnimationFrame(raf);
      ultimo = performance.now();
      raf = requestAnimationFrame(tick);
    };

    // Imágenes que ya fallaron antes de que React enganchara onError.
    wrap.querySelectorAll("img").forEach((img) => {
      if (img.complete && img.naturalWidth === 0) img.parentElement?.setAttribute("data-fallo", "1");
    });

    medir();

    let temporizador: number | undefined;
    const alCambiarTamano = () => {
      window.clearTimeout(temporizador);
      temporizador = window.setTimeout(medir, 150);
    };
    window.addEventListener("resize", alCambiarTamano);

    const alMover = (e: MouseEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 6;
      ty = (e.clientY / Math.max(window.innerHeight, 1) - 0.5) * -3;
    };
    // Al volver a la pestaña no hay salto: se reinicia la referencia de tiempo.
    const alCambiarVisibilidad = () => {
      ultimo = performance.now();
    };
    document.addEventListener("visibilitychange", alCambiarVisibilidad);

    let observador: IntersectionObserver | undefined;
    if (!reducido) {
      if (conHover) window.addEventListener("mousemove", alMover, { passive: true });
      // Pausa el giro cuando el hero no se ve.
      observador = new IntersectionObserver((entradas) => {
        entradas.forEach((entrada) => {
          visible = entrada.isIntersecting;
          if (visible) arrancar();
        });
      });
      observador.observe(wrap);
      arrancar();
    }

    return () => {
      cancelAnimationFrame(raf);
      observador?.disconnect();
      window.clearTimeout(temporizador);
      window.removeEventListener("resize", alCambiarTamano);
      window.removeEventListener("mousemove", alMover);
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div
      ref={envoltorio}
      data-enter="ring"
      aria-hidden="true"
      className="ring-wrap pointer-events-none absolute inset-x-0 top-0 z-1 h-165 md:h-full"
    >
      <div className="absolute top-[66%] left-1/2 h-0 w-0 [transform-style:preserve-3d]">
        <div ref={anillo} className="absolute top-0 left-0 will-change-transform [transform-style:preserve-3d]">
          {Array.from({ length: TARJETAS_ESCRITORIO }, (_, i) => {
            const item = items[i % items.length];
            return (
              <div
                key={`${item.id}-${i}`}
                ref={(el) => {
                  tarjetas.current[i] = el;
                }}
                className="ring-card"
                style={{ visibility: "hidden" }}
              >
                <span
                  ref={(el) => {
                    sombras.current[i] = el;
                  }}
                  className="ring-shade"
                />
                <div className="ring-media" data-fallo={item.imagen_url ? undefined : "1"}>
                  {item.imagen_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imagen_url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      onError={alFallarImagen}
                    />
                  )}
                  <div className="ring-fallback">
                    <HexIcon className="h-2/5 w-2/5 opacity-50" />
                  </div>
                </div>
                <div className="ring-code">{codigoDeDiseno(item.id)}</div>
                <div className="ring-name">{item.nombre}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
