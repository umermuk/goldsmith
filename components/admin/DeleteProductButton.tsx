"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeleteProductButton({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const router = useRouter();

  async function onDelete() {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      alert(error.message);
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
