"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { showConfirm, showError } from "@/lib/swal";

export default function DeleteProductButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const router = useRouter();

  async function onDelete() {
    const supabase = createClient();

    const { count, error: countError } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("product_id", id);

    if (countError) {
      await showError(countError.message);
      return;
    }

    const orderCount = count ?? 0;
    const message =
      orderCount > 0
        ? `"${title}" ke ${orderCount} order(s) bhi permanently delete ho jayenge.`
        : `"${title}" permanently delete ho jayega.`;

    const confirmed = await showConfirm(message, {
      title: "Delete product?",
      confirmText: "Delete",
      danger: true,
    });
    if (!confirmed) return;

    if (orderCount > 0) {
      const { error: ordersError } = await supabase
        .from("orders")
        .delete()
        .eq("product_id", id);

      if (ordersError) {
        await showError(ordersError.message);
        return;
      }
    }

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      await showError(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onDelete}
      className="text-red-600 hover:text-red-700"
    >
      Delete
    </button>
  );
}
