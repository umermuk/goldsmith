"use client";

import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  const href =
    process.env.NEXT_PUBLIC_WHATSAPP_LINK ||
    "https://wa.me/message/TGENSLM6PME7C1";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition hover:scale-105 hover:shadow-xl"
      aria-label="Message MU Gold Smith on WhatsApp"
    >
      <MessageCircle className="h-7 w-7 fill-current" />
    </a>
  );
}
