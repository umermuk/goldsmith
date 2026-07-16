"use client";

import { useState } from "react";
import Image from "next/image";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { PARENT_CATEGORIES, slugify } from "@/lib/format";
import type { Category } from "@/types/database";

export default function CategoriesManager({
  initial,
}: {
  initial: Category[];
}) {
  const [categories, setCategories] = useState(initial);
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parent, setParent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <button type="button" onClick={openCreate} className="btn-primary">
        <Plus className="h-4 w-4" />
        Add Category
      </button>

      {showForm && (
        <form
          onSubmit={onSave}
          className="rounded-sm border border-ivory-300 bg-white p-6 space-y-4"
        >
          <h2 className="font-medium">
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
          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
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

      {!categories.length ? (
        <div className="rounded-sm border border-dashed border-ivory-300 bg-white py-16 text-center text-ink-muted">
          No categories yet — click Add Category to get started
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-ivory-300 bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-ivory-300 bg-ivory-50 text-xs uppercase text-ink-muted">
              <tr>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Parent</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr key={cat.id} className="border-b border-ivory-200">
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
                  <td className="px-4 py-3 font-medium">{cat.name}</td>
                  <td className="px-4 py-3 text-ink-muted">
                    {cat.parent_category || "—"}
                  </td>
                  <td className="px-4 py-3 text-ink-light">{cat.slug}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(cat)}
                        className="text-gold-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(cat)}
                        className="text-red-600"
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
    </div>
  );
}
