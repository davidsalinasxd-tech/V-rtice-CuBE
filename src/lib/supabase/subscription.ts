import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";
import { SUSCRIPCION } from "@/lib/r2";

export type EstadoSuscripcion = {
  activa: boolean;
  vence: string | null;
};

export async function getEstadoSuscripcion(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<EstadoSuscripcion> {
  const { data: perfil } = await supabase
    .from("perfiles")
    .select("es_suscriptor, suscripcion_vence")
    .eq("id", userId)
    .maybeSingle();

  if (!perfil?.es_suscriptor || !perfil.suscripcion_vence) {
    return { activa: false, vence: perfil?.suscripcion_vence ?? null };
  }

  return { activa: new Date(perfil.suscripcion_vence) > new Date(), vence: perfil.suscripcion_vence };
}

export type CupoDescargaExterna = {
  disponible: boolean;
  usadasMes: number;
  usadasHoy: number;
  restanteMes: number;
  restanteHoy: number;
};

/** Cupo de descargas de diseños externos (no oficiales) cubiertas por la suscripción. */
export async function getCupoDescargaExterna(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<CupoDescargaExterna> {
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();
  const inicioDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).toISOString();

  const { data } = await supabase
    .from("descargas")
    .select("created_at, disenos!inner(es_oficial)")
    .eq("usuario_id", userId)
    .eq("via_suscripcion", true)
    .eq("disenos.es_oficial", false)
    .gte("created_at", inicioMes);

  const filas = (data ?? []) as unknown as Array<{ created_at: string }>;
  const usadasMes = filas.length;
  const usadasHoy = filas.filter((f) => f.created_at >= inicioDia).length;
  const restanteMes = Math.max(0, SUSCRIPCION.MAX_DESCARGAS_EXTERNAS_POR_MES - usadasMes);
  const restanteHoy = Math.max(0, SUSCRIPCION.MAX_DESCARGAS_EXTERNAS_POR_DIA - usadasHoy);

  return { disponible: restanteMes > 0 && restanteHoy > 0, usadasMes, usadasHoy, restanteMes, restanteHoy };
}
