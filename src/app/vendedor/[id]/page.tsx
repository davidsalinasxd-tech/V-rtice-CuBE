import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicNav } from "@/components/PublicNav";
import { CatalogSection } from "@/components/catalog/CatalogSection";
import { VendorBadge } from "@/components/VendorBadge";
import { getPerfilVendedorPublico, getVendedorDestacadoDelMes } from "@/lib/supabase/queries";
import { calcularNivel, proximoNivel } from "@/lib/niveles";
import { createClient } from "@/lib/supabase/server";
import { publicUrl } from "@/lib/r2";
import { TELEGRAM_URL } from "@/lib/telegram";
import type { Diseno } from "@/lib/types/database";

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await props.params;
  const perfil = await getPerfilVendedorPublico(id);
  if (!perfil) return {};

  return {
    title: `${perfil.nombre} — Vendedor en Vértice Cube`,
    description: `Diseños vector para sublimación de ${perfil.nombre}: ${perfil.disenosPublicados} diseños publicados en Vértice Cube.`,
  };
}

function formatMesAno(iso: string) {
  return new Date(iso).toLocaleDateString("es-PY", { month: "long", year: "numeric" });
}

export default async function PerfilVendedorPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const perfil = await getPerfilVendedorPublico(id);

  if (!perfil) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: disenosData }, destacadoId] = await Promise.all([
    supabase
      .from("disenos")
      .select("*")
      .eq("vendedor_id", id)
      .eq("estado", "publicado")
      .order("es_pro", { ascending: false })
      .order("created_at", { ascending: false }),
    getVendedorDestacadoDelMes(),
  ]);

  const disenos: Diseno[] = (disenosData ?? []).map((d) => ({ ...d, imagen_url: publicUrl(d.imagen_url) }));
  const nivel = calcularNivel(perfil.descargasTotales);
  const esPropio = user?.id === perfil.id;
  const esDestacado = destacadoId === perfil.id;
  const progreso = esPropio ? proximoNivel(perfil.descargasTotales) : null;

  return (
    <>
      <PublicNav />

      <section className="border-b border-line py-16">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-8 text-center">
          {esDestacado && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-navy to-navy-2 px-3.5 py-1.5 font-mono text-[11px] font-bold tracking-wide text-white uppercase before:content-['★'] before:text-orange">
              Destacado del mes
            </span>
          )}
          <VendorBadge nivel={nivel} size="lg" />
          <div>
            <h1 className="font-display text-[30px] text-navy">{perfil.nombre}</h1>
            <p className="mt-1 text-[13px] text-text-dim">Vendedor desde {formatMesAno(perfil.creadoEn)}</p>
          </div>
          <div className="flex gap-10">
            <div className="text-center">
              <div className="font-display text-2xl text-navy">{perfil.disenosPublicados}</div>
              <div className="font-mono text-[10px] tracking-widest text-text-dim uppercase">Diseños</div>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl text-navy">{perfil.descargasTotales}</div>
              <div className="font-mono text-[10px] tracking-widest text-text-dim uppercase">Descargas</div>
            </div>
          </div>

          {esPropio && (
            <div className="mt-2 w-full max-w-90 rounded-md border border-line bg-paper px-5 py-4">
              {progreso ? (
                <>
                  <div className="mb-2 flex items-center justify-between font-mono text-[11px] text-text-dim">
                    <span>Te faltan {progreso.faltan} descargas para {progreso.siguiente.nombre}</span>
                    <span>{progreso.porcentaje}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-sm bg-line">
                    <div
                      className="h-full rounded-sm bg-navy-2"
                      style={{ width: `${progreso.porcentaje}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="font-mono text-[11px] text-navy-2">Llegaste al nivel máximo — Elite 🎉</p>
              )}
              <p className="mt-2 text-[10px] text-text-dim">Solo vos ves este progreso.</p>
            </div>
          )}
        </div>
      </section>

      {disenos.length === 0 ? (
        <div className="mx-auto max-w-6xl px-8 py-20 text-center text-sm text-text-dim">
          Este vendedor todavía no tiene diseños publicados.
        </div>
      ) : (
        <CatalogSection
          disenos={disenos}
          titulo={
            <>
              Diseños de
              <br />
              {perfil.nombre}
            </>
          }
          subtitulo={`${perfil.disenosPublicados} diseño${perfil.disenosPublicados === 1 ? "" : "s"} publicados en Vértice Cube.`}
        />
      )}

      <footer className="border-t border-line bg-white py-10">
        <div className="mx-auto max-w-6xl px-8">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-text-dim">VÉRTICE CUBE © 2026</span>
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
