import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";
import { HeroShowcase } from "@/components/HeroShowcase";
import { CatalogSection } from "@/components/catalog/CatalogSection";
import { getDisenosPublicados, getDisenoMasDescargado } from "@/lib/supabase/queries";
import { disenosDeEjemplo } from "@/lib/seed-data";
import { TELEGRAM_URL } from "@/lib/telegram";

export default async function Home() {
  const disenos = await getDisenosPublicados();
  const catalogo = disenos.length > 0 ? disenos : disenosDeEjemplo;

  const novedad = [...catalogo].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0];
  const masDescargado =
    (disenos.length > 0 ? await getDisenoMasDescargado() : null) ??
    catalogo.find((d) => d.id !== novedad.id) ??
    novedad;

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

          <HeroShowcase novedad={novedad} masDescargado={masDescargado} />
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
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-text-dim hover:text-navy"
            >
              Contacto / Soporte
            </a>
          </div>
        </div>
      </footer>
    </>
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
