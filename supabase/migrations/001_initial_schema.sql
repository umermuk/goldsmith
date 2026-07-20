-- Gold Smith schema: tables, RLS, storage, seed data

-- Extensions
create extension if not exists "pgcrypto";

-- Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  image_url text,
  parent_category text,
  created_at timestamptz not null default now()
);

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  price numeric(12, 2) not null,
  compare_at_price numeric(12, 2),
  category_id uuid references public.categories(id) on delete set null,
  is_personalized boolean not null default false,
  is_active boolean not null default true,
  is_bestseller boolean not null default false,
  stock_status text not null default 'in_stock' check (stock_status in ('in_stock', 'sold_out')),
  created_at timestamptz not null default now()
);

-- Product images
create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  sort_order int not null default 0
);

-- Product variants
create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  variant_name text not null,
  variant_type text not null default 'color',
  price_override numeric(12, 2),
  image_url text
);

-- Orders (COD)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  address text not null,
  city text not null,
  product_id uuid not null references public.products(id) on delete restrict,
  variant_id uuid references public.product_variants(id) on delete set null,
  personalization_text text,
  quantity int not null default 1 check (quantity > 0),
  total_price numeric(12, 2) not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_bestseller on public.products(is_bestseller) where is_bestseller = true;
create index if not exists idx_product_images_product on public.product_images(product_id);
create index if not exists idx_product_variants_product on public.product_variants(product_id);
create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_created on public.orders(created_at desc);

-- RLS
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;

-- Categories policies
create policy "Public can read categories"
  on public.categories for select
  using (true);

create policy "Authenticated can insert categories"
  on public.categories for insert
  to authenticated
  with check (true);

create policy "Authenticated can update categories"
  on public.categories for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can delete categories"
  on public.categories for delete
  to authenticated
  using (true);

-- Products policies
create policy "Public can read products"
  on public.products for select
  using (true);

create policy "Authenticated can insert products"
  on public.products for insert
  to authenticated
  with check (true);

create policy "Authenticated can update products"
  on public.products for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can delete products"
  on public.products for delete
  to authenticated
  using (true);

-- Product images policies
create policy "Public can read product images"
  on public.product_images for select
  using (true);

create policy "Authenticated can insert product images"
  on public.product_images for insert
  to authenticated
  with check (true);

create policy "Authenticated can update product images"
  on public.product_images for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can delete product images"
  on public.product_images for delete
  to authenticated
  using (true);

-- Product variants policies
create policy "Public can read product variants"
  on public.product_variants for select
  using (true);

create policy "Authenticated can insert product variants"
  on public.product_variants for insert
  to authenticated
  with check (true);

create policy "Authenticated can update product variants"
  on public.product_variants for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated can delete product variants"
  on public.product_variants for delete
  to authenticated
  using (true);

-- Orders policies
create policy "Public can insert orders"
  on public.orders for insert
  with check (true);

create policy "Authenticated can read orders"
  on public.orders for select
  to authenticated
  using (true);

create policy "Authenticated can update orders"
  on public.orders for update
  to authenticated
  using (true)
  with check (true);

-- Storage buckets
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('category-images', 'category-images', true)
on conflict (id) do update set public = true;

-- Storage policies (drop if re-running)
drop policy if exists "Public read product images" on storage.objects;
drop policy if exists "Authenticated upload product images" on storage.objects;
drop policy if exists "Authenticated update product images" on storage.objects;
drop policy if exists "Authenticated delete product images" on storage.objects;
drop policy if exists "Public read category images" on storage.objects;
drop policy if exists "Authenticated upload category images" on storage.objects;
drop policy if exists "Authenticated update category images" on storage.objects;
drop policy if exists "Authenticated delete category images" on storage.objects;

create policy "Public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "Authenticated upload product images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-images');

create policy "Authenticated update product images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-images');

create policy "Authenticated delete product images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-images');

create policy "Public read category images"
  on storage.objects for select
  using (bucket_id = 'category-images');

create policy "Authenticated upload category images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'category-images');

create policy "Authenticated update category images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'category-images');

create policy "Authenticated delete category images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'category-images');

-- =====================
-- SEED DATA
-- =====================

