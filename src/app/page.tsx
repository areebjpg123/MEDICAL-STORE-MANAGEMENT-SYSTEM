import { createClient } from '@/utils/supabase/server';
import CustomerStorefront from './CustomerStorefront';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const supabase = await createClient();
  
  // Fetch active products
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('name');

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-zinc-950">
      <CustomerStorefront initialProducts={products || []} />
    </main>
  );
}
