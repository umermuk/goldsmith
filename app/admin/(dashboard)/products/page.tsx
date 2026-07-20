import { createClient } from "@/lib/supabase/server";
import ProductsManager from "@/components/admin/ProductsManager";
import type { Product } from "@/types/database";

type ProductWithCategory = Product & {
  categories?: { name: string } | null;
};

export default async function AdminProductsPage() {
  const supabase = createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*, categories(name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Products
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Manage your catalogue
          </p>
        </div>
      </div>

      <ProductsManager initial={(products || []) as ProductWithCategory[]} />
    </div>
  );
}