-- Fixed UUIDs for seed references
insert into public.categories (id, name, slug, image_url, parent_category) values
  ('a1000001-0000-4000-8000-000000000001', 'Customized Necklaces', 'customized-necklaces', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800&q=80', 'Women'),
  ('a1000001-0000-4000-8000-000000000002', 'Bracelets', 'bracelets', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800&q=80', 'Women'),
  ('a1000001-0000-4000-8000-000000000003', 'Rings for Women', 'rings-for-women', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80', 'Women'),
  ('a1000001-0000-4000-8000-000000000004', 'Cufflinks', 'cufflinks', 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=800&q=80', 'Men'),
  ('a1000001-0000-4000-8000-000000000005', 'Wallets', 'wallets', 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&q=80', 'Men'),
  ('a1000001-0000-4000-8000-000000000006', 'Rings for Men', 'rings-for-men', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80', 'Men'),
  ('a1000001-0000-4000-8000-000000000007', 'Islamic Necklaces', 'islamic-necklaces', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80', 'Islamic Jewellery'),
  ('a1000001-0000-4000-8000-000000000008', 'Islamic Bracelets', 'islamic-bracelets', 'https://images.unsplash.com/photo-1573408301185-91496d5a9f35?w=800&q=80', 'Islamic Jewellery')
on conflict (slug) do nothing;

insert into public.products (id, title, slug, description, price, compare_at_price, category_id, is_personalized, is_active, is_bestseller, stock_status) values
  ('b2000001-0000-4000-8000-000000000001', 'Birth Flower Signature Name Necklace', 'birth-flower-signature-name-necklace', 'Elegant personalized name necklace with birth flower charm. Crafted in premium plating — perfect for everyday wear or gifting.', 1699, 2199, 'a1000001-0000-4000-8000-000000000001', true, true, true, 'in_stock'),
  ('b2000001-0000-4000-8000-000000000002', 'Rainbow Kids Name Necklace', 'rainbow-kids-name-necklace', 'Colorful kids name necklace with playful charms. Soft chain, safe clasp, and custom name engraving.', 1999, null, 'a1000001-0000-4000-8000-000000000001', true, true, true, 'in_stock'),
  ('b2000001-0000-4000-8000-000000000003', 'Viral Tulip Bracelet', 'viral-tulip-bracelet', 'Delicate tulip charm bracelet — a bestselling gift for her. Available in gold and silver tones.', 1899, 2299, 'a1000001-0000-4000-8000-000000000002', true, true, true, 'in_stock'),
  ('b2000001-0000-4000-8000-000000000004', 'Custom Name Print Shawl', 'custom-name-print-shawl', 'Soft premium shawl with custom name print. Ideal for winter gifting and celebrations.', 2999, null, 'a1000001-0000-4000-8000-000000000001', true, true, false, 'in_stock'),
  ('b2000001-0000-4000-8000-000000000005', 'Arabic Stone Cufflinks', 'arabic-stone-cufflinks', 'Premium cufflinks with Arabic calligraphy stone inlay. A refined gift for him.', 1999, 2499, 'a1000001-0000-4000-8000-000000000004', true, true, true, 'in_stock'),
  ('b2000001-0000-4000-8000-000000000006', 'Translucent Urdu Name Cufflinks', 'translucent-urdu-name-cufflinks', 'Elegant translucent cufflinks featuring custom Urdu name calligraphy.', 1799, null, 'a1000001-0000-4000-8000-000000000004', true, true, true, 'in_stock'),
  ('b2000001-0000-4000-8000-000000000007', 'Customized Wallet with Name & Charm', 'customized-wallet-with-name-charm', 'Genuine-feel leather wallet with name engraving and charm. Available in classic colours.', 2299, 2799, 'a1000001-0000-4000-8000-000000000005', true, true, true, 'in_stock'),
  ('b2000001-0000-4000-8000-000000000008', 'Personalize Gift Set for Him', 'personalize-gift-set-for-him', 'Complete gift set: wallet, cufflinks, and keychain — all personalized. Perfect anniversary or birthday gift.', 5399, 6499, 'a1000001-0000-4000-8000-000000000005', true, true, true, 'in_stock'),
  ('b2000001-0000-4000-8000-000000000009', 'Turkish Style Black Onyx Ring', 'turkish-style-black-onyx-ring', 'Bold Ottoman-inspired ring with natural black onyx stone. Statement piece for men.', 9999, null, 'a1000001-0000-4000-8000-000000000006', false, true, false, 'in_stock'),
  ('b2000001-0000-4000-8000-000000000010', 'Exclusive 4 Qul Calligraphy Necklace', 'exclusive-4-qul-calligraphy-necklace', 'Beautiful Islamic calligraphy necklace featuring the Four Quls. Spiritual and elegant.', 2499, 2999, 'a1000001-0000-4000-8000-000000000007', false, true, true, 'in_stock'),
  ('b2000001-0000-4000-8000-000000000011', 'Ayat ul Kursi Cuff Bangle', 'ayat-ul-kursi-cuff-bangle', 'Unisex cuff bangle with Ayat ul Kursi calligraphy. Premium finish, adjustable fit.', 2199, null, 'a1000001-0000-4000-8000-000000000008', false, true, true, 'in_stock'),
  ('b2000001-0000-4000-8000-000000000012', 'Calligraphy Bismillah Lapel Pin', 'calligraphy-bismillah-lapel-pin', 'Refined Bismillah lapel pin in gold or silver finish. Subtle faith-inspired accessory.', 1699, null, 'a1000001-0000-4000-8000-000000000007', false, true, false, 'in_stock')
on conflict (slug) do nothing;

insert into public.product_images (product_id, image_url, sort_order) values
  ('b2000001-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1000&q=80', 0),
  ('b2000001-0000-4000-8000-000000000001', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1000&q=80', 1),
  ('b2000001-0000-4000-8000-000000000002', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1000&q=80', 0),
  ('b2000001-0000-4000-8000-000000000003', 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=1000&q=80', 0),
  ('b2000001-0000-4000-8000-000000000004', 'https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=1000&q=80', 0),
  ('b2000001-0000-4000-8000-000000000005', 'https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1000&q=80', 0),
  ('b2000001-0000-4000-8000-000000000006', 'https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=1000&q=80', 0),
  ('b2000001-0000-4000-8000-000000000007', 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=1000&q=80', 0),
  ('b2000001-0000-4000-8000-000000000008', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=1000&q=80', 0),
  ('b2000001-0000-4000-8000-000000000009', 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1000&q=80', 0),
  ('b2000001-0000-4000-8000-000000000010', 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1000&q=80', 0),
  ('b2000001-0000-4000-8000-000000000011', 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=1000&q=80', 0),
  ('b2000001-0000-4000-8000-000000000012', 'https://images.unsplash.com/photo-1611652022419-a9419f74343a?w=1000&q=80', 0);

insert into public.product_variants (product_id, variant_name, variant_type, price_override, image_url) values
  ('b2000001-0000-4000-8000-000000000001', 'Gold', 'color', null, null),
  ('b2000001-0000-4000-8000-000000000001', 'Silver', 'color', null, null),
  ('b2000001-0000-4000-8000-000000000003', 'Gold', 'color', null, null),
  ('b2000001-0000-4000-8000-000000000003', 'Silver', 'color', null, null),
  ('b2000001-0000-4000-8000-000000000004', 'Black', 'color', null, null),
  ('b2000001-0000-4000-8000-000000000004', 'White', 'color', null, null),
  ('b2000001-0000-4000-8000-000000000004', 'Beige', 'color', null, null),
  ('b2000001-0000-4000-8000-000000000005', 'Gold', 'color', null, null),
  ('b2000001-0000-4000-8000-000000000005', 'Silver', 'color', null, null),
  ('b2000001-0000-4000-8000-000000000006', 'Gold', 'color', null, null),
  ('b2000001-0000-4000-8000-000000000006', 'Silver', 'color', null, null),
  ('b2000001-0000-4000-8000-000000000007', 'Black', 'color', null, null),
  ('b2000001-0000-4000-8000-000000000007', 'Brown', 'color', null, null),
  ('b2000001-0000-4000-8000-000000000007', 'Tan', 'color', null, null),
  ('b2000001-0000-4000-8000-000000000008', 'Black', 'color', null, null),
  ('b2000001-0000-4000-8000-000000000008', 'Brown', 'color', null, null),
  ('b2000001-0000-4000-8000-000000000012', 'Gold', 'color', null, null),
  ('b2000001-0000-4000-8000-000000000012', 'Silver', 'color', null, null);
