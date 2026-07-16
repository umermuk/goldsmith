import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductGallery from "@/components/ProductGallery";
import ProductPurchase from "@/components/ProductPurchase";
import { createClient } from "@/lib/supabase/server";
import type { ProductImage, ProductVariant } from "@/types/database";

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const supabase = createClient();
  const { data } = await supabase
    .from("products")
    .select("title, description")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return { title: "Product" };
  return {
    title: data.title,
    description: data.description?.slice(0, 160),
  };
}

export default async function ProductPage({ params }: PageProps) {
  const supabase = createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*, product_images(*), product_variants(*)")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!product) notFound();

  const images = (product.product_images || []) as ProductImage[];
  const variants = (product.product_variants || []) as ProductVariant[];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <nav className="mb-6 text-sm text-ink-light">
        <Link href="/" className="hover:text-gold-600">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-ink-muted">{product.title}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={images} title={product.title} />
        <ProductPurchase product={product} variants={variants} />
      </div>
    </div>
  );
}
