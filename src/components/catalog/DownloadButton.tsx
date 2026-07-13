"use client";

import { useState } from "react";

export function DownloadButton({ disenoId, esGratis }: { disenoId: string; esGratis: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!esGratis) {
    return (
      <div>
        <button
          disabled
          className="w-full cursor-not-allowed rounded-[3px] bg-orange/50 px-6.5 py-4 text-[15px] font-bold text-white"
        >
          Compra próximamente
        </button>
        <p className="mt-3.5 flex items-center gap-2 text-xs text-text-dim">
          <span className="h-1.5 w-1.5 rounded-full bg-orange" />
          El cobro de diseños PRO todavía no está activo — pronto vía dLocal.
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
