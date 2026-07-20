"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Menu, X, Search, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";

const NAV = [
  { href: "/collections/women", label: "Women" },
  { href: "/collections/men", label: "Men" },
  { href: "/collections/islamic-jewellery", label: "Islamic Jewellery" },
  { href: "/collections/best-sellers", label: "Best Sellers" },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { totalCount, openCart } = useCart();

  return (
    <header className="sticky top-0 z-40 border-b border-ivory-300/80 bg-ivory-50/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        <Link href="/" className="group" aria-label="MU Gold Smith home">
          <Image
            src="/logo.png"
            alt="MU Gold Smith"
            width={210}
            height={46}
            priority
            className="h-10 w-auto object-contain sm:h-11"
          />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium tracking-wide text-ink-muted transition hover:text-gold-600"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/collections/best-sellers"
            className="hidden text-ink-muted transition hover:text-gold-600 sm:block"
            aria-label="Browse products"
          >
            <Search className="h-5 w-5" />
          </Link>

          {/* Cart Icon Button with Counter Badge */}
          <button
            type="button"
            onClick={openCart}
            className="relative rounded-full p-2 text-ink-muted transition hover:bg-ivory-200 hover:text-ink"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="h-5 w-5 text-ink" />
            {totalCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold-600 text-[10px] font-bold text-white shadow">
                {totalCount}
              </span>
            )}
          </button>

          <button
            type="button"
            className="text-ink md:hidden"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-ivory-300 bg-ivory-50 px-4 py-4 md:hidden">
          <ul className="flex flex-col gap-3">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block py-2 text-base font-medium text-ink-muted hover:text-gold-600"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
