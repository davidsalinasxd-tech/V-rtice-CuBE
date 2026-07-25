"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function EditarPrecioDiseno({
  disenoId,
  esGratis: esGratisInicial,
  precio: precioInicial,
}: {
  disenoId: string;
  esGratis: boolean;
  precio: number;
}) {
  const router = useRouter();
  const [esGratis, setEsGratis] = useState(esGratisInicial);
  const [precio, setPrecio] = useState(precioInicial ? String(precioInicial) : "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/disenos/${disenoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "editar",
          esGratis,
          precio: esGratis ? 0 : parseInt(precio || "0", 10),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo guardar.");
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
          onClick={guardar}
          disabled={loading}
          className="cursor-pointer rounded-sm border border-line-strong px-2 py-1 text-[11px] font-semibold text-navy transition-colors hover:border-navy disabled:cursor-wait disabled:opacity-50"
        >
          {loading ? "…" : "Guardar"}
        </button>
      </div>
      {error && <span className="text-[10px] text-orange">{error}</span>}
    </div>
  );
}
