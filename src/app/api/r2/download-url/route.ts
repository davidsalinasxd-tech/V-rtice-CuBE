import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { esClaveRarDe, getDownloadUrl } from "@/lib/r2";
import { esUuid, leerJson } from "@/lib/validacion";
import { getEstadoSuscripcion, getCupoDescargaExterna } from "@/lib/supabase/subscription";

export async function POST(request: Request) {
  const supabase = await createClient();
  const body = await leerJson(request);
  const disenoId = body?.disenoId;

  if (!esUuid(disenoId)) {
    return NextResponse.json({ error: "Falta el id del diseño." }, { status: 400 });
  }

  const { data: diseno, error } = await supabase
    .from("disenos")
    .select("*")
    .eq("id", disenoId)
    .eq("estado", "publicado")
    .single();

  // Solo se firma la clave canónica del diseño: una ruta manipulada en la base no sirve para leer otros archivos.
  if (error || !diseno || !diseno.rar_url || !esClaveRarDe(diseno.id, diseno.rar_url)) {
    return NextResponse.json({ error: "Diseño no disponible para descarga." }, { status: 404 });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Necesitás una cuenta para descargar. Iniciá sesión o registrate gratis.", motivo: "sin_cuenta" },
      { status: 401 },
    );
  }

  let viaSuscripcion = false;

  if (!diseno.es_gratis) {
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

  // Se registra la descarga ANTES de firmar: así la base (con su control de cupos) decide
  // y nunca se entrega un archivo que no quedó contado.
  const { error: descargaError } = await supabase.from("descargas").insert({
    diseno_id: diseno.id,
    usuario_id: user.id,
    precio_pagado: 0,
    via_suscripcion: viaSuscripcion,
    cuenta_para_pago: user.id !== diseno.vendedor_id,
  });

  if (descargaError) {
    if (descargaError.code === "P0001") {
      return NextResponse.json(
        { error: "No tenés cupo para descargar este diseño ahora.", motivo: "cupo_agotado" },
        { status: 403 },
      );
    }
    // Otro fallo de registro: no se bloquea al usuario por un problema nuestro.
    console.error("No se pudo registrar la descarga:", descargaError.code);
  }

  const url = await getDownloadUrl(diseno.rar_url);

  return NextResponse.json({ url });
}
