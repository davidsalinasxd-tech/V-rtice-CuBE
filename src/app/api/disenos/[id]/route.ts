import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Diseno } from "@/lib/types/database";

export async function PATCH(request: Request, ctx: RouteContext<"/api/disenos/[id]">) {
  const { id } = await ctx.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await request.json();
  const { rarKey, imagenKey } = body as { rarKey?: string; imagenKey?: string };

  const update: Partial<Pick<Diseno, "rar_url" | "imagen_url">> = {};
  if (rarKey) update.rar_url = rarKey;
  if (imagenKey) update.imagen_url = imagenKey;

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ diseno: data });
}
