-- Migración incremental: vista pública de vendedores (perfil público).
-- Solo expone id, nombre, fecha de alta y estado_vendedor — nunca email ni
-- ningún otro dato de contacto, sin importar qué columnas tenga `perfiles`
-- en el futuro (la vista fija la lista de columnas de una vez por todas).
-- Correr una sola vez en Supabase → SQL Editor.

create or replace view perfiles_publicos as
select id, nombre, created_at, estado_vendedor
from perfiles
where estado_vendedor = 'aprobado';

grant select on perfiles_publicos to anon, authenticated;
