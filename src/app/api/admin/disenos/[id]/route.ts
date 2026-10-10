import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { borrarArchivosDeDiseno } from "@/lib/r2";
import { esUuid, leerJson, precioValido } from "@/lib/validacion";

function mensajeDeError(message: string) {
  if (message.includes("Cannot coerce the result to a single JSON object")) {
    return "No se pudo actualizar el diseño: falta permiso de administrador (RLS) en la tabla disenos.";
  }
  console.error("Admin disenos:", message);
  return "No se pudo completar la operación.";
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

  if (!esUuid(id)) {
    return NextResponse.json({ error: "Diseño no encontrado." }, { status: 404 });
  }

  const body = await leerJson(request);
  const accion = body?.accion;
  const esGratis = body?.esGratis;

  if (accion !== "aprobar" && accion !== "rechazar" && accion !== "editar") {
    return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  }

  if (accion === "editar") {
    if (typeof esGratis !== "boolean") {
      return NextResponse.json({ error: "Falta indicar si es gratis." }, { status: 400 });
    }
    const precio = esGratis ? 0 : precioValido(body?.precio);
    if (precio === null) {
      return NextResponse.json({ error: "El precio tiene que ser un número entero entre 1 y 10.000.000 Gs." }, { status: 400 });
    }
    const { data, error } = await supabase
      .from("disenos")
      .update({ es_gratis: esGratis, precio })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: mensajeDeError(error.message) }, { status: 500 });
    return NextResponse.json({ diseno: data });
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
    if (!diseno.rar_url || !diseno.imagen_url) {
      return NextResponse.json({ error: "El diseño todavía no tiene sus archivos subidos." }, { status: 409 });
    }
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
  await borrarArchivosDeDiseno(diseno);

  const { data, error } = await supabase
    .from("disenos")
    .update({ estado: "rechazado", rar_url: null, imagen_url: null })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: mensajeDeError(error.message) }, { status: 500 });
  return NextResponse.json({ diseno: data });
}

export async function DELETE(request: Request, ctx: RouteContext<"/api/admin/disenos/[id]">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { data: diseno, error: findError } = await supabase.from("disenos").select("*").eq("id", id).single();

  if (findError || !diseno) {
    return NextResponse.json({ error: "Diseño no encontrado." }, { status: 404 });
  }

  await borrarArchivosDeDiseno(diseno);

  const { error } = await supabase.from("disenos").delete().eq("id", id);

  if (error) return NextResponse.json({ error: mensajeDeError(error.message) }, { status: 500 });
  return NextResponse.json({ ok: true });
}
