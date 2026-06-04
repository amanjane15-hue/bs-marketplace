const { createClient } = require('@supabase/supabase-js');

async function testWithAuth() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createClient(url, anonKey);
  const timestamp = Date.now();
  const testEmail = `e2etest${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';

  console.log('🧪 AUTHENTICATED LISTING SUBMISSION TEST\n');

  // Step 1: Sign up
  console.log('🔄 STEP 1: Create/authenticate test account');
  console.log('─'.repeat(60));

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword,
  });

  if (signUpError) {
    console.log(`SignUp error: ${signUpError.message}`);
  } else {
    console.log(`✅ Account created/confirmed`);
  }

  // Try to sign in
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  });

  if (signInError) {
    console.log(`❌ Sign in failed: ${signInError.message}`);
    process.exit(1);
  }

  const session = signInData.session;
  const userId = session.user.id;
  console.log(`✅ Authenticated as user ID: ${userId}`);

  // Step 2: Insert listing
  console.log('\n🔄 STEP 2: Insert listing as authenticated user');
  console.log('─'.repeat(60));

  const testListing = {
    title: `Test Listing ${timestamp}`,
    price: 99.99,
    description: 'Test from auth session',
    category: 'electronics',
    condition: 'new',
    university: 'university-of-oregon',
    contact: `contact+${timestamp}@example.com`,
    is_free: false,
    image_urls: null,
    user_id: userId,
  };

  console.log('Inserting:', JSON.stringify(testListing, null, 2));

  const { data: insertData, error: insertError } = await supabase
    .from('listings')
    .insert([testListing])
    .select();

  if (insertError) {
    console.log('❌ INSERT FAILED');
    console.log('Error:', JSON.stringify(insertError, null, 2));

    if (insertError.code === 'PGRST204') {
      const match = insertError.message.match(/Could not find the '(\w+)' column/);
      if (match) {
        console.log(`\n🔴 ROOT CAUSE: Missing column "${match[1]}" in listings table`);
      }
    } else if (insertError.code === '42501') {
      console.log('\n🔴 ROOT CAUSE: RLS permission denied');
    }
    process.exit(1);
  }

  const listingId = insertData[0].id;
  console.log(`✅ INSERT SUCCESSFUL - ID: ${listingId}`);

  // Step 3: Verify
  console.log('\n🔄 STEP 3: Verify in database');
  console.log('─'.repeat(60));

  const { data: fetched, error: fetchError } = await supabase
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .single();

  if (fetchError) {
    console.log(`❌ Fetch failed: ${fetchError.message}`);
    process.exit(1);
  }

  console.log('✅ Record retrieved');
  console.log('\nField checks:');
  console.log(`  user_id: ${fetched.user_id === userId ? '✅' : '❌'}`);
  console.log(`  contact: ${fetched.contact ? '✅ ' + fetched.contact : '❌'}`);
  console.log(`  title: ${fetched.title ? '✅' : '❌'}`);
  console.log(`  created_at: ${fetched.created_at ? '✅' : '❌'}`);

  console.log('\n✅ SUCCESS - Listing submission is working!');
}

testWithAuth().catch((err) => {
  console.error('Fatal Error:', err.message);
  process.exit(99);
});
