# MU Gold Smith — Personalized Jewellery E-commerce

Next.js (App Router) + Supabase COD storefront and admin panel for **MU Gold Smith**.

## Setup

### 1. Environment

Copy `.env.example` to `.env.local` (already configured with your Supabase project):

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=           # optional until email is needed
ADMIN_NOTIFICATION_EMAIL= # your email for order alerts
NEXT_PUBLIC_WHATSAPP_NUMBER=923000000000
NEXT_PUBLIC_SITE_NAME=MU Gold Smith
```

### 2. Run the SQL migration

In the [Supabase Dashboard](https://supabase.com/dashboard) → **SQL Editor**, paste and run the contents of:

`supabase/migrations/001_initial_schema.sql`

This creates tables, RLS policies, storage buckets (`product-images`, `category-images`), and demo seed products.

### 3. Create an admin user

Supabase Dashboard → **Authentication** → **Users** → **Add user** (email + password).  
Use that account to sign in at `/admin/login`.

### 4. Start the app

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Routes

| Path | Description |
|------|-------------|
| `/` | Storefront homepage |
| `/collections/[slug]` | Category / parent / best-sellers |
| `/products/[slug]` | Product detail + COD order modal |
| `/about`, `/shipping`, `/refund`, `/contact` | Static pages |
| `/admin/login` | Admin login |
| `/admin/dashboard` | Stats overview |
| `/admin/products` | Product CRUD + image upload |
| `/admin/categories` | Category CRUD |
| `/admin/orders` | Orders + status updates |

## Notes

- **No payment gateway** — Cash on Delivery only
- Order emails use Resend (best-effort; order still saves if email is not configured)
- Deploy to Vercel; set the same env vars in the project settings
