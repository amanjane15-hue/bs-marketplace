const { createClient } = require('@supabase/supabase-js');

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  const supabase = createClient(url, key);

  // Test 1: Insert WITHOUT contact (original test payload)
  console.log('\n=== TEST 1: Insert WITHOUT contact field ===');
  const payloadWithoutContact = {
    title: 'Test No Contact ' + Date.now(),
    price: 50.00,
    description: 'Test without contact',
    category: 'other',
    condition: 'good',
    university: 'university-of-oregon',
    is_free: false,
    image_urls: null,
    user_id: 'test-user-' + Date.now(),
  };

  const { data: data1, error: error1 } = await supabase.from('listings').insert([payloadWithoutContact]).select();
  if (error1) {
    console.log('ERROR:', error1.message);
  } else {
    console.log('SUCCESS: Created without contact');
  }

  // Test 2: Insert WITH contact (form payload)
  console.log('\n=== TEST 2: Insert WITH contact field ===');
  const payloadWithContact = {
    title: 'Test With Contact ' + Date.now(),
    price: 75.00,
    description: 'Test with contact',
    category: 'electronics',
    condition: 'new',
    university: 'oregon-state',
    contact: 'seller@student.edu',
    is_free: false,
    image_urls: null,
    user_id: 'test-user-' + Date.now(),
  };

  const { data: data2, error: error2 } = await supabase.from('listings').insert([payloadWithContact]).select();
  if (error2) {
    console.log('ERROR:', error2.message);
    console.log('ERROR CODE:', error2.code);
    if (error2.message.includes('contact')) {
      console.log('\n⚠️  DIAGNOSIS: Contact column does NOT exist');
      console.log('FIX: Run this SQL in Supabase SQL Editor:');
      console.log('  ALTER TABLE listings ADD COLUMN contact text;');
    }
  } else {
    console.log('SUCCESS: Created with contact:', data2[0]?.contact);
  }
}

main().catch(console.error);
