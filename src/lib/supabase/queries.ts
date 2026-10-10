import { createClient } from "@/lib/supabase/server";
import { publicUrl } from "@/lib/r2";
import type { Diseno } from "@/lib/types/database";

export type PerfilVendedorPublico = {
  id: string;
  nombre: string;
  creadoEn: string;
  disenosPublicados: number;
  descargasTotales: number;
};

/** Perfil público de un vendedor aprobado: sin email ni ningún dato de contacto. */
export async function getPerfilVendedorPublico(id: string): Promise<PerfilVendedorPublico | null> {
  const supabase = await createClient();
  const { data: perfil } = await supabase.from("perfiles_publicos").select("*").eq("id", id).maybeSingle();

  if (!perfil) return null;

  const { data: disenos } = await supabase
    .from("disenos")
    .select("id")
    .eq("vendedor_id", id)
    .eq("estado", "publicado");

  const disenoIds = (disenos ?? []).map((d) => d.id);

  const { data: descargasTotales, error: descargasError } = await supabase.rpc("descargas_pagables_de_vendedor", {
    p_vendedor: id,
  });
  if (descargasError) console.error("Error al contar descargas del vendedor:", descargasError.message);

  return {
    id: perfil.id,
    nombre: perfil.nombre,
    creadoEn: perfil.created_at,
    disenosPublicados: disenoIds.length,
    descargasTotales: descargasTotales ?? 0,
  };
}

async function vendedorConMasDescargas(
  supabase: Awaited<ReturnType<typeof createClient>>,
  inicio: Date,
  fin: Date
): Promise<string | null> {
  const { data, error } = await supabase.rpc("vendedor_destacado", {
    p_inicio: inicio.toISOString(),
    p_fin: fin.toISOString(),
  });
  if (error) console.error("Error al buscar el vendedor destacado:", error.message);
  return data ?? null;
}

/**
 * Vendedor externo (no oficial) con más descargas reales del mes pasado.
 * Si todavía no hay descargas del mes pasado (ej. recién arrancando), usa el
 * líder del mes actual para que la insignia no quede vacía desde el día uno.
 */
export async function getVendedorDestacadoDelMes(): Promise<string | null> {
  const supabase = await createClient();
  const ahora = new Date();
  const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const inicioMesPasado = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  const inicioMesSiguiente = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 1);

  const delMesPasado = await vendedorConMasDescargas(supabase, inicioMesPasado, inicioMesActual);
  if (delMesPasado) return delMesPasado;

  return vendedorConMasDescargas(supabase, inicioMesActual, inicioMesSiguiente);
}

/** Nombres públicos de vendedores aprobados, para linkear desde el catálogo/ficha de producto. */
export async function getNombresVendedores(vendedorIds: string[]): Promise<Map<string, string>> {
  if (vendedorIds.length === 0) return new Map();

  const supabase = await createClient();
  const { data } = await supabase.from("perfiles_publicos").select("id, nombre").in("id", vendedorIds);

  return new Map((data ?? []).map((p) => [p.id, p.nombre]));
}

function conImagenPublica(diseno: Diseno): Diseno {
  return { ...diseno, imagen_url: publicUrl(diseno.imagen_url) };
}

export async function getDisenosPublicados(): Promise<Diseno[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("disenos")
    .select("*")
    .eq("estado", "publicado")
    .order("es_pro", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error al leer diseños publicados:", error.message);
    return [];
  }

  return (data ?? []).map(conImagenPublica);
}

export async function getDisenoPublicadoPorId(id: string): Promise<Diseno | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("disenos")
    .select("*")
    .eq("id", id)
    .eq("estado", "publicado")
    .maybeSingle();

  if (error) {
    console.error("Error al leer diseño:", error.message);
    return null;
  }

  return data ? conImagenPublica(data) : null;
}

/** Diseño publicado con más descargas registradas en la tabla `descargas`. */
export async function getDisenoMasDescargado(): Promise<Diseno | null> {
  const supabase = await createClient();
  const { data: topId, error } = await supabase.rpc("diseno_mas_descargado");

  if (error) console.error("Error al leer el diseño más descargado:", error.message);
  return topId ? getDisenoPublicadoPorId(topId) : null;
}

/** Cantidad de descargas registradas por cada uno de los diseños dados. */
export async function getConteoDescargasPorDisenos(disenoIds: string[]): Promise<Map<string, number>> {
  if (disenoIds.length === 0) return new Map();

  const supabase = await createClient();
  const { data, error } = await supabase.from("descargas").select("diseno_id").in("diseno_id", disenoIds);

  if (error || !data) {
    if (error) console.error("Error al leer descargas por diseño:", error.message);
    return new Map();
  }

  const conteos = new Map<string, number>();
  for (const { diseno_id } of data) {
    conteos.set(diseno_id, (conteos.get(diseno_id) ?? 0) + 1);
  }
  return conteos;
}
