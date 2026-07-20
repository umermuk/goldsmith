"use client";

import { useState } from "react";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { formatPKR } from "@/lib/format";
import CartCheckoutModal from "@/components/CartCheckoutModal";

export default function CartDrawer() {
  const {
    items,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    subtotal,
    maxDeliveryCharges,
  } = useCart();

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  if (!isCartOpen) return null;

  const grandTotal = subtotal + maxDeliveryCharges;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-ink/50 backdrop-blur-xs transition-opacity"
          onClick={closeCart}
        />

        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between border-l border-ivory-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-ivory-300 px-6 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-gold-600" />
                <h2 className="font-display text-xl font-semibold text-ink">
                  Your Shopping Cart
                </h2>
              </div>
              <button
                type="button"
                onClick={closeCart}
                className="rounded p-1 text-ink-muted hover:bg-ivory-100 hover:text-ink"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {!items.length ? (
                <div className="py-16 text-center space-y-3 text-ink-muted">
                  <ShoppingBag className="mx-auto h-12 w-12 text-ivory-400" />
                  <p className="font-medium text-ink">Your cart is empty</p>
                  <p className="text-xs text-ink-muted">
                    Explore our exquisite personalized jewellery collections.
                  </p>
                  <button
                    type="button"
                    onClick={closeCart}
                    className="btn-primary text-xs py-2 px-4 inline-flex items-center gap-1 mt-2"
                  >
                    Browse Collections
                  </button>
                </div>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 rounded-sm border border-ivory-200 bg-ivory-50/50 p-3 relative transition hover:border-ivory-300"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-sm text-ink truncate pr-6">
                          {item.productTitle}
                        </h3>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="absolute right-3 top-3 text-ink-light hover:text-red-600 transition"
                          title="Remove item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {item.variantName && (
                        <p className="text-xs text-ink-muted mt-0.5">
                          Variant: <span className="font-medium text-ink">{item.variantName}</span>
                        </p>
                      )}

                      {item.personalizationText && (
                        <p className="text-xs text-gold-700 italic font-serif mt-0.5">
                          Personalization: &quot;{item.personalizationText}&quot;
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between">
                        {/* Quantity selector */}
                        <div className="inline-flex items-center border border-ivory-300 bg-white rounded-sm">
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity - 1)
                            }
                            className="px-2 py-1 text-ink-muted hover:text-ink text-xs"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="px-2 text-xs font-semibold text-ink">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(item.id, item.quantity + 1)
                            }
                            className="px-2 py-1 text-ink-muted hover:text-ink text-xs"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        <span className="font-semibold text-sm text-gold-700">
                          {formatPKR(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary & Checkout */}
            {items.length > 0 && (
              <div className="border-t border-ivory-300 bg-ivory-50 p-6 space-y-3">
                <div className="space-y-1.5 text-xs text-ink-muted">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-ink">{formatPKR(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Charges</span>
                    <span className="font-medium text-ink">
                      {formatPKR(maxDeliveryCharges)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-ivory-300 pt-2 text-sm font-bold text-ink">
                    <span>Total Amount</span>
                    <span className="text-gold-700">{formatPKR(grandTotal)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCheckoutModalOpen(true)}
                  className="btn-primary w-full text-sm py-3 inline-flex items-center justify-center gap-2 shadow-md"
                >
                  Proceed to Checkout — COD
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <CartCheckoutModal
        open={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
      />
    </>
  );
}
