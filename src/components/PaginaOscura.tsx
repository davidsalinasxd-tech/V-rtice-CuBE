import { Aurora } from "@/components/hero/Aurora";
import { Starfield } from "@/components/hero/Starfield";
import { Logo } from "@/components/Logo";

/**
 * Marco "espacio oscuro" para las pantallas internas (login, suscripción, panel de vendedor).
 * Además del fondo, `theme-legacy` reinterpreta los colores claros de siempre (ver globals.css)
 * para que esas pantallas no necesiten reescribir cada clase.
 */
export function PaginaOscura({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-space theme-legacy relative min-h-screen">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[110svh] overflow-hidden">
        <Aurora />
        <Starfield />
      </div>
      <div className="relative z-1">{children}</div>
    </div>
  );
}

/** Barra de vidrio con solo el logo (y, opcionalmente, acciones a la derecha). */
export function NavOscuroSimple({ children }: { children?: React.ReactNode }) {
  return (
    <div className="px-[clamp(12px,3vw,24px)] pt-4">
      <nav className="glass-pill mx-auto flex h-16 max-w-280 items-center justify-between gap-4 rounded-full pr-4 pl-4.5">
        <Logo variante="oscuro" />
        {children}
      </nav>
    </div>
  );
}
