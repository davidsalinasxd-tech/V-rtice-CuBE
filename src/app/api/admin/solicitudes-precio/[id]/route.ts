import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";

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
  const { accion } = body as { accion?: "aprobar" | "rechazar" };

  if (accion !== "aprobar" && accion !== "rechazar") {
    return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  }

  const { data: solicitud, error: findError } = await supabase
    .from("solicitudes_precio")
    .select("*")
    .eq("id", id)
    .eq("estado", "pendiente")
    .single();

  if (findError || !solicitud) {
    return NextResponse.json({ error: "Solicitud no encontrada o ya resuelta." }, { status: 404 });
  }

  if (accion === "aprobar") {
    const { error: updateError } = await supabase
      .from("disenos")
      .update({ es_gratis: solicitud.es_gratis, precio: solicitud.precio })
      .eq("id", solicitud.diseno_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }
  }

  const { data, error } = await supabase
    .from("solicitudes_precio")
    .update({ estado: accion === "aprobar" ? "aprobada" : "rechazada" })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ solicitud: data });
}
