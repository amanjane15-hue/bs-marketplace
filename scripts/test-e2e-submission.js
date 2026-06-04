const { createClient } = require('@supabase/supabase-js');

async function testListingSubmission() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.error('❌ Missing env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  console.log('🧪 LISTING SUBMISSION E2E TEST\n');
  console.log('📋 Test Configuration:');
  console.log(`  Supabase URL: ${url.substring(0, 30)}...`);
  console.log(`  Using anon key (simulates browser client)\n`);

  const supabase = createClient(url, anonKey);

  // Generate unique test data
  const timestamp = Date.now();
  const testUserId = `test-user-${timestamp}`;
  const testListing = {
    title: `Test Listing ${timestamp}`,
    price: 49.99,
    description: 'This is a test listing created by automated E2E test',
    category: 'electronics',
    condition: 'new',
    university: 'university-of-oregon',
    contact: `test+${timestamp}@student.edu`,
    is_free: false,
    image_urls: null,
    user_id: testUserId,
  };

  console.log('📝 Test Listing Data:');
  console.log(JSON.stringify(testListing, null, 2));

  // Step 1: Attempt to insert listing
  console.log('\n\n🔄 STEP 1: Attempt to insert listing');
  console.log('─'.repeat(60));

  const { data: insertData, error: insertError } = await supabase
    .from('listings')
    .insert([testListing])
    .select();

  if (insertError) {
    console.log('❌ INSERT FAILED');
    console.log('\n📊 Error Details:');
    console.log(JSON.stringify(insertError, null, 2));

    console.log('\n🔍 Error Analysis:');
    if (insertError.code === 'PGRST204') {
      console.log('  Type: Schema error');
      console.log('  Issue: Missing column in database');
      const match = insertError.message.match(/Could not find the '(\w+)' column/);
      if (match) {
        console.log(`  Missing Column: "${match[1]}"`);
      }
    } else if (insertError.code === '42501') {
      console.log('  Type: Permission error');
      console.log('  Issue: RLS policy or grant issue');
    } else {
      console.log(`  Type: ${insertError.code || 'Unknown'}`);
    }

    process.exit(1);
  }

  if (!insertData || insertData.length === 0) {
    console.log('❌ INSERT RETURNED NO DATA');
    console.log('  The insert may have succeeded but no data was returned');
    process.exit(1);
  }

  const createdId = insertData[0].id;
  console.log('✅ INSERT SUCCESSFUL');
  console.log(`\n📌 Created listing ID: ${createdId}`);
  console.log('\n📋 Returned Row Data:');
  console.log(JSON.stringify(insertData[0], null, 2));

  // Step 2: Verify the row in database
  console.log('\n\n🔄 STEP 2: Query the created listing from database');
  console.log('─'.repeat(60));

  const { data: fetchedListing, error: fetchError } = await supabase
    .from('listings')
    .select('*')
    .eq('id', createdId)
    .single();

  if (fetchError) {
    console.log('❌ FETCH FAILED');
    console.log(JSON.stringify(fetchError, null, 2));
    process.exit(1);
  }

  console.log('✅ FETCH SUCCESSFUL\n');
  console.log('📊 Full Row Data from Database:');
  console.log(JSON.stringify(fetchedListing, null, 2));

  // Step 3: Verify all fields
  console.log('\n\n🔄 STEP 3: Verify all fields are saved correctly');
  console.log('─'.repeat(60));

  const fieldChecks = {
    'title': { expected: testListing.title, actual: fetchedListing.title },
    'price': { expected: testListing.price, actual: fetchedListing.price },
    'description': { expected: testListing.description, actual: fetchedListing.description },
    'category': { expected: testListing.category, actual: fetchedListing.category },
    'condition': { expected: testListing.condition, actual: fetchedListing.condition },
    'university': { expected: testListing.university, actual: fetchedListing.university },
    'contact': { expected: testListing.contact, actual: fetchedListing.contact },
    'user_id': { expected: testListing.user_id, actual: fetchedListing.user_id },
    'is_free': { expected: testListing.is_free, actual: fetchedListing.is_free },
    'image_urls': { expected: testListing.image_urls, actual: fetchedListing.image_urls },
  };

  let allFieldsValid = true;
  for (const [field, check] of Object.entries(fieldChecks)) {
    const matches = JSON.stringify(check.expected) === JSON.stringify(check.actual);
    const status = matches ? '✅' : '❌';
    console.log(`  ${status} ${field}: ${matches ? 'OK' : 'MISMATCH'}`);
    if (!matches) {
      console.log(`      Expected: ${JSON.stringify(check.expected)}`);
      console.log(`      Actual: ${JSON.stringify(check.actual)}`);
      allFieldsValid = false;
    }
  }

  // Step 4: Check if created_at was set
  console.log('\n  📅 Database-managed fields:');
  console.log(`     created_at: ${fetchedListing.created_at}`);

  // Final result
  console.log('\n\n' + '='.repeat(60));
  if (allFieldsValid) {
    console.log('✅ ALL TESTS PASSED');
    console.log('   Listing submission is working correctly!');
  } else {
    console.log('⚠️  PARTIAL SUCCESS');
    console.log('   Listing created but some fields have issues');
  }
  console.log('='.repeat(60));
}

testListingSubmission().catch((err) => {
  console.error('💥 Fatal Error:', err.message);
  process.exit(99);
});
