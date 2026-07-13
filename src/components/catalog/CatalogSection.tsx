"use client";

import { useMemo, useState } from "react";
import { DesignCard } from "./DesignCard";
import { codigoDeDiseno } from "@/lib/codigo";
import type { Diseno } from "@/lib/types/database";

const PAGE_SIZE = 20;

const FILTROS = [
  { id: "todos", label: "Todos" },
  { id: "pro", label: "★ Pro" },
  { id: "gratis", label: "Gratis" },
  { id: "futbol", label: "Fútbol" },
  { id: "basquet", label: "Básquet" },
  { id: "voley", label: "Vóley" },
] as const;

function deporteSlug(deporte: string) {
  const d = deporte.toLowerCase();
  if (d.includes("fútbol") || d.includes("futbol")) return "futbol";
  if (d.includes("básquet") || d.includes("basquet")) return "basquet";
  if (d.includes("vóley") || d.includes("voley")) return "voley";
  return "otro";
}

export function CatalogSection({ disenos }: { disenos: Diseno[] }) {
  const [query, setQuery] = useState("");
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["id"]>("todos");
  const [page, setPage] = useState(1);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return disenos.filter((d) => {
      const sport = deporteSlug(d.deporte);
      let matchesFilter = true;
      if (filtro === "pro") matchesFilter = d.es_pro;
      else if (filtro === "gratis") matchesFilter = d.es_gratis;
      else if (["futbol", "basquet", "voley"].includes(filtro)) matchesFilter = sport === filtro;

      const haystack = `${d.nombre} ${codigoDeDiseno(d.id)} ${d.deporte}`.toLowerCase();
      const matchesQuery = q === "" || haystack.includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [disenos, query, filtro]);

  const isBrowsing = query.trim() === "" && filtro === "todos";
  const totalPages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const shown = isBrowsing ? matches.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE) : matches;

  return (
    <section className="section border-t border-line bg-white py-22" id="catalogo">
      <div className="mx-auto max-w-6xl px-8">
        <div className="mb-11 flex flex-wrap items-end justify-between gap-6">
          <h2 className="font-display text-[32px] leading-tight text-navy">
            Catálogo
            <br />
            reciente
          </h2>
          <p className="max-w-85 text-[15px] text-text-dim">
            Nuevos kits cada semana. Filtra por deporte, club o formato de archivo.
          </p>
        </div>

        <div className="mb-7">
          <div className="relative mb-4.5">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="pointer-events-none absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2"
            >
              <circle cx="11" cy="11" r="7" stroke="var(--color-text-dim)" strokeWidth="2" />
              <path d="M20 20L16.5 16.5" stroke="var(--color-text-dim)" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nombre, código (KIT-0142) o etiqueta..."
              className="w-full rounded-md border-1.5 border-line-strong bg-paper py-3.5 pr-4 pl-11 text-[15px] transition-colors focus:border-orange focus:bg-white focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setFiltro(f.id);
                  setPage(1);
                }}
                className={`cursor-pointer rounded-full border px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${
                  filtro === f.id
                    ? f.id === "pro"
                      ? "border-orange bg-orange text-white"
                      : "border-navy bg-navy text-white"
                    : "border-line-strong bg-paper text-text-dim hover:border-navy hover:text-navy"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
          {shown.length === 0 ? (
            <div className="col-span-full bg-white px-5 py-15 text-center text-sm text-text-dim">
              No encontramos diseños que coincidan. Probá con otra palabra o quitá el filtro.
            </div>
          ) : (
            shown.map((d, i) => <DesignCard key={d.id} diseno={d} index={i} />)
          )}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3.5">
          <span className="font-mono text-xs text-text-dim">
            {isBrowsing
              ? `${matches.length} diseños en total`
              : `${matches.length} resultado${matches.length === 1 ? "" : "s"}`}
          </span>
          {isBrowsing && totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                className="min-w-9.5 cursor-pointer rounded-md border border-transparent bg-transparent px-1.5 py-2 font-mono text-sm text-text-dim hover:text-navy disabled:cursor-not-allowed disabled:opacity-35"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-9.5 min-w-9.5 cursor-pointer rounded-md border px-1.5 font-mono text-sm font-semibold ${
                    p === currentPage
                      ? "border-navy bg-navy text-white"
                      : "border-line-strong bg-white text-navy hover:border-navy"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
                className="min-w-9.5 cursor-pointer rounded-md border border-transparent bg-transparent px-1.5 py-2 font-mono text-sm text-text-dim hover:text-navy disabled:cursor-not-allowed disabled:opacity-35"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
