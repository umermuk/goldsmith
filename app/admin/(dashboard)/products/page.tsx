import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { formatPKR } from "@/lib/format";
import DeleteProductButton from "@/components/admin/DeleteProductButton";

export default async function AdminProductsPage() {
  const supabase = createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*, categories(name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">
            Products
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            Manage your catalogue
          </p>
        </div>
        <Link href="/admin/products/new" className="btn-primary">
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      {!products?.length ? (
        <div className="mt-10 rounded-sm border border-dashed border-ivory-300 bg-white py-16 text-center">
          <p className="text-ink-muted">
            No products yet — click Add Product to get started
          </p>
          <Link href="/admin/products/new" className="btn-primary mt-6 inline-flex">
            <Plus className="h-4 w-4" />
            Add Product
          </Link>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-sm border border-ivory-300 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-ivory-300 bg-ivory-50 text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-ivory-200 last:border-0"
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
                          ? "text-green-700"
                          : "text-ink-light"
                      }
                    >
                      {p.is_active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {p.stock_status.replace("_", " ")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="text-gold-600 hover:text-gold-700"
                      >
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
    </div>
  );
}
