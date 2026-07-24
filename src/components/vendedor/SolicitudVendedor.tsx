"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { EstadoVendedor } from "@/lib/types/database";

export function SolicitudVendedor({ estado }: { estado: EstadoVendedor }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function solicitar() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vendedor/solicitud", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo enviar la solicitud.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setLoading(false);
    }
  }

  if (estado === "pendiente") {
    return (
      <>
        <h1 className="font-display mb-2.5 text-[26px] text-ink">Tu solicitud está en revisión</h1>
        <p className="text-[14px] leading-relaxed text-text-dim">
          Ya la mandaste. Te vamos a habilitar el panel de vendedor en cuanto la aprobemos.
        </p>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display mb-2.5 text-[26px] text-ink">Convertite en vendedor</h1>
      <p className="mb-6 text-[14px] leading-relaxed text-text-dim">
        {estado === "rechazado"
          ? "Tu solicitud anterior no fue aprobada. Podés volver a intentarlo."
          : "Para subir y vender tus propios diseños necesitás que aprobemos tu cuenta primero."}
      </p>
      <button
        onClick={solicitar}
        disabled={loading}
        className="cursor-pointer rounded-sm bg-orange px-5.5 py-3.25 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60"
      >
        {loading ? "Enviando…" : "Solicitar ser vendedor →"}
      </button>
      {error && <p className="mt-3.5 text-[13px] text-orange">{error}</p>}
    </>
  );
}
