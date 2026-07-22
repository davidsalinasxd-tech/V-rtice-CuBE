"use client";

import { useState } from "react";
import { linkTelegramCompra } from "@/lib/telegram";

export function DownloadButton({
  disenoId,
  esGratis,
  codigo,
  nombre,
  precio,
}: {
  disenoId: string;
  esGratis: boolean;
  codigo: string;
  nombre: string;
  precio: number;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!esGratis) {
    return (
      <div>
        <a
          href={linkTelegramCompra(codigo, nombre, precio)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-2 rounded-[3px] bg-orange px-6.5 py-4 text-[15px] font-bold text-white transition-colors hover:bg-orange-2"
        >
          Coordinar pago por Telegram →
        </a>
        <p className="mt-3.5 text-xs leading-relaxed text-text-dim">
          Le escribís a Vértice Cube por Telegram, te pasamos los datos para transferir, y en cuanto confirmamos
          el pago te mandamos el archivo por ahí mismo.
        </p>
      </div>
    );
  }

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/r2/download-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disenoId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo generar el link de descarga.");
      window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="w-full cursor-pointer rounded-[3px] bg-orange px-6.5 py-4 text-[15px] font-bold text-white transition-colors hover:bg-orange-2 disabled:cursor-wait disabled:opacity-70"
      >
        {loading ? "Generando link…" : "Descargar diseño →"}
      </button>
      {error ? (
        <p className="mt-3.5 text-xs text-orange">{error}</p>
      ) : (
        <p className="mt-3.5 flex items-center gap-2 text-xs text-text-dim">
          <span className="h-1.5 w-1.5 rounded-full bg-orange" />
          El link de descarga se habilita al instante
        </p>
      )}
    </div>
  );
}
