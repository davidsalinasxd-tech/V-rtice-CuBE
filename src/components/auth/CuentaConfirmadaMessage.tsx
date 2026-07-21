"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { ensurePerfil } from "@/lib/supabase/perfil";

export function CuentaConfirmadaMessage() {
  const [checking, setChecking] = useState(true);
  const [confirmado, setConfirmado] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        await ensurePerfil(supabase, data.session.user);
      }
      setConfirmado(!!data.session);
      setChecking(false);
    });
  }, [supabase]);

  if (checking) {
    return (
      <div className="w-full max-w-105 rounded-lg border border-line bg-white p-9 text-center shadow-[0_24px_48px_rgba(0,47,89,0.1)]">
        <p className="text-[13px] text-text-dim">Confirmando tu cuenta…</p>
      </div>
    );
  }

  if (!confirmado) {
    return (
      <div className="w-full max-w-105 rounded-lg border border-line bg-white p-9 text-center shadow-[0_24px_48px_rgba(0,47,89,0.1)]">
        <h1 className="font-display mb-2 text-xl text-ink">Este link ya no es válido</h1>
        <p className="mb-6 text-[13px] leading-relaxed text-text-dim">
          Puede que ya hayas confirmado tu cuenta antes, o que el link haya vencido. Probá iniciar sesión
          directamente.
        </p>
        <Link
          href="/registro"
          className="inline-block rounded-[3px] bg-orange px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-2"
        >
          Ir a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-105 rounded-lg border border-line bg-white p-9 text-center shadow-[0_24px_48px_rgba(0,47,89,0.1)]">
      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-navy/8 text-2xl">
        ✓
      </div>
      <h1 className="font-display mb-2 text-xl text-ink">¡Listo! Tu cuenta está confirmada</h1>
      <p className="mb-6 text-[13px] leading-relaxed text-text-dim">
        Ya podés explorar el catálogo, descargar diseños gratis y, si querés, empezar a vender los tuyos.
      </p>
      <Link
        href="/"
        className="inline-block rounded-[3px] bg-orange px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-2"
      >
        Ir al catálogo →
      </Link>
    </div>
  );
}
