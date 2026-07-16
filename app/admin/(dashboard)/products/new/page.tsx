import Link from "next/link";
import ProductForm from "@/components/admin/ProductForm";
import { createClient } from "@/lib/supabase/server";

export default async function NewProductPage() {
  const supabase = createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/products"
          className="text-sm text-ink-muted hover:text-gold-600"
        >
          ← Products
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
          Add Product
        </h1>
      </div>
      <ProductForm categories={categories || []} />
    </div>
  );
}
