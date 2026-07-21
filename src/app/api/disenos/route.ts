import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensurePerfil } from "@/lib/supabase/perfil";
import { R2_LIMITS } from "@/lib/r2";

const inicioDeMes = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
};

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { error: perfilError } = await ensurePerfil(supabase, user);
  if (perfilError) {
    return NextResponse.json(
      { error: "No se pudo preparar tu perfil de vendedor. Probá cerrar sesión y volver a entrar; si sigue fallando, avisá al administrador." },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { nombre, deporte, formato, esGratis, precio, autoriaConfirmada } = body as {
    nombre?: string;
    deporte?: string;
    formato?: string;
    esGratis?: boolean;
    precio?: number;
    autoriaConfirmada?: boolean;
  };

  if (!nombre || !deporte) {
    return NextResponse.json({ error: "Nombre y deporte son obligatorios." }, { status: 400 });
  }

  if (!autoriaConfirmada) {
    return NextResponse.json(
      { error: "Debés confirmar que el diseño es de tu autoría." },
      { status: 400 }
    );
  }

  const { count: enRevision } = await supabase
    .from("disenos")
    .select("id", { count: "exact", head: true })
    .eq("vendedor_id", user.id)
    .eq("estado", "revision");

  if ((enRevision ?? 0) >= R2_LIMITS.MAX_DISENOS_EN_REVISION) {
    return NextResponse.json(
      { error: `Ya tenés ${R2_LIMITS.MAX_DISENOS_EN_REVISION} diseños en revisión. Esperá la aprobación antes de subir más.` },
      { status: 409 }
    );
  }

  const { count: esteMes } = await supabase
    .from("disenos")
    .select("id", { count: "exact", head: true })
    .eq("vendedor_id", user.id)
    .gte("created_at", inicioDeMes());

  if ((esteMes ?? 0) >= R2_LIMITS.MAX_DISENOS_POR_MES) {
    return NextResponse.json(
      { error: `Alcanzaste el límite de ${R2_LIMITS.MAX_DISENOS_POR_MES} diseños nuevos este mes.` },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from("disenos")
    .insert({
      vendedor_id: user.id,
      nombre,
      deporte,
      formato: formato ?? "AI + PSD + PDF",
      es_gratis: esGratis ?? true,
      precio: esGratis ? 0 : (precio ?? 0),
      autoria_confirmada: true,
      estado: "revision",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ diseno: data });
}
