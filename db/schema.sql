-- schema.sql — Cotizador JyS Web (Neon / Postgres)
-- Sin piezas de Supabase (auth.users, RLS). Acceso por servidor; auth propia por cookie JWT.

create extension if not exists pgcrypto;

-- Usuarios (sesión propia)
create table if not exists usuarios (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  nombre text not null default '',
  rol text not null default 'ASESOR' check (rol in ('ADMIN','ASESOR')),
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- Clientes
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  razon_social text not null,
  ruc text unique,
  atencion text default '',
  ciudad text default '',
  tipo_empresa text not null default 'EIRL' check (tipo_empresa in ('EIRL','Firma')),
  created_at timestamptz not null default now()
);

-- Tarifas
create table if not exists tarifas (
  id uuid primary key default gen_random_uuid(),
  plan text not null,
  tipo text not null,
  nivel_ingreso text default '',
  regimen_tributario text default '',
  num_comprobantes text default '',
  num_trabajadores text default '',
  regimen_laboral text default '',
  monto numeric(12,2) not null,
  version text default '2026',
  created_at timestamptz not null default now()
);

-- Configuración
create table if not exists configuracion (
  clave text primary key,
  valor text not null,
  updated_at timestamptz not null default now()
);

-- Control de intentos de inicio de sesión (lockout por fallos)
create table if not exists login_attempts (
  email text primary key,
  fail_count int not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);

-- Descuentos de convenio (paridad; la UI usa monto fijo)
create table if not exists descuentos_config (
  id serial primary key,
  nombre text not null unique,
  porcentaje numeric(5,2) not null,
  activo boolean not null default true
);

-- Cotizaciones
create table if not exists cotizaciones (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  fecha text not null,
  cliente_id uuid references clientes(id) on delete set null,
  plan text not null,
  nivel_ingreso text default '',
  regimen_tributario text default '',
  regimen_laboral text default '',
  num_trabajadores text default '',
  num_comprobantes text default '',
  descuento_tipo text default '',
  descuento_porcentaje numeric(5,2) default 0,
  descuento_monto numeric(12,2) default 0,
  subtotal numeric(12,2) not null,
  total numeric(12,2) not null,
  servicios jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_cotizaciones_cliente on cotizaciones(cliente_id);
create index if not exists idx_cotizaciones_plan on cotizaciones(plan);
create index if not exists idx_cotizaciones_fecha on cotizaciones(fecha);
create index if not exists idx_tarifas_plan on tarifas(plan);

-- Numeración atómica NNNN-AAAA
create or replace function next_numero_cotizacion()
returns text
language plpgsql
as $$
declare
  v_num int;
  v_year text;
begin
  perform pg_advisory_xact_lock(hashtext('contador_cotizacion'));
  insert into configuracion (clave, valor, updated_at)
  values ('contador_cotizacion', '1', now())
  on conflict (clave) do nothing;

  select (valor)::int into v_num
  from configuracion where clave = 'contador_cotizacion';

  update configuracion
  set valor = (v_num + 1)::text, updated_at = now()
  where clave = 'contador_cotizacion';

  v_year := to_char(now(), 'YYYY');
  return lpad(v_num::text, 4, '0') || '-' || v_year;
end;
$$;

create or replace function preview_numero_cotizacion()
returns text
language sql
stable
as $$
  select lpad(
    (select coalesce(valor::int, 1) from configuracion where clave='contador_cotizacion')::text,
    4, '0') || '-' || to_char(now(), 'YYYY');
$$;

-- Datos semilla (sin tarifas; van en seed.sql)
insert into descuentos_config (nombre, porcentaje) values
  ('Por 2 o mas empresas', 0.10),
  ('Por convenio CM', 0.15),
  ('Por convenios CIP', 0.25)
on conflict (nombre) do nothing;

insert into configuracion (clave, valor, updated_at)
values ('contador_cotizacion', '1', now())
on conflict (clave) do nothing;
