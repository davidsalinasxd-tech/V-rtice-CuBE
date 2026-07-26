"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SolicitudPagoConDetalle } from "@/lib/supabase/admin-queries";

export function SolicitudesPagoPanel({ solicitudes }: { solicitudes: SolicitudPagoConDetalle[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function accionar(id: string, accion: "pagar" | "cancelar") {
    if (accion === "pagar" && !confirm("¿Ya hiciste la transferencia? Esto marca la solicitud como pagada.")) {
      return;
    }
    setLoadingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/solicitudes-pago/${id}`, {
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
    return <p className="text-sm text-text-dim">No hay solicitudes de pago pendientes.</p>;
  }

  return (
    <div>
      {error && <p className="mb-4 text-[13px] text-orange">{error}</p>}
      <div className="flex flex-col gap-3">
        {solicitudes.map((s) => (
          <div key={s.id} className="flex flex-col gap-4 border border-line bg-white p-5 sm:flex-row sm:items-center">
            <div className="flex-1">
              <h3 className="text-[15px] font-semibold text-navy">{s.vendedorNombre}</h3>
              {s.metodo ? (
                <div className="mt-0.5 text-xs text-text-dim">
                  {s.metodo.banco} · Cuenta {s.metodo.numero_cuenta} · Titular {s.metodo.titular} · CI/RUC{" "}
                  {s.metodo.ci_ruc}
                </div>
              ) : (
                <div className="mt-0.5 text-xs text-orange">Sin datos de transferencia cargados.</div>
              )}
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => accionar(s.id, "cancelar")}
                disabled={loadingId === s.id}
                className="cursor-pointer rounded-sm border border-line-strong px-4 py-2.5 text-xs font-semibold text-text-dim transition-colors hover:border-orange hover:text-orange disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingId === s.id ? "…" : "Cancelar"}
              </button>
              <button
                onClick={() => accionar(s.id, "pagar")}
                disabled={loadingId === s.id}
                className="cursor-pointer rounded-sm bg-navy px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-orange disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loadingId === s.id ? "…" : "Marcar como pagado"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
