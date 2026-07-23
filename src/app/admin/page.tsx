import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { RevisionCard } from "@/components/admin/RevisionCard";
import { SuscripcionesPanel } from "@/components/admin/SuscripcionesPanel";
import { DescargasMensualesPanel } from "@/components/admin/DescargasMensualesPanel";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { getDownloadUrl } from "@/lib/r2";
import { getPerfilesConSuscripcion, getDescargasPorVendedorDelMes } from "@/lib/supabase/admin-queries";

const TABS = [
  { id: "revision", label: "Revisión" },
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
  const tabParam = typeof searchParams.tab === "string" ? searchParams.tab : "revision";
  const tab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : "revision";

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

        {tab === "revision" && pendientesUI}

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
