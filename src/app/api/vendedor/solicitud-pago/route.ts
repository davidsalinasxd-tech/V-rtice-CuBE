import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { R2_LIMITS } from "@/lib/r2";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const [{ count: aprobados }, { data: metodo }, { count: pendientes }] = await Promise.all([
    supabase
      .from("disenos")
      .select("id", { count: "exact", head: true })
      .eq("vendedor_id", user.id)
      .eq("estado", "publicado"),
    supabase.from("metodos_cobro").select("*").eq("vendedor_id", user.id).maybeSingle(),
    supabase
      .from("solicitudes_pago")
      .select("id", { count: "exact", head: true })
      .eq("vendedor_id", user.id)
      .eq("estado", "pendiente"),
  ]);

  if ((aprobados ?? 0) < R2_LIMITS.DISENOS_APROBADOS_PARA_COBRO) {
    return NextResponse.json({ error: "Todavía no llegaste al mínimo de diseños aprobados." }, { status: 403 });
  }

  const metodoCompleto = !!(metodo?.banco && metodo?.numero_cuenta && metodo?.titular && metodo?.ci_ruc);
  if (!metodoCompleto) {
    return NextResponse.json(
      { error: "Completá tus datos de transferencia antes de solicitar el pago." },
      { status: 400 }
    );
  }

  if ((pendientes ?? 0) > 0) {
    return NextResponse.json({ error: "Ya tenés una solicitud de pago en revisión." }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("solicitudes_pago")
    .insert({ vendedor_id: user.id })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "No se pudo enviar la solicitud." }, { status: 500 });
  }

  return NextResponse.json({ solicitud: data });
}
