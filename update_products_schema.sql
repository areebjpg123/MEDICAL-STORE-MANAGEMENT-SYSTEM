-- Add the category column to the products table to support distinguishing extras from medicines
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'medicine';
