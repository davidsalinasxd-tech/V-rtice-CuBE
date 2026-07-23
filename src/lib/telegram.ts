export const TELEGRAM_USUARIO = "VERTICECUBE";
export const TELEGRAM_URL = `https://t.me/${TELEGRAM_USUARIO}`;

export function linkTelegramCompra(codigo: string, nombre: string, precio: number) {
  const texto = `Hola! Quiero comprar el diseño ${codigo} - ${nombre} (Gs. ${precio.toLocaleString("es-PY")}). ¿Me pasás los datos para la transferencia?`;
  return `${TELEGRAM_URL}?text=${encodeURIComponent(texto)}`;
}

export function linkTelegramSuscripcion() {
  const texto =
    "Hola! Quiero suscribirme al plan mensual de Vértice Cube (Gs. 50.000/mes). ¿Me pasás los datos para la transferencia?";
  return `${TELEGRAM_URL}?text=${encodeURIComponent(texto)}`;
}
