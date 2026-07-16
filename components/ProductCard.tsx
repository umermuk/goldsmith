import Image from "next/image";
import Link from "next/link";
import { formatPKR } from "@/lib/format";
import type { ProductWithImages } from "@/types/database";

interface ProductCardProps {
  product: ProductWithImages;
}

export default function ProductCard({ product }: ProductCardProps) {
  const image =
    product.product_images?.[0]?.image_url ||
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80";
  const onSale =
    product.compare_at_price != null &&
    Number(product.compare_at_price) > Number(product.price);
  const soldOut = product.stock_status === "sold_out";

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-ivory-200">
        <Image
          src={image}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        {product.is_bestseller && (
          <span className="absolute left-3 top-3 bg-gold-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
            Bestseller
          </span>
        )}
        {soldOut && (
          <span className="absolute inset-0 flex items-center justify-center bg-ink/40 text-sm font-medium uppercase tracking-widest text-white">
            Sold Out
          </span>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <h3 className="font-display text-lg font-medium leading-snug text-ink transition group-hover:text-gold-600">
          {product.title}
        </h3>
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-ink">
            {formatPKR(product.price)}
          </span>
          {onSale && (
            <span className="text-ink-light line-through">
              {formatPKR(product.compare_at_price)}
            </span>
          )}
        </div>
        {product.is_personalized && (
          <p className="text-xs text-gold-600">Personalized</p>
        )}
      </div>
    </Link>
  );
}
