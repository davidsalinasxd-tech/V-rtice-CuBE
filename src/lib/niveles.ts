export type Nivel = {
  id: string;
  nombre: string;
  colorStroke: string;
  colorCheck: string;
  minDescargas: number;
};

/** Nivel de vendedor según descargas reales acumuladas (sin auto-descargas). */
export const NIVELES_VENDEDOR: Nivel[] = [
  { id: "nuevo", nombre: "Nuevo", colorStroke: "#9CA3AF", colorCheck: "#9CA3AF", minDescargas: 0 },
  { id: "bronce", nombre: "Bronce", colorStroke: "#A9673A", colorCheck: "#A9673A", minDescargas: 5 },
  { id: "plata", nombre: "Plata", colorStroke: "#9AA4AD", colorCheck: "#9AA4AD", minDescargas: 25 },
  { id: "oro", nombre: "Oro", colorStroke: "#D4A017", colorCheck: "#D4A017", minDescargas: 75 },
  { id: "elite", nombre: "Elite", colorStroke: "var(--color-navy-2)", colorCheck: "var(--color-orange)", minDescargas: 200 },
];

export function calcularNivel(descargasTotales: number): Nivel {
  let nivel = NIVELES_VENDEDOR[0];
  for (const n of NIVELES_VENDEDOR) {
    if (descargasTotales >= n.minDescargas) nivel = n;
  }
  return nivel;
}
