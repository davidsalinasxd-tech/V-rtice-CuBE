import Link from "next/link";
import { HexIcon } from "@/components/HexIcon";
import { codigoDeDiseno } from "@/lib/codigo";
import type { Diseno } from "@/lib/types/database";

function formatGs(precio: number) {
  return `Gs. ${precio.toLocaleString("es-PY")}`;
}

export function DesignCard({
  diseno,
  index,
  vendedorNombre,
  variante = "claro",
}: {
  diseno: Diseno;
  index: number;
  vendedorNombre?: string;
  variante?: "claro" | "oscuro";
}) {
  const codigo = codigoDeDiseno(diseno.id);
  const esGratis = diseno.es_gratis;

  if (variante === "oscuro") {
    return (
      <div
        data-reveal=""
        data-reveal-delay={(index % 4) * 70}
        className={`group relative flex flex-col rounded-2xl px-5.5 pt-6.5 pb-5.5 text-white transition-[transform,border-color,box-shadow] duration-300 ease-[cubic-bezier(.16,1,.3,1)] hover:-translate-y-1.5 hover:border-orange/75 hover:shadow-[0_0_0_1px_rgba(254,102,1,.3),0_22px_40px_rgba(0,0,0,.45),0_12px_32px_rgba(254,102,1,.14)] ${
          diseno.es_pro
            ? "border border-transparent [background:linear-gradient(#08111f,#08111f)_padding-box,linear-gradient(135deg,#FE6601_0%,#0a3e68_100%)_border-box]"
            : "glass-card"
        }`}
      >
        <Link href={`/producto/${diseno.id}`} className="absolute inset-0 rounded-2xl" aria-label={diseno.nombre} />

        {diseno.es_pro && (
          <span className="pointer-events-none absolute -top-px right-5.5 rounded-b-md bg-orange px-2 py-1 font-mono text-[9px] font-bold tracking-[.1em] text-[#0a111d]">
            DESTACADO
          </span>
        )}
        <div className="pointer-events-none mb-4 flex items-start justify-between">
          <span aria-hidden="true" className="font-display text-[34px] leading-none font-bold text-white/16">
            {String(index + 1).padStart(2, "0")}
          </span>
          {diseno.es_pro ? (
            <span className="mt-3 inline-flex items-center gap-1 rounded-[5px] border border-[rgba(120,170,230,.25)] bg-gradient-to-r from-navy to-navy-2 px-2 py-1 font-mono text-[10px] font-bold tracking-[.06em] text-white uppercase before:content-['★'] before:text-[9px] before:text-orange-2">
              Pro
            </span>
          ) : esGratis ? (
            <span className="rounded-[5px] border border-white/10 bg-white/8 px-2 py-1 font-mono text-[10px] font-bold tracking-[.06em] text-[#e6edf5] uppercase">
              Gratis
            </span>
          ) : (
            <span className="rounded-[5px] border border-orange/30 bg-orange/15 px-2 py-1 font-mono text-[10px] font-bold tracking-[.06em] text-orange-2 uppercase">
              Pago
            </span>
          )}
        </div>

        <div className="pointer-events-none mb-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-[10px] bg-paper">
          {diseno.imagen_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={diseno.imagen_url}
              alt={diseno.nombre}
              loading="lazy"
              className="h-full w-full object-contain"
            />
          ) : (
            <HexIcon className="h-13 w-13 transition-transform duration-300 group-hover:scale-105" />
          )}
        </div>

        <span className="pointer-events-none mb-0.75 block font-mono text-[10px] text-on-dark-dim">{codigo}</span>
        <h3 className="pointer-events-none mb-1 text-[15px] leading-[1.35] font-semibold text-white">
          {diseno.nombre}
        </h3>
        <div className="mb-3.5 text-xs text-on-dark-dim">
          <span className="pointer-events-none">{diseno.deporte}</span>
          {diseno.es_oficial ? (
            <span className="pointer-events-none"> · Diseño oficial Vértice Cube</span>
          ) : vendedorNombre ? (
            <>
              <span className="pointer-events-none"> · </span>
              <Link
                href={`/vendedor/${diseno.vendedor_id}`}
                className="relative z-10 hover:text-orange-2 hover:underline"
              >
                {vendedorNombre}
              </Link>
            </>
          ) : (
            <span className="pointer-events-none"> · {diseno.formato}</span>
          )}
        </div>

        <div className="pointer-events-none mt-auto flex items-center justify-between border-t border-white/9 pt-3.5">
          <span className="font-mono text-[15px] font-bold text-white">
            {esGratis ? "Gratis" : formatGs(diseno.precio)}
          </span>
          <span className="rounded-lg border border-white/16 px-3 py-1.5 text-xs font-semibold text-white transition-colors group-hover:border-orange/70">
            {esGratis ? "Descargar" : "Comprar"}
          </span>
        </div>
        {diseno.es_pro && (
          <div className="pointer-events-none mt-2.5 text-[11px] font-semibold text-orange-2">
            ★ Incluido con la suscripción
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`group relative bg-white px-5.5 pt-6.5 pb-5.5 transition-all duration-250 hover:-translate-y-1.5 hover:shadow-[0_18px_32px_rgba(0,47,89,0.12)] ${
        diseno.es_pro
          ? "border-1.5 border-transparent [background:linear-gradient(white,white)_padding-box,linear-gradient(135deg,var(--color-orange)_0%,var(--color-navy)_100%)_border-box] hover:shadow-[0_22px_40px_rgba(254,102,1,0.18)]"
          : ""
      }`}
    >
      <Link href={`/producto/${diseno.id}`} className="absolute inset-0" aria-label={diseno.nombre} />

      {diseno.es_pro && (
        <span className="pointer-events-none absolute top-0 right-5.5 rounded-b bg-orange px-2 py-1 font-mono text-[9px] font-bold tracking-wider text-white">
          DESTACADO
        </span>
      )}
      <div className="pointer-events-none mb-4 flex items-start justify-between">
        <span className="font-display text-[34px] leading-none font-bold text-line-strong transition-colors group-hover:text-orange">
          {String(index + 1).padStart(2, "0")}
        </span>
        {diseno.es_pro ? (
          <span className="inline-flex items-center gap-1 rounded-sm bg-gradient-to-r from-navy to-navy-2 px-2 py-1 font-mono text-[10px] font-bold tracking-wide text-white uppercase before:content-['★'] before:text-[9px] before:text-orange">
            Pro
          </span>
        ) : esGratis ? (
          <span className="rounded-sm bg-navy/8 px-2 py-1 font-mono text-[10px] font-bold tracking-wide text-navy uppercase">
            Gratis
          </span>
        ) : (
          <span className="rounded-sm bg-orange/12 px-2 py-1 font-mono text-[10px] font-bold tracking-wide text-orange uppercase">
            Pago
          </span>
        )}
      </div>

      <div className="pointer-events-none mb-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-md border border-line bg-paper">
        {diseno.imagen_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={diseno.imagen_url} alt={diseno.nombre} className="h-full w-full object-contain" />
        ) : (
          <HexIcon className="h-13 w-13 transition-transform duration-300 group-hover:scale-105" />
        )}
      </div>

      <span className="pointer-events-none mb-0.5 block font-mono text-[10px] text-text-dim">{codigo}</span>
      <h3 className="pointer-events-none mb-1 text-[15px] font-semibold text-navy">{diseno.nombre}</h3>
      <div className="mb-3.5 text-xs text-text-dim">
        <span className="pointer-events-none">{diseno.deporte}</span>
        {diseno.es_oficial ? (
          <span className="pointer-events-none"> · Diseño oficial Vértice Cube</span>
        ) : vendedorNombre ? (
          <>
            <span className="pointer-events-none"> · </span>
            <Link
              href={`/vendedor/${diseno.vendedor_id}`}
              className="relative z-10 hover:text-orange hover:underline"
            >
              {vendedorNombre}
            </Link>
          </>
        ) : (
          <span className="pointer-events-none"> · {diseno.formato}</span>
        )}
      </div>

      <div className="pointer-events-none flex items-center justify-between border-t border-line pt-3.5">
        <span className="font-mono text-[15px] font-bold text-navy">
          {esGratis ? "Gratis" : formatGs(diseno.precio)}
        </span>
        <span className="rounded-[3px] border border-line-strong px-3 py-1.5 text-xs font-semibold text-navy transition-colors group-hover:border-orange group-hover:bg-orange group-hover:text-white">
          {esGratis ? "Descargar" : "Comprar"}
        </span>
      </div>
      {diseno.es_pro && (
        <div className="pointer-events-none mt-2.5 text-[11px] font-semibold text-orange">
          ★ Incluido con la suscripción
        </div>
      )}
    </div>
  );
}
