import Link from "next/link";
import { HexIcon } from "@/components/HexIcon";
import type { Diseno } from "@/lib/types/database";

export function DesignsMarquee({ disenos }: { disenos: Diseno[] }) {
  if (disenos.length === 0) return null;

  const items = [...disenos, ...disenos];

  return (
    <section
      data-reveal=""
      className="overflow-hidden border-y border-white/7 bg-white/[.015] py-5.5"
    >
      <div className="marquee-track flex w-max gap-4 px-4">
        {items.map((d, i) => (
          <Link
            key={`${d.id}-${i}`}
            href={`/producto/${d.id}`}
            className="flex w-36 shrink-0 flex-col gap-2 rounded-xl border border-white/10 bg-white/4 p-2.25 transition-[transform,border-color] duration-200 hover:-translate-y-1 hover:border-orange/60"
          >
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-[7px] bg-paper">
              {d.imagen_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.imagen_url} alt={d.nombre} loading="lazy" className="h-full w-full object-contain" />
              ) : (
                <HexIcon className="h-9 w-9" />
              )}
            </div>
            <span className="truncate text-[11px] font-semibold text-[#e6edf5]">{d.nombre}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
