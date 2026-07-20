"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  MessageCircle,
  Edit2,
  Save,
  Trash2,
  Eye,
  Search,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileSpreadsheet,
  CheckSquare,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatPKR, ORDER_STATUSES } from "@/lib/format";
import type { OrderStatus, OrderWithDetails } from "@/types/database";

const PAGE_SIZE = 25;

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
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(
    null
  );
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<{
    customer_name: string;
    phone: string;
    address: string;
    city: string;
    status: OrderStatus;
    quantity: number;
    delivery_charges: number;
    total_price: number;
    personalization_text: string;
    notes: string;
  }>({
    customer_name: "",
    phone: "",
    address: "",
    city: "",
    status: "pending",
    quantity: 1,
    delivery_charges: 200,
    total_price: 0,
    personalization_text: "",
    notes: "",
  });

  // Filter & Search Logic
  const filteredAndSearched = useMemo(() => {
    let result = orders;

    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((o) => {
        const pTitle =
          ((o.products as { title: string } | null)?.title || "").toLowerCase();
        const vName =
          ((o.product_variants as { variant_name: string } | null)?.variant_name ||
            "").toLowerCase();
        return (
          o.customer_name?.toLowerCase().includes(q) ||
          o.phone?.includes(q) ||
          o.city?.toLowerCase().includes(q) ||
          o.address?.toLowerCase().includes(q) ||
          o.id?.toLowerCase().includes(q) ||
          pTitle.includes(q) ||
          vName.includes(q) ||
          o.personalization_text?.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [orders, statusFilter, searchQuery]);

  // Reset pagination on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  const totalPages = Math.ceil(filteredAndSearched.length / PAGE_SIZE) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredAndSearched.slice(start, start + PAGE_SIZE);
  }, [filteredAndSearched, currentPage]);

  // Row selection helpers
  function toggleSelectOrder(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAll() {
    const allPaginatedIds = paginatedOrders.map((o) => o.id);
    const allSelected = allPaginatedIds.every((id) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allPaginatedIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        allPaginatedIds.forEach((id) => next.add(id));
        return next;
      });
    }
  }

  function onFilterChange(value: string) {
    setStatusFilter(value);
    const q = value === "all" ? "" : `?status=${value}`;
    router.push(`/admin/orders${q}`);
  }

  function openOrderModal(order: OrderWithDetails, editMode = false) {
    setSelectedOrder(order);
    setIsEditing(editMode);
    setEditForm({
      customer_name: order.customer_name || "",
      phone: order.phone || "",
      address: order.address || "",
      city: order.city || "",
      status: order.status,
      quantity: order.quantity || 1,
      delivery_charges: order.delivery_charges ?? 200,
      total_price: order.total_price || 0,
      personalization_text: order.personalization_text || "",
      notes: order.notes || "",
    });
  }

  function closeOrderModal() {
    setSelectedOrder(null);
    setIsEditing(false);
  }

  function sendWhatsAppNotification(order: OrderWithDetails) {
    let phone = order.phone.replace(/[^0-9]/g, "");
    if (phone.startsWith("0")) {
      phone = "92" + phone.substring(1);
    } else if (!phone.startsWith("92") && phone.length === 10) {
      phone = "92" + phone;
    }

    const productInfo = order.products as { title: string; slug?: string } | null;
    const productTitle = productInfo?.title || "Jewellery Item";
    const productSlug = productInfo?.slug;
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const productUrl = productSlug ? `${siteUrl}/products/${productSlug}` : null;

    const variantName = (
      order.product_variants as { variant_name: string } | null
    )?.variant_name;

    let message = `*MU Gold Smith - Order Notification* 🛍️\n\n`;
    message += `*Customer Name:* ${order.customer_name}\n`;
    message += `*Phone:* ${order.phone}\n`;
    message += `*Product:* ${productTitle}\n`;
    if (productUrl) message += `*Product Link:*\n${productUrl}\n`;
    if (variantName) message += `*Variant:* ${variantName}\n`;
    if (order.personalization_text)
      message += `*Personalization:* ${order.personalization_text}\n`;
    message += `*Quantity:* ${order.quantity}\n`;
    message += `*Delivery Charges:* ${
      order.delivery_charges != null ? formatPKR(order.delivery_charges) : "Rs. 200"
    }\n`;
    message += `*Total Amount:* ${formatPKR(order.total_price)} (COD)\n`;
    message += `*Delivery Address:* ${order.address}, ${order.city}\n`;
    if (order.notes) message += `*Notes:* ${order.notes}\n`;
    message += `\nThank you for choosing MU Gold Smith! ✨`;

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
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
    if (selectedOrder?.id === id) {
      setSelectedOrder({ ...selectedOrder, status });
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrder) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("orders")
      .update({
        customer_name: editForm.customer_name,
        phone: editForm.phone,
        address: editForm.address,
        city: editForm.city,
        status: editForm.status,
        quantity: editForm.quantity,
        delivery_charges: editForm.delivery_charges,
        total_price: editForm.total_price,
        personalization_text: editForm.personalization_text,
        notes: editForm.notes,
      })
      .eq("id", selectedOrder.id);

    setSaving(false);
    if (error) {
      alert("Failed to update order: " + error.message);
      return;
    }

    const updatedOrder: OrderWithDetails = {
      ...selectedOrder,
      ...editForm,
    };

    setOrders((prev) =>
      prev.map((o) => (o.id === selectedOrder.id ? updatedOrder : o))
    );
    setSelectedOrder(updatedOrder);
    setIsEditing(false);
    alert("Order updated successfully!");
  }

  async function handleDeleteOrder(id: string) {
    if (!confirm("Are you sure you want to delete this order?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) {
      alert(error.message);
      return;
    }
    setOrders((prev) => prev.filter((o) => o.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (selectedOrder?.id === id) closeOrderModal();
  }

  // Export Orders to Excel CSV (All, Selected, or Single specific order)
  function exportToExcel(specificOrders?: OrderWithDetails[]) {
    let targetOrders = specificOrders;

    if (!targetOrders) {
      if (selectedIds.size > 0) {
        targetOrders = orders.filter((o) => selectedIds.has(o.id));
      } else {
        targetOrders = filteredAndSearched;
      }
    }

    if (!targetOrders || !targetOrders.length) {
      alert("No orders available to export!");
      return;
    }

    const headers = [
      "Order ID",
      "Customer Name",
      "Phone",
      "Address",
      "City",
      "Product Title",
      "Variant",
      "Personalization",
      "Quantity",
      "Delivery Charges (PKR)",
      "Total Price (PKR)",
      "Status",
      "Notes",
      "Order Date",
    ];

    const rows = targetOrders.map((o) => {
      const pTitle = (o.products as { title: string } | null)?.title || "—";
      const vName =
        (o.product_variants as { variant_name: string } | null)?.variant_name ||
        "—";
      return [
        `"${o.id}"`,
        `"${(o.customer_name || "").replace(/"/g, '""')}"`,
        `"${(o.phone || "").replace(/"/g, '""')}"`,
        `"${(o.address || "").replace(/"/g, '""')}"`,
        `"${(o.city || "").replace(/"/g, '""')}"`,
        `"${pTitle.replace(/"/g, '""')}"`,
        `"${vName.replace(/"/g, '""')}"`,
        `"${(o.personalization_text || "").replace(/"/g, '""')}"`,
        o.quantity || 1,
        o.delivery_charges ?? 200,
        o.total_price || 0,
        `"${o.status}"`,
        `"${(o.notes || "").replace(/"/g, '""')}"`,
        `"${new Date(o.created_at).toLocaleString()}"`,
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const filename =
      targetOrders.length === 1
        ? `order_${targetOrders[0].customer_name.replace(/[^a-zA-Z0-9]/g, "_")}.csv`
        : `orders_export_${new Date().toISOString().slice(0, 10)}.csv`;

    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Import Orders from Excel CSV File
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        alert("CSV file must contain a header row and at least 1 order row.");
        setIsImporting(false);
        return;
      }

      const parseCSVRow = (rowStr: string): string[] => {
        const result: string[] = [];
        let insideQuotes = false;
        let currentCell = "";
        for (let i = 0; i < rowStr.length; i++) {
          const char = rowStr[i];
          if (char === '"') {
            insideQuotes = !insideQuotes;
          } else if (char === "," && !insideQuotes) {
            result.push(currentCell.trim());
            currentCell = "";
          } else {
            currentCell += char;
          }
        }
        result.push(currentCell.trim());
        return result;
      }

      const ordersToInsert = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = parseCSVRow(lines[i]);
        if (cols.length < 2) continue;

        const customer_name = cols[1] || cols[0] || "Imported Customer";
        const phone = cols[2] || cols[1] || "";
        const address = cols[3] || "";
        const city = cols[4] || "";
        const personalization_text = cols[7] || "";
        const quantity = parseInt(cols[8] || "1", 10) || 1;
        const delivery_charges = parseFloat(cols[9] || "200") || 200;
        const total_price = parseFloat(cols[10] || "0") || 0;
        const rawStatus = (cols[11] || "pending").toLowerCase();
        const status: OrderStatus = [
          "pending",
          "confirmed",
          "shipped",
          "delivered",
          "cancelled",
        ].includes(rawStatus)
          ? (rawStatus as OrderStatus)
          : "pending";
        const notes = cols[12] || "Imported from CSV/Excel";

        ordersToInsert.push({
          customer_name,
          phone,
          address,
          city,
          personalization_text,
          quantity,
          delivery_charges,
          total_price,
          status,
          notes,
        });
      }

      if (!ordersToInsert.length) {
        alert("No valid rows found in CSV.");
        setIsImporting(false);
        return;
      }

      const supabase = createClient();
      const { data: insertedData, error } = await supabase
        .from("orders")
        .insert(ordersToInsert)
        .select("*, products(title, slug), product_variants(variant_name)");

      if (error) {
        alert("Failed to import orders: " + error.message);
      } else {
        alert(
          `Successfully imported ${
            insertedData?.length || ordersToInsert.length
          } orders!`
        );
        if (insertedData) {
          setOrders((prev) => [...(insertedData as OrderWithDetails[]), ...prev]);
        }
      }
    } catch (err) {
      console.error("Import error:", err);
      alert("Error reading Excel/CSV file.");
    } finally {
      setIsImporting(false);
      e.target.value = "";
    }
  }

  const startRecord = (currentPage - 1) * PAGE_SIZE + 1;
  const endRecord = Math.min(
    currentPage * PAGE_SIZE,
    filteredAndSearched.length
  );
  const isAllPaginatedSelected =
    paginatedOrders.length > 0 &&
    paginatedOrders.every((o) => selectedIds.has(o.id));

  return (
    <div>
      {/* Top Filter & Toolbar Bar */}
      <div className="mb-6 flex flex-col gap-4 bg-white p-4 rounded-sm border border-ivory-300 shadow-sm md:flex-row md:items-center md:justify-between">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Search by customer, phone, city, product or order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-9 pr-8 text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-ink-muted hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-ink-muted">Status:</span>
            <select
              className="input-field w-auto py-1.5 text-xs"
              value={statusFilter}
              onChange={(e) => onFilterChange(e.target.value)}
            >
              <option value="all">All Statuses</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* Export Button (All or Selected) */}
          <button
            type="button"
            onClick={() => exportToExcel()}
            className={`inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium transition shadow-sm ${
              selectedIds.size > 0
                ? "border-emerald-700 bg-emerald-600 text-white hover:bg-emerald-700 font-semibold"
                : "border-emerald-600 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
            title={
              selectedIds.size > 0
                ? `Export ${selectedIds.size} selected row(s) to Excel`
                : "Export filtered orders to Excel"
            }
          >
            <Download className="h-3.5 w-3.5" />
            {selectedIds.size > 0
              ? `Export Selected (${selectedIds.size})`
              : "Export Excel"}
          </button>

          {/* Import Button */}
          <label className="inline-flex items-center gap-1.5 cursor-pointer rounded border border-gold-600 bg-gold-50 px-3 py-1.5 text-xs font-medium text-gold-800 transition hover:bg-gold-100 shadow-sm">
            {isImporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            <span>Import Excel</span>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isImporting}
            />
          </label>
        </div>
      </div>

      {/* Info counter & Selection Bar */}
      <div className="mb-3 flex items-center justify-between px-1 text-xs text-ink-muted">
        <div className="flex items-center gap-3">
          <span>
            Showing {filteredAndSearched.length === 0 ? 0 : startRecord}–
            {endRecord} of {filteredAndSearched.length} orders
            {orders.length !== filteredAndSearched.length && (
              <span className="ml-1 text-gold-700">
                (filtered from {orders.length} total)
              </span>
            )}
          </span>
          {selectedIds.size > 0 && (
            <span className="inline-flex items-center gap-1 rounded bg-gold-100 px-2 py-0.5 font-medium text-gold-800 border border-gold-300">
              <CheckSquare className="h-3 w-3" />
              {selectedIds.size} row(s) selected
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="ml-1 text-ink-muted hover:text-ink underline"
              >
                Clear
              </button>
            </span>
          )}
        </div>
        <span>Page {currentPage} of {totalPages}</span>
      </div>

      {/* Orders Table */}
      {!filteredAndSearched.length ? (
        <div className="rounded-sm border border-dashed border-ivory-300 bg-white py-16 text-center text-ink-muted">
          <FileSpreadsheet className="mx-auto h-10 w-10 text-ivory-400 mb-2" />
          <p className="font-medium text-ink">No matching orders found</p>
          <p className="text-xs text-ink-muted mt-1">
            Try adjusting your search query or status filter.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-ivory-300 bg-white shadow-sm">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-ivory-300 bg-ivory-50 text-xs uppercase text-ink-muted">
              <tr>
                <th className="px-3 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={isAllPaginatedSelected}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-ivory-300 text-gold-600 focus:ring-gold-500 cursor-pointer"
                    title="Select all on this page"
                  />
                </th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Product Details</th>
                <th className="px-4 py-3">Delivery</th>
                <th className="px-4 py-3">Total Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => {
                const productTitle =
                  (order.products as { title: string } | null)?.title || "—";
                const variantName = (
                  order.product_variants as { variant_name: string } | null
                )?.variant_name;
                const isSelected = selectedIds.has(order.id);

                return (
                  <tr
                    key={order.id}
                    className={`border-b border-ivory-200 transition ${
                      isSelected ? "bg-gold-50/60" : "hover:bg-ivory-50"
                    }`}
                  >
                    <td className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOrder(order.id)}
                        className="h-4 w-4 rounded border-ivory-300 text-gold-600 focus:ring-gold-500 cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-ink-muted whitespace-nowrap text-xs">
                      {new Date(order.created_at).toLocaleString("en-PK", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-ink">{order.customer_name}</p>
                      <p className="text-xs text-gold-700">{order.phone}</p>
                      <p className="text-xs text-ink-light truncate max-w-[160px]">
                        {order.city}
                      </p>
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      <p className="font-medium text-ink truncate">
                        {productTitle}
                      </p>
                      {variantName && (
                        <span className="inline-block text-xs text-ink-muted bg-ivory-200 px-1.5 py-0.5 rounded">
                          {variantName}
                        </span>
                      )}
                      {order.personalization_text && (
                        <p className="text-xs text-gold-700 font-serif italic truncate">
                          &quot;{order.personalization_text}&quot;
                        </p>
                      )}
                      <p className="text-xs text-ink-light">Qty: {order.quantity}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-ink-muted whitespace-nowrap">
                      {order.delivery_charges != null
                        ? formatPKR(order.delivery_charges)
                        : "Rs. 200"}
                    </td>
                    <td className="px-4 py-3 font-medium text-ink whitespace-nowrap">
                      {formatPKR(order.total_price)}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="rounded border border-ivory-300 bg-white px-2 py-1 text-xs capitalize font-medium text-ink focus:border-gold-500 focus:outline-none"
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
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Export Single Row to Excel */}
                        <button
                          type="button"
                          onClick={() => exportToExcel([order])}
                          className="rounded border border-emerald-300 p-1 text-emerald-700 transition hover:bg-emerald-50"
                          title="Export this single row to Excel"
                        >
                          <Download className="h-4 w-4" />
                        </button>

                        {/* WhatsApp Notification Button */}
                        <button
                          type="button"
                          onClick={() => sendWhatsAppNotification(order)}
                          className="inline-flex items-center gap-1 rounded bg-[#25D366] px-2 py-1 text-xs font-medium text-white shadow-sm transition hover:bg-[#20bd5a]"
                          title="Send Order Details on WhatsApp"
                        >
                          <MessageCircle className="h-3.5 w-3.5 fill-current" />
                          <span>WhatsApp</span>
                        </button>

                        {/* View Modal */}
                        <button
                          type="button"
                          onClick={() => openOrderModal(order, false)}
                          className="rounded border border-ivory-300 p-1 text-ink-muted transition hover:bg-ivory-200 hover:text-ink"
                          title="View Order Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Edit Modal */}
                        <button
                          type="button"
                          onClick={() => openOrderModal(order, true)}
                          className="rounded border border-gold-300 p-1 text-gold-700 transition hover:bg-gold-50"
                          title="Edit Order"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls Footer */}
      {totalPages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-sm border border-ivory-300 shadow-sm">
          <p className="text-xs text-ink-muted">
            Page <span className="font-semibold text-ink">{currentPage}</span> of{" "}
            <span className="font-semibold text-ink">{totalPages}</span>
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 rounded border border-ivory-300 px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-ivory-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 2
                )
                .map((page, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && page - prev > 1;

                  return (
                    <div key={page} className="flex items-center">
                      {showEllipsis && (
                        <span className="px-1 text-xs text-ink-muted">...</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`h-7 min-w-[28px] rounded text-xs font-medium px-2 transition ${
                          currentPage === page
                            ? "bg-gold-700 text-white font-semibold"
                            : "text-ink hover:bg-ivory-200"
                        }`}
                      >
                        {page}
                      </button>
                    </div>
                  );
                })}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 rounded border border-ivory-300 px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-ivory-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Order View & Edit Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-sm bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-ivory-300 pb-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">
                  {isEditing ? "Edit Order" : "Order Details"}
                </h2>
                <p className="text-xs text-ink-muted">
                  Order ID: {selectedOrder.id}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportToExcel([selectedOrder])}
                  className="inline-flex items-center gap-1 rounded border border-emerald-600 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100 transition"
                  title="Export this single order to Excel"
                >
                  <Download className="h-3.5 w-3.5" />
                  Excel
                </button>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-1 rounded border border-gold-300 bg-gold-50 px-2.5 py-1 text-xs font-medium text-gold-700 transition hover:bg-gold-100"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeOrderModal}
                  className="rounded p-1 text-ink-muted hover:bg-ivory-100 hover:text-ink"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label-field">Customer Name</label>
                    <input
                      type="text"
                      required
                      className="input-field mt-1"
                      value={editForm.customer_name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, customer_name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="label-field">Phone Number</label>
                    <input
                      type="text"
                      required
                      className="input-field mt-1"
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({ ...editForm, phone: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label-field">City</label>
                    <input
                      type="text"
                      required
                      className="input-field mt-1"
                      value={editForm.city}
                      onChange={(e) =>
                        setEditForm({ ...editForm, city: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="label-field">Status</label>
                    <select
                      className="input-field mt-1 capitalize"
                      value={editForm.status}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          status: e.target.value as OrderStatus,
                        })
                      }
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label-field">Delivery Address</label>
                  <textarea
                    rows={2}
                    required
                    className="input-field mt-1"
                    value={editForm.address}
                    onChange={(e) =>
                      setEditForm({ ...editForm, address: e.target.value })
                    }
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="label-field">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      required
                      className="input-field mt-1"
                      value={editForm.quantity}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          quantity: parseInt(e.target.value, 10) || 1,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="label-field">Delivery (PKR)</label>
                    <input
                      type="number"
                      min={0}
                      required
                      className="input-field mt-1"
                      value={editForm.delivery_charges}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          delivery_charges: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="label-field">Total Price (PKR)</label>
                    <input
                      type="number"
                      min={0}
                      required
                      className="input-field mt-1 font-bold text-gold-700"
                      value={editForm.total_price}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          total_price: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="label-field">Personalization Text</label>
                  <input
                    type="text"
                    className="input-field mt-1 font-serif italic"
                    value={editForm.personalization_text}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        personalization_text: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="label-field">Admin Notes</label>
                  <textarea
                    rows={2}
                    className="input-field mt-1"
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm({ ...editForm, notes: e.target.value })
                    }
                  />
                </div>

                <div className="flex items-center justify-between border-t border-ivory-300 pt-4">
                  <button
                    type="button"
                    onClick={() => handleDeleteOrder(selectedOrder.id)}
                    className="inline-flex items-center gap-1 rounded bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition hover:bg-red-100"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Order
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="rounded border border-ivory-300 px-4 py-2 text-xs font-medium text-ink-muted hover:bg-ivory-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary inline-flex items-center gap-1 text-xs py-2 px-4"
                    >
                      <Save className="h-4 w-4" />
                      {saving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="mt-4 space-y-4 text-sm">
                <div className="grid gap-4 sm:grid-cols-2 bg-ivory-50 p-4 rounded border border-ivory-200">
                  <div>
                    <span className="text-xs text-ink-muted">Customer Name</span>
                    <p className="font-medium text-ink">{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <span className="text-xs text-ink-muted">Phone Number</span>
                    <p className="font-medium text-gold-700">{selectedOrder.phone}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-xs text-ink-muted">Delivery Address</span>
                    <p className="text-ink">{selectedOrder.address}, {selectedOrder.city}</p>
                  </div>
                </div>

                <div className="space-y-2 border-t border-ivory-200 pt-3">
                  <h3 className="text-xs uppercase font-semibold text-ink-muted">Item Details</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-ink">
                        {(selectedOrder.products as { title: string } | null)?.title || "Jewellery Item"}
                      </p>
                      {(selectedOrder.product_variants as { variant_name: string } | null)?.variant_name && (
                        <p className="text-xs text-ink-muted">
                          Variant: {(selectedOrder.product_variants as { variant_name: string }).variant_name}
                        </p>
                      )}
                      {selectedOrder.personalization_text && (
                        <p className="text-xs text-gold-700 font-serif italic">
                          Engraving: &quot;{selectedOrder.personalization_text}&quot;
                        </p>
                      )}
                    </div>
                    <span className="text-xs bg-ivory-200 px-2 py-1 rounded">Qty: {selectedOrder.quantity}</span>
                  </div>
                </div>

                <div className="border-t border-ivory-200 pt-3 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Delivery Charges</span>
                    <span>{selectedOrder.delivery_charges != null ? formatPKR(selectedOrder.delivery_charges) : "Rs. 200"}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-ink pt-1 border-t border-ivory-200">
                    <span>Total Amount</span>
                    <span className="text-gold-700">{formatPKR(selectedOrder.total_price)}</span>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="bg-sand-50 p-3 rounded text-xs border border-ivory-300">
                    <span className="font-semibold text-ink-muted">Customer Notes:</span>
                    <p className="text-ink mt-0.5">{selectedOrder.notes}</p>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-ivory-300 pt-4">
                  <button
                    type="button"
                    onClick={() => sendWhatsAppNotification(selectedOrder)}
                    className="inline-flex items-center gap-1.5 rounded bg-[#25D366] px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-[#20bd5a]"
                  >
                    <MessageCircle className="h-4 w-4 fill-current" />
                    Share on WhatsApp
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="btn-primary inline-flex items-center gap-1 text-xs py-1.5 px-4"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    Edit Order
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
