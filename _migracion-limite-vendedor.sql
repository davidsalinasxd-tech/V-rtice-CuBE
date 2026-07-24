-- Migración incremental: límite mensual de diseños personalizado por vendedor.
-- Correr una sola vez en Supabase → SQL Editor (además de _migracion-suscripciones.sql).

alter table perfiles add column if not exists limite_disenos_mes integer;

-- null = usa el límite global por defecto (10/mes). Poné un número para darle
-- a un vendedor puntual más (o menos) cupo mensual, por ejemplo:
-- update perfiles set limite_disenos_mes = 30 where email = 'vendedor@ejemplo.com';
