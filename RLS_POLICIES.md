# Supabase Row Level Security (RLS) Implementation Guide

## Overview

This document describes the Row Level Security (RLS) policies implemented for the B&S Marketplace on Supabase.

## Security Model

### Listings Table RLS Policies

#### 1. **SELECT Policy: Public Read Access**
- **Name**: `listings_select_public`
- **Scope**: Everyone (authenticated and anonymous users)
- **Rule**: `USING (true)`
- **Purpose**: Allow public browsing of the marketplace feed
- **Frontend Impact**: Marketplace page loads without authentication

```sql
CREATE POLICY listings_select_public ON public.listings
FOR SELECT
USING (true);
```

---

#### 2. **INSERT Policy: Authenticated Users Only**
- **Name**: `listings_insert_authenticated`
- **Scope**: Only authenticated users
- **Rule**: `WITH CHECK (auth.uid() = user_id AND auth.uid() IS NOT NULL)`
- **Purpose**: Prevent anonymous users from creating listings; enforce user_id matches logged-in user
- **Frontend Impact**: Create listing form is protected by AuthGuard

```sql
CREATE POLICY listings_insert_authenticated ON public.listings
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND auth.uid() IS NOT NULL
);
```

---

#### 3. **UPDATE Policy: Users Update Only Their Own**
- **Name**: `listings_update_own`
- **Scope**: Only the listing owner
- **Rules**:
  - `USING (auth.uid() = user_id)` — Can only see listings they own
  - `WITH CHECK (auth.uid() = user_id)` — Can only update if they own it
- **Purpose**: Prevent users from modifying other users' listings
- **Frontend Impact**: Dashboard only shows user's listings; edit operations fail if not owner

```sql
CREATE POLICY listings_update_own ON public.listings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

---

#### 4. **DELETE Policy: Users Delete Only Their Own**
- **Name**: `listings_delete_own`
- **Scope**: Only the listing owner
- **Rule**: `USING (auth.uid() = user_id)`
- **Purpose**: Prevent users from deleting other users' listings
- **Frontend Impact**: Dashboard delete button only works for user's own listings

```sql
CREATE POLICY listings_delete_own ON public.listings
FOR DELETE
USING (auth.uid() = user_id);
```

---

## How to Apply These Policies

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a **New Query**
4. Copy the contents of `scripts/rls-policies.sql`
5. Click **Run** to execute all policies

### Option 2: Using Supabase CLI

```bash
supabase db push
```

### Option 3: Manual Policy Creation in Dashboard

1. Go to **Authentication > Policies**
2. Select the **listings** table
3. Create each policy manually following the rules above

---

## Security Features

### Frontend + Database Layer Security

The implementation uses **defense in depth**:

1. **Frontend Layer** (`AuthGuard` component)
   - Redirects unauthenticated users to login
   - Filters dashboard results to show only user's listings

2. **Database Layer** (RLS Policies)
   - `auth.uid()` enforces that only the logged-in user's ID is used
   - `user_id` column is required on all listings
   - Unauthorized modifications are rejected at the database level

### Key Security Properties

- ✅ **Public Read**: Anyone can browse marketplace listings
- ✅ **Authenticated Write**: Only logged-in users can create listings
- ✅ **Ownership Enforcement**: Users can only modify/delete their own listings
- ✅ **No Privilege Escalation**: Even if frontend is bypassed, database rejects unauthorized changes
- ✅ **Clean User Separation**: Each user's data is isolated

---

## Testing the RLS Policies

### Test 1: Public Read Access (Should Work)

```javascript
// Anonymous user can read listings
const { data } = await supabase
  .from('listings')
  .select('*');
// ✅ Returns all listings
```

### Test 2: Authenticated Insert (Should Work)

```javascript
// Authenticated user can create listing
const { data } = await supabase
  .from('listings')
  .insert([{
    title: "Test Listing",
    user_id: auth.uid(), // Current user's ID
    price: 25,
    // ... other fields
  }]);
// ✅ Successfully created
```

### Test 3: Authenticated Update Own (Should Work)

```javascript
// User can update their own listing
const { data } = await supabase
  .from('listings')
  .update({ title: "Updated Title" })
  .eq('id', 'their-listing-id')
  .eq('user_id', auth.uid());
// ✅ Successfully updated
```

### Test 4: Cannot Update Others (Should Fail)

```javascript
// User cannot update another user's listing
const { data, error } = await supabase
  .from('listings')
  .update({ title: "Hacked Title" })
  .eq('id', 'other-users-listing-id')
  .eq('user_id', auth.uid());
// ❌ Error: new row violates row-level security policy
```

---

## Frontend Compatibility

All existing frontend code continues to work because:

1. **Marketplace Page** — Uses public SELECT, which is allowed
2. **Create Listing** — Already checks `auth.uid()`, matches RLS requirement
3. **Dashboard Edit** — Already filters by `user_id`, matches RLS requirement
4. **Dashboard Delete** — Already filters by `user_id`, matches RLS requirement

**No frontend code changes required** — RLS enforces existing logic at the database level.

---

## Monitoring & Troubleshooting

### Check RLS Status in Supabase Console

1. Go to **Table Editor**
2. Click on **listings** table
3. Look for "RLS enabled" badge (should show enabled)
4. Click the lock icon to view active policies

### Common Issues

**Issue**: "new row violates row-level security policy"
- **Cause**: `user_id` doesn't match `auth.uid()`
- **Solution**: Ensure `user_id` is set to current user's ID on insert

**Issue**: Cannot see any listings on marketplace
- **Cause**: SELECT policy might be missing or incorrectly configured
- **Solution**: Verify `listings_select_public` exists with `USING (true)`

**Issue**: Dashboard shows empty even after creating listings
- **Cause**: UPDATE/SELECT combined might be failing
- **Solution**: Check that user_id column is properly set in INSERT operations

---

## RLS Policy Checklist

- [ ] RLS enabled on `listings` table
- [ ] `listings_select_public` policy created (SELECT)
- [ ] `listings_insert_authenticated` policy created (INSERT)
- [ ] `listings_update_own` policy created (UPDATE)
- [ ] `listings_delete_own` policy created (DELETE)
- [ ] Marketplace feed loads without authentication
- [ ] Authenticated users can create listings
- [ ] Users can edit only their own listings
- [ ] Users can delete only their own listings
- [ ] Unauthorized edit/delete attempts are rejected

---

## Production Deployment

When deploying to production:

1. ✅ Apply RLS policies before going live
2. ✅ Test all user scenarios (public read, create, edit, delete)
3. ✅ Monitor RLS policy violations in Supabase logs
4. ✅ Keep a backup of policies in version control (this file)

---

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Policies](https://www.postgresql.org/docs/current/sql-createpolicy.html)
- [auth.uid() Function](https://supabase.com/docs/guides/auth/auth-helpers/next-js)
