import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { formatPKR } from "@/lib/format";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      order_id,
      customer_name,
      phone,
      address,
      city,
      product_title,
      variant_name,
      personalization_text,
      quantity,
      total_price,
      notes,
    } = body;

    if (!customer_name || !phone || !product_title) {
      return NextResponse.json(
        { error: "Missing required order fields" },
        { status: 400 }
      );
    }

    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.ADMIN_NOTIFICATION_EMAIL;

    if (!apiKey || !to) {
      console.warn(
        "[send-order-email] RESEND_API_KEY or ADMIN_NOTIFICATION_EMAIL not set — skipping email"
      );
      return NextResponse.json({
        ok: true,
        skipped: true,
        message: "Email skipped — configure RESEND_API_KEY and ADMIN_NOTIFICATION_EMAIL",
      });
    }

    const resend = new Resend(apiKey);
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Gold Smith";

    const html = `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2C2416;">
        <h1 style="color: #8B7344; font-size: 24px;">New COD Order — ${siteName}</h1>
        <p style="color: #5C5346;">A customer placed a Cash on Delivery order.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-family: sans-serif; font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #8A8174;">Order ID</td><td style="padding: 8px 0;">${order_id || "—"}</td></tr>
          <tr><td style="padding: 8px 0; color: #8A8174;">Customer</td><td style="padding: 8px 0;"><strong>${escapeHtml(customer_name)}</strong></td></tr>
          <tr><td style="padding: 8px 0; color: #8A8174;">Phone</td><td style="padding: 8px 0;">${escapeHtml(phone)}</td></tr>
          <tr><td style="padding: 8px 0; color: #8A8174;">Address</td><td style="padding: 8px 0;">${escapeHtml(address)}</td></tr>
          <tr><td style="padding: 8px 0; color: #8A8174;">City</td><td style="padding: 8px 0;">${escapeHtml(city)}</td></tr>
          <tr><td style="padding: 8px 0; color: #8A8174;">Product</td><td style="padding: 8px 0;">${escapeHtml(product_title)}</td></tr>
          <tr><td style="padding: 8px 0; color: #8A8174;">Variant</td><td style="padding: 8px 0;">${escapeHtml(variant_name || "—")}</td></tr>
          <tr><td style="padding: 8px 0; color: #8A8174;">Personalization</td><td style="padding: 8px 0;">${escapeHtml(personalization_text || "—")}</td></tr>
          <tr><td style="padding: 8px 0; color: #8A8174;">Quantity</td><td style="padding: 8px 0;">${quantity}</td></tr>
          <tr><td style="padding: 8px 0; color: #8A8174;">Total</td><td style="padding: 8px 0;"><strong>${formatPKR(total_price)}</strong></td></tr>
          <tr><td style="padding: 8px 0; color: #8A8174;">Notes</td><td style="padding: 8px 0;">${escapeHtml(notes || "—")}</td></tr>
          <tr><td style="padding: 8px 0; color: #8A8174;">Payment</td><td style="padding: 8px 0;">Cash on Delivery</td></tr>
        </table>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: `${siteName} <onboarding@resend.dev>`,
      to: [to],
      subject: `New COD Order: ${customer_name} — ${formatPKR(total_price)}`,
      html,
    });

    if (error) {
      console.error("[send-order-email]", error);
      return NextResponse.json(
        { error: error.message || "Failed to send email" },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[send-order-email]", err);
    return NextResponse.json(
      { error: "Unexpected error sending email" },
      { status: 500 }
    );
  }
}

function escapeHtml(str: string) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
