import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database, Rol } from "@/lib/types/database";

/**
 * Crea la fila en `perfiles` si todavía no existe. Necesario porque un usuario
 * puede quedar con sesión activa (ej. al confirmar el correo) sin haber
 * pasado por el signup/login manual, que es donde normalmente se crea.
 */
export async function ensurePerfil(supabase: SupabaseClient<Database>, user: User) {
  const nombre = (user.user_metadata?.nombre as string | undefined) ?? user.email ?? "usuario";
  const rol = (user.user_metadata?.rol as Rol | undefined) ?? "comprador";
  await supabase.from("perfiles").upsert({ id: user.id, nombre, rol }, { onConflict: "id", ignoreDuplicates: true });
}
