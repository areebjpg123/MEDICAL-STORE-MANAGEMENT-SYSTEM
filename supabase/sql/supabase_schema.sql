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
