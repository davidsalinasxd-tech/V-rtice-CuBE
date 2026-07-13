import Link from "next/link";
import { Logo } from "./Logo";

export function PublicNav() {
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
        <Link
          href="/registro"
          className="rounded-[3px] bg-navy px-5.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange"
        >
          Iniciar sesión
        </Link>
      </div>
    </nav>
  );
}
