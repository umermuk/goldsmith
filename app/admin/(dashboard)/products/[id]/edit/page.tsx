import Link from "next/link";
import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { createClient } from "@/lib/supabase/server";
import type { ProductImage, ProductVariant } from "@/types/database";

interface PageProps {
  params: { id: string };
}

export default async function EditProductPage({ params }: PageProps) {
  const supabase = createClient();
  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase
      .from("products")
      .select("*, product_images(*), product_variants(*)")
      .eq("id", params.id)
      .maybeSingle(),
    supabase.from("categories").select("*").order("name"),
  ]);

  if (!product) notFound();

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
          Edit Product
        </h1>
      </div>
      <ProductForm
        categories={categories || []}
        product={product}
        images={(product.product_images || []) as ProductImage[]}
        variants={(product.product_variants || []) as ProductVariant[]}
      />
    </div>
  );
}
