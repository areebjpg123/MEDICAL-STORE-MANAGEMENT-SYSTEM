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
