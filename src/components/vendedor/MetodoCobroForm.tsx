"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { MetodoCobro } from "@/lib/types/database";

export function MetodoCobroForm({ vendedorId, metodo }: { vendedorId: string; metodo: MetodoCobro | null }) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setSaved(false);

    await supabase.from("metodos_cobro").upsert(
      {
        vendedor_id: vendedorId,
        banco: String(formData.get("banco") ?? ""),
        numero_cuenta: String(formData.get("cuenta") ?? ""),
        titular: String(formData.get("titular") ?? ""),
        ci_ruc: String(formData.get("ci") ?? ""),
      },
      { onConflict: "vendedor_id" }
    );

    setSaving(false);
    setSaved(true);
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      <p className="text-[13px] leading-relaxed text-text-dim">
        Por ahora los pagos a vendedores se procesan por transferencia bancaria manual. Estamos evaluando sumar
        cobro automático (vía dLocal) más adelante.
      </p>
      <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2">
        <Field label="Banco" name="banco" placeholder="Ej. Banco Itaú" defaultValue={metodo?.banco ?? ""} />
        <Field label="Número de cuenta" name="cuenta" placeholder="0000-000000-0" defaultValue={metodo?.numero_cuenta ?? ""} />
        <Field label="Titular de la cuenta" name="titular" placeholder="Nombre completo" defaultValue={metodo?.titular ?? ""} />
        <Field label="CI / RUC" name="ci" placeholder="0.000.000" defaultValue={metodo?.ci_ruc ?? ""} />
      </div>
      <button
        type="submit"
        disabled={saving}
        className="w-fit cursor-pointer rounded-sm bg-orange px-5.5 py-3.25 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {saving ? "Guardando…" : "Guardar método de cobro"}
      </button>
      {saved && <p className="text-[13px] text-navy-2">Guardado.</p>}
    </form>
  );
}

function Field({
  label,
  name,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder: string;
  defaultValue: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-xs text-text-dim">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="rounded-[3px] border border-line-strong bg-white px-3 py-2.75 text-sm focus:border-orange focus:outline-none"
      />
    </div>
  );
}
