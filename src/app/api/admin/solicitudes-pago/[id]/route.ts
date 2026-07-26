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
  const { accion } = body as { accion?: "pagar" | "cancelar" };

  if (accion !== "pagar" && accion !== "cancelar") {
    return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  }

  if (accion === "cancelar") {
    const { error } = await supabase.from("solicitudes_pago").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  const { data, error } = await supabase
    .from("solicitudes_pago")
    .update({ estado: "pagado", pagado_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ solicitud: data });
}
