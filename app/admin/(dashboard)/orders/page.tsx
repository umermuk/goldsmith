import OrdersManager from "@/components/admin/OrdersManager";
import { createClient } from "@/lib/supabase/server";
import type { OrderWithDetails } from "@/types/database";

interface PageProps {
  searchParams: { status?: string };
}

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const supabase = createClient();
  let query = supabase
    .from("orders")
    .select("*, products(title, slug), product_variants(variant_name)")
    .order("created_at", { ascending: false });

  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
  }

  const { data } = await query;

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Orders</h1>
      <p className="mt-1 text-sm text-ink-muted">
        COD orders from your storefront
      </p>
      <div className="mt-8">
        <OrdersManager
          initial={(data || []) as OrderWithDetails[]}
          initialStatus={searchParams.status || "all"}
        />
      </div>
    </div>
  );
}
