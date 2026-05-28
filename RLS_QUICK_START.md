# RLS Implementation Quick Start

## Step 1: Open Supabase Console

1. Go to https://supabase.com/dashboard
2. Select your B&S Marketplace project
3. Click **SQL Editor** in left sidebar

## Step 2: Create New Query

1. Click **New Query** button
2. Name it `RLS Policies for Listings` (optional)

## Step 3: Copy and Paste SQL

Copy the entire contents of `scripts/rls-policies.sql` into the query editor.

The SQL includes:
```sql
-- Enable RLS
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Create 4 policies:
-- 1. SELECT - public read
-- 2. INSERT - authenticated only
-- 3. UPDATE - own listings only
-- 4. DELETE - own listings only

-- Verify policies
SELECT schemaname, tablename, policyname, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'listings'
ORDER BY policyname;
```

## Step 4: Execute

1. Click **Run** button (⏱️ Ctrl+Enter)
2. Wait for execution to complete
3. Verify the last query shows 4 rows in results

## Step 5: Verify in Dashboard

1. Go to **Authentication > Policies**
2. Select **listings** table
3. Confirm you see all 4 policies:
   - ✅ `listings_select_public`
   - ✅ `listings_insert_authenticated`
   - ✅ `listings_update_own`
   - ✅ `listings_delete_own`

## Step 6: Test the Implementation

### Quick Test in Browser Console

Open your marketplace site and run these tests:

**Test 1: Public read works**
```javascript
const { data } = await supabase
  .from('listings')
  .select('id, title')
  .limit(1);
console.log('✅ Public read:', data?.length > 0);
```

**Test 2: Create listing (must be logged in)**
```javascript
const { data, error } = await supabase
  .from('listings')
  .insert([{
    title: "Test",
    price: 25,
    category: "textbooks",
    condition: "good",
    university: "university-of-oregon",
    description: "Test",
    user_id: (await supabase.auth.getSession()).data.session.user.id,
    is_free: false
  }]);
console.log(error ? '❌ Failed' : '✅ Created:', data?.[0]?.id);
```

**Test 3: Unauthorized update fails**
```javascript
const { error } = await supabase
  .from('listings')
  .update({ title: "Hacked" })
  .eq('id', 'some-other-users-listing-id');
console.log(error ? '✅ Blocked' : '❌ Not blocked');
```

## Step 7: Monitor

1. In Supabase dashboard, go to **Logs**
2. Filter for policy-related entries
3. Verify no error messages

## Common Issues

**"No results returned"** from verify query
- RLS might already be enabled
- Policies might already exist
- Drop and recreate by running the full script again

**"Permission denied"** errors in browser
- RLS is working correctly
- Frontend is trying to access data it's not authorized for
- This is expected behavior - check RLS_VERIFICATION.md

**Marketplace shows no listings**
- Verify SELECT policy has `USING (true)`
- Check that listings table has data
- Verify RLS is actually enabled

## What's Protected Now

| Operation | Anonymous | Authenticated | Own Listing |
|-----------|-----------|---|---|
| Read listings | ✅ Yes | ✅ Yes | ✅ Yes |
| Create listing | ❌ No | ✅ Yes | N/A |
| Edit listing | ❌ No | ❌ No (others) | ✅ Yes |
| Delete listing | ❌ No | ❌ No (others) | ✅ Yes |

## Next Steps

- [ ] Apply RLS policies (Steps 1-5 above)
- [ ] Test public read access on /marketplace
- [ ] Test create listing on /create-listing (logged in)
- [ ] Test edit/delete on /dashboard
- [ ] Run verification tests from RLS_VERIFICATION.md
- [ ] Check Supabase logs for any errors
- [ ] Mark RLS implementation as complete

## Documentation

- 📄 `RLS_POLICIES.md` - Detailed RLS documentation
- 📄 `RLS_VERIFICATION.md` - Complete testing guide
- 📄 `scripts/rls-policies.sql` - SQL migration file

## Support

If you encounter issues:

1. Check RLS_POLICIES.md for policy explanations
2. See RLS_VERIFICATION.md for troubleshooting
3. Review Supabase logs for specific error messages
4. Verify user_id is being saved on INSERT operations
