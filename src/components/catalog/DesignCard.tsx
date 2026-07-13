import Link from "next/link";
import { HexIcon } from "@/components/HexIcon";
import { codigoDeDiseno } from "@/lib/codigo";
import type { Diseno } from "@/lib/types/database";

function formatGs(precio: number) {
  return `Gs. ${precio.toLocaleString("es-PY")}`;
}

export function DesignCard({ diseno, index }: { diseno: Diseno; index: number }) {
  const codigo = codigoDeDiseno(diseno.id);
  const esGratis = diseno.es_gratis;

  return (
    <Link
      href={`/producto/${diseno.id}`}
      className={`group relative block bg-white px-5.5 pt-6.5 pb-5.5 transition-all duration-250 hover:-translate-y-1.5 hover:shadow-[0_18px_32px_rgba(0,47,89,0.12)] ${
        diseno.es_pro
          ? "border-1.5 border-transparent [background:linear-gradient(white,white)_padding-box,linear-gradient(135deg,var(--color-orange)_0%,var(--color-navy)_100%)_border-box] hover:shadow-[0_22px_40px_rgba(254,102,1,0.18)]"
          : ""
      }`}
    >
      {diseno.es_pro && (
        <span className="absolute top-0 right-5.5 rounded-b bg-orange px-2 py-1 font-mono text-[9px] font-bold tracking-wider text-white">
          DESTACADO
        </span>
      )}
      <div className="mb-4 flex items-start justify-between">
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

      <div className="mb-4 flex h-30 items-center justify-center overflow-hidden rounded-md border border-line bg-paper">
        {diseno.imagen_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={diseno.imagen_url} alt={diseno.nombre} className="h-full w-full object-cover" />
        ) : (
          <HexIcon className="h-13 w-13 transition-transform duration-300 group-hover:scale-105" />
        )}
      </div>

      <span className="mb-0.5 block font-mono text-[10px] text-text-dim">{codigo}</span>
      <h3 className="mb-1 text-[15px] font-semibold text-navy">{diseno.nombre}</h3>
      <div className="mb-3.5 text-xs text-text-dim">
        {diseno.deporte}
        {diseno.es_oficial ? " · Diseño oficial Vértice Cube" : ` · ${diseno.formato}`}
      </div>

      <div className="flex items-center justify-between border-t border-line pt-3.5">
        <span className="font-mono text-[15px] font-bold text-navy">
          {esGratis ? "Gratis" : formatGs(diseno.precio)}
        </span>
        <span className="rounded-[3px] border border-line-strong px-3 py-1.5 text-xs font-semibold text-navy transition-colors group-hover:border-orange group-hover:bg-orange group-hover:text-white">
          {esGratis ? "Descargar" : "Comprar"}
        </span>
      </div>
    </Link>
  );
}
