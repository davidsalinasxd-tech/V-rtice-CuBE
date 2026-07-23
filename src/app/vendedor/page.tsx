import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { HexIcon } from "@/components/HexIcon";
import { UploadForm } from "@/components/vendedor/UploadForm";
import { MetodoCobroForm } from "@/components/vendedor/MetodoCobroForm";
import { createClient } from "@/lib/supabase/server";
import { ensurePerfil } from "@/lib/supabase/perfil";
import { getConteoDescargasPorDisenos } from "@/lib/supabase/queries";
import { cerrarSesion } from "@/app/actions/auth";
import { R2_LIMITS } from "@/lib/r2";

const ESTADO_LABEL = {
  publicado: "Publicado",
  revision: "En revisión",
  rechazado: "Rechazado",
} as const;

const TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "disenos", label: "Mis diseños" },
  { id: "subir", label: "Subir diseño" },
  { id: "pagos", label: "Pagos" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default async function VendedorPage(props: PageProps<"/vendedor">) {
  const searchParams = await props.searchParams;
  const tabParam = typeof searchParams.tab === "string" ? searchParams.tab : "resumen";
  const tab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : "resumen";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/registro");

  await ensurePerfil(supabase, user);

  const [{ data: perfil }, { data: disenos }, { data: metodo }] = await Promise.all([
    supabase.from("perfiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("disenos").select("*").eq("vendedor_id", user.id).order("created_at", { ascending: false }),
    supabase.from("metodos_cobro").select("*").eq("vendedor_id", user.id).maybeSingle(),
  ]);

  const misDisenos = disenos ?? [];
  const conteoDescargas =
    tab === "disenos" ? await getConteoDescargasPorDisenos(misDisenos.map((d) => d.id)) : new Map<string, number>();
  const aprobados = misDisenos.filter((d) => d.estado === "publicado").length;
  const enRevision = misDisenos.filter((d) => d.estado === "revision").length;
  const faltan = Math.max(0, R2_LIMITS.DISENOS_APROBADOS_PARA_COBRO - aprobados);
  const cobroActivo = faltan === 0;
  const progreso = Math.min(100, (aprobados / R2_LIMITS.DISENOS_APROBADOS_PARA_COBRO) * 100);
  const nombre = perfil?.nombre ?? user.email ?? "vendedor";
  const iniciales = nombre
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      <nav className="border-b border-line">
        <div className="mx-auto flex h-19 max-w-6xl items-center justify-between px-8">
          <Logo />
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy font-display text-sm font-bold text-white">
              {iniciales || "V"}
            </div>
            <form action={cerrarSesion}>
              <button
                type="submit"
                className="cursor-pointer text-sm font-medium text-text-dim transition-colors hover:text-navy"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="mx-auto grid max-w-6xl grid-cols-1 md:grid-cols-[220px_1fr]">
        <aside className="border-r border-line px-5 py-8 md:min-h-[calc(100vh-77px)]">
          {TABS.map((t) => (
            <SideLink key={t.id} href={`/vendedor?tab=${t.id}`} active={tab === t.id}>
              {t.label}
            </SideLink>
          ))}
          <SideLink href="/">Volver a la tienda</SideLink>
        </aside>

        <div className="px-6 py-9 pb-20 md:px-10">
          <div className="mb-7.5">
            <h1 className="font-display text-[26px] text-ink">Hola, {nombre.split(" ")[0]}</h1>
            <p className="mt-1 text-[13px] text-text-dim">Esto es lo que pasó con tus diseños</p>
          </div>

          {tab === "resumen" && (
            <>
              <div className="mb-10 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-4">
                <Stat label="Diseños publicados" value={String(aprobados)} />
                <Stat label="En revisión" value={String(enRevision)} />
                <Stat label="Comisión de la plataforma" value="20%" mono />
                <Stat
                  label="Cobro de ventas"
                  value={cobroActivo ? "Activo" : `Faltan ${faltan}`}
                  mono
                  accent={cobroActivo}
                />
              </div>

              <div className="grid grid-cols-1 gap-px border border-line bg-line md:grid-cols-3">
                <RuleCard icon="©" titulo="Autoría propia">
                  Solo se aprueban diseños originales, hechos por vos. No se permite subir trabajo de terceros ni
                  escudos o marcas con derechos registrados.
                </RuleCard>
                <div className="bg-white px-6 py-5.5">
                  <div className="flex gap-4">
                    <div className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-sm border border-line-strong font-mono text-[15px] font-bold text-orange">
                      10
                    </div>
                    <div>
                      <h3 className="mb-1.5 text-sm text-ink">Mínimo para activar el cobro</h3>
                      <p className="text-[13px] leading-relaxed text-text-dim">
                        El cobro por ventas se activa recién al llegar a <b>10 diseños aprobados</b>.
                      </p>
                      <div className="mt-3.5 h-1.25 overflow-hidden rounded-sm bg-paper">
                        <div className="h-full rounded-sm bg-navy-2" style={{ width: `${progreso}%` }} />
                      </div>
                      <span className="mt-1.5 block font-mono text-[11px] text-navy-2">
                        {aprobados} / {R2_LIMITS.DISENOS_APROBADOS_PARA_COBRO} diseños aprobados
                      </span>
                    </div>
                  </div>
                </div>
                <RuleCard icon="▭" titulo="Marco obligatorio">
                  La imagen de portada tiene que estar exportada con el marco oficial de la plantilla. Sin marco, el
                  diseño <b>no se aprueba</b>.
                </RuleCard>
              </div>
            </>
          )}

          {tab === "subir" && (
            <Panel titulo="Subir diseño">
              <UploadForm />
            </Panel>
          )}

          {tab === "disenos" && (
            <Panel titulo="Mis diseños">
              {misDisenos.length === 0 ? (
                <p className="text-sm text-text-dim">
                  Todavía no subiste ningún diseño.{" "}
                  <Link href="/vendedor?tab=subir" className="text-navy-2 hover:text-orange">
                    Subí el primero →
                  </Link>
                </p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <Th>Diseño</Th>
                      <Th>Estado</Th>
                      <Th align="right">Descargas</Th>
                      <Th align="right">Precio</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {misDisenos.map((d) => (
                      <tr key={d.id} className="border-t border-line">
                        <td className="py-3.5 pr-3">
                          {d.estado === "publicado" ? (
                            <Link
                              href={`/producto/${d.id}`}
                              className="flex items-center gap-2.5 text-sm hover:text-orange"
                            >
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line-strong bg-paper">
                                <HexIcon className="h-4.5 w-4.5" />
                              </span>
                              {d.nombre}
                            </Link>
                          ) : (
                            <div className="flex items-center gap-2.5 text-sm text-ink">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-line-strong bg-paper">
                                <HexIcon className="h-4.5 w-4.5" />
                              </span>
                              {d.nombre}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 pr-3">
                          <span
                            className={`rounded-sm px-2.25 py-1 text-[11px] tracking-wide uppercase ${
                              d.estado === "publicado"
                                ? "bg-navy/8 text-navy-2"
                                : d.estado === "revision"
                                  ? "bg-orange/15 text-orange"
                                  : "bg-orange/10 text-text-dim"
                            }`}
                          >
                            {ESTADO_LABEL[d.estado]}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-mono text-sm text-navy-2">
                          {conteoDescargas.get(d.id) ?? 0}
                        </td>
                        <td className="py-3.5 text-right font-mono text-sm">
                          {d.es_gratis ? "Gratis" : `Gs. ${d.precio.toLocaleString("es-PY")}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>
          )}

          {tab === "pagos" && (
            <>
              <Panel titulo="Pagos">
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`font-mono text-2xl font-bold ${cobroActivo ? "text-navy-2" : "text-text-dim"}`}>
                      {cobroActivo ? "Disponible al vender" : "Bloqueado"}
                    </div>
                    <p className="mt-1 text-xs text-text-dim">
                      {cobroActivo
                        ? "Ya podés recibir pagos por transferencia bancaria manual."
                        : `El cobro se activa al llegar a ${R2_LIMITS.DISENOS_APROBADOS_PARA_COBRO} diseños aprobados (te faltan ${faltan}).`}
                    </p>
                  </div>
                  <button
                    disabled={!cobroActivo}
                    className="cursor-pointer rounded-sm border border-line-strong px-5 py-3 text-sm font-semibold transition-colors hover:border-text-dim hover:bg-paper disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Solicitar pago
                  </button>
                </div>
              </Panel>

              <Panel titulo="Método de cobro">
                <MetodoCobroForm vendedorId={user.id} metodo={metodo ?? null} />
              </Panel>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function SideLink({ href, children, active }: { href: string; children: React.ReactNode; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`mb-1 flex items-center gap-2.5 rounded-sm px-3 py-2.75 text-sm transition-colors ${
        active ? "bg-orange/12 text-orange" : "text-text-dim hover:bg-paper hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function Stat({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: boolean }) {
  return (
    <div className="bg-white px-5.5 py-5">
      <div className="mb-2 text-[11px] tracking-wide text-text-dim uppercase">{label}</div>
      <div className={`text-2xl font-bold ${mono ? "font-mono" : ""} ${accent ? "text-navy-2" : "text-ink"}`}>
        {value}
      </div>
    </div>
  );
}

function RuleCard({ icon, titulo, children }: { icon: string; titulo: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 bg-white px-6 py-5.5">
      <div className="flex h-9.5 w-9.5 shrink-0 items-center justify-center rounded-sm border border-line-strong font-mono text-[15px] font-bold text-orange">
        {icon}
      </div>
      <div>
        <h3 className="mb-1.5 text-sm text-ink">{titulo}</h3>
        <p className="text-[13px] leading-relaxed text-text-dim">{children}</p>
      </div>
    </div>
  );
}

function Panel({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="mb-9 rounded-sm border border-line">
      <div className="border-b border-line px-6 py-4.5">
        <h2 className="text-base text-ink">{titulo}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function Th({ children, align }: { children: React.ReactNode; align?: "right" }) {
  return (
    <th className={`pb-3 text-[11px] font-medium tracking-wide text-text-dim uppercase ${align === "right" ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}
