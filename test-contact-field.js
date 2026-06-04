const { createClient } = require('@supabase/supabase-js');

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, key);

  // Try with contact field (like the form does)
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

  console.log('[TEST] Success! Listing created');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(99);
});
