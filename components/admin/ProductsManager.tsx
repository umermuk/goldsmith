"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search, X, Plus, ChevronLeft, ChevronRight, Edit2 } from "lucide-react";
import { formatPKR } from "@/lib/format";
import DeleteProductButton from "@/components/admin/DeleteProductButton";
import type { Product } from "@/types/database";

type ProductWithCategory = Product & {
  categories?: { name: string } | null;
};

const PAGE_SIZE = 10;

export default function ProductsManager({
  initial,
}: {
  initial: ProductWithCategory[];
}) {
  const [products, setProducts] = useState(initial);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setProducts(initial);
  }, [initial]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const catName = (p.categories as { name: string } | null)?.name || "";
      return (
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        catName.toLowerCase().includes(q) ||
        p.stock_status.toLowerCase().includes(q) ||
        String(p.price).includes(q)
      );
    });
  }, [products, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredProducts.slice(start, start + PAGE_SIZE);
  }, [filteredProducts, currentPage]);

  const startRecord = (currentPage - 1) * PAGE_SIZE + 1;
  const endRecord = Math.min(currentPage * PAGE_SIZE, filteredProducts.length);

  return (
    <div className="space-y-6">
      {/* Search & Header Toolbar */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-sm border border-ivory-300 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Search products by title, category, price..."
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

        <Link href="/admin/products/new" className="btn-primary shrink-0">
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {/* Info counter */}
      <div className="flex items-center justify-between px-1 text-xs text-ink-muted">
        <span>
          Showing {filteredProducts.length === 0 ? 0 : startRecord}–
          {endRecord} of {filteredProducts.length} products
          {products.length !== filteredProducts.length && (
            <span className="ml-1 text-gold-700">
              (filtered from {products.length} total)
            </span>
          )}
        </span>
        <span>Page {currentPage} of {totalPages}</span>
      </div>

      {/* Products Table */}
      {!filteredProducts.length ? (
        <div className="rounded-sm border border-dashed border-ivory-300 bg-white py-16 text-center text-ink-muted">
          No matching products found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-ivory-300 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-ivory-300 bg-ivory-50 text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-ivory-200 transition hover:bg-ivory-50"
                >
                  <td className="px-4 py-3 font-medium text-ink">{p.title}</td>
                  <td className="px-4 py-3">{formatPKR(p.price)}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {(p.categories as { name: string } | null)?.name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        p.is_active
                          ? "text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded text-xs"
                          : "text-ink-light bg-ivory-200 px-2 py-0.5 rounded text-xs"
                      }
                    >
                      {p.is_active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize text-xs text-ink-muted">
                    {p.stock_status.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="inline-flex items-center gap-1 rounded border border-gold-300 px-2 py-1 text-xs font-medium text-gold-700 hover:bg-gold-50"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit
                      </Link>
                      <DeleteProductButton id={p.id} title={p.title} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-sm border border-ivory-300 shadow-sm">
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

            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
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
              ))}
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
    </div>
  );
}
