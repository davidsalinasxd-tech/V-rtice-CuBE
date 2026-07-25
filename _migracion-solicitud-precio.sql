-- Migración incremental: solicitudes de cambio de precio/gratis de vendedores.
-- El admin edita el precio de cualquier diseño directo (ya lo permite la
-- política "admin actualiza disenos" que ya existe). Un vendedor externo no
-- edita directo: manda una solicitud y el admin la aprueba o rechaza.
-- Correr una sola vez en Supabase → SQL Editor.

create table if not exists solicitudes_precio (
  id uuid primary key default gen_random_uuid(),
  diseno_id uuid not null references disenos(id) on delete cascade,
  vendedor_id uuid not null references perfiles(id) on delete cascade,
  es_gratis boolean not null,
  precio numeric(10,0) not null default 0,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  created_at timestamptz default now()
);

alter table solicitudes_precio enable row level security;

drop policy if exists "vendedor crea sus solicitudes de precio" on solicitudes_precio;
create policy "vendedor crea sus solicitudes de precio" on solicitudes_precio
  for insert with check (vendedor_id = auth.uid());

drop policy if exists "vendedor ve sus solicitudes de precio" on solicitudes_precio;
create policy "vendedor ve sus solicitudes de precio" on solicitudes_precio
  for select using (vendedor_id = auth.uid() or is_admin());

drop policy if exists "admin actualiza solicitudes de precio" on solicitudes_precio;
create policy "admin actualiza solicitudes de precio" on solicitudes_precio
  for update using (is_admin());
