import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";
import { HexIcon } from "@/components/HexIcon";
import { CatalogSection } from "@/components/catalog/CatalogSection";
import { getDisenosPublicados } from "@/lib/supabase/queries";
import { disenosDeEjemplo } from "@/lib/seed-data";

export default async function Home() {
  const disenos = await getDisenosPublicados();
  const catalogo = disenos.length > 0 ? disenos : disenosDeEjemplo;

  return (
    <>
      <PublicNav />

      <section className="relative overflow-hidden border-b border-line py-25 pb-29">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-8 md:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="mb-4.5 block font-mono text-xs font-bold tracking-widest text-orange uppercase">
              Archivos listos para sublimación · .RAR
            </span>
            <h1 className="font-display mb-5.5 text-[42px] leading-tight text-navy sm:text-[56px]">
              Diseños que
              <br />
              visten <span className="text-orange">equipos</span>
            </h1>
            <p className="mb-8 max-w-115 text-[17px] leading-relaxed text-text-dim">
              Camisetas, kits de básquet, vóley y más — listos en AI, PSD y PDF, empacados en un solo
              archivo. Descargá gratis o accedé a los diseños PRO.
            </p>
            <div className="flex flex-wrap gap-3.5">
              <Link
                href="#catalogo"
                className="inline-flex items-center gap-2 rounded-[3px] bg-orange px-6.5 py-4 text-[15px] font-bold text-white transition-all hover:gap-3 hover:bg-orange-2"
              >
                Ver catálogo →
              </Link>
              <Link
                href="#vender"
                className="rounded-[3px] border-1.5 border-line-strong bg-white px-6.5 py-4 text-[15px] font-semibold text-navy transition-colors hover:border-navy hover:bg-paper"
              >
                Vender mis diseños
              </Link>
            </div>
          </div>

          <div className="relative rounded-lg border border-line bg-white p-7 shadow-[0_24px_48px_rgba(0,47,89,0.08)]">
            <div className="mb-5 flex items-start justify-between">
              <div className="font-mono text-[11px] text-text-dim">KIT-0142 · LOCAL</div>
              <span className="rounded-sm bg-navy/8 px-2.5 py-1.5 font-mono text-[11px] font-bold text-navy uppercase">
                Gratis
              </span>
            </div>
            <div className="relative mb-4.5 flex h-50 items-center justify-center rounded-md border border-dashed border-line-strong bg-paper">
              <HexIcon className="h-24 w-24" />
              <span className="absolute bottom-3 font-mono text-[10px] tracking-wide text-text-dim uppercase">
                Vista previa del diseño
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 border-t border-line pt-4">
              <Spec label="Deporte" value="Fútbol 11" />
              <Spec label="Formato" value=".RAR · AI/PSD" mono />
              <Spec label="Resolución" value="300 DPI" />
              <Spec label="Precio" value="Gratis" mono />
            </div>
          </div>
        </div>
      </section>

      <CatalogSection disenos={catalogo} />

      <section className="border-t border-line py-22" id="como-funciona">
        <div className="mx-auto max-w-6xl px-8">
          <h2 className="font-display mb-11 text-[32px] leading-tight text-navy">
            Cómo
            <br />
            funciona
          </h2>
          <div className="grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-3">
            <HowItem numero="01" titulo="Elegís el diseño">
              Filtrá por deporte o formato. Cada ficha muestra el detalle del archivo antes de descargar.
            </HowItem>
            <HowItem numero="02" titulo="Elegís gratis o PRO">
              La mayoría del catálogo es gratuito. Los diseños marcados <b>PRO</b> son pagos y se compran al
              instante.
            </HowItem>
            <HowItem numero="03" titulo="Descargás el .RAR">
              El link de descarga se habilita al instante y el archivo queda disponible en tu cuenta.
            </HowItem>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-t border-line bg-navy py-20" id="vender">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-10 px-8 md:flex-row md:items-center">
          <div>
            <h2 className="font-display max-w-120 text-[30px] leading-tight text-white">
              ¿Diseñás kits deportivos?
            </h2>
            <p className="mt-3 max-w-110 text-[15px] text-white/70">
              Subí tus archivos y sumá tu trabajo al catálogo. La venta con comisión llega pronto.
            </p>
          </div>
          <Link
            href="/registro"
            className="inline-flex items-center gap-2 rounded-[3px] bg-orange px-6.5 py-4 text-[15px] font-bold text-white transition-all hover:gap-3 hover:bg-orange-2"
          >
            Empezar a vender →
          </Link>
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
            <Link href="#" className="text-[13px] text-text-dim hover:text-navy">
              Soporte
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}

function Spec({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="mb-0.5 text-[10px] tracking-wide text-text-dim uppercase">{label}</div>
      <div className={`text-[13px] font-semibold text-navy ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function HowItem({ numero, titulo, children }: { numero: string; titulo: string; children: React.ReactNode }) {
  return (
    <div className="bg-white px-7 py-8">
      <span className="mb-3.5 block font-mono text-xs font-bold text-orange">{numero}</span>
      <h4 className="mb-2.5 text-[17px] text-navy">{titulo}</h4>
      <p className="text-sm leading-relaxed text-text-dim">{children}</p>
    </div>
  );
}
