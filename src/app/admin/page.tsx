import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/Logo";
import { RevisionCard } from "@/components/admin/RevisionCard";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin";
import { getDownloadUrl } from "@/lib/r2";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/registro");
  if (!isAdminEmail(user.email)) redirect("/");

  const { data: pendientes } = await supabase
    .from("disenos")
    .select("*")
    .eq("estado", "revision")
    .order("created_at", { ascending: true });

  const disenos = pendientes ?? [];

  const vendedorIds = [...new Set(disenos.map((d) => d.vendedor_id))];
  const { data: perfiles } = vendedorIds.length
    ? await supabase.from("perfiles").select("id, nombre").in("id", vendedorIds)
    : { data: [] };
  const nombrePorVendedor = new Map((perfiles ?? []).map((p) => [p.id, p.nombre]));

  const previews = await Promise.all(
    disenos.map(async (d) => ({
      id: d.id,
      imagenUrl: d.imagen_url
        ? await getDownloadUrl(d.imagen_url, 600).catch((e) => {
            console.error(`admin: no se pudo firmar la imagen de ${d.id} (key: ${d.imagen_url}):`, e);
            return null;
          })
        : null,
      rarUrl: d.rar_url
        ? await getDownloadUrl(d.rar_url, 600).catch((e) => {
            console.error(`admin: no se pudo firmar el rar de ${d.id} (key: ${d.rar_url}):`, e);
            return null;
          })
        : null,
    }))
  );
  const previewPorId = new Map(previews.map((p) => [p.id, p]));

  return (
    <>
      <nav className="border-b border-line bg-white">
        <div className="mx-auto flex h-19 max-w-6xl items-center justify-between px-8">
          <Logo />
          <Link href="/" className="text-sm text-text-dim hover:text-navy">
            Volver a la tienda
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-8 py-9 pb-20">
        <h1 className="font-display mb-1.5 text-[26px] text-ink">Diseños en revisión</h1>
        <p className="mb-8 text-[13px] text-text-dim">
          {disenos.length === 0
            ? "No hay diseños pendientes de aprobación."
            : `${disenos.length} diseño${disenos.length === 1 ? "" : "s"} esperando revisión.`}
        </p>

        <div className="flex flex-col gap-3">
          {disenos.map((d) => (
            <RevisionCard
              key={d.id}
              diseno={d}
              vendedorNombre={nombrePorVendedor.get(d.vendedor_id) ?? "—"}
              imagenPreviewUrl={previewPorId.get(d.id)?.imagenUrl ?? null}
              rarPreviewUrl={previewPorId.get(d.id)?.rarUrl ?? null}
            />
          ))}
        </div>
      </div>
    </>
  );
}
