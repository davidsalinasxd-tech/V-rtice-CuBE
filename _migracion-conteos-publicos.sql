-- Migración: conteos públicos de descargas (solo números agregados, nunca filas ni usuarios).
--
-- Desde que la tabla descargas quedó protegida (cada usuario ve solo lo suyo), el perfil público
-- del vendedor, el "más descargado" de la home y el "vendedor destacado" no podían contar y
-- mostraban 0. Estas funciones devuelven únicamente el número o el id ganador.
-- Correr en Supabase → SQL Editor. Se puede repetir sin problema.

create or replace function descargas_pagables_de_vendedor(p_vendedor uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from descargas d
  join disenos s on s.id = d.diseno_id
  where s.vendedor_id = p_vendedor and s.estado = 'publicado' and d.cuenta_para_pago;
$$;

create or replace function diseno_mas_descargado()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select d.diseno_id
  from descargas d
  join disenos s on s.id = d.diseno_id
  where s.estado = 'publicado'
  group by d.diseno_id
  order by count(*) desc
  limit 1;
$$;

create or replace function vendedor_destacado(p_inicio timestamptz, p_fin timestamptz)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select s.vendedor_id
  from descargas d
  join disenos s on s.id = d.diseno_id
  where d.cuenta_para_pago and not s.es_oficial
    and d.created_at >= p_inicio and d.created_at < p_fin
  group by s.vendedor_id
  order by count(*) desc
  limit 1;
$$;

grant execute on function descargas_pagables_de_vendedor(uuid) to anon, authenticated;
grant execute on function diseno_mas_descargado() to anon, authenticated;
grant execute on function vendedor_destacado(timestamptz, timestamptz) to anon, authenticated;
