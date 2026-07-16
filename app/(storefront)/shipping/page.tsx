import type { Metadata } from "next";

export const metadata: Metadata = { title: "Shipping Details" };

export default function ShippingPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-ink">
        Shipping Details
      </h1>
      <div className="mt-8 space-y-4 text-ink-muted leading-relaxed">
        <p>
          We ship across Pakistan via reliable courier partners. Orders are
          typically dispatched within 2–4 business days after confirmation
          (personalized items may take slightly longer).
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Cash on Delivery (COD) available nationwide</li>
          <li>You will receive a confirmation call/WhatsApp before dispatch</li>
          <li>Delivery usually takes 2–5 days depending on your city</li>
          <li>Shipping charges (if any) are confirmed when we contact you</li>
        </ul>
      </div>
    </article>
  );
}
