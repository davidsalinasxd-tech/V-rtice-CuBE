import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDownloadUrl } from "@/lib/r2";

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

  const url = await getDownloadUrl(diseno.rar_url);

  await supabase.from("descargas").insert({
    diseno_id: diseno.id,
    usuario_id: user?.id ?? null,
    precio_pagado: diseno.es_gratis ? 0 : diseno.precio,
  });

  return NextResponse.json({ url });
}
