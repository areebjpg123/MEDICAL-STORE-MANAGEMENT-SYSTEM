const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const INITIAL_INVENTORY = [
  { name: "Panadol 500mg", company_name: "GSK", formula_name: "Paracetamol", exp_date: "11-2026", cost_price: 80, sale_price: 120, stock_quantity: 45, box_quantity: 100, section: "OTC" },
  { name: "Brufen 400mg", company_name: "Abbott", formula_name: "Ibuprofen", exp_date: "10-2026", cost_price: 120, sale_price: 180, stock_quantity: 32, box_quantity: 50, section: "OTC" },
  { name: "Augmentin 625mg", company_name: "GSK", formula_name: "Amoxicillin+Clavulanate", exp_date: "03-2027", cost_price: 600, sale_price: 850, stock_quantity: 8, box_quantity: 20, section: "Rx" },
  { name: "Flagyl 400mg", company_name: "Sanofi", formula_name: "Metronidazole", exp_date: "12-2026", cost_price: 60, sale_price: 95, stock_quantity: 60, box_quantity: 100, section: "Rx" },
  { name: "Amoxil 250mg", company_name: "GSK", formula_name: "Amoxicillin", exp_date: "01-2027", cost_price: 140, sale_price: 210, stock_quantity: 25, box_quantity: 50, section: "Rx" },
  { name: "Disprin", company_name: "Reckitt", exp_date: "11-2026", formula_name: "Aspirin", cost_price: 25, sale_price: 45, stock_quantity: 100, box_quantity: 200, section: "OTC" },
];

async function seed() {
  const { error } = await supabase.from('products').insert(INITIAL_INVENTORY);
  if (error) console.error('Seed error:', error);
  else console.log('Products seeded!');
}
seed();
