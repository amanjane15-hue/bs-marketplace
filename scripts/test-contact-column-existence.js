const { createClient } = require('@supabase/supabase-js');

async function test() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createClient(url, anonKey);
  const timestamp = Date.now();

  console.log('🧪 TEST A: Insert WITHOUT contact field\n');

  // Test without contact
  const payload1 = {
    title: `Test A ${timestamp}`,
    price: 10,
    description: 'No contact',
    category: 'other',
    condition: 'good',
    university: 'other',
    is_free: false,
    image_urls: null,
    user_id: `test-${timestamp}`,
  };

  const { error: error1 } = await supabase.from('listings').insert([payload1]);
  console.log('Result:', error1 ? `❌ ${error1.code}: ${error1.message}` : '✅ Success');

  console.log('\n🧪 TEST B: Insert WITH contact field\n');

  // Test with contact
  const payload2 = {
    title: `Test B ${timestamp}`,
    price: 20,
    description: 'With contact',
    category: 'other',
    condition: 'good',
    university: 'other',
    contact: 'test@test.com',
    is_free: false,
    image_urls: null,
    user_id: `test-${timestamp}`,
  };

  const { error: error2 } = await supabase.from('listings').insert([payload2]);
  console.log('Result:', error2 ? `❌ ${error2.code}: ${error2.message}` : '✅ Success');

  console.log('\n📊 ANALYSIS:');
  if (error1 && error1.code === '42501' && error2 && error2.code === 'PGRST204') {
    console.log('✓ Test A = Permission error (RLS)');
    console.log('✓ Test B = Schema error (contact column missing)');
    console.log('\n🎯 CONCLUSION: Contact column does NOT exist');
  } else if (error1?.code === error2?.code && error1?.code === '42501') {
    console.log('✓ Both tests failed with same permission error (RLS)');
    console.log('\n🎯 CONCLUSION: Permission issue prevents any inserts');
  } else {
    console.log('Different error patterns - see above');
  }
}

test().catch(console.error);
