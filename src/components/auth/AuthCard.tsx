"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ensurePerfil } from "@/lib/supabase/perfil";
import type { Rol } from "@/lib/types/database";

export function AuthCard() {
  const [tab, setTab] = useState<"crear" | "entrar">("crear");
  const [rol, setRol] = useState<Rol>("comprador");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarReenviar, setMostrarReenviar] = useState(false);
  const [emailPendiente, setEmailPendiente] = useState<string | null>(null);
  const [reenviado, setReenviado] = useState(false);
  const [recuperar, setRecuperar] = useState(false);
  const [resetEnviado, setResetEnviado] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleCrearCuenta(formData: FormData) {
    setLoading(true);
    setError(null);

    const nombre = String(formData.get("nombre") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("pass") ?? "");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre, rol }, emailRedirectTo: `${window.location.origin}/cuenta-confirmada` },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user && data.session) {
      await ensurePerfil(supabase, data.user);
      router.push(rol === "vendedor" || rol === "ambos" ? "/vendedor" : "/");
      router.refresh();
      return;
    }

    // Confirmación de correo requerida: Supabase no devuelve sesión todavía.
    setEmailPendiente(email);
    setLoading(false);
  }

  async function handleIniciarSesion(formData: FormData) {
    setLoading(true);
    setError(null);
    setMostrarReenviar(false);

    const email = String(formData.get("email2") ?? "");
    const password = String(formData.get("pass2") ?? "");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setError("Todavía no confirmaste tu correo. Revisá tu bandeja de entrada, o reenviamos el link.");
        setMostrarReenviar(true);
        setEmailPendiente(email);
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }

    if (data.user) {
      await ensurePerfil(supabase, data.user);
    }

    router.push("/");
    router.refresh();
  }

  async function handleReenviar() {
    if (!emailPendiente) return;
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: emailPendiente,
      options: { emailRedirectTo: `${window.location.origin}/cuenta-confirmada` },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setReenviado(true);
  }

  async function handleRecuperar(formData: FormData) {
    setLoading(true);
    setError(null);

    const email = String(formData.get("email3") ?? "");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/restablecer-contrasena`,
    });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setResetEnviado(email);
  }

  if (resetEnviado) {
    return (
      <div className="w-full max-w-105 rounded-lg border border-line bg-white p-9 text-center shadow-[0_24px_48px_rgba(0,47,89,0.1)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-orange/10 text-2xl">
          🔑
        </div>
        <h1 className="font-display mb-2 text-xl text-ink">Revisá tu correo</h1>
        <p className="mb-1 text-[13px] leading-relaxed text-text-dim">Te mandamos un link para elegir una nueva contraseña a</p>
        <p className="mb-5 text-sm font-semibold text-navy">{resetEnviado}</p>
        <p className="mb-6 text-[13px] leading-relaxed text-text-dim">
          Si no te llega en unos minutos, revisá spam o volvé a intentar.
        </p>
        <button
          onClick={() => {
            setResetEnviado(null);
            setRecuperar(false);
            setTab("entrar");
          }}
          className="block w-full cursor-pointer text-[13px] text-text-dim hover:text-navy"
        >
          Volver a iniciar sesión →
        </button>
      </div>
    );
  }

  if (recuperar) {
    return (
      <div className="w-full max-w-105 rounded-lg border border-line bg-white p-9 shadow-[0_24px_48px_rgba(0,47,89,0.1)]">
        {error && (
          <div className="mb-4 rounded-sm bg-orange/8 px-3.5 py-3 text-[13px] leading-relaxed text-orange">{error}</div>
        )}
        <form action={handleRecuperar} className="flex flex-col">
          <h1 className="font-display mb-1.5 text-2xl text-ink">Recuperar contraseña</h1>
          <p className="mb-6.5 text-[13px] text-text-dim">
            Escribí tu correo y te mandamos un link para elegir una nueva contraseña.
          </p>

          <Field label="Correo electrónico" name="email3" type="email" placeholder="nombre@correo.com" required />

          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer rounded-[3px] bg-orange py-3.5 text-sm font-bold text-white transition-colors hover:bg-orange-2 disabled:opacity-60"
          >
            {loading ? "Enviando…" : "Enviar link →"}
          </button>
          <button
            type="button"
            onClick={() => {
              setRecuperar(false);
              setError(null);
            }}
            className="mt-4 cursor-pointer text-[13px] text-text-dim hover:text-navy"
          >
            ← Volver a iniciar sesión
          </button>
        </form>
      </div>
    );
  }

  if (emailPendiente && !mostrarReenviar) {
    return (
      <div className="w-full max-w-105 rounded-lg border border-line bg-white p-9 text-center shadow-[0_24px_48px_rgba(0,47,89,0.1)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-orange/10 text-2xl">
          ✉️
        </div>
        <h1 className="font-display mb-2 text-xl text-ink">Revisá tu correo</h1>
        <p className="mb-1 text-[13px] leading-relaxed text-text-dim">
          Te mandamos un link de confirmación a
        </p>
        <p className="mb-5 text-sm font-semibold text-navy">{emailPendiente}</p>
        <p className="mb-6 text-[13px] leading-relaxed text-text-dim">
          Tocá el link del correo para activar tu cuenta. Después vas a poder iniciar sesión normalmente.
        </p>

        {reenviado ? (
          <p className="text-[13px] text-navy-2">Te reenviamos el correo.</p>
        ) : (
          <button
            onClick={handleReenviar}
            disabled={loading}
            className="cursor-pointer text-[13px] font-semibold text-navy-2 hover:text-orange disabled:opacity-60"
          >
            {loading ? "Reenviando…" : "¿No te llegó? Reenviar correo"}
          </button>
        )}

        <button
          onClick={() => {
            setEmailPendiente(null);
            setTab("entrar");
          }}
          className="mt-6 block w-full cursor-pointer text-[13px] text-text-dim hover:text-navy"
        >
          Volver a iniciar sesión →
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-105 rounded-lg border border-line bg-white p-9 shadow-[0_24px_48px_rgba(0,47,89,0.1)]">
      <div className="mb-7 flex gap-0.5 rounded-[3px] border border-line-strong bg-paper p-0.5">
        <button
          onClick={() => setTab("crear")}
          className={`flex-1 cursor-pointer rounded-sm py-2.25 text-[13px] font-semibold transition-colors ${
            tab === "crear" ? "bg-orange text-white" : "text-text-dim"
          }`}
        >
          Crear cuenta
        </button>
        <button
          onClick={() => setTab("entrar")}
          className={`flex-1 cursor-pointer rounded-sm py-2.25 text-[13px] font-semibold transition-colors ${
            tab === "entrar" ? "bg-orange text-white" : "text-text-dim"
          }`}
        >
          Iniciar sesión
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-sm bg-orange/8 px-3.5 py-3 text-[13px] leading-relaxed text-orange">
          {error}
          {mostrarReenviar && (
            <button
              onClick={handleReenviar}
              disabled={loading}
              className="mt-1.5 block cursor-pointer font-semibold underline disabled:opacity-60"
            >
              {loading ? "Reenviando…" : "Reenviar correo de confirmación"}
            </button>
          )}
        </div>
      )}

      {tab === "crear" ? (
        <form action={handleCrearCuenta} className="flex flex-col">
          <h1 className="font-display mb-1.5 text-2xl text-ink">Sumate a Vértice Cube</h1>
          <p className="mb-6.5 text-[13px] text-text-dim">Elegí cómo vas a usar tu cuenta. Podés cambiarlo después.</p>

          <div className="mb-6 grid grid-cols-2 gap-2.5">
            <RoleCard
              icon="↓"
              titulo="Comprar diseños"
              desc="Descargar diseños gratis y comprar los premium"
              checked={rol === "comprador"}
              onClick={() => setRol("comprador")}
            />
            <RoleCard
              icon="↑"
              titulo="Vender diseños"
              desc="Subir tus kits y cobrar por cada descarga"
              checked={rol === "vendedor"}
              onClick={() => setRol("vendedor")}
            />
          </div>

          <Field label="Nombre completo" name="nombre" type="text" placeholder="Martina Duarte" required />
          <Field label="Correo electrónico" name="email" type="email" placeholder="nombre@correo.com" required />
          <Field label="Contraseña" name="pass" type="password" placeholder="Mínimo 8 caracteres" required minLength={8} />

          <label className="mb-5.5 flex items-start gap-2.5 text-xs leading-relaxed text-text-dim">
            <input type="checkbox" required className="mt-0.5 accent-orange" />
            Acepto los Términos de uso y la Política de privacidad de VÉRTICE CUBE
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer rounded-[3px] bg-orange py-3.5 text-sm font-bold text-white transition-colors hover:bg-orange-2 disabled:opacity-60"
          >
            {loading ? "Creando cuenta…" : "Crear cuenta →"}
          </button>
          <p className="mt-3.5 text-center text-[11.5px] leading-relaxed text-text-dim">
            Te vamos a mandar un correo para confirmar la cuenta antes de que puedas ingresar.
          </p>
        </form>
      ) : (
        <form action={handleIniciarSesion} className="flex flex-col">
          <h1 className="font-display mb-1.5 text-2xl text-ink">Bienvenido de nuevo</h1>
          <p className="mb-6.5 text-[13px] text-text-dim">Iniciá sesión para seguir comprando o vendiendo diseños.</p>

          <Field label="Correo electrónico" name="email2" type="email" placeholder="nombre@correo.com" required />
          <Field label="Contraseña" name="pass2" type="password" placeholder="Tu contraseña" required />

          <button
            type="button"
            onClick={() => {
              setRecuperar(true);
              setError(null);
            }}
            className="mb-5 cursor-pointer self-end text-[12.5px] text-navy-2 hover:text-orange"
          >
            ¿Olvidaste tu contraseña?
          </button>

          <button
            type="submit"
            disabled={loading}
            className="w-full cursor-pointer rounded-[3px] bg-orange py-3.5 text-sm font-bold text-white transition-colors hover:bg-orange-2 disabled:opacity-60"
          >
            {loading ? "Ingresando…" : "Iniciar sesión →"}
          </button>
        </form>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  type,
  placeholder,
  required,
  minLength,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <div className="mb-4 flex flex-col gap-1.5">
      <label htmlFor={name} className="text-xs text-text-dim">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        required={required}
        minLength={minLength}
        className="rounded-[3px] border border-line-strong bg-paper px-3.25 py-3 text-sm transition-colors focus:border-orange focus:outline-none"
      />
    </div>
  );
}

function RoleCard({
  icon,
  titulo,
  desc,
  checked,
  onClick,
}: {
  icon: string;
  titulo: string;
  desc: string;
  checked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-md border px-3.5 py-4 text-left transition-colors ${
        checked ? "border-orange bg-orange/6" : "border-line-strong hover:border-text-dim"
      }`}
    >
      <span className={`mb-2.5 block font-mono text-base ${checked ? "text-orange" : "text-text-dim"}`}>{icon}</span>
      <h4 className="mb-1 text-[13px] text-ink">{titulo}</h4>
      <p className="text-[11px] leading-relaxed text-text-dim">{desc}</p>
    </button>
  );
}
