"use client";

import { useEffect, useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { formatPKR } from "@/lib/format";
import type { OrderFormData } from "@/types/database";

interface OrderModalProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
  unitPrice: number;
  deliveryCharges?: number;
  variantId: string | null;
  variantName: string | null;
  personalizationText: string;
  isPersonalized: boolean;
  initialQuantity: number;
}

export default function OrderModal({
  open,
  onClose,
  productId,
  productTitle,
  unitPrice,
  deliveryCharges = 200,
  variantId,
  variantName,
  personalizationText,
  isPersonalized,
  initialQuantity,
}: OrderModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [quantity, setQuantity] = useState(initialQuantity);
  const [personalization, setPersonalization] = useState(personalizationText);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setQuantity(initialQuantity);
      setPersonalization(personalizationText);
      setSuccess(false);
      setError(null);
    }
  }, [open, initialQuantity, personalizationText]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const subtotal = unitPrice * quantity;
  const total = subtotal + (deliveryCharges || 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (isPersonalized && !personalization.trim()) {
      setError("Please enter your personalization text.");
      return;
    }

    setSubmitting(true);

    const orderPayload = {
      customer_name: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      product_id: productId,
      variant_id: variantId,
      personalization_text: isPersonalized
        ? personalization.trim()
        : null,
      quantity,
      delivery_charges: deliveryCharges || 0,
      total_price: total,
      notes: notes.trim() || null,
      status: "pending",
    };

    const res = await fetch("/api/place-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });

    const result = await res.json();

    if (!res.ok || result.error) {
      setSubmitting(false);
      setError(result.error || "Failed to place order. Please try again.");
      return;
    }

    const insertedData = result.data?.[0];

    const emailBody: OrderFormData = {
      ...orderPayload,
      product_title: productTitle,
      variant_name: variantName,
    };

    try {
      await fetch("/api/send-order-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...emailBody, order_id: insertedData?.id }),
      });
    } catch {
      // Best-effort email — order already saved
    }

    setSubmitting(false);
    setSuccess(true);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-ivory-50 shadow-2xl sm:rounded-sm">
        <div className="sticky top-0 flex items-center justify-between border-b border-ivory-300 bg-ivory-50 px-5 py-4">
          <h2
            id="order-modal-title"
            className="font-display text-xl font-semibold text-ink"
          >
            {success ? "Order Received" : "Complete Your Order"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-ink-muted hover:text-ink"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <CheckCircle2 className="h-14 w-14 text-gold-500" />
            <p className="mt-4 font-display text-2xl font-medium text-ink">
              Order received!
            </p>
            <p className="mt-2 max-w-sm text-sm text-ink-muted">
              We&apos;ll contact you shortly to confirm. Cash on Delivery —
              pay when your order arrives.
            </p>
            <button type="button" onClick={onClose} className="btn-primary mt-8">
              Continue Shopping
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 px-5 py-6">
            <div className="rounded-sm bg-ivory-200/60 px-4 py-3 text-sm space-y-1">
              <p className="font-medium text-ink">{productTitle}</p>
              {variantName && (
                <p className="text-xs text-ink-muted">Variant: {variantName}</p>
              )}
              <div className="border-t border-ivory-300/60 pt-2 text-xs space-y-1">
                <div className="flex justify-between text-ink-muted">
                  <span>Subtotal ({formatPKR(unitPrice)} × {quantity})</span>
                  <span>{formatPKR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-ink-muted">
                  <span>Delivery Charges</span>
                  <span>{deliveryCharges ? formatPKR(deliveryCharges) : "Free"}</span>
                </div>
                <div className="flex justify-between pt-1 font-semibold text-gold-800 text-sm">
                  <span>Total Amount (COD)</span>
                  <span>{formatPKR(total)}</span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="customer_name" className="label-field">
                Full Name *
              </label>
              <input
                id="customer_name"
                className="input-field"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="phone" className="label-field">
                Phone Number *
              </label>
              <input
                id="phone"
                type="tel"
                className="input-field"
                required
                placeholder="03XX XXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="address" className="label-field">
                Address *
              </label>
              <textarea
                id="address"
                className="input-field min-h-[80px]"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="city" className="label-field">
                City *
              </label>
              <input
                id="city"
                className="input-field"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="quantity" className="label-field">
                Quantity
              </label>
              <input
                id="quantity"
                type="number"
                min={1}
                max={20}
                className="input-field"
                required
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                }
              />
            </div>
            {isPersonalized && (
              <div>
                <label htmlFor="personalization" className="label-field">
                  Enter Name/Text for Personalization *
                </label>
                <input
                  id="personalization"
                  className="input-field"
                  required
                  value={personalization}
                  onChange={(e) => setPersonalization(e.target.value)}
                />
              </div>
            )}
            <div>
              <label htmlFor="notes" className="label-field">
                Notes (optional)
              </label>
              <textarea
                id="notes"
                className="input-field min-h-[60px]"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions..."
              />
            </div>

            {error && (
              <p className="rounded-sm bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Placing Order...
                </>
              ) : (
                "Place COD Order"
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
