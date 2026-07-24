"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Perfil } from "@/lib/types/database";

export function SolicitudesPanel({ solicitudes }: { solicitudes: Perfil[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function accionar(perfilId: string, accion: "aprobar" | "rechazar") {
    setLoadingId(perfilId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/solicitudes/${perfilId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo procesar la solicitud.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setLoadingId(null);
    }
  }

  if (solicitudes.length === 0) {
    return <p className="text-sm text-text-dim">No hay solicitudes pendientes.</p>;
  }

  return (
    <div>
      {error && <p className="mb-4 text-[13px] text-orange">{error}</p>}
      <div className="flex flex-col gap-3">
        {solicitudes.map((p) => (
          <div key={p.id} className="flex flex-col gap-4 border border-line bg-white p-5 sm:flex-row sm:items-center">
            <div className="flex-1">
              <h3 className="text-[15px] font-semibold text-navy">{p.nombre}</h3>
              <div className="mt-0.5 text-xs text-text-dim">{p.email ?? "—"}</div>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => accionar(p.id, "rechazar")}
                disabled={loadingId === p.id}
                className="cursor-pointer rounded-sm border border-line-strong px-4 py-2.5 text-xs font-semibold text-text-dim transition-colors hover:border-orange hover:text-orange disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingId === p.id ? "…" : "Rechazar"}
              </button>
              <button
                onClick={() => accionar(p.id, "aprobar")}
                disabled={loadingId === p.id}
                className="cursor-pointer rounded-sm bg-navy px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-orange disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingId === p.id ? "…" : "Aprobar"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
