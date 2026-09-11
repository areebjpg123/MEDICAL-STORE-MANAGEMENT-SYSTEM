const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@medistore.com',
    password: 'password123',
    email_confirm: true
  });
  if (error) {
    if (error.message.includes('already exists')) {
      console.log('Admin user already exists.');
    } else {
      console.error('Error creating admin:', error.message);
    }
  } else {
    console.log('Admin user created successfully:', data.user.email);
  }
}
main();
