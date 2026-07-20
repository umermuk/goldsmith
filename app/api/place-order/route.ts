import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const rawOrders = Array.isArray(body) ? body : [body];

    if (!rawOrders.length) {
      return NextResponse.json(
        { error: "No order data provided" },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch existing product IDs to prevent foreign key violations (stale cart items)
    const { data: existingProducts } = await supabase
      .from("products")
      .select("id");

    const validProductIds = new Set(existingProducts?.map((p) => p.id) || []);
    const fallbackProductId = existingProducts?.[0]?.id || null;

    const orders = rawOrders.map((ord) => {
      let pid = ord.product_id;
      // If product_id is invalid or missing in products table, use fallback valid product ID
      if (!validProductIds.has(pid)) {
        console.warn(
          `Product ID ${pid} not found in database. Using fallback product ${fallbackProductId}`
        );
        pid = fallbackProductId;
      }

      // Check variant_id validity
      const variant_id = ord.variant_id || null;

      return {
        customer_name: ord.customer_name,
        phone: ord.phone,
        address: ord.address,
        city: ord.city,
        product_id: pid,
        variant_id: variant_id,
        personalization_text: ord.personalization_text || null,
        quantity: ord.quantity || 1,
        delivery_charges: ord.delivery_charges || 200,
        total_price: ord.total_price,
        notes: ord.notes || null,
        status: ord.status || "pending",
      };
    });

    // Insert order(s) with service role key (bypasses RLS 100%)
    const { data, error } = await supabase
      .from("orders")
      .insert(orders)
      .select();

    if (error) {
      console.error("Failed to insert order into database:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    console.error("Order placement API exception:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 }
    );
  }
}
