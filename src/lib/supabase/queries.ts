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
