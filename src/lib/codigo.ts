/** Código corto tipo KIT-0142 derivado del UUID, mientras no exista una columna dedicada en `disenos`. */
export function codigoDeDiseno(id: string): string {
  const numeric = parseInt(id.replace(/-/g, "").slice(0, 6), 16) % 10000;
  return `KIT-${String(numeric).padStart(4, "0")}`;
}
