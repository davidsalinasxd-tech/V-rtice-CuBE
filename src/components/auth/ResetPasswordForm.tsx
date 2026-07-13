"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordForm() {
  const [checking, setChecking] = useState(true);
  const [sesionValida, setSesionValida] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSesionValida(!!data.session);
      setChecking(false);
    });
  }, [supabase]);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    const pass = String(formData.get("pass") ?? "");
    const pass2 = String(formData.get("pass2") ?? "");

    if (pass !== pass2) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: pass });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setListo(true);
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 2000);
  }

  if (checking) {
    return (
      <div className="w-full max-w-105 rounded-lg border border-line bg-white p-9 text-center shadow-[0_24px_48px_rgba(0,47,89,0.1)]">
        <p className="text-[13px] text-text-dim">Verificando el link…</p>
      </div>
    );
  }

  if (!sesionValida) {
    return (
      <div className="w-full max-w-105 rounded-lg border border-line bg-white p-9 text-center shadow-[0_24px_48px_rgba(0,47,89,0.1)]">
        <h1 className="font-display mb-2 text-xl text-ink">Link inválido o vencido</h1>
        <p className="mb-6 text-[13px] leading-relaxed text-text-dim">
          Este link para restablecer la contraseña ya no es válido. Pedí uno nuevo desde la pantalla de inicio de
          sesión.
        </p>
        <Link
          href="/registro"
          className="inline-block rounded-[3px] bg-orange px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-2"
        >
          Volver a intentar
        </Link>
      </div>
    );
  }

  if (listo) {
    return (
      <div className="w-full max-w-105 rounded-lg border border-line bg-white p-9 text-center shadow-[0_24px_48px_rgba(0,47,89,0.1)]">
        <h1 className="font-display mb-2 text-xl text-ink">Contraseña actualizada</h1>
        <p className="text-[13px] leading-relaxed text-text-dim">Ya podés seguir usando tu cuenta. Redirigiendo…</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-105 rounded-lg border border-line bg-white p-9 shadow-[0_24px_48px_rgba(0,47,89,0.1)]">
      {error && (
        <div className="mb-4 rounded-sm bg-orange/8 px-3.5 py-3 text-[13px] leading-relaxed text-orange">{error}</div>
      )}
      <form action={handleSubmit} className="flex flex-col">
        <h1 className="font-display mb-1.5 text-2xl text-ink">Elegí una nueva contraseña</h1>
        <p className="mb-6.5 text-[13px] text-text-dim">Tiene que tener al menos 8 caracteres.</p>

        <div className="mb-4 flex flex-col gap-1.5">
          <label htmlFor="pass" className="text-xs text-text-dim">
            Nueva contraseña
          </label>
          <input
            id="pass"
            name="pass"
            type="password"
            placeholder="Mínimo 8 caracteres"
            required
            minLength={8}
            className="rounded-[3px] border border-line-strong bg-paper px-3.25 py-3 text-sm transition-colors focus:border-orange focus:outline-none"
          />
        </div>
        <div className="mb-5.5 flex flex-col gap-1.5">
          <label htmlFor="pass2" className="text-xs text-text-dim">
            Repetir contraseña
          </label>
          <input
            id="pass2"
            name="pass2"
            type="password"
            placeholder="Repetí la contraseña"
            required
            minLength={8}
            className="rounded-[3px] border border-line-strong bg-paper px-3.25 py-3 text-sm transition-colors focus:border-orange focus:outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full cursor-pointer rounded-[3px] bg-orange py-3.5 text-sm font-bold text-white transition-colors hover:bg-orange-2 disabled:opacity-60"
        >
          {loading ? "Guardando…" : "Guardar contraseña →"}
        </button>
      </form>
    </div>
  );
}
