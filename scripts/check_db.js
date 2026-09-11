
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
    const { data: c, error: ce } = await supabase.from('clients').select('*').limit(1);
    console.log('clients:', ce ? ce.message : 'exists');
    const { data: p, error: pe } = await supabase.from('payments').select('*').limit(1);
    console.log('payments:', pe ? pe.message : 'exists');
    const { data: l, error: le } = await supabase.from('ledger').select('*').limit(1);
    console.log('ledger:', le ? le.message : 'exists');
}
check();
