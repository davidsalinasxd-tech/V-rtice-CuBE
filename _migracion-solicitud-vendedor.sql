-- Migración incremental: solicitud de vendedor (comprador -> pide -> admin aprueba).
-- Correr una sola vez en Supabase → SQL Editor.

alter table perfiles add column if not exists estado_vendedor text not null default 'ninguno'
  check (estado_vendedor in ('ninguno', 'pendiente', 'aprobado', 'rechazado'));

-- Deja como aprobados a quienes ya venían vendiendo (para no cortarles el acceso
-- de golpe): eligieron rol vendedor/ambos al registrarse, o ya tienen diseños subidos.
update perfiles set estado_vendedor = 'aprobado'
where estado_vendedor = 'ninguno'
  and (rol in ('vendedor', 'ambos') or id in (select distinct vendedor_id from disenos));

-- Importante: la política de "cada usuario edita su propio perfil" no distingue
-- columnas, así que sin esto cualquier usuario podría, llamando directo a la API
-- de Supabase con su propia sesión, poner estado_vendedor = 'aprobado' (o incluso
-- es_admin = true) en su propia fila. Este trigger lo bloquea a nivel de base de
-- datos: un usuario normal solo puede llevar su estado_vendedor a 'pendiente', y
-- no puede tocar es_admin, es_suscriptor, suscripcion_vence ni limite_disenos_mes.
create or replace function proteger_columnas_admin_perfiles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if is_admin() then
    return new;
  end if;

  if new.es_admin is distinct from old.es_admin
     or new.es_suscriptor is distinct from old.es_suscriptor
     or new.suscripcion_vence is distinct from old.suscripcion_vence
     or new.limite_disenos_mes is distinct from old.limite_disenos_mes
  then
    raise exception 'No autorizado para modificar ese campo.';
  end if;

  if new.estado_vendedor is distinct from old.estado_vendedor and new.estado_vendedor <> 'pendiente' then
    raise exception 'No autorizado para modificar ese campo.';
  end if;

  return new;
end;
$$;

drop trigger if exists proteger_columnas_admin_perfiles on perfiles;
create trigger proteger_columnas_admin_perfiles
  before update on perfiles
  for each row
  execute function proteger_columnas_admin_perfiles();
