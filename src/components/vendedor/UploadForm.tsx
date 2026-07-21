"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function UploadForm() {
  const router = useRouter();
  const [esGratis, setEsGratis] = useState(true);
  const [precio, setPrecio] = useState("");
  const [autoria, setAutoria] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const rarInput = useRef<HTMLInputElement>(null);
  const imgInput = useRef<HTMLInputElement>(null);

  const neto = precio ? Math.round(parseInt(precio, 10) * 0.8) : 0;

  async function subirArchivo(disenoId: string, kind: "rar" | "imagen", file: File) {
    const res = await fetch("/api/r2/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        disenoId,
        kind,
        contentType: file.type || "application/octet-stream",
        sizeBytes: file.size,
        extension: file.name.split(".").pop(),
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "No se pudo generar la URL de subida.");

    const put = await fetch(json.url, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
    if (!put.ok) throw new Error(`Falló la subida a R2 (${kind}).`);

    return json.key as string;
  }

  async function handleSubmit(formData: FormData) {
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const nombre = String(formData.get("nombre") ?? "");
      const deporte = String(formData.get("deporte") ?? "");
      const formato = String(formData.get("formato") ?? "");
      const rarFile = rarInput.current?.files?.[0];
      const imgFile = imgInput.current?.files?.[0];

      if (!nombre || !deporte) throw new Error("Completá nombre y deporte.");
      if (!autoria) throw new Error("Confirmá la autoría del diseño.");
      if (!rarFile) throw new Error("Falta el archivo .rar.");
      if (!imgFile) throw new Error("Falta la imagen de portada.");

      const createRes = await fetch("/api/disenos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre,
          deporte,
          formato,
          esGratis,
          precio: esGratis ? 0 : parseInt(precio || "0", 10),
          autoriaConfirmada: autoria,
        }),
      });
      const createJson = await createRes.json();
      if (!createRes.ok) throw new Error(createJson.error ?? "No se pudo crear el diseño.");
      const disenoId = createJson.diseno.id as string;

      const [rarKey, imagenKey] = await Promise.all([
        subirArchivo(disenoId, "rar", rarFile),
        subirArchivo(disenoId, "imagen", imgFile),
      ]);

      const patchRes = await fetch(`/api/disenos/${disenoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rarKey, imagenKey }),
      });
      if (!patchRes.ok) throw new Error("El diseño se creó pero no se pudieron guardar los archivos.");

      setSuccess("Diseño enviado a revisión.");
      setPrecio("");
      setAutoria(false);
      if (rarInput.current) rarInput.current.value = "";
      if (imgInput.current) imgInput.current.value = "";
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label
          htmlFor="rar-input"
          className="cursor-pointer rounded-md border-1.5 border-dashed border-line-strong px-5 py-7 text-center transition-colors hover:border-orange hover:bg-orange/5"
        >
          <div className="mx-auto mb-3.5 flex h-10 w-10 items-center justify-center rounded-md border-1.5 border-line-strong font-mono text-[11px] text-text-dim">
            .RAR
          </div>
          <p className="mb-1 text-sm">Arrastrá el archivo .rar acá, o hacé clic para buscarlo</p>
          <span className="text-xs text-text-dim">Máx. 50 MB · incluí AI, PSD o PDF dentro del .rar</span>
          <input ref={rarInput} id="rar-input" type="file" accept=".rar" className="hidden" />
        </label>
        <label
          htmlFor="img-input"
          className="cursor-pointer rounded-md border-1.5 border-dashed border-line-strong px-5 py-7 text-center transition-colors hover:border-orange hover:bg-orange/5"
        >
          <div className="mx-auto mb-3.5 flex h-10 w-10 items-center justify-center rounded-md border-1.5 border-line-strong font-mono text-[11px] text-text-dim">
            IMG
          </div>
          <p className="mb-1 text-sm">Arrastrá tu imagen ya exportada con el marco</p>
          <span className="text-xs text-text-dim">JPG · máx. 3 MB · sin el marco oficial no se aprueba</span>
          <input ref={imgInput} id="img-input" type="file" accept="image/*" className="hidden" />
        </label>
      </div>

      <a href="/plantilla-marco-oficial.rar" download className="flex items-center gap-2 text-[13px] text-navy-2 hover:text-ink">
        <span className="rounded-sm border border-line-strong bg-white px-1.75 py-0.75 font-mono text-[11px] text-text-dim">
          .RAR
        </span>
        Descargar plantilla oficial del marco (CDR + PDF) →
      </a>

      <div className="flex w-fit gap-0.5 rounded-[3px] border border-line-strong bg-paper p-0.5">
        <button
          type="button"
          onClick={() => setEsGratis(false)}
          className={`cursor-pointer rounded-sm px-4 py-2 text-xs font-semibold transition-colors ${
            !esGratis ? "bg-orange text-white" : "text-text-dim"
          }`}
        >
          Diseño pago
        </button>
        <button
          type="button"
          onClick={() => setEsGratis(true)}
          className={`cursor-pointer rounded-sm px-4 py-2 text-xs font-semibold transition-colors ${
            esGratis ? "bg-navy-2 text-white" : "text-text-dim"
          }`}
        >
          Diseño gratis
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4.5 sm:grid-cols-2">
        <TextField label="Nombre del diseño" name="nombre" placeholder="Ej. Kit Local Estrella" required />
        <SelectField label="Deporte" name="deporte" options={["Fútbol", "Básquetbol", "Vóleibol", "Otro"]} />
        {!esGratis && (
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-text-dim">Precio de venta (Gs.)</label>
            <input
              type="number"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="25000"
              className="rounded-[3px] border border-line-strong bg-white px-3 py-2.75 text-sm focus:border-orange focus:outline-none"
            />
          </div>
        )}
        <SelectField label="Formatos incluidos" name="formato" options={["AI + PSD + PDF", "AI + PSD", "Solo PSD"]} />
      </div>

      {!esGratis ? (
        <div className="flex items-center justify-between rounded-[3px] bg-paper px-4 py-3.5 text-[13px] text-text-dim">
          <span>
            Con un precio de <b className="text-ink">Gs. {(parseInt(precio || "0", 10)).toLocaleString("es-PY")}</b>,
            recibís
          </span>
          <b className="font-mono text-navy-2">Gs. {neto.toLocaleString("es-PY")}</b>
        </div>
      ) : (
        <div className="rounded-[3px] bg-paper px-4 py-3.5 text-[13px] text-text-dim">
          Los diseños gratis no generan comisión y cuentan para tu progreso de <b className="text-ink">10 diseños</b>
        </div>
      )}

      <label className="flex cursor-pointer items-start gap-2.5 text-[13px] leading-relaxed text-text-dim">
        <input
          type="checkbox"
          checked={autoria}
          onChange={(e) => setAutoria(e.target.checked)}
          className="mt-0.5 accent-orange"
        />
        Confirmo que este diseño es de mi autoría y no infringe derechos de terceros
      </label>

      {error && <p className="text-[13px] text-orange">{error}</p>}
      {success && <p className="text-[13px] text-navy-2">{success}</p>}

      <button
        type="submit"
        disabled={!autoria || submitting}
        className="w-fit cursor-pointer rounded-sm bg-orange px-5.5 py-3.25 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? "Publicando…" : "Publicar diseño"}
      </button>
    </form>
  );
}

function TextField({
  label,
  name,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  placeholder: string;
  required?: boolean;
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
        required={required}
        className="rounded-[3px] border border-line-strong bg-white px-3 py-2.75 text-sm focus:border-orange focus:outline-none"
      />
    </div>
  );
}

function SelectField({ label, name, options }: { label: string; name: string; options: string[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-xs text-text-dim">
        {label}
      </label>
      <select
        id={name}
        name={name}
        className="rounded-[3px] border border-line-strong bg-white px-3 py-2.75 text-sm focus:border-orange focus:outline-none"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
