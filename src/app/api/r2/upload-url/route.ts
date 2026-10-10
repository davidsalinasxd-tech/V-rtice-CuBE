import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import {
  EXTENSION_POR_TIPO_IMAGEN,
  R2_LIMITS,
  TIPOS_RAR,
  disenoImagenKey,
  disenoRarKey,
  getUploadUrl,
} from "@/lib/r2";
import { enteroEnRango, esUuid, leerJson } from "@/lib/validacion";

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
  const kind = body?.kind;
  const contentType = body?.contentType;

  if (!esUuid(disenoId) || (kind !== "rar" && kind !== "imagen") || typeof contentType !== "string") {
    return NextResponse.json({ error: "Faltan datos del archivo." }, { status: 400 });
  }

  const maxBytes = kind === "rar" ? R2_LIMITS.MAX_RAR_BYTES : R2_LIMITS.MAX_IMAGEN_BYTES;
  const sizeBytes = enteroEnRango(body?.sizeBytes, 1, maxBytes);
  if (sizeBytes === null) {
    return NextResponse.json(
      { error: kind === "rar" ? "El archivo .rar supera el máximo de 50 MB." : "La imagen de portada supera el máximo de 3 MB." },
      { status: 400 },
    );
  }

  const { data: diseno, error } = await supabase
    .from("disenos")
    .select("id, vendedor_id, estado")
    .eq("id", disenoId)
    .single();

  if (error || !diseno) {
    return NextResponse.json({ error: "Diseño no encontrado." }, { status: 404 });
  }

  if (diseno.vendedor_id !== user.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  // Solo se sube mientras el diseño está en revisión (o es un oficial del admin):
  // un diseño ya publicado no puede cambiar su archivo por debajo de los compradores.
  if (diseno.estado !== "revision" && !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Este diseño ya no admite cambios de archivo." }, { status: 409 });
  }

  if (kind === "rar") {
    if (!(TIPOS_RAR as readonly string[]).includes(contentType)) {
      return NextResponse.json({ error: "El archivo debe ser un .rar." }, { status: 400 });
    }
    const key = disenoRarKey(diseno.id);
    const url = await getUploadUrl(key, contentType, sizeBytes);
    return NextResponse.json({ url, key });
  }

  const extension = EXTENSION_POR_TIPO_IMAGEN[contentType];
  if (!extension) {
    return NextResponse.json({ error: "La portada debe ser JPG, PNG o WEBP." }, { status: 400 });
  }
  const key = disenoImagenKey(diseno.id, extension);
  const url = await getUploadUrl(key, contentType, sizeBytes);
  return NextResponse.json({ url, key });
}
