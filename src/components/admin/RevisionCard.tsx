"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { HexIcon } from "@/components/HexIcon";
import { codigoDeDiseno } from "@/lib/codigo";
import type { Diseno } from "@/lib/types/database";

export function RevisionCard({
  diseno,
  vendedorNombre,
  imagenPreviewUrl,
  rarPreviewUrl,
}: {
  diseno: Diseno;
  vendedorNombre: string;
  imagenPreviewUrl: string | null;
  rarPreviewUrl: string | null;
}) {
  const [loading, setLoading] = useState<"aprobar" | "rechazar" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleAccion(accion: "aprobar" | "rechazar") {
    if (accion === "rechazar" && !confirm(`¿Rechazar "${diseno.nombre}"? Esto borra los archivos de R2.`)) {
      return;
    }
    setLoading(accion);
    setError(null);
    try {
      const res = await fetch(`/api/admin/disenos/${diseno.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo procesar la acción.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-4 border border-line bg-white p-5 sm:flex-row sm:items-center">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-md border border-line bg-paper">
        {imagenPreviewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imagenPreviewUrl} alt={diseno.nombre} className="h-full w-full object-cover" />
        ) : (
          <HexIcon className="h-9 w-9" />
        )}
      </div>

      <div className="flex-1">
        <div className="mb-0.5 font-mono text-[10px] text-text-dim">{codigoDeDiseno(diseno.id)}</div>
        <h3 className="text-[15px] font-semibold text-navy">{diseno.nombre}</h3>
        <div className="mt-0.5 text-xs text-text-dim">
          {diseno.deporte} · {diseno.formato} · {diseno.es_gratis ? "Gratis" : `Gs. ${diseno.precio.toLocaleString("es-PY")}`} · Vendedor:{" "}
          {vendedorNombre}
        </div>
        {rarPreviewUrl && (
          <a href={rarPreviewUrl} className="mt-1.5 inline-block text-xs text-navy-2 hover:text-orange">
            Descargar .rar para revisar →
          </a>
        )}
        {error && <p className="mt-1.5 text-xs text-orange">{error}</p>}
      </div>

      <div className="flex gap-2.5">
        <button
          onClick={() => handleAccion("rechazar")}
          disabled={loading !== null}
          className="cursor-pointer rounded-sm border border-line-strong px-4 py-2.5 text-xs font-semibold text-text-dim transition-colors hover:border-orange hover:text-orange disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "rechazar" ? "Rechazando…" : "Rechazar"}
        </button>
        <button
          onClick={() => handleAccion("aprobar")}
          disabled={loading !== null}
          className="cursor-pointer rounded-sm bg-navy px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-orange disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading === "aprobar" ? "Aprobando…" : "Aprobar"}
        </button>
      </div>
    </div>
  );
}
