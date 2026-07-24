-- Migración incremental: permitir al admin borrar diseños definitivamente.
-- Correr una sola vez en Supabase → SQL Editor.

drop policy if exists "admin elimina disenos" on disenos;
create policy "admin elimina disenos" on disenos
  for delete using (is_admin());
