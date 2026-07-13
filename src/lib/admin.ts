/**
 * No hay columna de rol "admin" en `perfiles` (el schema ya está creado en
 * Supabase y no lo tocamos). Mientras tanto, el acceso al panel de admin se
 * controla por lista de correos en la variable de entorno ADMIN_EMAILS.
 */
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowlist = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowlist.includes(email.toLowerCase());
}
