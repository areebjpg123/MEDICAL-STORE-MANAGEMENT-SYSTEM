-- Create Ledger Clients Table
CREATE TABLE IF NOT EXISTS public.ledger_clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_billed NUMERIC DEFAULT 0,
    total_paid NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Ledger Payments Table
CREATE TABLE IF NOT EXISTS public.ledger_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES public.ledger_clients(id) ON DELETE CASCADE,
    client_name TEXT,
    phone TEXT,
    amount NUMERIC NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set up RLS for Ledger Tables
ALTER TABLE public.ledger_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read/write for anonymous users on ledger_clients" ON public.ledger_clients;
CREATE POLICY "Enable read/write for anonymous users on ledger_clients" ON public.ledger_clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable read/write for anonymous users on ledger_payments" ON public.ledger_payments;
CREATE POLICY "Enable read/write for anonymous users on ledger_payments" ON public.ledger_payments FOR ALL USING (true) WITH CHECK (true);
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Products Table
CREATE TABLE products (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    name TEXT NOT NULL,
    exp_date TEXT,
    sale_price NUMERIC NOT NULL,
    cost_price NUMERIC,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    box_quantity INTEGER,
    section TEXT,
    company_name TEXT,
    formula_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clients Table
CREATE TABLE clients (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE orders (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::TEXT,
    receipt_number SERIAL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    client_name TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'DISPATCHED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Create Row Level Security (RLS) policies
-- Right now, enable public access for easy development (restrict later in production)
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read/write for anonymous users on products" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write for anonymous users on clients" ON clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable read/write for anonymous users on orders" ON orders FOR ALL USING (true) WITH CHECK (true);
-- Create Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safely add address column if table already existed without it
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='address') THEN
        ALTER TABLE public.customers ADD COLUMN address TEXT;
    END IF;
END $$;

-- Alter Orders Table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL;

-- Remove the old check constraint on status and add a new one
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check CHECK (status IN ('PENDING', 'ACCEPTED', 'COMPLETED', 'DISPATCHED', 'CANCELLED'));

-- Set up RLS for Customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read/write for anonymous users on customers" ON public.customers;
CREATE POLICY "Enable read/write for anonymous users on customers" ON public.customers FOR ALL USING (true) WITH CHECK (true);
-- Add Purchase Analytics columns to the products table
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS purchase_source TEXT DEFAULT 'market',
ADD COLUMN IF NOT EXISTS base_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS trade_discount NUMERIC DEFAULT 15,
ADD COLUMN IF NOT EXISTS tax_percentage NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS extra_discount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS bonus_quantity INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_cost NUMERIC DEFAULT 0;
-- Add the category column to the products table to support distinguishing extras from medicines
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'medicine';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_address TEXT;
-- Trigger function to automatically deduct stock from products when an order is placed
CREATE OR REPLACE FUNCTION deduct_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
    item JSONB;
BEGIN
    -- Loop through the JSONB array in NEW.items
    -- items looks like: [{"id": "uuid", "quantity": 2}, ...]
    FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
    LOOP
        -- Deduct stock from the products table based on the item id and quantity
        UPDATE products
        SET stock_quantity = stock_quantity - (item->>'quantity')::INT
        WHERE id = (item->>'id')::TEXT;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists to avoid errors on re-run
DROP TRIGGER IF EXISTS on_order_created ON orders;

-- Create the trigger on the orders table
CREATE TRIGGER on_order_created
AFTER INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION deduct_stock_on_order();
