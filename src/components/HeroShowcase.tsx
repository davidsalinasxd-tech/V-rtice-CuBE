"use client";

import { useState } from "react";
import { HexIcon } from "@/components/HexIcon";
import { codigoDeDiseno } from "@/lib/codigo";
import type { Diseno } from "@/lib/types/database";

function formatGs(precio: number) {
  return `Gs. ${precio.toLocaleString("es-PY")}`;
}

type Tab = "novedad" | "descargado";

export function HeroShowcase({ novedad, masDescargado }: { novedad: Diseno; masDescargado: Diseno }) {
  const [tab, setTab] = useState<Tab>("novedad");
  const diseno = tab === "novedad" ? novedad : masDescargado;
  const codigo = codigoDeDiseno(diseno.id);

  return (
    <div className="relative rounded-lg border border-line bg-white p-7 shadow-[0_24px_48px_rgba(0,47,89,0.08)]">
      <div className="mb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTab("novedad")}
          className={`cursor-pointer rounded-full border px-3.5 py-1.5 font-mono text-[11px] font-bold tracking-wide uppercase transition-colors ${
            tab === "novedad"
              ? "border-orange bg-orange text-white"
              : "border-line-strong bg-paper text-text-dim hover:border-navy hover:text-navy"
          }`}
        >
          Novedad
        </button>
        <button
          type="button"
          onClick={() => setTab("descargado")}
          className={`cursor-pointer rounded-full border px-3.5 py-1.5 font-mono text-[11px] font-bold tracking-wide uppercase transition-colors ${
            tab === "descargado"
              ? "border-orange bg-orange text-white"
              : "border-line-strong bg-paper text-text-dim hover:border-navy hover:text-navy"
          }`}
        >
          Más descargado
        </button>
      </div>

      <div className="mb-5 flex items-start justify-between">
        <div className="font-mono text-[11px] text-text-dim">
          {codigo} · {diseno.deporte.toUpperCase()}
        </div>
        <span className="rounded-sm bg-navy/8 px-2.5 py-1.5 font-mono text-[11px] font-bold text-navy uppercase">
          {diseno.es_gratis ? "Gratis" : diseno.es_pro ? "Pro" : "Pago"}
        </span>
      </div>

      <div className="relative mb-4.5 flex h-50 items-center justify-center overflow-hidden rounded-md border border-dashed border-line-strong bg-paper">
        {diseno.imagen_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={diseno.imagen_url} alt={diseno.nombre} className="h-full w-full object-contain" />
        ) : (
          <>
            <HexIcon className="h-24 w-24" />
            <span className="absolute bottom-3 font-mono text-[10px] tracking-wide text-text-dim uppercase">
              {diseno.nombre}
            </span>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2.5 border-t border-line pt-4">
        <Spec label="Deporte" value={diseno.deporte} />
        <Spec label="Formato" value={diseno.formato} mono />
        <Spec label="Nombre" value={diseno.nombre} />
        <Spec label="Precio" value={diseno.es_gratis ? "Gratis" : formatGs(diseno.precio)} mono />
      </div>
    </div>
  );
}

function Spec({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="mb-0.5 text-[10px] tracking-wide text-text-dim uppercase">{label}</div>
      <div className={`truncate text-[13px] font-semibold text-navy ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
