import type { Metadata } from "next";

export const metadata: Metadata = { title: "About Us" };

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-ink">About Us</h1>
      <div className="mt-8 space-y-4 text-ink-muted leading-relaxed">
        <p>
          MU Gold Smith is a personalized jewellery brand crafted for meaningful
          moments. From custom name necklaces to engraved cufflinks and Islamic
          calligraphy pieces, every order is made with care.
        </p>
        <p>
          We believe jewellery should tell a story — yours. Whether you&apos;re
          gifting a loved one or treating yourself, our pieces are designed to
          feel personal, elegant, and lasting.
        </p>
        <p>
          Based in Pakistan, we offer Cash on Delivery nationwide so you can
          shop with confidence.
        </p>
      </div>
    </article>
  );
}
