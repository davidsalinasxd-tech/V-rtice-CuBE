"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DisenoConVendedor } from "@/lib/supabase/admin-queries";

const ESTADO_LABEL = {
  publicado: "Publicado",
  revision: "En revisión",
  rechazado: "Rechazado",
} as const;

export function DisenosPanel({ disenos }: { disenos: DisenoConVendedor[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtrados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return disenos;
    return disenos.filter((d) => `${d.nombre} ${d.vendedorNombre} ${d.deporte}`.toLowerCase().includes(q));
  }, [disenos, query]);

  async function eliminar(diseno: DisenoConVendedor) {
    if (!confirm(`¿Borrar "${diseno.nombre}" definitivamente? Esto borra también sus archivos de R2 y no se puede deshacer.`)) {
      return;
    }
    setLoadingId(diseno.id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/disenos/${diseno.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo borrar el diseño.");
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
        placeholder="Buscar por nombre, vendedor o deporte..."
        className="mb-5 w-full max-w-90 rounded-[3px] border border-line-strong bg-paper px-3.5 py-2.5 text-sm focus:border-orange focus:bg-white focus:outline-none"
      />

      {error && <p className="mb-4 text-[13px] text-orange">{error}</p>}

      {filtrados.length === 0 ? (
        <p className="text-sm text-text-dim">No hay diseños que coincidan.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <Th>Diseño</Th>
              <Th>Vendedor</Th>
              <Th>Estado</Th>
              <Th align="right">Precio</Th>
              <Th align="right">Acciones</Th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((d) => (
              <tr key={d.id} className="border-t border-line">
                <td className="py-3.5 pr-3">
                  <div className="text-sm text-ink">{d.nombre}</div>
                  <div className="text-[11px] text-text-dim">
                    {d.deporte}
                    {d.es_oficial ? " · Oficial" : ""}
                  </div>
                </td>
                <td className="py-3.5 pr-3 text-sm text-text-dim">{d.vendedorNombre}</td>
                <td className="py-3.5 pr-3">
                  <span
                    className={`rounded-sm px-2.25 py-1 text-[11px] tracking-wide uppercase ${
                      d.estado === "publicado"
                        ? "bg-navy/8 text-navy-2"
                        : d.estado === "revision"
                          ? "bg-orange/15 text-orange"
                          : "bg-orange/10 text-text-dim"
                    }`}
                  >
                    {ESTADO_LABEL[d.estado]}
                  </span>
                </td>
                <td className="py-3.5 text-right font-mono text-sm">
                  {d.es_gratis ? "Gratis" : `Gs. ${d.precio.toLocaleString("es-PY")}`}
                </td>
                <td className="py-3.5 text-right">
                  <button
                    onClick={() => eliminar(d)}
                    disabled={loadingId === d.id}
                    className="cursor-pointer rounded-sm border border-line-strong px-3 py-1.5 text-xs font-semibold text-orange transition-colors hover:border-orange disabled:cursor-wait disabled:opacity-50"
                  >
                    {loadingId === d.id ? "Borrando…" : "Borrar"}
                  </button>
                </td>
              </tr>
            ))}
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
