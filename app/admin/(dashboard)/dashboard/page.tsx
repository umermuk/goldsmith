import Link from "next/link";
import { Package, ShoppingBag, Clock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = createClient();

  const [
    { count: totalOrders },
    { count: pendingOrders },
    { count: totalProducts },
  ] = await Promise.all([
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("products").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    {
      label: "Total Orders",
      value: totalOrders ?? 0,
      icon: ShoppingBag,
      href: "/admin/orders",
    },
    {
      label: "Pending Orders",
      value: pendingOrders ?? 0,
      icon: Clock,
      href: "/admin/orders?status=pending",
    },
    {
      label: "Total Products",
      value: totalProducts ?? 0,
      icon: Package,
      href: "/admin/products",
    },
  ];

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Overview of your Gold Smith store
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-sm border border-ivory-300 bg-white p-6 transition hover:border-gold-300"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink-muted">{s.label}</p>
              <s.icon className="h-5 w-5 text-gold-500" />
            </div>
            <p className="mt-3 font-display text-4xl font-semibold text-ink">
              {s.value}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
