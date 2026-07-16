import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import ProductCard from "@/components/ProductCard";
import CollectionSort from "@/components/CollectionSort";
import { createClient } from "@/lib/supabase/server";
import type { ProductWithImages } from "@/types/database";

type SortKey = "newest" | "price-asc" | "price-desc";

interface PageProps {
  params: { slug: string };
  searchParams: { sort?: string };
}

const PARENT_SLUGS: Record<string, string> = {
  women: "Women",
  men: "Men",
  "islamic-jewellery": "Islamic Jewellery",
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const slug = params.slug;
  if (slug === "best-sellers") {
    return { title: "Best Sellers" };
  }
  if (PARENT_SLUGS[slug]) {
    return { title: PARENT_SLUGS[slug] };
  }
  const supabase = createClient();
  const { data } = await supabase
    .from("categories")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();
  return { title: data?.name || "Collection" };
}

export default async function CollectionPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = params;
  const sort = (searchParams.sort as SortKey) || "newest";
  const supabase = createClient();

  let title = "Collection";
  let description = "";
  let products: ProductWithImages[] = [];

  if (slug === "best-sellers") {
    title = "Best Sellers";
    description = "Our most loved personalized pieces";
    let query = supabase
      .from("products")
      .select("*, product_images(*)")
      .eq("is_active", true)
      .eq("is_bestseller", true);
    query = applySort(query, sort);
    const { data } = await query;
    products = (data || []) as ProductWithImages[];
  } else if (PARENT_SLUGS[slug]) {
    const parent = PARENT_SLUGS[slug];
    title = parent;
    description = `Shop ${parent} jewellery`;
    const { data: cats } = await supabase
      .from("categories")
      .select("id")
      .eq("parent_category", parent);
    const ids = (cats || []).map((c) => c.id);
    if (ids.length) {
      let query = supabase
        .from("products")
        .select("*, product_images(*)")
        .eq("is_active", true)
        .in("category_id", ids);
      query = applySort(query, sort);
      const { data } = await query;
      products = (data || []) as ProductWithImages[];
    }
  } else {
    const { data: category } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (!category) {
      return (
        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h1 className="font-display text-3xl text-ink">
            Collection not found
          </h1>
          <Link href="/" className="btn-secondary mt-6 inline-flex">
            Back home
          </Link>
        </div>
      );
    }

    title = category.name;
    description = category.parent_category
      ? `${category.parent_category} collection`
      : "";
    let query = supabase
      .from("products")
      .select("*, product_images(*)")
      .eq("is_active", true)
      .eq("category_id", category.id);
    query = applySort(query, sort);
    const { data } = await query;
    products = (data || []) as ProductWithImages[];
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-4xl font-semibold text-ink">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-ink-muted">{description}</p>
          )}
          <p className="mt-2 text-xs text-ink-light">
            {products.length} product{products.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Suspense fallback={null}>
          <CollectionSort current={sort} />
        </Suspense>
      </div>

      {products.length === 0 ? (
        <div className="rounded-sm border border-dashed border-ivory-300 py-20 text-center">
          <p className="text-ink-muted">No products in this collection yet.</p>
          <Link href="/" className="btn-secondary mt-6 inline-flex">
            Browse homepage
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySort(query: any, sort: SortKey) {
  if (sort === "price-asc") {
    return query.order("price", { ascending: true });
  }
  if (sort === "price-desc") {
    return query.order("price", { ascending: false });
  }
  return query.order("created_at", { ascending: false });
}
