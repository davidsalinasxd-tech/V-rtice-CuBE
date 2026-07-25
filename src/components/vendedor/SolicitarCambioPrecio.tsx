"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SolicitarCambioPrecio({
  disenoId,
  esGratis: esGratisActual,
  precio: precioActual,
  pendiente,
}: {
  disenoId: string;
  esGratis: boolean;
  precio: number;
  pendiente: boolean;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [esGratis, setEsGratis] = useState(esGratisActual);
  const [precio, setPrecio] = useState(precioActual ? String(precioActual) : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (pendiente) {
    return <span className="text-[11px] text-text-dim">Solicitud en revisión</span>;
  }

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        className="cursor-pointer rounded-sm border border-line-strong px-2.5 py-1 text-[11px] font-semibold text-navy transition-colors hover:border-navy"
      >
        Solicitar cambio
      </button>
    );
  }

  async function enviar() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vendedor/solicitud-precio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disenoId,
          esGratis,
          precio: esGratis ? 0 : parseInt(precio || "0", 10),
        }),
      });
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
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        <select
          value={esGratis ? "gratis" : "pago"}
          onChange={(e) => setEsGratis(e.target.value === "gratis")}
          className="rounded-sm border border-line-strong bg-white px-1.5 py-1 text-[11px] focus:border-orange focus:outline-none"
        >
          <option value="gratis">Gratis</option>
          <option value="pago">Pago</option>
        </select>
        {!esGratis && (
          <input
            type="number"
            min={0}
            value={precio}
            onChange={(e) => setPrecio(e.target.value)}
            placeholder="Gs."
            className="w-20 rounded-sm border border-line-strong bg-white px-1.5 py-1 text-[11px] focus:border-orange focus:outline-none"
          />
        )}
        <button
          onClick={enviar}
          disabled={loading}
          className="cursor-pointer rounded-sm bg-navy px-2.5 py-1 text-[11px] font-semibold text-white transition-colors hover:bg-orange disabled:cursor-wait disabled:opacity-50"
        >
          {loading ? "…" : "Enviar"}
        </button>
        <button
          onClick={() => setAbierto(false)}
          className="cursor-pointer text-[11px] text-text-dim hover:text-navy"
        >
          Cancelar
        </button>
      </div>
      {error && <span className="text-[10px] text-orange">{error}</span>}
    </div>
  );
}
