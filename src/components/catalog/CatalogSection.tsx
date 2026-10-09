"use client";

import { useMemo, useState } from "react";
import { DesignCard } from "./DesignCard";
import { codigoDeDiseno } from "@/lib/codigo";
import type { Diseno } from "@/lib/types/database";

const PAGE_SIZE = 20;
const PRO_POR_PAGINA = 4;

/** Reparte los diseños PRO cada ~5 lugares en vez de amontonarlos todos al principio. */
function intercalarPro(disenos: Diseno[]): Diseno[] {
  const pro = disenos.filter((d) => d.es_pro);
  const resto = disenos.filter((d) => !d.es_pro);
  if (pro.length === 0 || resto.length === 0) return disenos;

  const espaciado = Math.floor(PAGE_SIZE / PRO_POR_PAGINA);
  const resultado: Diseno[] = [];
  let pi = 0;
  let ri = 0;

  while (pi < pro.length || ri < resto.length) {
    const turnoDePro = resultado.length % espaciado === 0;
    if (turnoDePro && pi < pro.length) {
      resultado.push(pro[pi++]);
    } else if (ri < resto.length) {
      resultado.push(resto[ri++]);
    } else {
      resultado.push(pro[pi++]);
    }
  }
  return resultado;
}

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

type Variante = "claro" | "oscuro";

/** Clases de cada variante. La clara es el aspecto de siempre (también lo usa el perfil público de vendedor). */
const ESTILOS: Record<Variante, Record<string, string>> = {
  claro: {
    seccion: "section border-t border-line bg-white py-22",
    titulo: "font-display text-[32px] leading-tight text-navy",
    subtitulo: "max-w-85 text-[15px] text-text-dim",
    icono: "text-text-dim",
    input:
      "w-full rounded-md border-1.5 border-line-strong bg-paper py-3.5 pr-4 pl-11 text-[15px] transition-colors focus:border-orange focus:bg-white focus:outline-none",
    chip: "cursor-pointer rounded-full border px-3.5 py-2 text-[12.5px] font-semibold transition-colors",
    chipPro: "border-orange bg-orange text-white",
    chipActivo: "border-navy bg-navy text-white",
    chipInactivo: "border-line-strong bg-paper text-text-dim hover:border-navy hover:text-navy",
    grilla: "grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4",
    vacio: "col-span-full bg-white px-5 py-15 text-center text-sm text-text-dim",
    contador: "font-mono text-xs text-text-dim",
    flecha:
      "min-w-9.5 cursor-pointer rounded-md border border-transparent bg-transparent px-1.5 py-2 font-mono text-sm text-text-dim hover:text-navy disabled:cursor-not-allowed disabled:opacity-35",
    pagina: "h-9.5 min-w-9.5 cursor-pointer rounded-md border px-1.5 font-mono text-sm font-semibold",
    paginaActiva: "border-navy bg-navy text-white",
    paginaInactiva: "border-line-strong bg-white text-navy hover:border-navy",
  },
  oscuro: {
    seccion: "py-[clamp(64px,8vw,104px)]",
    titulo:
      "font-display text-[length:clamp(34px,4vw,48px)] leading-[1.05] font-semibold tracking-[-.02em] text-white",
    subtitulo: "max-w-85 text-[15px] leading-relaxed text-on-dark-dim",
    icono: "text-on-dark-dim",
    input:
      "w-full rounded-xl border border-white/12 bg-white/4 py-3.75 pr-4 pl-11.5 text-[15px] text-white transition-[border-color,background-color,box-shadow] focus:border-orange focus:bg-white/7 focus:shadow-[0_0_0_3px_rgba(254,102,1,.15)] focus:outline-none",
    chip: "cursor-pointer rounded-full border px-3.75 py-2.25 text-[12.5px] font-semibold transition-colors",
    chipPro: "border-orange bg-orange text-[#0a111d]",
    chipActivo: "border-[rgba(120,170,230,.45)] bg-navy text-white",
    chipInactivo: "border-white/12 bg-white/4 text-[#b5c3d4] hover:border-white/35 hover:text-white",
    grilla: "grid grid-cols-[repeat(auto-fill,minmax(min(100%,240px),1fr))] gap-3.5",
    vacio:
      "glass-card col-span-full rounded-2xl px-5 py-15 text-center text-sm text-on-dark-dim",
    contador: "font-mono text-xs text-on-dark-dim",
    flecha:
      "min-w-9.5 cursor-pointer rounded-lg border border-transparent bg-transparent px-1.5 py-2 font-mono text-sm text-on-dark-dim hover:text-white disabled:cursor-not-allowed disabled:opacity-35",
    pagina: "h-9.5 min-w-9.5 cursor-pointer rounded-lg border px-1.5 font-mono text-sm font-semibold",
    paginaActiva: "border-[rgba(120,170,230,.45)] bg-navy text-white",
    paginaInactiva: "border-white/12 bg-white/4 text-[#b5c3d4] hover:border-white/35 hover:text-white",
  },
};

