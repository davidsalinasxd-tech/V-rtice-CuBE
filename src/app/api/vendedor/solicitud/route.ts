import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensurePerfil } from "@/lib/supabase/perfil";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  await ensurePerfil(supabase, user);

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("estado_vendedor")
    .eq("id", user.id)
    .maybeSingle();

  if (perfil?.estado_vendedor === "aprobado" || perfil?.estado_vendedor === "pendiente") {
    return NextResponse.json({ error: "Ya tenés una solicitud aprobada o en revisión." }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("perfiles")
    .update({ estado_vendedor: "pendiente" })
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "No se pudo enviar la solicitud. Probá de nuevo en un momento." },
      { status: 500 }
    );
  }

  return NextResponse.json({ perfil: data });
}
