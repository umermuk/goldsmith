import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
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
      delivery_charges,
      total_price,
      notes,
    } = body;

    if (!customer_name || !phone || !product_title) {
      return NextResponse.json(
        { error: "Missing required order fields" },
        { status: 400 }
      );
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
    const resendApiKey = process.env.RESEND_API_KEY;
    const toEmail = process.env.ADMIN_NOTIFICATION_EMAIL || smtpUser;

    if (!toEmail) {
      console.warn(
        "[send-order-email] ADMIN_NOTIFICATION_EMAIL / SMTP_USER not set — skipping email"
      );
      return NextResponse.json({
        ok: true,
        skipped: true,
        message: "Email skipped — configure SMTP credentials or ADMIN_NOTIFICATION_EMAIL in .env.local",
      });
    }

    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "MU Gold Smith";

    const html = `
      <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #2C2416; border: 1px solid #E6E1D7; padding: 24px; border-radius: 8px;">
        <h1 style="color: #8B7344; font-size: 22px; margin-top: 0;">🛍️ New COD Order — ${escapeHtml(siteName)}</h1>
        <p style="color: #5C5346; font-size: 14px;">A new order has been placed on your store.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-family: sans-serif; font-size: 14px;">
          <tr style="border-bottom: 1px solid #EEE;"><td style="padding: 8px 0; color: #8A8174; width: 140px;">Order ID</td><td style="padding: 8px 0; font-weight: bold;">${order_id || "—"}</td></tr>
          <tr style="border-bottom: 1px solid #EEE;"><td style="padding: 8px 0; color: #8A8174;">Customer Name</td><td style="padding: 8px 0;"><strong>${escapeHtml(customer_name)}</strong></td></tr>
          <tr style="border-bottom: 1px solid #EEE;"><td style="padding: 8px 0; color: #8A8174;">Phone Number</td><td style="padding: 8px 0;"><a href="tel:${escapeHtml(phone)}" style="color: #8B7344;">${escapeHtml(phone)}</a></td></tr>
          <tr style="border-bottom: 1px solid #EEE;"><td style="padding: 8px 0; color: #8A8174;">Product</td><td style="padding: 8px 0; font-weight: bold;">${escapeHtml(product_title)}</td></tr>
          <tr style="border-bottom: 1px solid #EEE;"><td style="padding: 8px 0; color: #8A8174;">Variant</td><td style="padding: 8px 0;">${escapeHtml(variant_name || "Standard")}</td></tr>
          <tr style="border-bottom: 1px solid #EEE;"><td style="padding: 8px 0; color: #8A8174;">Personalization</td><td style="padding: 8px 0;">${escapeHtml(personalization_text || "None")}</td></tr>
          <tr style="border-bottom: 1px solid #EEE;"><td style="padding: 8px 0; color: #8A8174;">Quantity</td><td style="padding: 8px 0;">${quantity}</td></tr>
          <tr style="border-bottom: 1px solid #EEE;"><td style="padding: 8px 0; color: #8A8174;">Delivery Charges</td><td style="padding: 8px 0;">${delivery_charges != null ? formatPKR(delivery_charges) : "Rs. 200"}</td></tr>
          <tr style="border-bottom: 1px solid #EEE;"><td style="padding: 8px 0; color: #8A8174;">Total Amount</td><td style="padding: 8px 0; color: #B45309; font-size: 16px; font-weight: bold;">${formatPKR(total_price)} (COD)</td></tr>
          <tr style="border-bottom: 1px solid #EEE;"><td style="padding: 8px 0; color: #8A8174;">Address</td><td style="padding: 8px 0;">${escapeHtml(address)}, ${escapeHtml(city)}</td></tr>
          <tr style="border-bottom: 1px solid #EEE;"><td style="padding: 8px 0; color: #8A8174;">Notes</td><td style="padding: 8px 0;">${escapeHtml(notes || "—")}</td></tr>
        </table>
      </div>
    `;

    const subject = `New COD Order: ${customer_name} — ${formatPKR(total_price)}`;

    // 1. Try Gmail / Nodemailer SMTP first if user provided credentials
    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for 587
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"${siteName}" <${smtpUser}>`,
        to: toEmail,
        subject,
        html,
      });

      return NextResponse.json({ ok: true, method: "nodemailer" });
    }

    // 2. Fallback to Resend API key if set
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      const { error } = await resend.emails.send({
        from: `${siteName} <onboarding@resend.dev>`,
        to: [toEmail],
        subject,
        html,
      });

      if (error) {
        console.error("[send-order-email] Resend error:", error);
        return NextResponse.json(
          { error: error.message || "Failed to send email via Resend" },
          { status: 502 }
        );
      }

      return NextResponse.json({ ok: true, method: "resend" });
    }

    console.warn(
      "[send-order-email] No SMTP_USER/PASS or RESEND_API_KEY provided — skipping email"
    );
    return NextResponse.json({
      ok: true,
      skipped: true,
      message: "Please configure SMTP_USER & SMTP_PASS or RESEND_API_KEY in .env.local",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Unexpected error";
    console.error("[send-order-email] Exception:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

function escapeHtml(str: string) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
