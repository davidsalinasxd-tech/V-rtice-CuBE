import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { enteroEnRango, esUuid, leerJson } from "@/lib/validacion";

function mensajeDeError(message: string) {
  if (message.includes("Cannot coerce the result to a single JSON object")) {
    return "No se pudo actualizar el perfil: falta permiso de administrador (RLS) en la tabla perfiles.";
  }
  console.error("Admin vendedores:", message);
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
  const limiteDisenosMes = body?.limiteDisenosMes === null ? null : enteroEnRango(body?.limiteDisenosMes, 0, 1000);

  if (body?.limiteDisenosMes !== null && limiteDisenosMes === null) {
    return NextResponse.json({ error: "Límite inválido." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("perfiles")
    .update({ limite_disenos_mes: limiteDisenosMes })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: mensajeDeError(error.message) }, { status: 500 });
  return NextResponse.json({ perfil: data });
}
