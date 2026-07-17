import Image from "next/image";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { createClient } from "@/lib/supabase/server";
import type { Category, ProductWithImages } from "@/types/database";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = createClient();

  const [
    bestsellersRes,
    categoriesRes,
    allProductsRes,
  ] = await Promise.all([
      supabase
        .from("products")
        .select("*, product_images(*)")
        .eq("is_active", true)
        .eq("is_bestseller", true)
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("categories")
        .select("*")
        .order("name"),
      supabase
        .from("products")
        .select("*, product_images(*), categories(name, slug, parent_category)")
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
    ]);

  const bestsellers = bestsellersRes.data;
  const categories = categoriesRes.data;
  const allProducts = allProductsRes.data;

  if (bestsellersRes.error || categoriesRes.error) {
    console.error(
      "Supabase query error — did you run the SQL migration?",
      bestsellersRes.error || categoriesRes.error
    );
  }

  const cats = (categories || []) as Category[];
  const best = (bestsellers || []) as ProductWithImages[];
  const products = (allProducts || []) as ProductWithImages[];

  const parentGroups = ["Women", "Men", "Islamic Jewellery"] as const;
  const featuredByParent = parentGroups.map((parent) => {
    const parentCats = cats.filter((c) => c.parent_category === parent);
    const catIds = new Set(parentCats.map((c) => c.id));
    const groupProducts = products
      .filter((p) => p.category_id && catIds.has(p.category_id))
      .slice(0, 4);
    return { parent, products: groupProducts };
  });

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-hero-glow">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1600&q=80"
            alt="MU Gold Smith personalized jewellery"
            fill
            priority
            className="object-cover opacity-40"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ivory-50 via-ivory-50/85 to-transparent" />
        </div>
        <div className="relative mx-auto flex min-h-[70vh] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
          <p className="font-display text-5xl font-semibold tracking-wide text-ink sm:text-6xl md:text-7xl">
            MU Gold Smith
          </p>
          <h1 className="mt-4 max-w-md font-display text-2xl font-medium text-ink-muted sm:text-3xl">
            Personalized jewellery for every story
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-light">
            Custom necklaces, bracelets, cufflinks & more — Cash on Delivery
            across Pakistan.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/collections/best-sellers" className="btn-primary">
              Shop Best Sellers
            </Link>
            <Link href="/collections/women" className="btn-secondary">
              Explore Collections
            </Link>
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-semibold text-ink">
              Best Sellers
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Loved by customers across Pakistan
            </p>
          </div>
          <Link
            href="/collections/best-sellers"
            className="text-sm font-medium text-gold-600 hover:text-gold-700"
          >
            View all
          </Link>
        </div>
        {best.length === 0 ? (
          <p className="text-ink-muted">
            Products will appear here once the catalog is connected.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {best.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Category cards */}
      <section className="border-y border-ivory-300 bg-ivory-100/50 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-semibold text-ink">
            Choose by Collection
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Find the perfect piece for her, him, or sacred moments
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {cats.map((cat) => (
              <Link
                key={cat.id}
                href={`/collections/${cat.slug}`}
                className="group relative aspect-[4/3] overflow-hidden bg-ivory-200"
              >
                {cat.image_url && (
                  <Image
                    src={cat.image_url}
                    alt={cat.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
                <div className="absolute bottom-0 left-0 p-4">
                  <p className="font-display text-lg font-medium text-white">
                    {cat.name}
                  </p>
                  {cat.parent_category && (
                    <p className="text-xs text-ivory-200">
                      {cat.parent_category}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured by parent */}
      {featuredByParent.map(
        ({ parent, products: groupProducts }) =>
          groupProducts.length > 0 && (
            <section
              key={parent}
              className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
            >
              <div className="mb-8 flex items-end justify-between">
                <h2 className="font-display text-3xl font-semibold text-ink">
                  {parent}
                </h2>
                <Link
                  href={`/collections/${parent === "Islamic Jewellery" ? "islamic-jewellery" : parent.toLowerCase()}`}
                  className="text-sm font-medium text-gold-600 hover:text-gold-700"
                >
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
                {groupProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )
      )}
    </>
  );
}
