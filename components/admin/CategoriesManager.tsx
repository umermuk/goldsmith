"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PARENT_CATEGORIES, slugify } from "@/lib/format";
import type { Category } from "@/types/database";

const PAGE_SIZE = 10;

export default function CategoriesManager({
  initial,
}: {
  initial: Category[];
}) {
  const [categories, setCategories] = useState(initial);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parent, setParent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter Logic
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.parent_category && c.parent_category.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const totalPages = Math.ceil(filteredCategories.length / PAGE_SIZE) || 1;
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCategories.slice(start, start + PAGE_SIZE);
  }, [filteredCategories, currentPage]);

  const startRecord = (currentPage - 1) * PAGE_SIZE + 1;
  const endRecord = Math.min(
    currentPage * PAGE_SIZE,
    filteredCategories.length
  );

  function openCreate() {
    setCreating(true);
    setEditing(null);
    setName("");
    setSlug("");
    setParent("");
    setImageUrl("");
    setFile(null);
    setError(null);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setCreating(false);
    setName(cat.name);
    setSlug(cat.slug);
    setParent(cat.parent_category || "");
    setImageUrl(cat.image_url || "");
    setFile(null);
    setError(null);
  }

  function closeForm() {
    setCreating(false);
    setEditing(null);
  }

  async function uploadImage(supabase: ReturnType<typeof createClient>) {
    if (!file) return imageUrl || null;
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("category-images")
      .upload(path, file);
    if (upErr) throw new Error(upErr.message);
    const {
      data: { publicUrl },
    } = supabase.storage.from("category-images").getPublicUrl(path);
    return publicUrl;
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const supabase = createClient();
    try {
      const url = await uploadImage(supabase);
      const payload = {
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        parent_category: parent || null,
        image_url: url,
      };

      if (editing) {
        const { data, error: err } = await supabase
          .from("categories")
          .update(payload)
          .eq("id", editing.id)
          .select()
          .single();
        if (err) throw err;
        setCategories((prev) =>
          prev.map((c) => (c.id === editing.id ? data : c))
        );
      } else {
        const { data, error: err } = await supabase
          .from("categories")
          .insert(payload)
          .select()
          .single();
        if (err) throw err;
        setCategories((prev) => [...prev, data]);
      }
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
    setSaving(false);
  }

  async function onDelete(cat: Category) {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    const supabase = createClient();
    const { error: err } = await supabase
      .from("categories")
      .delete()
      .eq("id", cat.id);
    if (err) {
      alert(err.message);
      return;
    }
    setCategories((prev) => prev.filter((c) => c.id !== cat.id));
  }

  const showForm = creating || editing;

  return (
    <div className="space-y-6">
      {/* Search & Header Toolbar */}
      <div className="flex flex-col gap-4 bg-white p-4 rounded-sm border border-ivory-300 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Search category by name, parent group, or slug..."
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

        <button type="button" onClick={openCreate} className="btn-primary shrink-0">
          <Plus className="h-4 w-4" />
          Add Category
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={onSave}
          className="rounded-sm border border-ivory-300 bg-white p-6 space-y-4 shadow-sm"
        >
          <h2 className="font-medium text-ink">
            {editing ? "Edit Category" : "New Category"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-field">Name *</label>
              <input
                className="input-field"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!editing) setSlug(slugify(e.target.value));
                }}
              />
            </div>
            <div>
              <label className="label-field">Slug *</label>
              <input
                className="input-field"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
              />
            </div>
            <div>
              <label className="label-field">Parent group</label>
              <select
                className="input-field"
                value={parent}
                onChange={(e) => setParent(e.target.value)}
              >
                <option value="">None</option>
                {PARENT_CATEGORIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Image</label>
              <input
                type="file"
                accept="image/*"
                className="input-field"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {imageUrl && !file && (
                <p className="mt-1 truncate text-xs text-ink-light">{imageUrl}</p>
              )}
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Save"
              )}
            </button>
            <button type="button" className="btn-secondary" onClick={closeForm}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Info counter */}
      <div className="flex items-center justify-between px-1 text-xs text-ink-muted">
        <span>
          Showing {filteredCategories.length === 0 ? 0 : startRecord}–
          {endRecord} of {filteredCategories.length} categories
          {categories.length !== filteredCategories.length && (
            <span className="ml-1 text-gold-700">
              (filtered from {categories.length} total)
            </span>
          )}
        </span>
        <span>Page {currentPage} of {totalPages}</span>
      </div>

      {/* Table */}
      {!filteredCategories.length ? (
        <div className="rounded-sm border border-dashed border-ivory-300 bg-white py-16 text-center text-ink-muted">
          No matching categories found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-ivory-300 bg-white shadow-sm">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-ivory-300 bg-ivory-50 text-xs uppercase text-ink-muted">
              <tr>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Parent</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedCategories.map((cat) => (
                <tr key={cat.id} className="border-b border-ivory-200 hover:bg-ivory-50 transition">
                  <td className="px-4 py-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-sm bg-ivory-200">
                      {cat.image_url && (
                        <Image
                          src={cat.image_url}
                          alt={cat.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">{cat.name}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {cat.parent_category || "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-light text-xs font-mono">{cat.slug}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(cat)}
                        className="rounded border border-gold-300 p-1 text-gold-700 hover:bg-gold-50 transition"
                        title="Edit category"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(cat)}
                        className="rounded border border-red-200 p-1 text-red-600 hover:bg-red-50 transition"
                        title="Delete category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
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
