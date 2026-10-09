import Image from "next/image";
import Link from "next/link";

export function Logo({ variante = "claro" }: { variante?: "claro" | "oscuro" }) {
  const oscuro = variante === "oscuro";

  return (
    <Link href="/" className="flex items-center gap-2.5">
      <Image
        src={oscuro ? "/logo-mark-oscuro.png" : "/logo-mark.png"}
        alt="Vértice Cube"
        width={38}
        height={38}
        className={oscuro ? "h-8.5 w-8.5" : "h-9 w-auto"}
        priority
      />
      {/* En pantallas muy angostas queda solo el isotipo (el alt conserva el nombre). */}
      <span
        className={
          oscuro
            ? "font-display hidden text-[17px] font-bold tracking-[.01em] text-white min-[360px]:inline"
            : "font-display text-lg font-bold tracking-tight text-navy"
        }
      >
        VÉRTICE<span className={oscuro ? "text-orange-2" : "text-orange"}> CUBE</span>
      </span>
    </Link>
  );
}
