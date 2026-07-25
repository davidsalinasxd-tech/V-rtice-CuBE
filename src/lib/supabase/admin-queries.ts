import { createClient } from "@/lib/supabase/server";
import { getStorageUsage } from "@/lib/r2";
import type { Diseno, Perfil, SolicitudPrecio } from "@/lib/types/database";

export type ResumenDashboard = {
  disenosPublicados: number;
  disenosEnRevision: number;
  vendedoresConDisenos: number;
  suscriptoresActivos: number;
  descargasEsteMes: number;
  almacenamientoBytes: number;
  almacenamientoObjetos: number;
};

export async function getResumenDashboard(): Promise<ResumenDashboard> {
  const supabase = await createClient();
  const ahora = new Date();
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1).toISOString();

  const [
    { count: disenosPublicados },
    { count: disenosEnRevision },
    { data: vendedoresData },
    { count: suscriptoresActivos },
    { count: descargasEsteMes },
    almacenamiento,
  ] = await Promise.all([
    supabase.from("disenos").select("id", { count: "exact", head: true }).eq("estado", "publicado"),
    supabase.from("disenos").select("id", { count: "exact", head: true }).eq("estado", "revision"),
    supabase.from("disenos").select("vendedor_id").eq("es_oficial", false),
    supabase
      .from("perfiles")
      .select("id", { count: "exact", head: true })
      .eq("es_suscriptor", true)
      .gt("suscripcion_vence", ahora.toISOString()),
    supabase.from("descargas").select("id", { count: "exact", head: true }).gte("created_at", inicioMes),
    getStorageUsage().catch((e) => {
      console.error("Error al leer el uso de almacenamiento de R2:", e);
      return { bytes: 0, objetos: 0 };
    }),
  ]);

  const vendedoresConDisenos = new Set((vendedoresData ?? []).map((d) => d.vendedor_id)).size;

  return {
    disenosPublicados: disenosPublicados ?? 0,
    disenosEnRevision: disenosEnRevision ?? 0,
    vendedoresConDisenos,
    suscriptoresActivos: suscriptoresActivos ?? 0,
    descargasEsteMes: descargasEsteMes ?? 0,
    almacenamientoBytes: almacenamiento.bytes,
    almacenamientoObjetos: almacenamiento.objetos,
  };
}

export type DisenoConVendedor = Diseno & { vendedorNombre: string };

export async function getTodosLosDisenos(): Promise<DisenoConVendedor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("disenos").select("*").order("created_at", { ascending: false });

  if (error || !data) {
    if (error) console.error("Error al leer diseños:", error.message);
    return [];
  }

  const vendedorIds = [...new Set(data.map((d) => d.vendedor_id))];
  const { data: perfiles } = vendedorIds.length
    ? await supabase.from("perfiles").select("id, nombre").in("id", vendedorIds)
    : { data: [] };
  const nombrePorId = new Map((perfiles ?? []).map((p) => [p.id, p.nombre]));

  return data.map((d) => ({ ...d, vendedorNombre: nombrePorId.get(d.vendedor_id) ?? "—" }));
}

export async function getSolicitudesVendedorPendientes(): Promise<Perfil[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("perfiles")
    .select("*")
    .eq("estado_vendedor", "pendiente")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error al leer solicitudes de vendedor:", error.message);
    return [];
  }

  return data ?? [];
}

export type SolicitudPrecioConDetalle = SolicitudPrecio & { disenoNombre: string; vendedorNombre: string };

export async function getSolicitudesPrecioPendientes(): Promise<SolicitudPrecioConDetalle[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("solicitudes_precio")
    .select("*")
    .eq("estado", "pendiente")
    .order("created_at", { ascending: true });

  if (error || !data) {
    if (error) console.error("Error al leer solicitudes de precio:", error.message);
    return [];
  }

  const disenoIds = [...new Set(data.map((s) => s.diseno_id))];
  const vendedorIds = [...new Set(data.map((s) => s.vendedor_id))];

  const [{ data: disenos }, { data: perfiles }] = await Promise.all([
    disenoIds.length ? supabase.from("disenos").select("id, nombre").in("id", disenoIds) : Promise.resolve({ data: [] }),
    vendedorIds.length ? supabase.from("perfiles").select("id, nombre").in("id", vendedorIds) : Promise.resolve({ data: [] }),
  ]);

  const nombreDisenoPorId = new Map((disenos ?? []).map((d) => [d.id, d.nombre]));
  const nombreVendedorPorId = new Map((perfiles ?? []).map((p) => [p.id, p.nombre]));

  return data.map((s) => ({
    ...s,
    disenoNombre: nombreDisenoPorId.get(s.diseno_id) ?? "—",
    vendedorNombre: nombreVendedorPorId.get(s.vendedor_id) ?? "—",
  }));
}

export async function getPerfilesConSuscripcion(): Promise<Perfil[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("perfiles").select("*").order("created_at", { ascending: false });

  if (error) {
    console.error("Error al leer perfiles:", error.message);
    return [];
  }

  return data ?? [];
}

export type DescargasPorVendedor = {
  vendedorId: string;
  vendedorNombre: string;
  total: number;
  cuentanParaPago: number;
  viaSuscripcion: number;
};

/** Descargas del período [inicio, fin) agrupadas por vendedor externo. */
export async function getDescargasPorVendedorDelMes(inicio: Date, fin: Date): Promise<DescargasPorVendedor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("descargas")
    .select("cuenta_para_pago, via_suscripcion, disenos!inner(vendedor_id)")
    .gte("created_at", inicio.toISOString())
    .lt("created_at", fin.toISOString());

  if (error || !data) {
    if (error) console.error("Error al leer descargas por vendedor:", error.message);
    return [];
  }

  const porVendedor = new Map<string, { total: number; cuentanParaPago: number; viaSuscripcion: number }>();
  for (const fila of data as unknown as Array<{
    cuenta_para_pago: boolean;
    via_suscripcion: boolean;
    disenos: { vendedor_id: string } | { vendedor_id: string }[];
  }>) {
    const disenoRel = Array.isArray(fila.disenos) ? fila.disenos[0] : fila.disenos;
    if (!disenoRel) continue;
    const vendedorId = disenoRel.vendedor_id;
    const actual = porVendedor.get(vendedorId) ?? { total: 0, cuentanParaPago: 0, viaSuscripcion: 0 };
    actual.total += 1;
    if (fila.cuenta_para_pago) actual.cuentanParaPago += 1;
    if (fila.via_suscripcion) actual.viaSuscripcion += 1;
    porVendedor.set(vendedorId, actual);
  }

  const vendedorIds = [...porVendedor.keys()];
  const { data: perfiles } = vendedorIds.length
    ? await supabase.from("perfiles").select("id, nombre").in("id", vendedorIds)
    : { data: [] };
  const nombrePorId = new Map((perfiles ?? []).map((p) => [p.id, p.nombre]));

  return [...porVendedor.entries()]
    .map(([vendedorId, stats]) => ({ vendedorId, vendedorNombre: nombrePorId.get(vendedorId) ?? "—", ...stats }))
    .sort((a, b) => b.total - a.total);
}
