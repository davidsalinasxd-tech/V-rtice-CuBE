import { createClient } from "@/lib/supabase/server";
import { publicUrl } from "@/lib/r2";
import type { Diseno } from "@/lib/types/database";

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
  const { data, error } = await supabase.from("descargas").select("diseno_id");

  if (error || !data || data.length === 0) {
    if (error) console.error("Error al leer descargas:", error.message);
    return null;
  }

  const conteos = new Map<string, number>();
  for (const { diseno_id } of data) {
    conteos.set(diseno_id, (conteos.get(diseno_id) ?? 0) + 1);
  }

  const [topId] = [...conteos.entries()].sort((a, b) => b[1] - a[1])[0] ?? [];
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
