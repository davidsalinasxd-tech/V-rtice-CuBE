import Link from "next/link";
import { Logo } from "./Logo";
import { createClient } from "@/lib/supabase/server";
import { cerrarSesion } from "@/app/actions/auth";

export async function PublicNav() {
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

  return (
    <nav className="border-b border-line bg-white">
      <div className="mx-auto flex h-19 max-w-6xl items-center justify-between px-8">
        <Logo />
        <div className="hidden gap-9 md:flex">
          <Link href="/#catalogo" className="text-sm font-medium text-text-dim transition-colors hover:text-navy">
            Catálogo
          </Link>
          <Link
            href="/#como-funciona"
            className="text-sm font-medium text-text-dim transition-colors hover:text-navy"
          >
            Cómo funciona
          </Link>
          <Link href="/vendedor" className="text-sm font-medium text-text-dim transition-colors hover:text-navy">
            Vender diseños
          </Link>
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <Link
              href="/vendedor"
              title={nombre ?? "Mi cuenta"}
              className="flex h-9.5 w-9.5 items-center justify-center rounded-full bg-navy font-display text-sm font-bold text-white transition-colors hover:bg-orange"
            >
              {iniciales || "?"}
            </Link>
            <form action={cerrarSesion}>
              <button
                type="submit"
                className="cursor-pointer text-sm font-medium text-text-dim transition-colors hover:text-navy"
              >
                Salir
              </button>
            </form>
          </div>
        ) : (
          <Link
            href="/registro"
            className="rounded-[3px] bg-navy px-5.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange"
          >
            Iniciar sesión
          </Link>
        )}
      </div>
    </nav>
  );
}
