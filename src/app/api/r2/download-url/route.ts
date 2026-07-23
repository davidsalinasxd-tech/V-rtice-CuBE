import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDownloadUrl } from "@/lib/r2";
import { getEstadoSuscripcion, getCupoDescargaExterna } from "@/lib/supabase/subscription";

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await request.json();
  const { disenoId } = body as { disenoId?: string };

  if (!disenoId) {
    return NextResponse.json({ error: "Falta el id del diseño." }, { status: 400 });
  }

  const { data: diseno, error } = await supabase
    .from("disenos")
    .select("*")
    .eq("id", disenoId)
    .eq("estado", "publicado")
    .single();

  if (error || !diseno || !diseno.rar_url) {
    return NextResponse.json({ error: "Diseño no disponible para descarga." }, { status: 404 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let viaSuscripcion = false;

  if (!diseno.es_gratis) {
    if (!user) {
      return NextResponse.json(
        { error: "Este diseño es pago. Coordiná el pago por Telegram.", motivo: "sin_suscripcion" },
        { status: 403 },
      );
    }

    const estado = await getEstadoSuscripcion(supabase, user.id);
    if (!estado.activa) {
      return NextResponse.json(
        { error: "Necesitás una suscripción activa para descargar este diseño directo.", motivo: "sin_suscripcion" },
        { status: 403 },
      );
    }

    if (!diseno.es_oficial) {
      const cupo = await getCupoDescargaExterna(supabase, user.id);
      if (!cupo.disponible) {
        return NextResponse.json(
          {
            error: "Ya usaste tu cupo de descargas externas de este mes o de hoy.",
            motivo: "cupo_agotado",
          },
          { status: 403 },
        );
      }
    }

    viaSuscripcion = true;
  }

  const url = await getDownloadUrl(diseno.rar_url);

  await supabase.from("descargas").insert({
    diseno_id: diseno.id,
    usuario_id: user?.id ?? null,
    precio_pagado: 0,
    via_suscripcion: viaSuscripcion,
    cuenta_para_pago: !user || user.id !== diseno.vendedor_id,
  });

  return NextResponse.json({ url });
}
