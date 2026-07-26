"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SolicitarPago({ metodoCompleto, pendiente }: { metodoCompleto: boolean; pendiente: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (pendiente) {
    return (
      <span className="rounded-sm bg-navy/8 px-3.5 py-2 text-xs font-semibold text-navy-2">
        Solicitud enviada — en revisión
      </span>
    );
  }

  async function solicitar() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vendedor/solicitud-pago", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo enviar la solicitud.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="text-right">
      <button
        onClick={solicitar}
        disabled={!metodoCompleto || loading}
        className="cursor-pointer rounded-sm border border-line-strong px-5 py-3 text-sm font-semibold transition-colors hover:border-text-dim hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40"
      >
        {loading ? "Enviando…" : "Solicitar pago"}
      </button>
      {error && <p className="mt-2 text-xs text-orange">{error}</p>}
    </div>
  );
}
