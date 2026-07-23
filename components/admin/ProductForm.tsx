"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/format";
import { showConfirm } from "@/lib/swal";
import type {
  Category,
  Product,
  ProductImage,
  ProductVariant,
} from "@/types/database";

interface VariantDraft {
  key: string;
  id?: string;
  variant_name: string;
  variant_type: string;
  price_override: string;
  image_url: string;
}

interface ProductFormProps {
  categories: Category[];
  product?: Product;
  images?: ProductImage[];
  variants?: ProductVariant[];
}

export default function ProductForm({
  categories,
  product,
  images = [],
  variants = [],
}: ProductFormProps) {
  const router = useRouter();
  const isEdit = !!product;

  const [title, setTitle] = useState(product?.title || "");
  const [slug, setSlug] = useState(product?.slug || "");
  const [slugTouched, setSlugTouched] = useState(!!product);
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price?.toString() || "");
  const [compareAt, setCompareAt] = useState(
    product?.compare_at_price?.toString() || ""
  );
  const [deliveryCharges, setDeliveryCharges] = useState(
    product?.delivery_charges != null
      ? product.delivery_charges.toString()
      : "200"
  );
  const [categoryId, setCategoryId] = useState(product?.category_id || "");
  const [isPersonalized, setIsPersonalized] = useState(
    product?.is_personalized || false
  );
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [isBestseller, setIsBestseller] = useState(
    product?.is_bestseller || false
  );
  const [stockStatus, setStockStatus] = useState<"in_stock" | "sold_out">(
    product?.stock_status || "in_stock"
  );
  const [existingImages, setExistingImages] = useState(images);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [variantDrafts, setVariantDrafts] = useState<VariantDraft[]>(
    variants.map((v) => ({
      key: v.id,
      id: v.id,
      variant_name: v.variant_name,
      variant_type: v.variant_type,
      price_override: v.price_override?.toString() || "",
      image_url: v.image_url || "",
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previews = useMemo(() => newPreviews, [newPreviews]);

  function onTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function onFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files);
    setNewFiles((prev) => [...prev, ...list]);
    setNewPreviews((prev) => [
      ...prev,
      ...list.map((f) => URL.createObjectURL(f)),
    ]);
  }

  function removeNewFile(index: number) {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function removeExistingImage(img: ProductImage) {
    const confirmed = await showConfirm("Yeh image permanently remove ho jayegi.", {
      title: "Remove image?",
      confirmText: "Remove",
      danger: true,
    });
    if (!confirmed) return;
    const supabase = createClient();
    await supabase.from("product_images").delete().eq("id", img.id);
    setExistingImages((prev) => prev.filter((i) => i.id !== img.id));
  }

  function addVariant() {
    setVariantDrafts((prev) => [
      ...prev,
      {
        key: `new-${Date.now()}`,
        variant_name: "",
        variant_type: "color",
        price_override: "",
        image_url: "",
      },
    ]);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const supabase = createClient();

    const payload = {
      title: title.trim(),
      slug: slug.trim() || slugify(title),
      description: description.trim(),
      price: parseFloat(price) || 0,
      compare_at_price: compareAt ? parseFloat(compareAt) : null,
      delivery_charges: deliveryCharges !== "" ? parseFloat(deliveryCharges) : 0,
      category_id: categoryId || null,
      is_personalized: isPersonalized,
      is_active: isActive,
      is_bestseller: isBestseller,
      stock_status: stockStatus,
    };

    let productId = product?.id;

    if (isEdit && productId) {
      const { error: updErr } = await supabase
        .from("products")
        .update(payload)
        .eq("id", productId);
      if (updErr) {
        setSaving(false);
        setError(updErr.message);
        return;
      }
    } else {
      const { data, error: insErr } = await supabase
        .from("products")
        .insert(payload)
        .select("id")
        .single();
      if (insErr || !data) {
        setSaving(false);
        setError(insErr?.message || "Failed to create product");
        return;
      }
      productId = data.id;
    }

    // Upload new images
    const startOrder = existingImages.length;
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${productId}/${Date.now()}-${i}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("product-images")
        .upload(path, file, { upsert: false });
      if (upErr) {
        setError(`Image upload failed: ${upErr.message}`);
        continue;
      }
      const {
        data: { publicUrl },
      } = supabase.storage.from("product-images").getPublicUrl(path);
      await supabase.from("product_images").insert({
        product_id: productId,
        image_url: publicUrl,
        sort_order: startOrder + i,
      });
    }

    // Sync variants: delete removed, upsert rest
    const keepIds = variantDrafts.filter((v) => v.id).map((v) => v.id!);
    if (isEdit && productId) {
      const { data: current } = await supabase
        .from("product_variants")
        .select("id")
        .eq("product_id", productId);
      const toDelete = (current || [])
        .map((v) => v.id)
        .filter((id) => !keepIds.includes(id));
      if (toDelete.length) {
        await supabase.from("product_variants").delete().in("id", toDelete);
      }
    }

    for (const v of variantDrafts) {
      if (!v.variant_name.trim()) continue;
      const vPayload = {
        product_id: productId!,
        variant_name: v.variant_name.trim(),
        variant_type: v.variant_type.trim() || "color",
        price_override: v.price_override
          ? parseFloat(v.price_override)
          : null,
        image_url: v.image_url.trim() || null,
      };
      if (v.id) {
        await supabase.from("product_variants").update(vPayload).eq("id", v.id);
      } else {
        await supabase.from("product_variants").insert(vPayload);
      }
    }

    setSaving(false);
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-sm border border-ivory-300 bg-white p-6 space-y-4">
        <div>
          <label className="label-field" htmlFor="title">
            Title *
          </label>
          <input
            id="title"
            className="input-field"
            required
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>
        <div>
          <label className="label-field" htmlFor="slug">
            Slug *
          </label>
          <input
            id="slug"
            className="input-field"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
          />
        </div>
        <div>
          <label className="label-field" htmlFor="description">
            Description
          </label>
          <textarea
            id="description"
            className="input-field min-h-[120px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label-field" htmlFor="price">
              Price (PKR) *
            </label>
            <input
              id="price"
              type="number"
              min={0}
              step="1"
              className="input-field"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <label className="label-field" htmlFor="compare">
              Compare at price
            </label>
            <input
              id="compare"
              type="number"
              min={0}
              step="1"
              className="input-field"
              value={compareAt}
              onChange={(e) => setCompareAt(e.target.value)}
            />
          </div>
          <div>
            <label className="label-field" htmlFor="delivery_charges">
              Delivery Charges (PKR)
            </label>
            <input
              id="delivery_charges"
              type="number"
              min={0}
              step="1"
              className="input-field"
              placeholder="e.g. 200 (0 for Free)"
              value={deliveryCharges}
              onChange={(e) => setDeliveryCharges(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label-field" htmlFor="category">
            Category
          </label>
          <select
            id="category"
            className="input-field"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.parent_category ? ` (${c.parent_category})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-field" htmlFor="stock">
            Stock status
          </label>
          <select
            id="stock"
            className="input-field"
            value={stockStatus}
            onChange={(e) =>
              setStockStatus(e.target.value as "in_stock" | "sold_out")
            }
          >
            <option value="in_stock">In stock</option>
            <option value="sold_out">Sold out</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-6 pt-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPersonalized}
              onChange={(e) => setIsPersonalized(e.target.checked)}
            />
            Personalized
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Active (visible)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isBestseller}
              onChange={(e) => setIsBestseller(e.target.checked)}
            />
            Bestseller
          </label>
        </div>
      </div>

      <div className="rounded-sm border border-ivory-300 bg-white p-6">
        <h2 className="font-medium text-ink">Images</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          {existingImages.map((img) => (
            <div
              key={img.id}
              className="group relative h-24 w-24 overflow-hidden rounded-sm bg-ivory-200"
            >
              <Image
                src={img.image_url}
                alt=""
                fill
                className="object-cover"
                sizes="96px"
              />
              <button
                type="button"
                onClick={() => removeExistingImage(img)}
                className="absolute right-1 top-1 rounded bg-ink/70 p-0.5 text-white opacity-0 transition group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {previews.map((src, i) => (
            <div
              key={src}
              className="group relative h-24 w-24 overflow-hidden rounded-sm bg-ivory-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeNewFile(i)}
                className="absolute right-1 top-1 rounded bg-ink/70 p-0.5 text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
        <label className="btn-secondary mt-4 inline-flex cursor-pointer">
          <Upload className="h-4 w-4" />
          Upload images
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => onFiles(e.target.files)}
          />
        </label>
      </div>

      <div className="rounded-sm border border-ivory-300 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-medium text-ink">Variants</h2>
          <button type="button" onClick={addVariant} className="btn-secondary py-2 text-xs">
            <Plus className="h-3 w-3" />
            Add variant
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {variantDrafts.length === 0 && (
            <p className="text-sm text-ink-light">
              No variants — add color or size options if needed.
            </p>
          )}
          {variantDrafts.map((v, idx) => (
            <div
              key={v.key}
              className="grid gap-2 rounded-sm border border-ivory-200 p-3 sm:grid-cols-4"
            >
              <input
                className="input-field"
                placeholder="Name (e.g. Gold)"
                value={v.variant_name}
                onChange={(e) => {
                  const next = [...variantDrafts];
                  next[idx] = { ...v, variant_name: e.target.value };
                  setVariantDrafts(next);
                }}
              />
              <input
                className="input-field"
                placeholder="Type (color/size)"
                value={v.variant_type}
                onChange={(e) => {
                  const next = [...variantDrafts];
                  next[idx] = { ...v, variant_type: e.target.value };
                  setVariantDrafts(next);
                }}
              />
              <input
                className="input-field"
                type="number"
                placeholder="Price override"
                value={v.price_override}
                onChange={(e) => {
                  const next = [...variantDrafts];
                  next[idx] = { ...v, price_override: e.target.value };
                  setVariantDrafts(next);
                }}
              />
              <div className="flex gap-2">
                <input
                  className="input-field"
                  placeholder="Image URL (optional)"
                  value={v.image_url}
                  onChange={(e) => {
                    const next = [...variantDrafts];
                    next[idx] = { ...v, image_url: e.target.value };
                    setVariantDrafts(next);
                  }}
                />
                <button
                  type="button"
                  className="text-red-600"
                  onClick={() =>
                    setVariantDrafts((prev) => prev.filter((_, i) => i !== idx))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-sm bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : isEdit ? (
            "Update Product"
          ) : (
            "Create Product"
          )}
        </button>
        <button
          type="button"
          className="btn-secondary"
          onClick={() => router.push("/admin/products")}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
