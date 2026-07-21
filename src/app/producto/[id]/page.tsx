import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicNav } from "@/components/PublicNav";
import { HexIcon } from "@/components/HexIcon";
import { DownloadButton } from "@/components/catalog/DownloadButton";
import { codigoDeDiseno } from "@/lib/codigo";
import { getDisenoPublicadoPorId } from "@/lib/supabase/queries";

export default async function ProductoPage(props: PageProps<"/producto/[id]">) {
  const { id } = await props.params;
  const diseno = await getDisenoPublicadoPorId(id);

  if (!diseno) notFound();

  const codigo = codigoDeDiseno(diseno.id);

  return (
    <>
      <PublicNav />

      <div className="mx-auto max-w-6xl px-8 pt-5.5 text-sm text-text-dim">
        <Link href="/#catalogo" className="hover:text-navy">
          Catálogo
        </Link>{" "}
        / <span className="text-navy">{diseno.deporte}</span>
      </div>

      <section className="mx-auto grid max-w-6xl grid-cols-1 items-start gap-14 px-8 py-9 md:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-line bg-white p-8 shadow-[0_20px_40px_rgba(0,47,89,0.06)]">
          <div className="relative flex h-90 items-center justify-center overflow-hidden rounded-md border border-dashed border-line-strong bg-paper">
            {diseno.imagen_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={diseno.imagen_url} alt={diseno.nombre} className="h-full w-full object-contain" />
            ) : (
              <>
                <HexIcon className="h-47.5 w-47.5" />
                <span className="absolute bottom-4 font-mono text-[11px] tracking-wide text-text-dim uppercase">
                  Vista previa del diseño
                </span>
              </>
            )}
          </div>
        </div>

        <div>
          <div className="mb-3.5">
            <span className="rounded-sm bg-navy/8 px-2.5 py-1.5 font-mono text-[11px] font-bold text-navy uppercase">
              {diseno.es_gratis ? "Gratis" : "PRO"}
            </span>
          </div>
          <h1 className="font-display mb-2.5 text-[32px] leading-tight text-navy">{diseno.nombre}</h1>
          <div className="mb-6.5 text-[13px] text-text-dim">
            {codigo} · {diseno.es_oficial ? "Diseño oficial Vértice Cube" : "Vendedor externo"}
          </div>

          <div className="mb-7 grid grid-cols-3 gap-px border border-line bg-line">
            <SpecCell label="Deporte" value={diseno.deporte} />
            <SpecCell label="Formato" value=".RAR" mono />
            <SpecCell label="Incluye" value={diseno.formato} />
          </div>

          <div className="mb-7 rounded-lg border-1.5 border-line-strong bg-white p-6">
            <div className="mb-4.5 flex items-center justify-between">
              <span className="text-[13px] text-text-dim">Precio</span>
              <span className="font-mono text-2xl font-bold text-navy">
                {diseno.es_gratis ? "Gratis" : `Gs. ${diseno.precio.toLocaleString("es-PY")}`}
              </span>
            </div>
            <DownloadButton disenoId={diseno.id} esGratis={diseno.es_gratis} />
          </div>

          <div>
            <h3 className="mb-2.5 text-[15px] text-navy">Descripción</h3>
            <p className="mb-5 text-sm leading-relaxed text-text-dim">
              Kit completo listo para sublimación. Incluye guía de colores y capas separadas para ajustar
              sponsors o números.
            </p>
            <h3 className="mb-2.5 text-[15px] text-navy">Este archivo incluye</h3>
            <ul className="flex flex-col gap-2">
              {diseno.formato.split("+").map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-[13px] text-ink before:h-1.25 before:w-1.25 before:bg-orange">
                  Archivo {f.trim()}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-white py-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8">
          <span className="font-mono text-xs text-text-dim">VÉRTICE CUBE © 2026</span>
          <div className="flex gap-6">
            <Link href="#" className="text-[13px] text-text-dim hover:text-navy">
              Términos
            </Link>
            <Link href="#" className="text-[13px] text-text-dim hover:text-navy">
              Contacto
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}

function SpecCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-white px-4 py-3.5">
      <div className="mb-1 text-[10px] tracking-wide text-text-dim uppercase">{label}</div>
      <div className={`text-sm font-semibold text-navy ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
