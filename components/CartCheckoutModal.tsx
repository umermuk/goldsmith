"use client";

import { useState } from "react";
import { X, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { formatPKR } from "@/lib/format";
import { useCart } from "@/context/CartContext";

export default function CartCheckoutModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { items, subtotal, maxDeliveryCharges, clearCart } = useCart();
  const grandTotal = subtotal + maxDeliveryCharges;

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<{
    customerName: string;
    totalAmount: number;
  } | null>(null);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!items.length) return;

    setError(null);
    setLoading(true);

    try {
      // 1. Insert an order entry into Supabase for each cart item or combined summary order
      // We will create orders for each item in the cart or bulk insert
      const orderRecords = items.map((item) => ({
        customer_name: customerName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        product_id: item.productId,
        variant_id: item.variantId,
        personalization_text: item.personalizationText.trim() || null,
        quantity: item.quantity,
        total_price: item.unitPrice * item.quantity + item.deliveryCharges,
        delivery_charges: item.deliveryCharges,
        status: "pending" as const,
        notes: notes.trim()
          ? `${notes.trim()} (Cart item: ${item.productTitle})`
          : `Cart order item: ${item.productTitle}`,
      }));

      const res = await fetch("/api/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderRecords),
      });

      const result = await res.json();

      if (!res.ok || result.error) {
        throw new Error(result.error || "Failed to place order.");
      }

      const data = result.data;

      // 2. Trigger Nodemailer email notification
      const firstItem = items[0];
      try {
        await fetch("/api/send-order-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: data?.[0]?.id || `CART-${Date.now()}`,
            customerName: customerName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            city: city.trim(),
            productTitle: `${items.length} items (${items
              .map((i) => `${i.productTitle} x${i.quantity}`)
              .join(", ")})`,
            productSlug: null,
            variantName: firstItem.variantName || null,
            personalizationText: items
              .map((i) => i.personalizationText)
              .filter(Boolean)
              .join("; "),
            quantity: items.reduce((acc, i) => acc + i.quantity, 0),
            deliveryCharges: maxDeliveryCharges,
            totalPrice: grandTotal,
            notes: notes.trim(),
          }),
        });
      } catch (err) {
        console.warn("Failed to send order notification email", err);
      }

      const totalPlacedAmount = grandTotal;
      const finalName = customerName.trim();

      clearCart();
      setOrderSuccess({
        customerName: finalName,
        totalAmount: totalPlacedAmount,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-sm bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-ink-muted hover:text-ink"
        >
          <X className="h-5 w-5" />
        </button>

        {orderSuccess ? (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600 animate-bounce" />
            <h2 className="font-display text-2xl font-semibold text-ink">
              Order Confirmed!
            </h2>
            <p className="text-sm text-ink-muted leading-relaxed max-w-sm mx-auto">
              Thank you, <strong className="text-ink">{orderSuccess.customerName}</strong>! Your order of{" "}
              <strong className="text-gold-700">{formatPKR(orderSuccess.totalAmount)}</strong> has been placed successfully via Cash on Delivery.
            </p>
            <p className="text-xs text-ink-light bg-ivory-100 p-3 rounded border border-ivory-300">
              Our team will contact you shortly to confirm your order delivery.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="btn-primary w-full mt-4"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">
              Cart Checkout — COD
            </h2>
            <p className="mt-1 text-xs text-ink-muted">
              Pay Cash on Delivery when your package arrives at your doorstep.
            </p>

            {/* Cart Summary Header */}
            <div className="mt-4 rounded border border-ivory-300 bg-ivory-50 p-3 text-xs space-y-1.5">
              <div className="font-semibold text-ink">
                Items ({items.length}):
              </div>
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-ink-muted">
                  <span className="truncate max-w-[220px]">
                    {item.productTitle} {item.variantName ? `(${item.variantName})` : ""} x{item.quantity}
                  </span>
                  <span className="font-medium text-ink">
                    {formatPKR(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
              <div className="border-t border-ivory-200 pt-1 flex justify-between font-bold text-ink">
                <span>Total Amount (Inc. Delivery):</span>
                <span className="text-gold-700">{formatPKR(grandTotal)}</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="label-field">Full Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Umer Khan"
                  className="input-field"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div>
                <label className="label-field">Phone / Mobile Number *</label>
                <input
                  required
                  type="tel"
                  placeholder="03001234567"
                  className="input-field"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="label-field">City *</label>
                <input
                  required
                  type="text"
                  placeholder="Karachi, Lahore, Islamabad, etc."
                  className="input-field"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div>
                <label className="label-field">Delivery Address *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Full street address, house/shop number"
                  className="input-field"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="label-field">Special Instructions / Notes</label>
                <input
                  type="text"
                  placeholder="Optional notes"
                  className="input-field"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {error && (
                <p className="rounded bg-red-50 p-2.5 text-xs text-red-700 font-medium">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-base py-3 inline-flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-5 w-5" />
                    Confirm Order — {formatPKR(grandTotal)}
                  </>
                )}
              </button>

              <p className="text-center text-xs text-ink-light">
                Cash on Delivery (COD) • Safe & Secure Delivery across Pakistan
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
