# RLS Policy Verification Checklist

This document guides you through verifying that the RLS policies are working correctly.

## Pre-Deployment Verification

### 1. Check RLS is Enabled

In Supabase Console:
- [ ] Navigate to **Authentication > Policies**
- [ ] Select **listings** table from dropdown
- [ ] Verify you see 4 policies listed:
  - `listings_select_public`
  - `listings_insert_authenticated`
  - `listings_update_own`
  - `listings_delete_own`

### 2. Verify Policy Details

For each policy, click to view:
- [ ] `listings_select_public` → USING: `true`
- [ ] `listings_insert_authenticated` → WITH CHECK: `auth.uid() = user_id AND auth.uid() IS NOT NULL`
- [ ] `listings_update_own` → USING: `auth.uid() = user_id` AND WITH CHECK: `auth.uid() = user_id`
- [ ] `listings_delete_own` → USING: `auth.uid() = user_id`

## Frontend Testing

### Test Scenario 1: Public Marketplace Access (Should Work)

**Action**: Visit `/marketplace` without logging in
**Expected**: 
- [ ] Page loads successfully
- [ ] Listings feed displays all listings
- [ ] No authentication required
- [ ] Real-time updates work

**Verify in browser console**:
```javascript
// Check if listings are loading
const response = await supabase
  .from('listings')
  .select('*')
  .limit(5);
console.log('Public read:', response.data?.length > 0);
// Should log: true
```

---

### Test Scenario 2: Create Listing While Unauthenticated (Should Fail)

**Action**: 
1. Open browser dev console
2. Run:
```javascript
const { data, error } = await supabase
  .from('listings')
  .insert([{
    title: "Test",
    price: 10,
    user_id: "non-existent-id"
  }]);
console.log('Unauthenticated insert error:', error?.message);
// Should show RLS policy error
```

**Expected**: Error message mentioning "row-level security policy"

---

### Test Scenario 3: Create Listing While Authenticated (Should Work)

**Action**: 
1. Login at `/login`
2. Navigate to `/create-listing`
3. Fill out form and submit

**Expected**:
- [ ] Form submits successfully
- [ ] Listing appears in Supabase dashboard
- [ ] Listing has correct `user_id`

**Verify in browser console**:
```javascript
const session = await supabase.auth.getSession();
const userId = session.data.session?.user?.id;

// Attempt insert
const { data, error } = await supabase
  .from('listings')
  .insert([{
    title: "Test Listing",
    price: 25,
    category: "textbooks",
    condition: "good",
    university: "university-of-oregon",
    description: "Test",
    user_id: userId,
    is_free: false
  }]);

console.log('Authenticated insert result:', {
  success: !error,
  listingId: data?.[0]?.id,
  error: error?.message
});
// Should log: success: true
```

---

### Test Scenario 4: Dashboard Shows Only User's Listings (Should Work)

**Action**: 
1. Login as User A
2. Create a listing
3. Visit `/dashboard`

**Expected**:
- [ ] Dashboard loads
- [ ] Only User A's listing shows
- [ ] Edit/Delete buttons are active

---

### Test Scenario 5: Cannot Edit Another User's Listing (Should Fail)

**Action**: 
1. Login as User A, create Listing #1
2. Login as User B, try to edit Listing #1

**Steps**:
1. Get Listing #1's ID (from User A's dashboard)
2. Login as User B
3. In browser console, run:

```javascript
const { data, error } = await supabase
  .from('listings')
  .update({ title: "Hacked by User B" })
  .eq('id', 'listing-1-id');

console.log('Unauthorized update:', error?.message);
// Should show: "new row violates row-level security policy"
```

**Expected**: Update fails with RLS policy error

---

### Test Scenario 6: User Can Edit Their Own Listing (Should Work)

**Action**:
1. Login as User A
2. Go to `/dashboard`
3. Click "Edit" on their listing

**Expected**:
- [ ] Edit modal opens
- [ ] Form pre-fills with current data
- [ ] Changes save successfully
- [ ] Marketplace shows updated listing

---

### Test Scenario 7: Cannot Delete Another User's Listing (Should Fail)

**Action**: 
1. Login as User A, note their listing ID
2. Login as User B, in console run:

```javascript
const { error } = await supabase
  .from('listings')
  .delete()
  .eq('id', 'user-a-listing-id');

console.log('Unauthorized delete:', error?.message);
// Should show: "new row violates row-level security policy"
```

**Expected**: Delete fails with RLS policy error

---

### Test Scenario 8: User Can Delete Their Own Listing (Should Work)

**Action**:
1. Login as User A
2. Go to `/dashboard`
3. Click "Delete" on their listing
4. Confirm deletion

**Expected**:
- [ ] Confirmation modal appears
- [ ] Delete succeeds
- [ ] Listing removed from dashboard
- [ ] Listing removed from marketplace feed

---

## API-Level Testing

### Test with cURL (Optional)

```bash
# Get your Anon Key from Supabase settings
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"

# Test 1: Anonymous user can read (should work)
curl -X GET \
  "$SUPABASE_URL/rest/v1/listings?limit=5" \
  -H "apikey: $SUPABASE_ANON_KEY"

# Test 2: Anonymous user cannot insert (should fail)
curl -X POST \
  "$SUPABASE_URL/rest/v1/listings" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","user_id":"fake-id"}'
# Expected: 403 Forbidden or policy error
```

---

## Supabase Dashboard Monitoring

### View RLS Violations

1. Go to **Logs** in Supabase dashboard
2. Filter for "policy"
3. Look for violations to debug issues

### View Active Sessions

1. Go to **Authentication > Users**
2. See all authenticated users
3. Verify user_id values match in listings table

---

## Post-Implementation Checklist

- [ ] All RLS policies created successfully
- [ ] No RLS policy errors in Supabase logs
- [ ] Marketplace feed loads publicly without errors
- [ ] Authenticated users can create listings
- [ ] Users see only their listings on dashboard
- [ ] Users can edit only their own listings
- [ ] Users cannot modify other users' listings
- [ ] Users can delete only their own listings
- [ ] Real-time updates work correctly
- [ ] No TypeScript errors in frontend
- [ ] Build succeeds without errors

---

## Troubleshooting

### "Row-level security policy denies access to the target relation"

**Cause**: User trying to access data they're not authorized for  
**Solution**: Verify user_id matches auth.uid() and RLS policies are correct

### Marketplace shows no listings

**Cause**: SELECT policy might be too restrictive  
**Solution**: Ensure `listings_select_public` has `USING (true)`

### Can't create listings

**Cause**: INSERT policy user_id validation  
**Solution**: Ensure frontend sends user_id matching the logged-in user

### Edit works but doesn't save changes

**Cause**: UPDATE policy user_id mismatch  
**Solution**: Verify user_id is in the WHERE clause and matches current user

---

## Documentation References

- [RLS_POLICIES.md](../RLS_POLICIES.md) - Full policy documentation
- [scripts/rls-policies.sql](../scripts/rls-policies.sql) - SQL migration file
