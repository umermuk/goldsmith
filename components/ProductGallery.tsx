"use client";

import Image from "next/image";
import { useState } from "react";
import type { ProductImage } from "@/types/database";

interface ProductGalleryProps {
  images: ProductImage[];
  title: string;
}

export default function ProductGallery({ images, title }: ProductGalleryProps) {
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const fallback =
    "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1000&q=80";
  const [active, setActive] = useState(sorted[0]?.image_url || fallback);

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden bg-ivory-200">
        <Image
          src={active}
          alt={title}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(img.image_url)}
              className={`relative h-20 w-20 flex-shrink-0 overflow-hidden border-2 transition ${
                active === img.image_url
                  ? "border-gold-500"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={img.image_url}
                alt={`${title} thumbnail`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