export function CatalogSection({
  disenos,
  titulo = (
    <>
      Catálogo
      <br />
      reciente
    </>
  ),
  subtitulo = "Nuevos kits cada semana. Filtra por deporte, club o formato de archivo.",
  vendedorNombres,
  variante = "claro",
}: {
  disenos: Diseno[];
  titulo?: React.ReactNode;
  subtitulo?: string;
  vendedorNombres?: Map<string, string>;
  variante?: Variante;
}) {
  const estilos = ESTILOS[variante];
  const oscuro = variante === "oscuro";
  const [query, setQuery] = useState("");
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]["id"]>("todos");
  const [page, setPage] = useState(1);

  const disenosOrdenados = useMemo(() => intercalarPro(disenos), [disenos]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return disenosOrdenados.filter((d) => {
      const sport = deporteSlug(d.deporte);
      let matchesFilter = true;
      if (filtro === "pro") matchesFilter = d.es_pro;
      else if (filtro === "gratis") matchesFilter = d.es_gratis;
      else if (["futbol", "basquet", "voley"].includes(filtro)) matchesFilter = sport === filtro;

      const haystack = `${d.nombre} ${codigoDeDiseno(d.id)} ${d.deporte}`.toLowerCase();
      const matchesQuery = q === "" || haystack.includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [disenosOrdenados, query, filtro]);

  const isBrowsing = query.trim() === "" && filtro === "todos";
  const totalPages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const shown = isBrowsing ? matches.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE) : matches;

  return (
    <section className={estilos.seccion} id="catalogo">
      <div className={oscuro ? "mx-auto max-w-6xl px-[clamp(20px,3vw,32px)]" : "mx-auto max-w-6xl px-8"}>
        <div
          {...(oscuro ? { "data-reveal": "" } : {})}
          className="mb-11 flex flex-wrap items-end justify-between gap-6"
        >
          <h2 className={estilos.titulo}>{titulo}</h2>
          <p className={estilos.subtitulo}>{subtitulo}</p>
        </div>

        <div {...(oscuro ? { "data-reveal": "" } : {})} className="mb-7">
          <div className="relative mb-4.5">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className={`pointer-events-none absolute top-1/2 left-4 h-4.5 w-4.5 -translate-y-1/2 ${estilos.icono}`}
            >
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M20 20L16.5 16.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nombre, código (KIT-0142) o etiqueta..."
              className={estilos.input}
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
                className={`${estilos.chip} ${
                  filtro === f.id ? (f.id === "pro" ? estilos.chipPro : estilos.chipActivo) : estilos.chipInactivo
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className={estilos.grilla}>
          {shown.length === 0 ? (
            <div className={estilos.vacio}>
              No encontramos diseños que coincidan. Probá con otra palabra o quitá el filtro.
            </div>
          ) : (
            shown.map((d, i) => (
              <DesignCard
                key={d.id}
                diseno={d}
                index={i}
                vendedorNombre={vendedorNombres?.get(d.vendedor_id)}
                variante={variante}
              />
            ))
          )}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3.5">
          <span className={estilos.contador}>
            {isBrowsing
              ? `${matches.length} diseños en total`
              : `${matches.length} resultado${matches.length === 1 ? "" : "s"}`}
          </span>
          {isBrowsing && totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                className={estilos.flecha}
              >
                ‹
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`${estilos.pagina} ${p === currentPage ? estilos.paginaActiva : estilos.paginaInactiva}`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setPage(currentPage + 1)}
                className={estilos.flecha}
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
