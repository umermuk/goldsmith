import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPKR(amount: number | string | null | undefined): string {
  const n = typeof amount === "string" ? parseFloat(amount) : Number(amount ?? 0);
  if (Number.isNaN(n)) return "Rs. 0";
  return `Rs. ${Math.round(n).toLocaleString("en-PK")}`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const PARENT_CATEGORIES = [
  "Women",
  "Men",
  "Islamic Jewellery",
] as const;

export const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;
