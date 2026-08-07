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
  { id: "bronce", nombre: "Bronce", colorStroke: "#A9673A", colorCheck: "#A9673A", minDescargas: 50 },
  { id: "plata", nombre: "Plata", colorStroke: "#9AA4AD", colorCheck: "#9AA4AD", minDescargas: 150 },
  { id: "oro", nombre: "Oro", colorStroke: "#D4A017", colorCheck: "#D4A017", minDescargas: 300 },
  { id: "elite", nombre: "Elite", colorStroke: "var(--color-navy-2)", colorCheck: "var(--color-orange)", minDescargas: 500 },
];

export function calcularNivel(descargasTotales: number): Nivel {
  let nivel = NIVELES_VENDEDOR[0];
  for (const n of NIVELES_VENDEDOR) {
    if (descargasTotales >= n.minDescargas) nivel = n;
  }
  return nivel;
}

export type ProgresoNivel = {
  actual: Nivel;
  siguiente: Nivel;
  faltan: number;
  porcentaje: number;
};

/** null cuando ya está en el nivel máximo. */
export function proximoNivel(descargasTotales: number): ProgresoNivel | null {
  const actual = calcularNivel(descargasTotales);
  const siguiente = NIVELES_VENDEDOR.find((n) => n.minDescargas > descargasTotales);
  if (!siguiente) return null;

  const rango = siguiente.minDescargas - actual.minDescargas;
  const avance = descargasTotales - actual.minDescargas;
  const porcentaje = rango > 0 ? Math.min(100, Math.round((avance / rango) * 100)) : 0;

  return { actual, siguiente, faltan: siguiente.minDescargas - descargasTotales, porcentaje };
}
