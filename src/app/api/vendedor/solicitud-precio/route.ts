import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { esUuid, leerJson, precioValido } from "@/lib/validacion";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await leerJson(request);
  const disenoId = body?.disenoId;
  const esGratis = body?.esGratis;

  if (!esUuid(disenoId) || typeof esGratis !== "boolean") {
    return NextResponse.json({ error: "Faltan datos de la solicitud." }, { status: 400 });
  }

  const precio = esGratis ? 0 : precioValido(body?.precio);
  if (precio === null) {
    return NextResponse.json({ error: "El precio tiene que ser un número entero entre 1 y 10.000.000 Gs." }, { status: 400 });
  }

  const { data: diseno, error: findError } = await supabase
    .from("disenos")
    .select("id")
    .eq("id", disenoId)
    .eq("vendedor_id", user.id)
    .maybeSingle();

  if (findError || !diseno) {
    return NextResponse.json({ error: "Diseño no encontrado." }, { status: 404 });
  }

  const { count: pendientes } = await supabase
    .from("solicitudes_precio")
    .select("id", { count: "exact", head: true })
    .eq("diseno_id", disenoId)
    .eq("estado", "pendiente");

  if ((pendientes ?? 0) > 0) {
    return NextResponse.json({ error: "Ya tenés una solicitud de este diseño en revisión." }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("solicitudes_precio")
    .insert({
      diseno_id: disenoId,
      vendedor_id: user.id,
      es_gratis: esGratis,
      precio,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "No se pudo enviar la solicitud." }, { status: 500 });
  }

  return NextResponse.json({ solicitud: data });
}
