import Link from "next/link";
import {
  Package,
  ShoppingBag,
  Clock,
  Banknote,
  TrendingUp,
  CheckCircle2,
  Truck,
  FolderTree,
  ArrowUpRight,
  Eye,
  Plus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatPKR } from "@/lib/format";
import type { OrderWithDetails } from "@/types/database";

export default async function AdminDashboardPage() {
  const supabase = createClient();

  // Fetch all orders and counts in parallel
  const [
    { data: allOrders },
    { count: totalProducts },
    { count: totalCategories },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("*, products(title, slug), product_variants(variant_name)")
      .order("created_at", { ascending: false }),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("categories").select("*", { count: "exact", head: true }),
  ]);

  const orders = (allOrders || []) as OrderWithDetails[];

  // Revenue & Order status metrics
  let totalRevenue = 0;
  let deliveredRevenue = 0;
  let pendingRevenue = 0;

  const statusCounts = {
    pending: 0,
    confirmed: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  };

  orders.forEach((o) => {
    const price = Number(o.total_price) || 0;
    if (o.status !== "cancelled") {
      totalRevenue += price;
    }
    if (o.status === "delivered") {
      deliveredRevenue += price;
    }
    if (o.status === "pending") {
      pendingRevenue += price;
    }

    if (statusCounts[o.status] !== undefined) {
      statusCounts[o.status]++;
    }
  });

  const totalOrdersCount = orders.length;

  const statsCards = [
    {
      label: "Total Sales Revenue",
      value: formatPKR(totalRevenue),
      subtext: `From ${totalOrdersCount - statusCounts.cancelled} active orders`,
      icon: Banknote,
      color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    },
    {
      label: "Delivered Revenue",
      value: formatPKR(deliveredRevenue),
      subtext: `${statusCounts.delivered} completed deliveries`,
      icon: TrendingUp,
      color: "text-blue-700 bg-blue-50 border-blue-200",
    },
    {
      label: "Pending Orders Revenue",
      value: formatPKR(pendingRevenue),
      subtext: `${statusCounts.pending} orders awaiting action`,
      icon: Clock,
      color: "text-amber-700 bg-amber-50 border-amber-200",
    },
    {
      label: "Total Orders",
      value: totalOrdersCount.toString(),
      subtext: `${statusCounts.pending} pending, ${statusCounts.delivered} delivered`,
      icon: ShoppingBag,
      color: "text-gold-700 bg-gold-50 border-gold-200",
    },
  ];

  const secondaryStats = [
    {
      label: "Pending Action",
      count: statusCounts.pending,
      icon: Clock,
      badge: "bg-amber-100 text-amber-800",
      href: "/admin/orders?status=pending",
    },
    {
      label: "Confirmed Orders",
      count: statusCounts.confirmed,
      icon: CheckCircle2,
      badge: "bg-blue-100 text-blue-800",
      href: "/admin/orders?status=confirmed",
    },
    {
      label: "In Transit / Shipped",
      count: statusCounts.shipped,
      icon: Truck,
      badge: "bg-purple-100 text-purple-800",
      href: "/admin/orders?status=shipped",
    },
    {
      label: "Delivered",
      count: statusCounts.delivered,
      icon: CheckCircle2,
      badge: "bg-emerald-100 text-emerald-800",
      href: "/admin/orders?status=delivered",
    },
    {
      label: "Total Products",
      count: totalProducts ?? 0,
      icon: Package,
      badge: "bg-ivory-200 text-ink",
      href: "/admin/products",
    },
    {
      label: "Categories",
      count: totalCategories ?? 0,
      icon: FolderTree,
      badge: "bg-ivory-200 text-ink",
      href: "/admin/categories",
    },
  ];

  const recentOrders = orders.slice(0, 8);

  return (
    <div className="space-y-8">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Live overview of sales, revenue, products, and customer orders
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/products/new"
            className="btn-primary text-xs py-2 px-3 inline-flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
          <Link
            href="/admin/orders"
            className="rounded border border-ivory-300 bg-white px-3 py-2 text-xs font-medium text-ink hover:bg-ivory-100 shadow-sm inline-flex items-center gap-1 transition"
          >
            Manage Orders
            <ArrowUpRight className="h-3.5 w-3.5 text-ink-muted" />
          </Link>
        </div>
      </div>

      {/* Main Revenue & Core Financial Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-sm border border-ivory-300 bg-white p-5 shadow-sm transition hover:border-gold-300"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-ink-muted">
                  {card.label}
                </span>
                <div className={`rounded p-2 border ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-ink">
                {card.value}
              </p>
              <p className="mt-1 text-xs text-ink-muted">{card.subtext}</p>
            </div>
          );
        })}
      </div>

      {/* Secondary Status & Overview Cards */}
      <div>
        <h2 className="text-xs uppercase font-semibold tracking-wider text-ink-muted mb-3">
          Order Status & Catalogue Overview
        </h2>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {secondaryStats.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="group rounded-sm border border-ivory-300 bg-white p-4 transition hover:border-gold-400 hover:shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="h-4 w-4 text-ink-muted group-hover:text-gold-600 transition" />
                  <span
                    className={`rounded px-1.5 py-0.5 text-xs font-bold ${item.badge}`}
                  >
                    {item.count}
                  </span>
                </div>
                <p className="text-xs font-medium text-ink group-hover:text-gold-700 transition">
                  {item.label}
                </p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Order Status Breakdown Progress Bar */}
      {totalOrdersCount > 0 && (
        <div className="rounded-sm border border-ivory-300 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-ink uppercase tracking-wide">
              Order Fulfillment Breakdown
            </span>
            <span className="text-ink-muted">
              {totalOrdersCount} Total Orders
            </span>
          </div>

          {/* Combined Progress Bar */}
          <div className="flex h-3 w-full overflow-hidden rounded bg-ivory-200">
            {statusCounts.delivered > 0 && (
              <div
                style={{
                  width: `${(statusCounts.delivered / totalOrdersCount) * 100}%`,
                }}
                className="bg-emerald-500"
                title={`Delivered: ${statusCounts.delivered}`}
              />
            )}
            {statusCounts.shipped > 0 && (
              <div
                style={{
                  width: `${(statusCounts.shipped / totalOrdersCount) * 100}%`,
                }}
                className="bg-purple-500"
                title={`Shipped: ${statusCounts.shipped}`}
              />
            )}
            {statusCounts.confirmed > 0 && (
              <div
                style={{
                  width: `${(statusCounts.confirmed / totalOrdersCount) * 100}%`,
                }}
                className="bg-blue-500"
                title={`Confirmed: ${statusCounts.confirmed}`}
              />
            )}
            {statusCounts.pending > 0 && (
              <div
                style={{
                  width: `${(statusCounts.pending / totalOrdersCount) * 100}%`,
                }}
                className="bg-amber-500"
                title={`Pending: ${statusCounts.pending}`}
              />
            )}
            {statusCounts.cancelled > 0 && (
              <div
                style={{
                  width: `${(statusCounts.cancelled / totalOrdersCount) * 100}%`,
                }}
                className="bg-red-400"
                title={`Cancelled: ${statusCounts.cancelled}`}
              />
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-ink-muted">
                Delivered ({statusCounts.delivered})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              <span className="text-ink-muted">
                Shipped ({statusCounts.shipped})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-ink-muted">
                Confirmed ({statusCounts.confirmed})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              <span className="text-ink-muted">
                Pending ({statusCounts.pending})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="text-ink-muted">
                Cancelled ({statusCounts.cancelled})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">
              Recent Orders
            </h2>
            <p className="text-xs text-ink-muted">
              Latest storefront customer purchases
            </p>
          </div>
          <Link
            href="/admin/orders"
            className="text-xs font-medium text-gold-700 hover:text-gold-800 hover:underline inline-flex items-center gap-0.5"
          >
            View All Orders ({totalOrdersCount}) &rarr;
          </Link>
        </div>

        {!recentOrders.length ? (
          <div className="rounded-sm border border-dashed border-ivory-300 bg-white py-12 text-center text-ink-muted">
            No orders placed yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-sm border border-ivory-300 bg-white shadow-sm">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="border-b border-ivory-300 bg-ivory-50 text-xs uppercase text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Product</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => {
                  const productTitle =
                    (order.products as { title: string } | null)?.title || "—";
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-ivory-200 hover:bg-ivory-50 transition"
                    >
                      <td className="px-4 py-3 text-xs text-ink-muted whitespace-nowrap">
                        {new Date(order.created_at).toLocaleString("en-PK", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">
                          {order.customer_name}
                        </p>
                        <p className="text-xs text-gold-700">{order.phone}</p>
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate">
                        <span className="font-medium text-ink">
                          {productTitle}
                        </span>
                        {order.personalization_text && (
                          <p className="text-xs text-gold-700 italic">
                            &quot;{order.personalization_text}&quot;
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-ink whitespace-nowrap">
                        {formatPKR(order.total_price)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs capitalize font-medium ${
                            order.status === "delivered"
                              ? "bg-emerald-100 text-emerald-800"
                              : order.status === "shipped"
                              ? "bg-purple-100 text-purple-800"
                              : order.status === "confirmed"
                              ? "bg-blue-100 text-blue-800"
                              : order.status === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href="/admin/orders"
                          className="inline-flex items-center gap-1 rounded border border-ivory-300 px-2.5 py-1 text-xs font-medium text-ink hover:bg-ivory-100"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
