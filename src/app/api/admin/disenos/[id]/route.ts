import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { deleteObject } from "@/lib/r2";

function mensajeDeError(message: string) {
  if (message.includes("Cannot coerce the result to a single JSON object")) {
    return "No se pudo actualizar el diseño: falta permiso de administrador (RLS) en la tabla disenos.";
  }
  return message;
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/disenos/[id]">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const body = await request.json();
  const { accion } = body as { accion?: "aprobar" | "rechazar" };

  if (accion !== "aprobar" && accion !== "rechazar") {
    return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  }

  const { data: diseno, error: findError } = await supabase
    .from("disenos")
    .select("*")
    .eq("id", id)
    .single();

  if (findError || !diseno) {
    return NextResponse.json({ error: "Diseño no encontrado." }, { status: 404 });
  }

  if (accion === "aprobar") {
    const { data, error } = await supabase
      .from("disenos")
      .update({ estado: "publicado" })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: mensajeDeError(error.message) }, { status: 500 });
    return NextResponse.json({ diseno: data });
  }

  // Rechazar: borra los archivos de R2 en el momento (regla de negocio) y marca el estado.
  await Promise.all([
    diseno.rar_url ? deleteObject(diseno.rar_url).catch(() => {}) : Promise.resolve(),
    diseno.imagen_url ? deleteObject(diseno.imagen_url).catch(() => {}) : Promise.resolve(),
  ]);

  const { data, error } = await supabase
    .from("disenos")
    .update({ estado: "rechazado", rar_url: null, imagen_url: null })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: mensajeDeError(error.message) }, { status: 500 });
  return NextResponse.json({ diseno: data });
}
