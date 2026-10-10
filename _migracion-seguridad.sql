-- Migración de seguridad: blinda la base de datos aunque alguien salte la web y llame
-- directo a la API de Supabase con su propia sesión (la clave anon es pública).
--
-- Cómo funciona: triggers BEFORE INSERT/UPDATE que corrigen o rechazan lo que mande
-- el cliente. No dependen de las políticas RLS que ya existen (no las tocan), así que
-- sirven aunque alguna de esas políticas sea más permisiva de lo debido.
--
-- Pasan sin restricciones: el admin (is_admin()) y el SQL Editor / service role
-- (donde auth.uid() es null).
--
-- Correr UNA vez en Supabase → SQL Editor. Se puede repetir sin problema.
-- Al final del archivo está el bloque para deshacer todo si algo falla.

-- ─── 1. perfiles: nadie se crea un perfil con privilegios ───────────────────────────
create or replace function forzar_perfil_nuevo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or is_admin() then
    return new;
  end if;

  if new.id is distinct from auth.uid() then
    raise exception 'No autorizado.';
  end if;

  new.es_admin := false;
  new.es_suscriptor := false;
  new.suscripcion_vence := null;
  new.limite_disenos_mes := null;
  new.estado_vendedor := 'ninguno';
  new.email := (select email from auth.users where id = new.id);

  return new;
end;
$$;

drop trigger if exists forzar_perfil_nuevo on perfiles;
create trigger forzar_perfil_nuevo
  before insert on perfiles
  for each row
  execute function forzar_perfil_nuevo();

-- Mismo caso para el trigger de UPDATE que ya existía: dejaba bloqueado hasta al SQL Editor
-- (donde auth.uid() es null). Se redefine igual que antes, solo que ahora el SQL Editor pasa.
create or replace function proteger_columnas_admin_perfiles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or is_admin() then
    return new;
  end if;

  if new.es_admin is distinct from old.es_admin
     or new.es_suscriptor is distinct from old.es_suscriptor
     or new.suscripcion_vence is distinct from old.suscripcion_vence
     or new.limite_disenos_mes is distinct from old.limite_disenos_mes
     or new.id is distinct from old.id
  then
    raise exception 'No autorizado para modificar ese campo.';
  end if;

  if new.estado_vendedor is distinct from old.estado_vendedor and new.estado_vendedor <> 'pendiente' then
    raise exception 'No autorizado para modificar ese campo.';
  end if;

  return new;
end;
$$;

-- ─── 2. disenos: estado, precio, oficial/pro y archivos solo por el camino correcto ─
create or replace function proteger_disenos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_estado_vendedor text;
  v_limite integer;
  v_en_revision integer;
  v_este_mes integer;
begin
  if auth.uid() is null or is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.vendedor_id is distinct from auth.uid() then
      raise exception 'No autorizado.';
    end if;

    select estado_vendedor, limite_disenos_mes
      into v_estado_vendedor, v_limite
      from perfiles where id = auth.uid();

    if v_estado_vendedor is distinct from 'aprobado' then
      raise exception 'Todavía no sos vendedor aprobado.';
    end if;

    if new.autoria_confirmada is not true then
      raise exception 'Debés confirmar la autoría del diseño.';
    end if;

    select count(*) into v_en_revision
      from disenos where vendedor_id = auth.uid() and estado = 'revision';
    if v_en_revision >= 3 then
      raise exception 'Ya tenés 3 diseños en revisión.';
    end if;

    select count(*) into v_este_mes
      from disenos
      where vendedor_id = auth.uid() and created_at >= date_trunc('month', now());
    if v_este_mes >= coalesce(v_limite, 10) then
      raise exception 'Alcanzaste el límite de diseños nuevos de este mes.';
    end if;

    new.estado := 'revision';
    new.es_oficial := false;
    new.es_pro := false;
    new.rar_url := null;
    new.imagen_url := null;

    if new.es_gratis then
      new.precio := 0;
    elsif new.precio is null or new.precio < 1 or new.precio > 10000000 then
      raise exception 'Precio inválido.';
    end if;

    return new;
  end if;

  -- UPDATE de un vendedor sobre su propio diseño
  if new.vendedor_id is distinct from old.vendedor_id
     or new.estado is distinct from old.estado
     or new.es_oficial is distinct from old.es_oficial
     or new.es_pro is distinct from old.es_pro
     or new.es_gratis is distinct from old.es_gratis
     or new.precio is distinct from old.precio
     or new.autoria_confirmada is distinct from old.autoria_confirmada
     or new.created_at is distinct from old.created_at
  then
    raise exception 'No autorizado para modificar ese campo.';
  end if;

  if new.nombre is distinct from old.nombre
     or new.deporte is distinct from old.deporte
     or new.formato is distinct from old.formato
     or new.rar_url is distinct from old.rar_url
     or new.imagen_url is distinct from old.imagen_url
  then
    -- Con el diseño ya publicado o rechazado, solo el admin cambia contenido o archivos.
    if old.estado <> 'revision' then
      raise exception 'Este diseño ya no admite cambios.';
    end if;

    if new.rar_url is not null and new.rar_url <> 'disenos/' || old.id || '/archivo.rar' then
      raise exception 'Archivo no válido.';
    end if;

    if new.imagen_url is not null
       and new.imagen_url not in (
         'disenos/' || old.id || '/portada.jpg',
         'disenos/' || old.id || '/portada.png',
         'disenos/' || old.id || '/portada.webp'
       )
    then
      raise exception 'Imagen no válida.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists proteger_disenos on disenos;
