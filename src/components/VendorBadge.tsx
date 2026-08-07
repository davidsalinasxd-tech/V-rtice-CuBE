import { HexIcon } from "@/components/HexIcon";
import type { Nivel } from "@/lib/niveles";

export function VendorBadge({ nivel, size = "md" }: { nivel: Nivel; size?: "md" | "lg" }) {
  const dims = size === "lg" ? "h-20 w-20" : "h-11 w-11";
  return (
    <div className="flex flex-col items-center gap-1.5">
      <HexIcon className={dims} stroke={nivel.colorStroke} check={nivel.colorCheck} />
      <span className="font-mono text-[10px] font-bold tracking-widest uppercase" style={{ color: nivel.colorStroke }}>
        {nivel.nombre}
      </span>
    </div>
  );
}
