/** Validación de lo que llega por las rutas de API: nunca confiar en el tipo ni en el rango que manda el cliente. */

export const PRECIO_MAXIMO = 10_000_000

/** Lee el cuerpo JSON sin explotar si viene vacío o malformado. */
export async function leerJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** Texto recortado de 1 a `max` caracteres, o null si no sirve. */
export function texto(valor: unknown, max: number): string | null {
  if (typeof valor !== "string") return null;
  const t = valor.trim();
  return t.length >= 1 && t.length <= max ? t : null;
}

/** Precio entero en guaraníes, de 1 a PRECIO_MAXIMO, o null. */
export function precioValido(valor: unknown): number | null {
  return typeof valor === "number" && Number.isInteger(valor) && valor >= 1 && valor <= PRECIO_MAXIMO ? valor : null;
}

/** Entero dentro de [min, max], o null. */
export function enteroEnRango(valor: unknown, min: number, max: number): number | null {
  return typeof valor === "number" && Number.isInteger(valor) && valor >= min && valor <= max ? valor : null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function esUuid(valor: unknown): valor is string {
  return typeof valor === "string" && UUID.test(valor);
}
