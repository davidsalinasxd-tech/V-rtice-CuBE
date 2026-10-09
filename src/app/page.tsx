import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";
import { HeroShowcase } from "@/components/HeroShowcase";
import { CatalogSection } from "@/components/catalog/CatalogSection";
import { DesignsMarquee } from "@/components/catalog/DesignsMarquee";
import { Aurora } from "@/components/hero/Aurora";
import { DesignRing } from "@/components/hero/DesignRing";
import { HeroEntrance } from "@/components/hero/HeroEntrance";
import { ScrollReveal } from "@/components/hero/ScrollReveal";
import { Starfield } from "@/components/hero/Starfield";
import { getDisenosPublicados, getDisenoMasDescargado, getNombresVendedores } from "@/lib/supabase/queries";
import { disenosDeEjemplo } from "@/lib/seed-data";
import { TELEGRAM_URL } from "@/lib/telegram";

export default async function Home() {
  const disenos = await getDisenosPublicados();
  const catalogo = disenos.length > 0 ? disenos : disenosDeEjemplo;
  const vendedorNombres = await getNombresVendedores([
    ...new Set(catalogo.filter((d) => !d.es_oficial).map((d) => d.vendedor_id)),
  ]);

  const novedad = [...catalogo].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )[0];
  const masDescargado =
    (disenos.length > 0 ? await getDisenoMasDescargado() : null) ??
    catalogo.find((d) => d.id !== novedad.id) ??
    novedad;

  // El anillo solo necesita lo mínimo para dibujar cada tarjeta.
  const itemsAnillo = catalogo.slice(0, 16).map((d) => ({ id: d.id, nombre: d.nombre, imagen_url: d.imagen_url }));

  return (
    <div className="theme-space min-h-screen">
      <HeroEntrance />
      <ScrollReveal />

      <section className="relative isolate overflow-hidden md:min-h-240">
        <div className="absolute inset-0 z-0">
          <Aurora />
          <Starfield />
        </div>

        <DesignRing items={itemsAnillo} />

        {/* Velo: garantiza el contraste del texto sobre el anillo. */}
        <div aria-hidden="true" className="hero-veil pointer-events-none absolute inset-0 z-2" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-2 bg-[rgba(2,6,16,.5)] md:hidden" />

        <div className="relative z-3 px-[clamp(12px,3vw,24px)] pt-4">
          <div data-enter="nav">
            <PublicNav variante="oscuro" />
          </div>

          <div data-enter="bar" className="mx-auto mt-3 flex max-w-280 justify-center">
            <Link
              href="/suscripcion"
              className="inline-flex items-center gap-2 rounded-full border border-orange/28 bg-gradient-to-r from-orange/10 to-navy/28 px-4.5 py-2.25 text-center text-[13px] leading-[1.4] font-semibold text-balance text-[#f2f5f9] backdrop-blur-[12px] transition-[border-color] duration-200 hover:border-orange/60 hover:text-white"
            >
              🔥 ¿Cansado de coordinar pago por cada diseño? Hay una forma de tener acceso ilimitado →
            </Link>
          </div>
        </div>

        <div className="relative z-3 mx-auto grid max-w-6xl grid-cols-1 items-center gap-[clamp(40px,5vw,56px)] px-[clamp(20px,3vw,32px)] pt-[clamp(48px,7vw,96px)] pb-[clamp(72px,9vw,120px)] md:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span
              data-enter="eyebrow"
              className="mb-5 block font-mono text-xs font-bold tracking-[.14em] text-orange-2 uppercase"
            >
              Archivos listos para sublimación · .RAR
            </span>
            <h1 className="font-display mb-6 text-[length:clamp(46px,6.2vw,80px)] leading-[1.02] font-semibold tracking-[-.025em] text-white">
              <span data-enter="l1" className="block">
                Diseños que
              </span>{" "}
              <span data-enter="l2" className="block">
                visten{" "}
                <span className="text-orange-2 [text-shadow:0_0_28px_rgba(254,102,1,.45),0_0_2px_rgba(255,124,36,.6)]">
                  equipos
                </span>
              </span>
            </h1>
            <p
              data-enter="lead"
              className="mb-9 max-w-[470px] text-[17px] leading-[1.65] text-pretty text-[#b5c3d4]"
            >
              Camisetas, kits de básquet, vóley y más — listos en AI, PSD y PDF, empacados en un solo
              archivo. Descargá gratis o accedé a los diseños PRO.
            </p>
            <div data-enter="cta" className="flex flex-wrap gap-3.5">
              <Link href="/suscripcion" className="btn-glow">
                Suscribirme →
              </Link>
              <Link href="/vendedor" className="btn-glass">
                Vender mis diseños
              </Link>
            </div>
          </div>

          <HeroShowcase novedad={novedad} masDescargado={masDescargado} />
        </div>
      </section>

      <DesignsMarquee disenos={catalogo.slice(0, 16)} />

      <CatalogSection disenos={catalogo} vendedorNombres={vendedorNombres} variante="oscuro" />

      <section data-reveal="" className="border-t border-white/7 py-10">
        <div className="mx-auto max-w-4xl px-[clamp(20px,3vw,32px)] text-center">
          <p className="text-[13px] leading-[1.7] text-pretty text-[#8fa1b6]">
            En Vértice Cube encontrás diseños vector gratis y PRO para sublimación: kits de fútbol, básquet y
            vóley en formato AI, PSD y PDF, listos para imprimir. Bajá plantillas de camisetas y kits deportivos
            en vector sin costo, o accedé a diseños PRO exclusivos con la suscripción mensual.
          </p>
        </div>
      </section>

      <section className="border-t border-white/7 py-[clamp(64px,8vw,96px)]" id="como-funciona">
        <div className="mx-auto max-w-6xl px-[clamp(20px,3vw,32px)]">
          <h2
            data-reveal=""
            className="font-display mb-11 text-[length:clamp(34px,4vw,48px)] leading-[1.05] font-semibold tracking-[-.02em] text-white"
          >
            Cómo
            <br />
            funciona
          </h2>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-3.5">
            <HowItem numero="01" titulo="Elegís el diseño" retraso={0}>
              Filtrá por deporte o formato. Cada ficha muestra el detalle del archivo antes de descargar.
            </HowItem>
            <HowItem numero="02" titulo="Elegís gratis o PRO" retraso={90}>
              La mayoría del catálogo es gratuito. Los diseños marcados <b>PRO</b> son pagos y se compran al
              instante.
            </HowItem>
            <HowItem numero="03" titulo="Descargás el .RAR" retraso={180}>
              El link de descarga se habilita al instante y el archivo queda disponible en tu cuenta.
            </HowItem>
          </div>
        </div>
      </section>

      <section className="band-glow relative overflow-hidden py-[clamp(48px,6vw,64px)]">
        <div
          data-reveal=""
          className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-[clamp(20px,3vw,32px)]"
        >
          <h2 className="font-display max-w-130 text-[length:clamp(22px,2.4vw,28px)] leading-[1.2] font-semibold tracking-[-.01em] text-balance text-white">
            ¿Descargás diseños PRO seguido? Salís ganando con la suscripción.
          </h2>
          <Link href="/suscripcion" className="btn-glow shrink-0">
            Suscribirte →
          </Link>
        </div>
      </section>

      <footer className="py-10">
        <div className="mx-auto max-w-6xl px-[clamp(20px,3vw,32px)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <span className="font-mono text-xs text-on-dark-dim">VÉRTICE CUBE © 2026</span>
            <div className="flex gap-6">
              <Link href="#" className="text-[13px] text-on-dark-dim transition-colors hover:text-white">
                Términos
              </Link>
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] text-on-dark-dim transition-colors hover:text-white"
              >
                Contacto / Soporte
              </a>
            </div>
          </div>
          <p className="mt-4.5 flex flex-wrap items-center justify-center gap-2 text-center text-[11px] text-on-dark-dim">
            <span className="pulse-dot h-1.5 w-1.5 shrink-0 rounded-full bg-orange" />
            <span>
              ¿Necesitás un diseño específico? Solicitalo por{" "}
              <a
                href={TELEGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-2 transition-colors hover:text-[#ffb27a]"
              >
                Telegram
              </a>
              .
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}

function HowItem({
  numero,
  titulo,
  retraso,
  children,
}: {
  numero: string;
  titulo: string;
  retraso: number;
  children: React.ReactNode;
}) {
  return (
    <div data-reveal="" data-reveal-delay={retraso} className="glass-card rounded-2xl px-7 py-8">
      <span className="mb-4 block font-mono text-xs font-bold text-orange-2">{numero}</span>
      <h4 className="font-display mb-2.5 text-xl font-semibold text-white">{titulo}</h4>
      <p className="text-sm leading-[1.65] text-on-dark-dim [&_b]:text-white">{children}</p>
    </div>
  );
}
