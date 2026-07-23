"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Perfil } from "@/lib/types/database";

function estaActiva(perfil: Perfil) {
  return perfil.es_suscriptor && !!perfil.suscripcion_vence && new Date(perfil.suscripcion_vence) > new Date();
}

function formatFecha(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-PY", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function SuscripcionesPanel({ perfiles }: { perfiles: Perfil[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return perfiles;
    return perfiles.filter((p) => `${p.nombre} ${p.email ?? ""}`.toLowerCase().includes(q));
  }, [perfiles, query]);

  async function accionar(perfilId: string, accion: "activar" | "cancelar") {
    setLoadingId(perfilId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/suscripciones/${perfilId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion, meses: 1 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo actualizar la suscripción.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nombre o email..."
        className="mb-5 w-full max-w-90 rounded-[3px] border border-line-strong bg-paper px-3.5 py-2.5 text-sm focus:border-orange focus:bg-white focus:outline-none"
      />

      {error && <p className="mb-4 text-[13px] text-orange">{error}</p>}

      {filtrados.length === 0 ? (
        <p className="text-sm text-text-dim">No hay usuarios que coincidan.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th>Usuario</Th>
              <Th>Rol</Th>
              <Th>Estado</Th>
              <Th>Vence</Th>
              <Th align="right">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => {
              const activa = estaActiva(p);
              return (
                <tr key={p.id} className="border-t border-line">
                  <td className="py-3.5 pr-3">
                    <div className="text-sm text-ink">{p.nombre}</div>
                    <div className="font-mono text-[11px] text-text-dim">{p.email ?? "—"}</div>
                  </td>
                  <td className="py-3.5 pr-3 text-sm text-text-dim">{p.rol}</td>
                  <td className="py-3.5 pr-3">
                    <span
                      className={`rounded-sm px-2.25 py-1 text-[11px] tracking-wide uppercase ${
                        activa ? "bg-navy/8 text-navy-2" : "bg-orange/10 text-text-dim"
                      }`}
                    >
                      {activa ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="py-3.5 pr-3 font-mono text-xs text-text-dim">{formatFecha(p.suscripcion_vence)}</td>
                  <td className="py-3.5 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => accionar(p.id, "activar")}
                        disabled={loadingId === p.id}
                        className="cursor-pointer rounded-sm border border-line-strong px-3 py-1.5 text-xs font-semibold text-navy transition-colors hover:border-navy disabled:cursor-wait disabled:opacity-50"
                      >
                        {activa ? "Extender +1 mes" : "Activar 1 mes"}
                      </button>
                      {activa && (
                        <button
                          onClick={() => accionar(p.id, "cancelar")}
                          disabled={loadingId === p.id}
                          className="cursor-pointer rounded-sm border border-line-strong px-3 py-1.5 text-xs font-semibold text-orange transition-colors hover:border-orange disabled:cursor-wait disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th className={`pb-3 text-[11px] font-medium tracking-wide text-text-dim uppercase ${align === "right" ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}
