const { createClient } = require('@supabase/supabase-js');

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, key);

  const payload = {
    title: 'E2E Test Item ' + Date.now(),
    price: 1.23,
    description: 'E2E test insertion from workspace script',
    category: 'other',
    condition: 'good',
    university: 'test-university',
    is_free: false,
    image_urls: null,
    user_id: 'script-test',
  };

  console.log('Inserting test listing...');
  const { data, error } = await supabase.from('listings').insert([payload]).select();
  if (error) {
    console.error('Insert error:', error);
    process.exit(2);
  }

  console.log('Inserted:', data);

  const id = data && data[0] && data[0].id;
  if (!id) {
    console.error('No id returned for inserted row');
    process.exit(3);
  }

  console.log('Fetching the inserted listing...');
  const { data: fetched, error: fetchErr } = await supabase.from('listings').select('*').eq('id', id).single();
  if (fetchErr) {
    console.error('Fetch error:', fetchErr);
    process.exit(4);
  }

  console.log('Fetched listing:', fetched);
  console.log('E2E test completed successfully.');
}

main().catch((err) => {
  console.error(err);
  process.exit(99);
});
