import Link from "next/link";
import { Logo } from "./Logo";
import { createClient } from "@/lib/supabase/server";
import { cerrarSesion } from "@/app/actions/auth";

export async function PublicNav({ variante = "claro" }: { variante?: "claro" | "oscuro" }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let nombre: string | null = null;
  if (user) {
    const { data: perfil } = await supabase.from("perfiles").select("nombre").eq("id", user.id).maybeSingle();
    nombre = perfil?.nombre ?? user.email ?? null;
  }

  const iniciales = nombre
    ? nombre
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : null;

  const oscuro = variante === "oscuro";

  const enlace = oscuro
    ? "nav-underline py-1.5 text-sm font-medium text-[#b5c3d4]"
    : "text-sm font-medium text-text-dim transition-colors hover:text-navy";

  return (
    <nav className={oscuro ? "glass-pill mx-auto max-w-280 rounded-full" : "border-b border-line bg-white"}>
      <div
        className={
          oscuro
            ? "flex h-16 items-center justify-between gap-4 pr-2.5 pl-4.5"
            : "mx-auto flex h-19 max-w-6xl items-center justify-between px-8"
        }
      >
        <Logo variante={variante} />
        <div className={oscuro ? "hidden gap-8.5 md:flex" : "hidden gap-9 md:flex"}>
          <Link href="/#catalogo" className={enlace}>
            Catálogo
          </Link>
          <Link href="/#como-funciona" className={enlace}>
            Cómo funciona
          </Link>
          <Link href="/vendedor" className={enlace}>
            Vender diseños
          </Link>
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <Link
              href="/vendedor"
              title={nombre ?? "Mi cuenta"}
              className={
                oscuro
                  ? "flex h-11 w-11 items-center justify-center rounded-full border border-glass-line bg-navy font-display text-sm font-bold text-white transition-colors hover:border-orange/60 hover:bg-navy-2"
                  : "flex h-9.5 w-9.5 items-center justify-center rounded-full bg-navy font-display text-sm font-bold text-white transition-colors hover:bg-orange"
              }
            >
              {iniciales || "?"}
            </Link>
            <form action={cerrarSesion}>
              <button
                type="submit"
                className={
                  oscuro
                    ? "cursor-pointer px-1 py-2 text-sm font-medium text-[#b5c3d4] transition-colors hover:text-white"
                    : "cursor-pointer text-sm font-medium text-text-dim transition-colors hover:text-navy"
                }
              >
                Salir
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/registro"
            className={
              oscuro
                ? "inline-flex h-11 shrink-0 items-center rounded-full border border-white/14 bg-white/6 px-5 text-sm font-semibold whitespace-nowrap text-white transition-[background-color,border-color,transform] duration-200 hover:-translate-y-px hover:border-orange/60 hover:bg-white/10"
                : "rounded-[3px] bg-navy px-5.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange"
            }
          >
            Iniciar sesión
          </Link>
        )}
      </div>
    </nav>
  );
}
