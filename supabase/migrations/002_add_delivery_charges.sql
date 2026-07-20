-- Migration: Add delivery charges to products and orders tables

-- 1. Add delivery_charges column to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS delivery_charges NUMERIC(12, 2) DEFAULT 200.00;

-- 2. Add delivery_charges column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS delivery_charges NUMERIC(12, 2) DEFAULT 200.00;

-- Comment for documentation
COMMENT ON COLUMN public.products.delivery_charges IS 'Product specific delivery charges in PKR (0 for Free Delivery)';
COMMENT ON COLUMN public.orders.delivery_charges IS 'Delivery charges applied to this order';
