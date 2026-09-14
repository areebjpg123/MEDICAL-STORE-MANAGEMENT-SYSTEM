-- Supabase Schema for Medical Store POS & ERP
-- Uses IF NOT EXISTS to prevent dropping existing data.

-- 1. Products Table (Inventory)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company_name TEXT,
    formula_name TEXT,
    exp_date TEXT,
    cost_price NUMERIC DEFAULT 0,
    sale_price NUMERIC DEFAULT 0,
    stock_quantity INTEGER DEFAULT 0,
    box_quantity INTEGER DEFAULT 0,
    section TEXT DEFAULT 'OTC',
    barcode TEXT,
    category TEXT DEFAULT 'medicine',
    purchase_source TEXT DEFAULT 'market',
    base_amount NUMERIC DEFAULT 0,
    trade_discount NUMERIC DEFAULT 15,
    tax_percentage NUMERIC DEFAULT 0,
    extra_discount NUMERIC DEFAULT 0,
    bonus_quantity INTEGER DEFAULT 0,
    net_cost NUMERIC DEFAULT 0,
    order_number TEXT,
    order_date TEXT,
    bill_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Orders Table (Sales)
CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY,
    receipt_number TEXT,
    client_name TEXT,
    date TEXT,
    total NUMERIC DEFAULT 0,
    original_total NUMERIC DEFAULT 0,
    cost_total NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'DISPATCHED',
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Ledger Clients
CREATE TABLE IF NOT EXISTS public.ledger_clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    date TEXT,
    total_billed NUMERIC DEFAULT 0,
    total_paid NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Ledger Payments
CREATE TABLE IF NOT EXISTS public.ledger_payments (
    id TEXT PRIMARY KEY,
    client_id TEXT,
    client_name TEXT,
    phone TEXT,
    amount NUMERIC DEFAULT 0,
    date TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Note: In a production environment with existing tables, altering tables to add missing columns might be required 
-- if the schema was partially created previously. Here are safe ADD COLUMN statements that won't fail if they exist (PostgreSQL 11+).

DO $$ 
BEGIN
    -- Add columns to products if they don't exist
    BEGIN ALTER TABLE public.products ADD COLUMN IF NOT EXISTS barcode TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'medicine'; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.products ADD COLUMN IF NOT EXISTS purchase_source TEXT DEFAULT 'market'; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.products ADD COLUMN IF NOT EXISTS base_amount NUMERIC DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.products ADD COLUMN IF NOT EXISTS trade_discount NUMERIC DEFAULT 15; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tax_percentage NUMERIC DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.products ADD COLUMN IF NOT EXISTS extra_discount NUMERIC DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.products ADD COLUMN IF NOT EXISTS bonus_quantity INTEGER DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.products ADD COLUMN IF NOT EXISTS net_cost NUMERIC DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.products ADD COLUMN IF NOT EXISTS order_number TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.products ADD COLUMN IF NOT EXISTS order_date TEXT; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.products ADD COLUMN IF NOT EXISTS bill_image TEXT; EXCEPTION WHEN duplicate_column THEN END;

    -- Add columns to orders if they don't exist
    BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS original_total NUMERIC DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
    BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cost_total NUMERIC DEFAULT 0; EXCEPTION WHEN duplicate_column THEN END;
    
    -- Realtime config
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ledger_clients;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ledger_payments;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Enable RLS on all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_payments ENABLE ROW LEVEL SECURITY;

-- Create policies to only allow authenticated users to view, insert, update, or delete.
-- (Assumes users are authenticated via Supabase Auth)

-- Products
CREATE POLICY "Allow authenticated full access to products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Deny anonymous access to products" ON public.products FOR ALL TO anon USING (false);

-- Orders
CREATE POLICY "Allow authenticated full access to orders" ON public.orders FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Deny anonymous access to orders" ON public.orders FOR ALL TO anon USING (false);

-- Ledger Clients
CREATE POLICY "Allow authenticated full access to ledger_clients" ON public.ledger_clients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Deny anonymous access to ledger_clients" ON public.ledger_clients FOR ALL TO anon USING (false);

-- Ledger Payments
CREATE POLICY "Allow authenticated full access to ledger_payments" ON public.ledger_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Deny anonymous access to ledger_payments" ON public.ledger_payments FOR ALL TO anon USING (false);
