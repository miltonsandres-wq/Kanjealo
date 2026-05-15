-- ═══════════════════════════════════════
-- Kanjealo — Supabase Schema
-- ═══════════════════════════════════════

-- 1. EXTENSIONES
create extension if not exists "uuid-ossp";

-- 2. TABLA: BUSINESSES (Negocios)
create table businesses (
  id uuid primary key default gen_random_uuid(),
  clerk_org_id text unique not null,
  name text not null,
  slug text unique not null,
  logo_url text,
  brand_color text default '#FF5C3A',
  program_name text default 'Programa de Lealtad',
  stamps_required int default 10,
  reward_description text,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text default 'basic' check (plan in ('basic', 'pro')),
  is_active boolean default false,
  created_at timestamptz default now()
);

-- 3. TABLA: CUSTOMERS (Clientes de los negocios)
create table customers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  phone text,
  total_stamps int default 0,
  total_redemptions int default 0,
  pass_serial text unique,
  push_token text,
  created_at timestamptz default now()
);

-- 4. TABLA: CASHIERS (Cajeros)
create table cashiers (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references businesses(id) on delete cascade not null,
  name text not null,
  pin_hash text not null, -- Guardamos el PIN (idealmente hasheado con bcrypt)
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 5. TABLA: STAMPS (Registro de sellos individuales)
create table stamps (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade not null,
  business_id uuid references businesses(id) on delete cascade not null,
  cashier_id uuid references cashiers(id) on delete set null,
  created_at timestamptz default now()
);

-- 6. TABLA: REDEMPTIONS (Registro de premios canjeados)
create table redemptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade not null,
  business_id uuid references businesses(id) on delete cascade not null,
  created_at timestamptz default now()
);

-- 7. RLS (Row Level Security)
alter table businesses enable row level security;
alter table customers enable row level security;
alter table cashiers enable row level security;
alter table stamps enable row level security;
alter table redemptions enable row level security;

-- 8. POLÍTICAS DE SEGURIDAD (Policies)

-- Nota: Estas políticas asumen que Clerk pasa el org_id en el JWT
-- O que usamos el service_role para operaciones administrativas.

-- BUSINESSES: El negocio solo ve su propia fila
create policy "Negocios pueden ver su propio perfil"
  on businesses for select
  using ( clerk_org_id = auth.jwt() ->> 'org_id' );

create policy "Negocios pueden actualizar su propio perfil"
  on businesses for update
  using ( clerk_org_id = auth.jwt() ->> 'org_id' );

-- CUSTOMERS: El negocio solo ve a sus propios clientes
create policy "Negocios ven sus propios clientes"
  on customers for all
  using ( business_id in (select id from businesses where clerk_org_id = auth.jwt() ->> 'org_id') );

-- CASHIERS: El negocio gestiona sus cajeros
create policy "Negocios gestionan sus cajeros"
  on cashiers for all
  using ( business_id in (select id from businesses where clerk_org_id = auth.jwt() ->> 'org_id') );

-- STAMPS & REDEMPTIONS
create policy "Negocios ven sus sellos"
  on stamps for select
  using ( business_id in (select id from businesses where clerk_org_id = auth.jwt() ->> 'org_id') );

create policy "Negocios ven sus canjes"
  on redemptions for select
  using ( business_id in (select id from businesses where clerk_org_id = auth.jwt() ->> 'org_id') );

-- 9. ÍNDICES PARA RENDIMIENTO
create index idx_customers_business_id on customers(business_id);
create index idx_stamps_customer_id on stamps(customer_id);
create index idx_redemptions_customer_id on redemptions(customer_id);
create index idx_businesses_slug on businesses(slug);
