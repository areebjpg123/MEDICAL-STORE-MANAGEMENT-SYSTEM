import { createClient } from '@/utils/supabase/server';
import CustomerStorefront from './CustomerStorefront';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  
  // Fetch active products (bypassing 1000 limit)
  let allProducts: any[] = [];
  let from = 0;
  const step = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, company_name, formula_name, exp_date, sale_price, stock_quantity, box_quantity, section') // Exclude cost_price for customers
      .order('name')
      .range(from, from + step - 1);

    if (error) break;

    if (data && data.length > 0) {
      allProducts = [...allProducts, ...data];
      from += step;
      if (data.length < step) hasMore = false;
    } else {
      hasMore = false;
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <CustomerStorefront initialProducts={allProducts} />
    </main>
  );
}
