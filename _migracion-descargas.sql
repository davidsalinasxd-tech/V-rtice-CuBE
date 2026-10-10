-- Migración: permite registrar descargas (antes la tabla no tenía política de INSERT, así que
-- la base rechazaba todas y el panel de admin siempre mostraba 0).
--
-- Es seguro abrir el INSERT porque el trigger controlar_descarga (de _migracion-seguridad.sql)
-- fuerza usuario_id, cuenta_para_pago y via_suscripcion y aplica cupos y suscripción.
-- Correr DESPUÉS de _migracion-seguridad.sql. Se puede repetir sin problema.

drop policy if exists "usuario registra su descarga" on descargas;
create policy "usuario registra su descarga" on descargas
  for insert to authenticated
  with check (auth.uid() is not null and usuario_id = auth.uid());

-- Cada usuario ve sus propias descargas (para su cupo mensual) y cada vendedor las de sus diseños.
drop policy if exists "usuario y vendedor ven sus descargas" on descargas;
create policy "usuario y vendedor ven sus descargas" on descargas
  for select to authenticated
  using (
    usuario_id = auth.uid()
    or exists (select 1 from disenos d where d.id = descargas.diseno_id and d.vendedor_id = auth.uid())
  );
