import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { R2_LIMITS, disenoImagenKey, disenoRarKey, getUploadUrl } from "@/lib/r2";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await request.json();
  const { disenoId, kind, contentType, sizeBytes, extension } = body as {
    disenoId?: string;
    kind?: "rar" | "imagen";
    contentType?: string;
    sizeBytes?: number;
    extension?: string;
  };

  if (!disenoId || !kind || !contentType || !sizeBytes) {
    return NextResponse.json({ error: "Faltan datos del archivo." }, { status: 400 });
  }

  const { data: diseno, error } = await supabase
    .from("disenos")
    .select("id, vendedor_id")
    .eq("id", disenoId)
    .single();

  if (error || !diseno) {
    return NextResponse.json({ error: "Diseño no encontrado." }, { status: 404 });
  }

  if (diseno.vendedor_id !== user.id) {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  if (kind === "rar") {
    if (sizeBytes > R2_LIMITS.MAX_RAR_BYTES) {
      return NextResponse.json({ error: "El archivo .rar supera el máximo de 50 MB." }, { status: 400 });
    }
    const key = disenoRarKey(diseno.id);
    const url = await getUploadUrl(key, contentType);
    return NextResponse.json({ url, key });
  }

  if (sizeBytes > R2_LIMITS.MAX_IMAGEN_BYTES) {
    return NextResponse.json({ error: "La imagen de portada supera el máximo de 3 MB." }, { status: 400 });
  }
  const key = disenoImagenKey(diseno.id, extension ?? "jpg");
  const url = await getUploadUrl(key, contentType);
  return NextResponse.json({ url, key });
}
