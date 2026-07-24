import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";

function mensajeDeError(message: string) {
  if (message.includes("Cannot coerce the result to a single JSON object")) {
    return "No se pudo actualizar el perfil: falta permiso de administrador (RLS) en la tabla perfiles.";
  }
  return message;
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

  const body = await request.json();
  const { limiteDisenosMes } = body as { limiteDisenosMes?: number | null };

  if (limiteDisenosMes !== null && (!Number.isFinite(limiteDisenosMes) || (limiteDisenosMes ?? 0) < 0)) {
    return NextResponse.json({ error: "Límite inválido." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("perfiles")
    .update({ limite_disenos_mes: limiteDisenosMes ?? null })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: mensajeDeError(error.message) }, { status: 500 });
  return NextResponse.json({ perfil: data });
}
