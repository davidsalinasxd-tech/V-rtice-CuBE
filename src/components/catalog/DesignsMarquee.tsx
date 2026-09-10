import Link from "next/link";
import { HexIcon } from "@/components/HexIcon";
import type { Diseno } from "@/lib/types/database";

export function DesignsMarquee({ disenos }: { disenos: Diseno[] }) {
  if (disenos.length === 0) return null;

  const items = [...disenos, ...disenos];

  return (
    <section className="overflow-hidden border-b border-line bg-paper py-6">
      <div className="marquee-track flex w-max gap-4 px-4">
        {items.map((d, i) => (
          <Link
            key={`${d.id}-${i}`}
            href={`/producto/${d.id}`}
            className="flex w-36 shrink-0 flex-col gap-2 rounded-md border border-line bg-white p-2.5 transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(0,47,89,0.1)]"
          >
            <div className="flex aspect-square items-center justify-center overflow-hidden rounded-sm border border-line bg-paper">
              {d.imagen_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.imagen_url} alt={d.nombre} className="h-full w-full object-contain" />
              ) : (
                <HexIcon className="h-9 w-9" />
              )}
            </div>
            <span className="truncate text-[11px] font-semibold text-navy">{d.nombre}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
