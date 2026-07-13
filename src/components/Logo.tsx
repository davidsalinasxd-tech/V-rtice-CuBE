import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <Image src="/logo-mark.png" alt="Vértice Cube" width={38} height={38} className="h-9 w-auto" priority />
      <span className="font-display text-lg font-bold tracking-tight text-navy">
        VÉRTICE<span className="text-orange"> CUBE</span>
      </span>
    </Link>
  );
}
