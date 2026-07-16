import type { Metadata } from "next";
import { Mail, Phone, MessageCircle } from "lucide-react";

export const metadata: Metadata = { title: "Contact Us" };

export default function ContactPage() {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "923000000000";

  return (
    <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-semibold text-ink">
        Contact Us
      </h1>
      <p className="mt-3 text-ink-muted">
        Questions about an order or custom piece? We&apos;re happy to help.
      </p>
      <ul className="mt-10 space-y-5">
        <li className="flex items-center gap-3 text-ink-muted">
          <Phone className="h-5 w-5 text-gold-500" />
          <span>+92 300 0000000</span>
        </li>
        <li className="flex items-center gap-3 text-ink-muted">
          <Mail className="h-5 w-5 text-gold-500" />
          <span>hello@goldsmith.pk</span>
        </li>
        <li>
          <a
            href={`https://wa.me/${wa}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex"
          >
            <MessageCircle className="h-4 w-4" />
            Chat on WhatsApp
          </a>
        </li>
      </ul>
    </article>
  );
}
