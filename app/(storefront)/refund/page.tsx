import type { Metadata } from "next";

export const metadata: Metadata = { title: "Refund Policy" };

export default function RefundPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-ink">
        Refund Policy
      </h1>
      <div className="mt-8 space-y-4 text-ink-muted leading-relaxed">
        <p>
          Because many of our pieces are personalized, we handle returns with
          care:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>
            Non-personalized items can be returned within 7 days if unused and
            in original packaging
          </li>
          <li>
            Personalized / engraved items are non-refundable unless defective or
            incorrect due to our error
          </li>
          <li>
            If you receive a damaged item, contact us within 48 hours with
            photos
          </li>
        </ul>
        <p>
          Reach us via WhatsApp or the Contact page and we&apos;ll help resolve
          your issue promptly.
        </p>
      </div>
    </article>
  );
}