create trigger proteger_disenos
  before insert or update on disenos
  for each row
  execute function proteger_disenos();

-- ─── 3. descargas: la base decide quién descarga y qué cuenta para el pago ──────────
-- Antes el cliente podía insertar descargas con los valores que quisiera (por ejemplo
-- cuenta_para_pago = true sobre sus propios diseños para inflar lo que se le paga).
create or replace function controlar_descarga()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  d record;
  p record;
  v_mes integer;
  v_dia integer;
begin
  if auth.uid() is null then
    return new;
  end if;

  select id, vendedor_id, estado, es_gratis, es_oficial into d from disenos where id = new.diseno_id;
  if not found or d.estado <> 'publicado' then
    raise exception 'Diseño no disponible para descarga.';
  end if;

  new.usuario_id := auth.uid();
  new.precio_pagado := 0;
  new.cuenta_para_pago := (auth.uid() <> d.vendedor_id);

  if d.es_gratis then
    new.via_suscripcion := false;
    return new;
  end if;

  select es_suscriptor, suscripcion_vence into p from perfiles where id = auth.uid();
  if not found or p.es_suscriptor is not true or p.suscripcion_vence is null or p.suscripcion_vence <= now() then
    raise exception 'Necesitás una suscripción activa para descargar este diseño.';
  end if;

  new.via_suscripcion := true;

  if not d.es_oficial then
    select count(*) into v_mes
      from descargas x join disenos dd on dd.id = x.diseno_id
      where x.usuario_id = auth.uid() and x.via_suscripcion and not dd.es_oficial
        and x.created_at >= date_trunc('month', now());
    select count(*) into v_dia
      from descargas x join disenos dd on dd.id = x.diseno_id
      where x.usuario_id = auth.uid() and x.via_suscripcion and not dd.es_oficial
        and x.created_at >= date_trunc('day', now());

    if v_mes >= 10 or v_dia >= 5 then
      raise exception 'Ya usaste tu cupo de descargas externas.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists controlar_descarga on descargas;
create trigger controlar_descarga
  before insert on descargas
  for each row
  execute function controlar_descarga();

-- ─── 4. solicitudes de pago y de precio: solo las que el vendedor realmente puede pedir
create or replace function controlar_solicitud_pago()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  m record;
begin
  if auth.uid() is null or is_admin() then
    return new;
  end if;

  if new.vendedor_id is distinct from auth.uid() then
    raise exception 'No autorizado.';
  end if;

  new.estado := 'pendiente';
  new.pagado_at := null;

  if (select count(*) from disenos where vendedor_id = auth.uid() and estado = 'publicado') < 10 then
    raise exception 'Todavía no llegaste al mínimo de diseños aprobados.';
  end if;

  select banco, numero_cuenta, titular, ci_ruc into m from metodos_cobro where vendedor_id = auth.uid();
  if not found or coalesce(m.banco, '') = '' or coalesce(m.numero_cuenta, '') = ''
     or coalesce(m.titular, '') = '' or coalesce(m.ci_ruc, '') = '' then
    raise exception 'Completá tus datos de transferencia.';
  end if;

  if exists (select 1 from solicitudes_pago where vendedor_id = auth.uid() and estado = 'pendiente') then
    raise exception 'Ya tenés una solicitud de pago en revisión.';
  end if;

  return new;
end;
$$;

drop trigger if exists controlar_solicitud_pago on solicitudes_pago;
create trigger controlar_solicitud_pago
  before insert on solicitudes_pago
  for each row
  execute function controlar_solicitud_pago();

create or replace function controlar_solicitud_precio()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or is_admin() then
    return new;
  end if;

  if new.vendedor_id is distinct from auth.uid() then
    raise exception 'No autorizado.';
  end if;

  if not exists (select 1 from disenos where id = new.diseno_id and vendedor_id = auth.uid()) then
    raise exception 'Diseño no encontrado.';
  end if;

  if exists (select 1 from solicitudes_precio where diseno_id = new.diseno_id and estado = 'pendiente') then
    raise exception 'Ya hay una solicitud de este diseño en revisión.';
  end if;

  new.estado := 'pendiente';

  if new.es_gratis then
    new.precio := 0;
  elsif new.precio is null or new.precio < 1 or new.precio > 10000000 then
    raise exception 'Precio inválido.';
  end if;

  return new;
end;
$$;

drop trigger if exists controlar_solicitud_precio on solicitudes_precio;
create trigger controlar_solicitud_precio
  before insert on solicitudes_precio
  for each row
  execute function controlar_solicitud_precio();

-- ─── Para deshacer todo (solo si algo falla; copiar y correr aparte) ─────────────────
-- drop trigger if exists forzar_perfil_nuevo on perfiles;
-- drop trigger if exists proteger_disenos on disenos;
-- drop trigger if exists controlar_descarga on descargas;
-- drop trigger if exists controlar_solicitud_pago on solicitudes_pago;
-- drop trigger if exists controlar_solicitud_precio on solicitudes_precio;
