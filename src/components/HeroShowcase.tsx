"use client";

import { useState } from "react";
import { HexIcon } from "@/components/HexIcon";
import { codigoDeDiseno } from "@/lib/codigo";
import type { Diseno } from "@/lib/types/database";

function formatGs(precio: number) {
  return `Gs. ${precio.toLocaleString("es-PY")}`;
}

type Tab = "novedad" | "descargado";

const TABS: { id: Tab; label: string }[] = [
  { id: "novedad", label: "Novedad" },
  { id: "descargado", label: "Más descargado" },
];

export function HeroShowcase({ novedad, masDescargado }: { novedad: Diseno; masDescargado: Diseno }) {
  const [tab, setTab] = useState<Tab>("novedad");
  const diseno = tab === "novedad" ? novedad : masDescargado;
  const codigo = codigoDeDiseno(diseno.id);

  return (
    <div data-enter="panel" className="hero-panel-scene mx-auto w-full max-w-115 min-w-0">
      <div className="hero-panel relative rounded-[20px] p-6.5">
        <div className="mb-5 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`cursor-pointer rounded-full border px-3.5 py-1.75 font-mono text-[11px] font-bold tracking-[.06em] whitespace-nowrap uppercase transition-colors ${
                tab === t.id
                  ? "border-orange bg-orange text-[#0a111d]"
                  : "border-white/14 bg-white/4 text-[#b5c3d4] hover:border-orange-2/70 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mb-4.5 flex items-start justify-between gap-3">
          <div className="font-mono text-[11px] text-on-dark-dim">
            {codigo} · {diseno.deporte.toUpperCase()}
          </div>
          <span className="rounded-md border border-white/10 bg-white/8 px-2.5 py-1.25 font-mono text-[11px] font-bold text-[#e6edf5] uppercase">
            {diseno.es_gratis ? "Gratis" : diseno.es_pro ? "Pro" : "Pago"}
          </span>
        </div>

        <div className="relative mb-4.5 flex h-55 items-center justify-center overflow-hidden rounded-xl bg-paper shadow-[inset_0_0_0_1px_rgba(0,47,89,0.1)]">
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

        <div className="grid grid-cols-2 gap-x-3.5 gap-y-3 border-t border-white/9 pt-4">
          <Spec label="Deporte" value={diseno.deporte} />
          <Spec label="Formato" value={diseno.formato} mono />
          <Spec label="Nombre" value={diseno.nombre} />
          <Spec
            label="Precio"
            value={diseno.es_gratis ? "Gratis" : formatGs(diseno.precio)}
            mono
            acento
          />
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value, mono, acento }: { label: string; value: string; mono?: boolean; acento?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="mb-0.75 text-[10px] tracking-[.08em] text-on-dark-dim uppercase">{label}</div>
      <div
        className={`truncate text-[13px] ${mono ? "font-mono font-bold" : "font-semibold"} ${
          acento ? "text-orange-2" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
