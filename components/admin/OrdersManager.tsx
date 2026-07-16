"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPKR, ORDER_STATUSES } from "@/lib/format";
import type { OrderStatus, OrderWithDetails } from "@/types/database";

export default function OrdersManager({
  initial,
  initialStatus,
}: {
  initial: OrderWithDetails[];
  initialStatus: string;
}) {
  const router = useRouter();
  const [orders, setOrders] = useState(initial);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [selected, setSelected] = useState<OrderWithDetails | null>(null);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  function onFilterChange(value: string) {
    setStatusFilter(value);
    const q = value === "all" ? "" : `?status=${value}`;
    router.push(`/admin/orders${q}`);
  }

  async function updateStatus(id: string, status: OrderStatus) {
    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
    if (selected?.id === id) {
      setSelected({ ...selected, status });
    }
  }

  return (
    <div>
      <div className="mb-4">
        <label className="label-field">Filter by status</label>
        <select
          className="input-field w-auto"
          value={statusFilter}
          onChange={(e) => onFilterChange(e.target.value)}
        >
          <option value="all">All</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {!filtered.length ? (
        <div className="rounded-sm border border-dashed border-ivory-300 bg-white py-16 text-center text-ink-muted">
          No orders yet — they will appear when customers place COD orders
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-ivory-300 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-ivory-300 bg-ivory-50 text-xs uppercase text-ink-muted">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr
                  key={order.id}
                  className="cursor-pointer border-b border-ivory-200 hover:bg-ivory-50"
                  onClick={() => setSelected(order)}
                >
                  <td className="px-4 py-3 text-ink-muted">
                    {new Date(order.created_at).toLocaleString("en-PK")}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{order.customer_name}</p>
                    <p className="text-xs text-ink-light">{order.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    {(order.products as { title: string } | null)?.title || "—"}
                  </td>
                  <td className="px-4 py-3">{formatPKR(order.total_price)}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <select
                      className="input-field py-1.5 text-xs capitalize"
                      value={order.status}
                      onChange={(e) =>
                        updateStatus(order.id, e.target.value as OrderStatus)
                      }
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-sm bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <h2 className="font-display text-xl font-semibold">
                Order Details
              </h2>
              <button type="button" onClick={() => setSelected(null)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <dl className="mt-6 space-y-3 text-sm">
              <Row label="Customer" value={selected.customer_name} />
              <Row label="Phone" value={selected.phone} />
              <Row label="Address" value={selected.address} />
              <Row label="City" value={selected.city} />
              <Row
                label="Product"
                value={
                  (selected.products as { title: string } | null)?.title || "—"
                }
              />
              <Row
                label="Variant"
                value={
                  (
                    selected.product_variants as {
                      variant_name: string;
                    } | null
                  )?.variant_name || "—"
                }
              />
              <Row
                label="Personalization"
                value={selected.personalization_text || "—"}
              />
              <Row label="Quantity" value={String(selected.quantity)} />
              <Row label="Total" value={formatPKR(selected.total_price)} />
              <Row label="Status" value={selected.status} />
              <Row label="Notes" value={selected.notes || "—"} />
              <Row
                label="Date"
                value={new Date(selected.created_at).toLocaleString("en-PK")}
              />
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="col-span-2 font-medium text-ink">{value}</dd>
    </div>
  );
}
