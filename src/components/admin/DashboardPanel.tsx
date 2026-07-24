import { R2_LIMITS } from "@/lib/r2";
import type { ResumenDashboard } from "@/lib/supabase/admin-queries";

function formatBytes(bytes: number) {
  const gb = bytes / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(2)} GB`;
  const mb = bytes / 1024 ** 2;
  return `${mb.toFixed(1)} MB`;
}

export function DashboardPanel({ resumen }: { resumen: ResumenDashboard }) {
  const porcentaje = Math.min(100, (resumen.almacenamientoBytes / R2_LIMITS.STORAGE_LIMIT_BYTES) * 100);
  const restanteBytes = Math.max(0, R2_LIMITS.STORAGE_LIMIT_BYTES - resumen.almacenamientoBytes);
  const cerca = porcentaje >= 80;

  return (
    <div>
      <div className="mb-8 grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
        <Stat label="Diseños publicados" value={String(resumen.disenosPublicados)} />
        <Stat label="En revisión" value={String(resumen.disenosEnRevision)} />
        <Stat label="Vendedores externos" value={String(resumen.vendedoresConDisenos)} />
        <Stat label="Suscriptores activos" value={String(resumen.suscriptoresActivos)} accent />
        <Stat label="Descargas este mes" value={String(resumen.descargasEsteMes)} mono />
        <Stat label="Archivos en R2" value={String(resumen.almacenamientoObjetos)} mono />
      </div>

      <div className="rounded-sm border border-line bg-white px-6 py-5.5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm text-ink">Almacenamiento usado (plan gratuito R2)</h3>
          <span className={`font-mono text-sm font-semibold ${cerca ? "text-orange" : "text-navy-2"}`}>
            {formatBytes(resumen.almacenamientoBytes)} / 10 GB
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-sm bg-paper">
          <div
            className={`h-full rounded-sm transition-all ${cerca ? "bg-orange" : "bg-navy-2"}`}
            style={{ width: `${porcentaje}%` }}
          />
        </div>
        <p className="mt-2.5 text-xs text-text-dim">
          {cerca
            ? "Te estás acercando al límite del plan gratuito — a partir de los 10 GB, R2 empieza a cobrar por el excedente."
            : `Te quedan ${formatBytes(restanteBytes)} antes de superar el plan gratuito y empezar a pagar extra.`}
        </p>
      </div>
    </div>
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
