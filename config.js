-- CartyFinds_ initial schema. Run in Supabase SQL Editor after creating your project.
create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;
create policy "admins can read own admin membership" on public.admin_users
 for select to authenticated using (user_id = (select auth.uid()));

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null default 'Other',
  image_url text not null default '',
  images text[] not null default '{}',
  variants jsonb not null default '[]'::jsonb,
  supplier_url text not null default '',
  supplier_cost numeric(12,2) not null default 0,
  price numeric(12,2) not null check (price >= 0),
  compare_at_price numeric(12,2),
  stock integer,
  published boolean not null default false,
  source text not null default 'manual',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
revoke all on public.products from anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
create policy "public can read published products" on public.products
 for select to anon using (published = true);
create policy "signed-in admins can read all products" on public.products
 for select to authenticated using (
   exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()))
 );
create policy "admins insert products" on public.products
 for insert to authenticated with check (
   exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()))
 );
create policy "admins update products" on public.products
 for update to authenticated using (
   exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()))
 ) with check (
   exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()))
 );
create policy "admins delete products" on public.products
 for delete to authenticated using (
   exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()))
 );

create table if not exists public.orders (
 id uuid primary key default gen_random_uuid(),
 order_number text not null unique default ('CF-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
 customer_name text not null,
 customer_email text not null default '',
 customer_phone text not null,
 shipping_address jsonb not null default '{}'::jsonb,
 items jsonb not null default '[]'::jsonb,
 subtotal numeric(12,2) not null default 0,
 shipping_fee numeric(12,2) not null default 0,
 total numeric(12,2) not null default 0,
 payment_method text not null default 'cod',
 payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
 status text not null default 'new' check (status in ('new','confirmed','packed','shipped','delivered','cancelled','returned')),
 tracking_number text not null default '',
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.orders enable row level security;
revoke all on public.orders from anon, authenticated;
grant select, update on public.orders to authenticated;
grant insert on public.orders to anon;
create policy "admins can read orders" on public.orders
 for select to authenticated using (
  exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()))
 );
create policy "admins can update orders" on public.orders
 for update to authenticated using (
  exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()))
 ) with check (
  exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()))
 );
create policy "allow public order creation for demo checkout" on public.orders
 for insert to anon with check (true);

-- Admin membership is intentionally not self-service. Create a user in Supabase Auth first,
-- then run: insert into public.admin_users(user_id) values ('AUTH_USER_UUID');
