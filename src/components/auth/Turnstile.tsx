"use client";

import { useEffect, useRef } from "react";

type TurnstileApi = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      theme: "light" | "dark";
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/** Clave pública del widget. Si no está definida, el captcha queda apagado en toda la web. */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise: Promise<void> | null = null;

function cargarScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error("No se pudo cargar el captcha."));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

/**
 * Captcha de Cloudflare Turnstile. Entrega un token de un solo uso por `onToken`
 * (o null si venció o falló); para pedir uno nuevo hay que remontar el componente (cambiar su `key`).
 */
export function Turnstile({ onToken }: { onToken: (token: string | null) => void }) {
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return;
    let cancelado = false;
    let widgetId: string | undefined;

    cargarScript()
      .then(() => {
        if (cancelado || !contenedor.current || !window.turnstile) return;
        widgetId = window.turnstile.render(contenedor.current, {
          sitekey: TURNSTILE_SITE_KEY,
          theme: "dark",
          callback: (token) => onToken(token),
          "expired-callback": () => onToken(null),
          "error-callback": () => onToken(null),
        });
      })
      .catch(() => onToken(null));

    return () => {
      cancelado = true;
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
  }, [onToken]);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={contenedor} className="mb-4 flex min-h-16.25 justify-center" />;
}
