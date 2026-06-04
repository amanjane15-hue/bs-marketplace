const { createClient } = require('@supabase/supabase-js');

async function checkSchema() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createClient(url, anonKey);

  console.log('🔍 CHECKING LISTINGS TABLE SCHEMA\n');

  // Try to read a sample row to infer schema
  console.log('Querying sample row from listings table...');
  const { data: sampleRow, error: sampleError } = await supabase
    .from('listings')
    .select('*')
    .limit(1)
    .single();

  if (sampleError) {
    // If we can't read because table is empty or permissions, try with explicit columns
    console.log(`Sample query error: ${sampleError.code} - ${sampleError.message}\n`);
    console.log('Trying to select specific columns we know should exist...\n');

    const { data: row2, error: err2 } = await supabase
      .from('listings')
      .select('id, title, price, contact, user_id, condition')
      .limit(1)
      .single();

    if (err2) {
      console.log(`❌ Error: ${err2.code} - ${err2.message}`);
      if (err2.code === 'PGRST204') {
        const match = err2.message.match(/Could not find the '(\w+)' column/);
        if (match) {
          console.log(`\n🔴 ROOT CAUSE: Column "${match[1]}" does NOT exist in listings table`);
        }
      }
      return;
    }

    console.log('✅ Successfully selected columns');
    console.log('Columns that exist:', Object.keys(row2));
    return;
  }

  if (!sampleRow) {
    console.log('Table appears empty. Trying to insert test row to check schema...');
    return;
  }

  console.log('✅ Sample row retrieved\n');
  console.log('Columns in listings table:');
  const columns = Object.keys(sampleRow);
  columns.forEach((col, i) => {
    console.log(`  ${i + 1}. ${col}`);
  });

  console.log('\n📊 CRITICAL FINDINGS:');
  console.log(`  ${columns.includes('contact') ? '✅' : '❌'} contact column`);
  console.log(`  ${columns.includes('user_id') ? '✅' : '❌'} user_id column`);
  console.log(`  ${columns.includes('condition') ? '✅' : '❌'} condition column`);

  if (!columns.includes('contact')) {
    console.log('\n🔴 ROOT CAUSE: contact column is MISSING from database');
  }
}

checkSchema().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
