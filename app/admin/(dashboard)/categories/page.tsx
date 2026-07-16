import CategoriesManager from "@/components/admin/CategoriesManager";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/types/database";

export default async function AdminCategoriesPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return (
    <div>
      <h1 className="font-display text-3xl font-semibold text-ink">
        Categories
      </h1>
      <p className="mt-1 text-sm text-ink-muted">
        Organize products by collection and parent group
      </p>
      <div className="mt-8">
        <CategoriesManager initial={(data || []) as Category[]} />
      </div>
    </div>
  );
}
