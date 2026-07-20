export type StockStatus = "in_stock" | "sold_out";
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  parent_category: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  delivery_charges?: number | null;
  category_id: string | null;
  is_personalized: boolean;
  is_active: boolean;
  is_bestseller: boolean;
  stock_status: StockStatus;
  created_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_name: string;
  variant_type: string;
  price_override: number | null;
  image_url: string | null;
}

export interface Order {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  city: string;
  product_id: string;
  variant_id: string | null;
  personalization_text: string | null;
  quantity: number;
  delivery_charges?: number | null;
  total_price: number;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
}

export interface ProductWithImages extends Product {
  product_images: ProductImage[];
  product_variants?: ProductVariant[];
  categories?: Category | null;
}

export interface OrderWithDetails extends Order {
  products?: Product | null;
  product_variants?: ProductVariant | null;
}

export interface OrderFormData {
  customer_name: string;
  phone: string;
  address: string;
  city: string;
  product_id: string;
  variant_id: string | null;
  personalization_text: string | null;
  quantity: number;
  delivery_charges?: number;
  total_price: number;
  notes: string | null;
  product_title?: string;
  variant_name?: string | null;
}
