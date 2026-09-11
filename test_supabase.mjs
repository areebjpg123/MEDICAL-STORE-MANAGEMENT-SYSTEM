import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { error } = await supabase.from('products').update({ category: 'medicine' }).eq('id', 'non-existent');
  console.log('Update result:', error);
}

test();
