const { createClient } = require('@supabase/supabase-js');

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const adminKey = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  // Use service key to run migrations (admin access)
  if (!adminKey) {
    console.log('[INFO] SUPABASE_SERVICE_KEY not set. Cannot run migrations.');
    console.log('[INFO] Please run this SQL in Supabase SQL editor:');
    console.log(`
ALTER TABLE listings ADD COLUMN contact text;
    `);
    process.exit(0);
  }

  const supabaseAdmin = createClient(url, adminKey);

  console.log('[MIGRATION] Adding contact column to listings table...');
  const { error: migrationError } = await supabaseAdmin.rpc('exec_sql', {
    sql: 'ALTER TABLE listings ADD COLUMN IF NOT EXISTS contact text;',
  }).single();

  if (migrationError) {
    console.log('[MIGRATION] Note: Column might already exist or migration had issues:', migrationError);
  } else {
    console.log('[MIGRATION] Contact column added successfully');
  }

  // Now test insert with anon key
  const supabase = createClient(url, key);
  const payload = {
    title: 'Test Item with Contact ' + Date.now(),
    price: 99.99,
    description: 'Test listing with contact field',
    category: 'electronics',
    condition: 'new',
    university: 'university-of-oregon',
    contact: 'test@student.edu',
    is_free: false,
    image_urls: null,
    user_id: 'test-user-123',
  };

  console.log('[TEST] Inserting listing WITH contact field...');
  const { data, error } = await supabase.from('listings').insert([payload]).select();
  if (error) {
    console.log('[TEST] ERROR:', JSON.stringify(error, null, 2));
    process.exit(2);
  }

  console.log('[TEST] Success! Listing created with contact:', data[0]?.contact);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(99);
});
