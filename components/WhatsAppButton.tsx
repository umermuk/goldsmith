"use client";

import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  const number =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "923000000000";
  const href = `https://wa.me/${number}?text=${encodeURIComponent(
    "Hi MU Gold Smith! I'd like to know more about your jewellery."
  )}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-7 w-7 fill-current" />
    </a>
  );
}
