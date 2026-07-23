-- Migración: suscripción mensual + panel admin
-- Correr una sola vez en Supabase → SQL Editor.

-- 1. Columnas nuevas en perfiles
alter table perfiles add column if not exists email text;
alter table perfiles add column if not exists es_suscriptor boolean not null default false;
alter table perfiles add column if not exists suscripcion_vence timestamptz;
alter table perfiles add column if not exists es_admin boolean not null default false;

-- Backfill del email para cuentas que ya existían antes de esta columna
update perfiles p
set email = u.email
from auth.users u
where p.id = u.id and p.email is null;

-- 2. Columnas nuevas en descargas (definidas en el brief, para más adelante
--    poder armar el pool de pago y excluir auto-descargas)
alter table descargas add column if not exists via_suscripcion boolean not null default false;
alter table descargas add column if not exists cuenta_para_pago boolean not null default true;

-- 3. Helper de admin + políticas RLS aditivas (no tocan las que ya existen)
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select es_admin from perfiles where id = auth.uid()), false);
$$;

drop policy if exists "admin lee todos los perfiles" on perfiles;
create policy "admin lee todos los perfiles" on perfiles
  for select using (is_admin());

drop policy if exists "admin actualiza cualquier perfil" on perfiles;
create policy "admin actualiza cualquier perfil" on perfiles
  for update using (is_admin());

drop policy if exists "admin actualiza disenos" on disenos;
create policy "admin actualiza disenos" on disenos
  for update using (is_admin());

drop policy if exists "admin lee todas las descargas" on descargas;
create policy "admin lee todas las descargas" on descargas
  for select using (is_admin());

-- 4. Activar tu propia cuenta como admin en la base de datos.
--    Reemplazá el email por el tuyo (davidsalinasxd@gmail.com si es con el
--    que entrás a Vértice Cube) y corré esta línea al final.
update perfiles set es_admin = true where email = 'davidsalinasxd@gmail.com';
