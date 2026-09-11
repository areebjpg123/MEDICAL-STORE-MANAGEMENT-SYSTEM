import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function addColumns() {
  const { error } = await supabase.rpc('execute_sql', {
    sql: `
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'medicine',
      ADD COLUMN IF NOT EXISTS order_number TEXT,
      ADD COLUMN IF NOT EXISTS order_date TEXT,
      ADD COLUMN IF NOT EXISTS bill_image TEXT;
    `
  });

  if (error) {
    console.error("Could not run RPC, running directly via REST fallback...", error);
    // There is no direct SQL execution from client without RPC or postgres connection string.
    // However, if they have an execute_sql rpc we can use it.
  }
}

addColumns();
