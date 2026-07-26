-- Migración incremental: solicitud de pago del vendedor.
-- Correr una sola vez en Supabase → SQL Editor.

create table if not exists solicitudes_pago (
  id uuid primary key default gen_random_uuid(),
  vendedor_id uuid not null references perfiles(id) on delete cascade,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'pagado')),
  created_at timestamptz default now(),
  pagado_at timestamptz
);

alter table solicitudes_pago enable row level security;

drop policy if exists "vendedor crea su solicitud de pago" on solicitudes_pago;
create policy "vendedor crea su solicitud de pago" on solicitudes_pago
  for insert with check (vendedor_id = auth.uid());

drop policy if exists "vendedor ve sus solicitudes de pago" on solicitudes_pago;
create policy "vendedor ve sus solicitudes de pago" on solicitudes_pago
  for select using (vendedor_id = auth.uid() or is_admin());

drop policy if exists "admin actualiza solicitudes de pago" on solicitudes_pago;
create policy "admin actualiza solicitudes de pago" on solicitudes_pago
  for update using (is_admin());

drop policy if exists "admin borra solicitudes de pago" on solicitudes_pago;
create policy "admin borra solicitudes de pago" on solicitudes_pago
  for delete using (is_admin());
