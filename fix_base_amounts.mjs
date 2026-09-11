import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing Supabase credentials in environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
  console.log("Fetching products with empty base_amount...");
  
  // Need to handle pagination if > 1000 items
  let allProducts = [];
  let from = 0;
  const step = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('products')
      .select('id, cost_price, sale_price, base_amount')
      .range(from, from + step - 1);

    if (error) {
      console.error("Error fetching products:", error);
      process.exit(1);
    }

    if (data && data.length > 0) {
      allProducts.push(...data);
      from += step;
      if (data.length < step) hasMore = false;
    } else {
      hasMore = false;
    }
  }

  console.log(`Found ${allProducts.length} total products.`);
  
  const toUpdate = allProducts.filter(p => !p.base_amount || p.base_amount === 0);
  console.log(`${toUpdate.length} products need base_amount update.`);

  let updatedCount = 0;
  for (const product of toUpdate) {
    const newBase = product.cost_price || (product.sale_price * 0.7);
    const { error } = await supabase
      .from('products')
      .update({
        base_amount: newBase,
        net_cost: newBase
      })
      .eq('id', product.id);

    if (error) {
      console.error(`Failed to update product ${product.id}:`, error);
    } else {
      updatedCount++;
      if (updatedCount % 50 === 0) console.log(`Updated ${updatedCount}...`);
    }
  }

  console.log(`Finished updating ${updatedCount} products.`);
}

main();
