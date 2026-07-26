import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { RevisionCard } from "@/components/admin/RevisionCard";
import { SuscripcionesPanel } from "@/components/admin/SuscripcionesPanel";
import { DescargasMensualesPanel } from "@/components/admin/DescargasMensualesPanel";
import { DashboardPanel } from "@/components/admin/DashboardPanel";
import { DisenosPanel } from "@/components/admin/DisenosPanel";
import { SolicitudesPanel } from "@/components/admin/SolicitudesPanel";
import { SolicitudesPrecioPanel } from "@/components/admin/SolicitudesPrecioPanel";
import { SolicitudesPagoPanel } from "@/components/admin/SolicitudesPagoPanel";
import { UploadForm } from "@/components/vendedor/UploadForm";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { getDownloadUrl } from "@/lib/r2";
import {
  getPerfilesConSuscripcion,
  getDescargasPorVendedorDelMes,
  getResumenDashboard,
  getTodosLosDisenos,
  getSolicitudesVendedorPendientes,
  getSolicitudesPrecioPendientes,
  getSolicitudesPagoPendientes,
} from "@/lib/supabase/admin-queries";

const TABS = [
  { id: "resumen", label: "Resumen" },
  { id: "revision", label: "Revisión" },
  { id: "solicitudes", label: "Solicitudes" },
  { id: "disenos", label: "Diseños" },
  { id: "oficial", label: "Subir oficial" },
  { id: "suscriptores", label: "Suscriptores" },
  { id: "descargas", label: "Descargas" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function parseMes(param: string | undefined) {
  if (param && /^\d{4}-\d{2}$/.test(param)) {
    const [y, m] = param.split("-").map(Number);
    return new Date(y, m - 1, 1);
  }
  const ahora = new Date();
  return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
}

function formatMes(fecha: Date) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
}

export default async function AdminPage(props: PageProps<"/admin">) {
  const searchParams = await props.searchParams;
  const tabParam = typeof searchParams.tab === "string" ? searchParams.tab : "resumen";
  const tab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : "resumen";

  const mesInicio = parseMes(typeof searchParams.mes === "string" ? searchParams.mes : undefined);
  const mesFin = new Date(mesInicio.getFullYear(), mesInicio.getMonth() + 1, 1);
  const mesAnterior = new Date(mesInicio.getFullYear(), mesInicio.getMonth() - 1, 1);
  const mesSiguiente = new Date(mesInicio.getFullYear(), mesInicio.getMonth() + 1, 1);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/registro");
  if (!isAdminEmail(user.email)) redirect("/");

  let pendientesUI: React.ReactNode = null;
  if (tab === "revision") {
    const { data: pendientes } = await supabase
      .from("disenos")
      .select("*")
      .eq("estado", "revision")
      .order("created_at", { ascending: true });

    const disenos = pendientes ?? [];

    const vendedorIds = [...new Set(disenos.map((d) => d.vendedor_id))];
    const { data: perfiles } = vendedorIds.length
      ? await supabase.from("perfiles").select("id, nombre").in("id", vendedorIds)
      : { data: [] };
    const nombrePorVendedor = new Map((perfiles ?? []).map((p) => [p.id, p.nombre]));

    const previews = await Promise.all(
      disenos.map(async (d) => ({
        id: d.id,
        imagenUrl: d.imagen_url
          ? await getDownloadUrl(d.imagen_url, 600).catch((e) => {
              console.error(`admin: no se pudo firmar la imagen de ${d.id} (key: ${d.imagen_url}):`, e);
              return null;
            })
          : null,
        rarUrl: d.rar_url
          ? await getDownloadUrl(d.rar_url, 600).catch((e) => {
              console.error(`admin: no se pudo firmar el rar de ${d.id} (key: ${d.rar_url}):`, e);
              return null;
            })
          : null,
      }))
    );
    const previewPorId = new Map(previews.map((p) => [p.id, p]));

    pendientesUI = (
      <>
        <h1 className="font-display mb-1.5 text-[26px] text-ink">Diseños en revisión</h1>
        <p className="mb-8 text-[13px] text-text-dim">
          {disenos.length === 0
            ? "No hay diseños pendientes de aprobación."
            : `${disenos.length} diseño${disenos.length === 1 ? "" : "s"} esperando revisión.`}
        </p>

        <div className="flex flex-col gap-3">
          {disenos.map((d) => (
            <RevisionCard
              key={d.id}
              diseno={d}
              vendedorNombre={nombrePorVendedor.get(d.vendedor_id) ?? "—"}
              imagenPreviewUrl={previewPorId.get(d.id)?.imagenUrl ?? null}
              rarPreviewUrl={previewPorId.get(d.id)?.rarUrl ?? null}
            />
          ))}
        </div>
      </>
    );
  }

  const perfiles = tab === "suscriptores" ? await getPerfilesConSuscripcion() : [];
  const descargasPorVendedor = tab === "descargas" ? await getDescargasPorVendedorDelMes(mesInicio, mesFin) : [];
  const resumen = tab === "resumen" ? await getResumenDashboard() : null;
  const todosLosDisenos = tab === "disenos" ? await getTodosLosDisenos() : [];
  const solicitudes = tab === "solicitudes" ? await getSolicitudesVendedorPendientes() : [];
  const solicitudesPrecio = tab === "solicitudes" ? await getSolicitudesPrecioPendientes() : [];
  const solicitudesPago = tab === "solicitudes" ? await getSolicitudesPagoPendientes() : [];

  return (
    <>
      <nav className="border-b border-line bg-white">
        <div className="mx-auto flex h-19 max-w-6xl items-center justify-between px-8">
          <Logo />
          <Link href="/" className="text-sm text-text-dim hover:text-navy">
            Volver a la tienda
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-8 py-9 pb-20">
        <div className="mb-8 flex w-fit gap-0.5 rounded-[3px] border border-line-strong bg-paper p-0.5">
          {TABS.map((t) => (
            <Link
              key={t.id}
              href={`/admin?tab=${t.id}`}
              className={`cursor-pointer rounded-sm px-4 py-2 text-xs font-semibold transition-colors ${
                tab === t.id ? "bg-navy text-white" : "text-text-dim hover:text-navy"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {tab === "resumen" && resumen && (
          <>
            <h1 className="font-display mb-1.5 text-[26px] text-ink">Resumen</h1>
            <p className="mb-8 text-[13px] text-text-dim">Lo más importante del negocio, de un vistazo.</p>
            <DashboardPanel resumen={resumen} />
          </>
        )}

        {tab === "revision" && pendientesUI}

        {tab === "solicitudes" && (
          <>
            <h1 className="font-display mb-1.5 text-[26px] text-ink">Solicitudes de vendedor</h1>
            <p className="mb-8 text-[13px] text-text-dim">
              {solicitudes.length === 0
                ? "No hay solicitudes pendientes."
                : `${solicitudes.length} solicitud${solicitudes.length === 1 ? "" : "es"} esperando aprobación.`}
            </p>
            <SolicitudesPanel solicitudes={solicitudes} />

            <h2 className="font-display mt-12 mb-1.5 text-[22px] text-ink">Cambios de precio</h2>
            <p className="mb-8 text-[13px] text-text-dim">
              Pedidos de vendedores para cambiar el precio o pasar a gratis un diseño ya publicado.
            </p>
            <SolicitudesPrecioPanel solicitudes={solicitudesPrecio} />

            <h2 className="font-display mt-12 mb-1.5 text-[22px] text-ink">Pagos</h2>
            <p className="mb-8 text-[13px] text-text-dim">
              Pedidos de cobro de vendedores, con sus datos de transferencia. Marcá como pagado recién después de
              hacer la transferencia manual.
            </p>
            <SolicitudesPagoPanel solicitudes={solicitudesPago} />
          </>
        )}

        {tab === "disenos" && (
          <>
            <h1 className="font-display mb-1.5 text-[26px] text-ink">Diseños</h1>
            <p className="mb-8 text-[13px] text-text-dim">
              Todo el catálogo, publicado o no. Borrar un diseño elimina también sus archivos de R2 — no se puede
              deshacer.
            </p>
            <DisenosPanel disenos={todosLosDisenos} />
          </>
        )}

        {tab === "oficial" && (
          <>
            <h1 className="font-display mb-1.5 text-[26px] text-ink">Subir diseño oficial</h1>
            <p className="mb-8 text-[13px] text-text-dim">
              Se publica directo (sin revisión) y no cuenta para los límites de espacio de vendedor externo.
            </p>
            <UploadForm esOficial />
          </>
        )}

        {tab === "suscriptores" && (
          <>
            <h1 className="font-display mb-1.5 text-[26px] text-ink">Suscriptores</h1>
            <p className="mb-8 text-[13px] text-text-dim">
              Activá o cancelá la suscripción mensual de un usuario después de confirmar el pago por Telegram.
            </p>
            <SuscripcionesPanel perfiles={perfiles} />
          </>
        )}

        {tab === "descargas" && (
          <>
            <div className="mb-1.5 flex items-center justify-between">
              <h1 className="font-display text-[26px] text-ink">Descargas por vendedor</h1>
              <div className="flex items-center gap-2 font-mono text-xs text-text-dim">
                <Link href={`/admin?tab=descargas&mes=${formatMes(mesAnterior)}`} className="hover:text-navy">
                  ‹
                </Link>
                <span className="text-navy">{formatMes(mesInicio)}</span>
                <Link href={`/admin?tab=descargas&mes=${formatMes(mesSiguiente)}`} className="hover:text-navy">
                  ›
                </Link>
              </div>
            </div>
            <p className="mb-8 text-[13px] text-text-dim">
              Total de descargas del período por vendedor, y cuántas cuentan para pago (excluye auto-descargas) o
              vinieron incluidas en una suscripción.
            </p>
            <DescargasMensualesPanel filas={descargasPorVendedor} />
          </>
        )}
      </div>
    </>
  );
}
