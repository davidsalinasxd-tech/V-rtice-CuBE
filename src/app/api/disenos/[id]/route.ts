import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import {
  EXTENSION_POR_TIPO_IMAGEN,
  R2_LIMITS,
  TIPOS_RAR,
  deleteObject,
  esClaveImagenDe,
  esClaveRarDe,
  getObjetoInfo,
} from "@/lib/r2";
import { esUuid, leerJson } from "@/lib/validacion";
import type { Diseno } from "@/lib/types/database";

/** Confirma en R2 que el archivo subido existe y es lo que se autorizó; si no, lo borra. */
async function verificarSubida(key: string, kind: "rar" | "imagen") {
  const info = await getObjetoInfo(key);
  if (!info) return "No encontramos el archivo subido. Volvé a intentarlo.";

  const maxBytes = kind === "rar" ? R2_LIMITS.MAX_RAR_BYTES : R2_LIMITS.MAX_IMAGEN_BYTES;
  const tipo = info.contentType ?? "";
  const tipoValido =
    kind === "rar" ? (TIPOS_RAR as readonly string[]).includes(tipo) : tipo in EXTENSION_POR_TIPO_IMAGEN;

  if (info.bytes < 1 || info.bytes > maxBytes || !tipoValido) {
    await deleteObject(key).catch(() => {});
    return "El archivo subido no cumple los requisitos de tipo o tamaño.";
  }
  return null;
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/disenos/[id]">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  if (!esUuid(id)) {
    return NextResponse.json({ error: "Diseño no encontrado." }, { status: 404 });
  }

  const body = await leerJson(request);
  const rarKey = body?.rarKey;
  const imagenKey = body?.imagenKey;

  const { data: actual } = await supabase
    .from("disenos")
    .select("id, vendedor_id, estado, imagen_url")
    .eq("id", id)
    .eq("vendedor_id", user.id)
    .maybeSingle();

  if (!actual) {
    return NextResponse.json({ error: "Diseño no encontrado." }, { status: 404 });
  }

  if (actual.estado !== "revision" && !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Este diseño ya no admite cambios de archivo." }, { status: 409 });
  }

  const update: Partial<Pick<Diseno, "rar_url" | "imagen_url">> = {};

  // Las claves no se aceptan tal cual: tienen que ser exactamente las que el servidor emitió.
  if (rarKey !== undefined) {
    if (typeof rarKey !== "string" || !esClaveRarDe(id, rarKey)) {
      return NextResponse.json({ error: "Archivo no válido." }, { status: 400 });
    }
    const problema = await verificarSubida(rarKey, "rar");
    if (problema) return NextResponse.json({ error: problema }, { status: 400 });
    update.rar_url = rarKey;
  }

  if (imagenKey !== undefined) {
    if (typeof imagenKey !== "string" || !esClaveImagenDe(id, imagenKey)) {
      return NextResponse.json({ error: "Imagen no válida." }, { status: 400 });
    }
    const problema = await verificarSubida(imagenKey, "imagen");
    if (problema) return NextResponse.json({ error: problema }, { status: 400 });
    update.imagen_url = imagenKey;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nada para actualizar." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("disenos")
    .update(update)
    .eq("id", id)
    .eq("vendedor_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "No se pudo guardar el archivo. Probá de nuevo." }, { status: 500 });
  }

  // Si la portada cambió de formato (jpg → png), no dejamos la anterior huérfana.
  if (update.imagen_url && actual.imagen_url && actual.imagen_url !== update.imagen_url && esClaveImagenDe(id, actual.imagen_url)) {
    await deleteObject(actual.imagen_url).catch(() => {});
  }

  return NextResponse.json({ diseno: data });
}
