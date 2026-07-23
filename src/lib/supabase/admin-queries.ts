import { createClient } from "@/lib/supabase/server";
import type { Perfil } from "@/lib/types/database";

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
