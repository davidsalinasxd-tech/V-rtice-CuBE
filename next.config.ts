import type { NextConfig } from "next";
import path from "node:path";

const esProduccion = process.env.NODE_ENV === "production";

/** Origen (https://host) de una URL, o null si no es válida. */
function origenDe(url: string | undefined) {
  try {
    return url ? new URL(url).origin : null;
  } catch {
    return null;
  }
}

const origenPublicoR2 = origenDe(process.env.R2_PUBLIC_URL);

// CSP sin nonces: Next inyecta scripts en línea para hidratar, así que hace falta 'unsafe-inline'.
// El resto (orígenes, frames, formularios, objetos) sí queda cerrado.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${esProduccion ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: https://*.r2.dev https://*.r2.cloudflarestorage.com${origenPublicoR2 ? ` ${origenPublicoR2}` : ""}`,
  "font-src 'self' data:",
  // Supabase (auth/REST) y R2 (subida directa con URL firmada, desde el navegador).
  `connect-src 'self' https://*.supabase.co https://*.r2.cloudflarestorage.com${esProduccion ? "" : " ws: wss:"}`,
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(esProduccion ? ["upgrade-insecure-requests"] : []),
].join("; ");

const cabecerasDeSeguridad = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    root: path.resolve(__dirname),
  },
  async headers() {
    return [{ source: "/:path*", headers: cabecerasDeSeguridad }];
  },
};

export default nextConfig;
