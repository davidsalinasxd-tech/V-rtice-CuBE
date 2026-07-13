"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Rol } from "@/lib/types/database";

async function asegurarPerfil(supabase: ReturnType<typeof createClient>, userId: string, nombre: string, rol: Rol) {
  await supabase.from("perfiles").upsert({ id: userId, nombre, rol }, { onConflict: "id", ignoreDuplicates: true });
}

export function AuthCard() {
  const [tab, setTab] = useState<"crear" | "entrar">("crear");
  const [rol, setRol] = useState<Rol>("comprador");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleCrearCuenta(formData: FormData) {
    setLoading(true);
    setError(null);
    setInfo(null);

    const nombre = String(formData.get("nombre") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("pass") ?? "");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nombre, rol } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user && data.session) {
      await asegurarPerfil(supabase, data.user.id, nombre, rol);
      router.push(rol === "vendedor" || rol === "ambos" ? "/vendedor" : "/");
      router.refresh();
      return;
    }

    setInfo("Revisá tu correo para confirmar la cuenta antes de iniciar sesión.");
    setLoading(false);
  }

  async function handleIniciarSesion(formData: FormData) {
    setLoading(true);
    setError(null);
    setInfo(null);

    const email = String(formData.get("email2") ?? "");
    const password = String(formData.get("pass2") ?? "");

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const metaNombre = (data.user.user_metadata?.nombre as string | undefined) ?? email;
      const metaRol = (data.user.user_metadata?.rol as Rol | undefined) ?? "comprador";
      await asegurarPerfil(supabase, data.user.id, metaNombre, metaRol);
    }

    router.push("/");
    router.refresh();
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

      {error && <p className="mb-4 text-[13px] text-orange">{error}</p>}
      {info && <p className="mb-4 text-[13px] text-navy-2">{info}</p>}

      {tab === "crear" ? (
        <form
          action={handleCrearCuenta}
          className="flex flex-col"
        >
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
        </form>
      ) : (
        <form action={handleIniciarSesion} className="flex flex-col">
          <h1 className="font-display mb-1.5 text-2xl text-ink">Bienvenido de nuevo</h1>
          <p className="mb-6.5 text-[13px] text-text-dim">Iniciá sesión para seguir comprando o vendiendo diseños.</p>

          <Field label="Correo electrónico" name="email2" type="email" placeholder="nombre@correo.com" required />
          <Field label="Contraseña" name="pass2" type="password" placeholder="Tu contraseña" required />

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
