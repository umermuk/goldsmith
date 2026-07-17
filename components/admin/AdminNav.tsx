"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderOpen,
  ShoppingBag,
  LogOut,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/format";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderOpen },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <>
      <aside className="relative hidden w-56 flex-shrink-0 border-r border-ivory-300 bg-white md:flex md:flex-col">
        <div className="border-b border-ivory-300 px-5 py-5">
          <Link
            href="/admin/dashboard"
            aria-label="MU Gold Smith admin dashboard"
          >
            <Image
              src="/logo.png"
              alt="MU Gold Smith"
              width={170}
              height={37}
              className="h-9 w-auto object-contain"
            />
          </Link>
          <p className="text-xs text-ink-light">Admin Panel</p>
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-sm px-3 py-2.5 text-sm transition",
                  active
                    ? "bg-gold-100 text-gold-800"
                    : "text-ink-muted hover:bg-ivory-100 hover:text-ink"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-ivory-300 p-3">
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-sm px-3 py-2.5 text-sm text-ink-muted hover:bg-ivory-100"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="border-b border-ivory-300 bg-white md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-display text-lg font-semibold text-gold-700">
            Admin
          </span>
          <button
            type="button"
            onClick={signOut}
            className="text-sm text-ink-muted"
          >
            Sign out
          </button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-sm px-3 py-1.5 text-xs",
                  active
                    ? "bg-gold-100 text-gold-800"
                    : "text-ink-muted hover:bg-ivory-100"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
