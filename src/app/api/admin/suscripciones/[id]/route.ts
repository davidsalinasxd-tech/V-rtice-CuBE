import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { enteroEnRango, esUuid, leerJson } from "@/lib/validacion";

function mensajeDeError(message: string) {
  if (message.includes("Cannot coerce the result to a single JSON object")) {
    return "No se pudo actualizar el perfil: falta permiso de administrador (RLS) en la tabla perfiles.";
  }
  console.error("Admin suscripciones:", message);
  return "No se pudo completar la operación.";
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  if (!esUuid(id)) {
    return NextResponse.json({ error: "Perfil no encontrado." }, { status: 404 });
  }

  const body = await leerJson(request);
  const accion = body?.accion;

  if (accion !== "activar" && accion !== "cancelar") {
    return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  }

  if (accion === "cancelar") {
    const { data, error } = await supabase
      .from("perfiles")
      .update({ es_suscriptor: false })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: mensajeDeError(error.message) }, { status: 500 });
    return NextResponse.json({ perfil: data });
  }

  const cantidadMeses = body?.meses === undefined ? 1 : enteroEnRango(body.meses, 1, 24);
  if (cantidadMeses === null) {
    return NextResponse.json({ error: "Los meses tienen que ser un entero entre 1 y 24." }, { status: 400 });
  }

  const { data: perfilActual, error: findError } = await supabase
    .from("perfiles")
    .select("suscripcion_vence")
    .eq("id", id)
    .single();

  if (findError || !perfilActual) {
    return NextResponse.json({ error: "Perfil no encontrado." }, { status: 404 });
  }

  const ahora = new Date();
  const venceActual = perfilActual.suscripcion_vence ? new Date(perfilActual.suscripcion_vence) : ahora;
  const base = venceActual > ahora ? venceActual : ahora;
  const nuevoVence = new Date(base);
  nuevoVence.setMonth(nuevoVence.getMonth() + cantidadMeses);

  const { data, error } = await supabase
    .from("perfiles")
    .update({ es_suscriptor: true, suscripcion_vence: nuevoVence.toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: mensajeDeError(error.message) }, { status: 500 });
  return NextResponse.json({ perfil: data });
}
