"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import OrderModal from "@/components/OrderModal";
import { formatPKR } from "@/lib/format";
import type { Product, ProductVariant } from "@/types/database";
import { useCart } from "@/context/CartContext";

interface ProductPurchaseProps {
  product: Product;
  variants: ProductVariant[];
}

export default function ProductPurchase({
  product,
  variants,
}: ProductPurchaseProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants[0] ?? null
  );
  const [personalization, setPersonalization] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const { addToCart } = useCart();

  const unitPrice = useMemo(() => {
    if (selectedVariant?.price_override != null) {
      return Number(selectedVariant.price_override);
    }
    return Number(product.price);
  }, [selectedVariant, product.price]);

  const onSale =
    product.compare_at_price != null &&
    Number(product.compare_at_price) > unitPrice;
  const soldOut = product.stock_status === "sold_out";

  const variantsByType = useMemo(() => {
    const map = new Map<string, ProductVariant[]>();
    for (const v of variants) {
      const list = map.get(v.variant_type) || [];
      list.push(v);
      map.set(v.variant_type, list);
    }
    return map;
  }, [variants]);

  function handleAddToCart() {
    addToCart({
      productId: product.id,
      productTitle: product.title,
      unitPrice,
      deliveryCharges:
        product.delivery_charges != null ? Number(product.delivery_charges) : 200,
      variantId: selectedVariant?.id ?? null,
      variantName: selectedVariant?.variant_name ?? null,
      personalizationText: personalization,
      quantity,
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
          {product.title}
        </h1>
        <div className="mt-3 flex items-baseline gap-3">
          <span className="text-2xl font-medium text-ink">
            {formatPKR(unitPrice)}
          </span>
          {onSale && (
            <span className="text-lg text-ink-light line-through">
              {formatPKR(product.compare_at_price)}
            </span>
          )}
        </div>
        {soldOut && (
          <p className="mt-2 text-sm font-medium uppercase tracking-wide text-red-600">
            Currently sold out
          </p>
        )}
      </div>

      {Array.from(variantsByType.entries()).map(([type, list]) => (
        <div key={type}>
          <p className="label-field capitalize">{type}</p>
          <div className="flex flex-wrap gap-2">
            {list.map((v: ProductVariant) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setSelectedVariant(v)}
                className={`min-w-[4.5rem] rounded-sm border px-4 py-2 text-sm transition ${
                  selectedVariant?.id === v.id
                    ? "border-gold-600 bg-gold-600 text-white"
                    : "border-ivory-300 bg-white text-ink hover:border-gold-400"
                }`}
              >
                {v.variant_name}
              </button>
            ))}
          </div>
        </div>
      ))}

      {product.is_personalized && (
        <div>
          <label htmlFor="pdp-personalization" className="label-field">
            Enter Name/Text for Personalization
          </label>
          <input
            id="pdp-personalization"
            className="input-field"
            placeholder="e.g. Ayesha, محمد, Forever Yours"
            value={personalization}
            onChange={(e) => setPersonalization(e.target.value)}
          />
        </div>
      )}

      <div>
        <p className="label-field">Quantity</p>
        <div className="inline-flex items-center border border-ivory-300 bg-white">
          <button
            type="button"
            className="px-3 py-2 text-ink-muted hover:text-ink"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-[2.5rem] text-center text-sm font-medium">
            {quantity}
          </span>
          <button
            type="button"
            className="px-3 py-2 text-ink-muted hover:text-ink"
            onClick={() => setQuantity((q) => Math.min(20, q + 1))}
            aria-label="Increase quantity"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className="rounded-sm border border-gold-600 bg-gold-50 py-3 px-6 text-center text-sm font-medium text-gold-800 transition hover:bg-gold-100 flex-1 inline-flex items-center justify-center gap-2 shadow-xs"
          disabled={soldOut}
          onClick={handleAddToCart}
        >
          <ShoppingBag className="h-4 w-4" />
          Add to Cart
        </button>

        <button
          type="button"
          className="btn-primary flex-1 py-3"
          disabled={soldOut}
          onClick={() => setModalOpen(true)}
        >
          Buy Now — COD
        </button>
      </div>

      <div className="prose prose-sm max-w-none border-t border-ivory-300 pt-6 text-ink-muted">
        <h2 className="font-display text-xl font-semibold text-ink">
          Description
        </h2>
        <p className="mt-2 whitespace-pre-line leading-relaxed">
          {product.description}
        </p>
      </div>

      <OrderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        productId={product.id}
        productTitle={product.title}
        unitPrice={unitPrice}
        deliveryCharges={
          product.delivery_charges != null ? Number(product.delivery_charges) : 200
        }
        variantId={selectedVariant?.id ?? null}
        variantName={selectedVariant?.variant_name ?? null}
        personalizationText={personalization}
        isPersonalized={product.is_personalized}
        initialQuantity={quantity}
      />
    </div>
  );
}
