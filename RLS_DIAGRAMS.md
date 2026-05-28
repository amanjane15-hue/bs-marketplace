# RLS Flow Diagrams & Examples

## 🔄 Complete Request Flow

### Scenario 1: Anonymous User Reading Listings (✅ Allowed)

```
Browser: Anonymous User
         ↓
    GET /marketplace
         ↓
Frontend: MarketplaceFeed component
         ↓
Supabase Query: SELECT * FROM listings
         ↓
Database: listings_select_public policy
         │
         └─→ USING (true)  ← Rule: Allow everyone
         ↓
Database: Returns all listings
         ↓
Browser: Marketplace displays listings
```

### Scenario 2: Authenticated User Creating Listing (✅ Allowed)

```
Browser: Authenticated User
User ID: "user-123"
         ↓
    POST /create-listing
         ↓
Frontend: ListingForm component
         ↓
    AuthGuard: Checks if user logged in ✅
         ↓
Supabase Query: 
  INSERT INTO listings (
    title, price, user_id = "user-123", ...
  )
         ↓
Database: listings_insert_authenticated policy
         │
         ├─→ auth.uid() = "user-123" ✓
         ├─→ user_id = "user-123" ✓
         ├─→ auth.uid() IS NOT NULL ✓
         │
         └─→ WITH CHECK: PASSED
         ↓
Database: Listing created successfully
         ↓
Browser: "Listing created!" message
```

### Scenario 3: User Trying to Update Another's Listing (❌ Blocked)

```
Browser: Malicious User
User ID: "user-456"
         ↓
    Intercept Request & Modify:
    PUT /api/listings/listing-1
    { title: "Hacked!", user_id: "user-456" }
         ↓
Frontend: No guard here (attacker bypassed UI)
         ↓
Supabase Query:
  UPDATE listings
  SET title = "Hacked!"
  WHERE id = "listing-1"
         ↓
Database: listings_update_own policy
         │
         └─→ USING (auth.uid() = user_id)
             Checking: "user-456" = "user-123"? ❌
         ↓
Database: Policy Check FAILED
         ↓
Supabase: 403 Forbidden
  "new row violates row-level security policy"
         ↓
Browser: Request fails, listing unchanged
```

### Scenario 4: Owner Updating Their Own Listing (✅ Allowed)

```
Browser: Original User
User ID: "user-123"
         ↓
    Dashboard: Edit button clicked
         ↓
Frontend: DashboardContent component
         │
         ├─→ AuthGuard: User logged in ✓
         ├─→ Listing owner = current user ✓
         ├─→ Edit modal shows
         │
         └─→ User fills form & clicks "Save"
         ↓
Supabase Query:
  UPDATE listings
  SET title = "Updated Title", ...
  WHERE id = "listing-1"
         ↓
Database: listings_update_own policy
         │
         ├─→ auth.uid() = "user-123" ✓
         ├─→ listings.user_id = "user-123" ✓
         │
         └─→ USING & WITH CHECK: PASSED
         ↓
Database: Listing updated successfully
         ↓
Browser: "Changes saved!" notification
```

---

## 🎯 Policy Decision Matrix

```
┌──────────────────────────────────────────────────────────┐
│ Which Policy Applies?                                    │
├──────────────────────────────────────────────────────────┤
│ Operation │ Auth Status │ Ownership │ Policy             │
├───────────┼─────────────┼───────────┼────────────────────┤
│ SELECT    │ ANY         │ ANY       │ select_public      │
│           │             │           │ (always allowed)   │
├───────────┼─────────────┼───────────┼────────────────────┤
│ INSERT    │ No          │ N/A       │ Blocked ❌         │
│           ├─────────────┤───────────┼────────────────────┤
│           │ Yes         │ Own       │ insert_auth ✅     │
│           │             │ Other     │ Blocked ❌         │
├───────────┼─────────────┼───────────┼────────────────────┤
│ UPDATE    │ No          │ N/A       │ Blocked ❌         │
│           ├─────────────┤───────────┼────────────────────┤
│           │ Yes         │ Own       │ update_own ✅      │
│           │             │ Other     │ Blocked ❌         │
├───────────┼─────────────┼───────────┼────────────────────┤
│ DELETE    │ No          │ N/A       │ Blocked ❌         │
│           ├─────────────┤───────────┼────────────────────┤
│           │ Yes         │ Own       │ delete_own ✅      │
│           │             │ Other     │ Blocked ❌         │
└──────────────────────────────────────────────────────────┘
```

---

## 🔐 Database Security Layers

```
Request Comes In
      ↓
┌─────────────────────────────────────┐
│ Layer 1: Authentication             │
│ ────────────────────────────────────│
│ Check: Is auth.uid() set?           │
│ ├─→ No:  Some policies still work   │
│ └─→ Yes: User has a session         │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│ Layer 2: RLS Policies               │
│ ────────────────────────────────────│
│ Check: Does user meet USING clause? │
│ ├─→ No:  Request blocked            │
│ └─→ Yes: Continue                   │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│ Layer 3: WITH CHECK Validation      │
│ ────────────────────────────────────│
│ Check: Data meets security rules?   │
│ ├─→ No:  Request blocked            │
│ └─→ Yes: Allow operation            │
└─────────────────────────────────────┘
      ↓
┌─────────────────────────────────────┐
│ Layer 4: Execute                    │
│ ────────────────────────────────────│
│ Run the SQL operation               │
│ Return results to user              │
└─────────────────────────────────────┘
```

---

## 🛡️ Real-World Attack Scenarios

### Scenario A: Frontend Bypass Attempt

**Attacker's Goal**: Edit someone else's listing

```
Attacker modifies JavaScript in browser:
  Sends UPDATE request with user_id of target

Frontend Layer: ✅ BYPASSED (attacker modified code)

Database Layer: ❌ RLS BLOCKS
  Policy: USING (auth.uid() = user_id)
  Check: attacker_id = target_id? NO
  Result: Policy denied
```

**Outcome**: ❌ Attack FAILS

### Scenario B: Direct API Call

**Attacker's Goal**: Delete another user's listing

```
Attacker calls Supabase API directly:
  DELETE FROM listings WHERE id = "target-listing"

Frontend Layer: ✅ BYPASSED (no frontend involved)

Database Layer: ❌ RLS BLOCKS
  Policy: USING (auth.uid() = user_id)
  Check: attacker_id = listing_owner_id? NO
  Result: Policy denied
```

**Outcome**: ❌ Attack FAILS

### Scenario C: SQL Injection (Hypothetical)

**Attacker's Goal**: Access arbitrary data

```
Attacker tries SQL injection in title field:
  '; DROP TABLE listings; --

Frontend Layer: Escapes input (Supabase client handles)

Database Layer: ❌ RLS BLOCKS
  Even if injection somehow worked
  RLS policies still enforce ownership
  Can only access own data anyway
```

**Outcome**: ❌ Attack FAILS (double protected)

---

## 📊 Auth Context Flow

```
User Opens Browser
      ↓
      ├─→ No Session?
      │   ├─→ auth.uid() = NULL
      │   ├─→ Can: SELECT (public)
      │   └─→ Cannot: INSERT, UPDATE, DELETE
      │
      └─→ Has Session?
          ├─→ auth.uid() = "user-123"
          ├─→ Can: SELECT, INSERT own listings
          ├─→ Can: UPDATE own, DELETE own
          └─→ Cannot: Modify others' listings
```

---

## 🔍 Policy Evaluation Order

```
User sends query:
  SELECT * FROM listings WHERE id = "listing-1"

┌────────────────────────────────────────┐
│ Step 1: RLS Enabled?                   │
│ Check: Is RLS on for listings table?   │
│ Result: YES                            │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│ Step 2: Find Matching Policy           │
│ Operation: SELECT                      │
│ Matching Policy: listings_select_public│
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│ Step 3: Evaluate USING Clause          │
│ Condition: USING (true)                │
│ Evaluation: true = TRUE                │
│ Result: PASS                           │
└────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────┐
│ Step 4: Return Data                    │
│ Rows matching WHERE clause returned    │
│ User sees: Listing data                │
└────────────────────────────────────────┘
```

---

## 🚀 Performance Notes

RLS policies have **minimal performance impact**:

```
Query Time Comparison:

Without RLS:
  └─→ Query: 5ms
     Total: 5ms

With RLS:
  ├─→ Auth lookup: <1ms
  ├─→ Query: 5ms
  └─→ RLS policy check: <1ms
     Total: ~6ms (virtually no difference)
```

---

## 📋 Policy Summary Table

```
┌────────────────────────────────────────────────────────────┐
│ POLICY SUMMARY                                             │
├────────────────┬─────────┬──────────────┬─────────────────┤
│ Name           │ Type    │ Who Can?     │ Condition       │
├────────────────┼─────────┼──────────────┼─────────────────┤
│ select_public  │ SELECT  │ Everyone     │ true            │
│                │         │              │ (no condition)  │
├────────────────┼─────────┼──────────────┼─────────────────┤
│ insert_auth    │ INSERT  │ Logged-in    │ auth.uid() =    │
│                │         │ only         │ user_id         │
├────────────────┼─────────┼──────────────┼─────────────────┤
│ update_own     │ UPDATE  │ Owner only   │ auth.uid() =    │
│                │         │              │ user_id (both   │
│                │         │              │ USING & CHECK)  │
├────────────────┼─────────┼──────────────┼─────────────────┤
│ delete_own     │ DELETE  │ Owner only   │ auth.uid() =    │
│                │         │              │ user_id         │
└────────────────┴─────────┴──────────────┴─────────────────┘
```

---

## 🎓 Key Concepts

**USING Clause**: Read permission
```sql
-- Can I see this row?
USING (auth.uid() = user_id)
```

**WITH CHECK Clause**: Write permission
```sql
-- Can I write this row?
WITH CHECK (auth.uid() = user_id)
```

**auth.uid()**: Current user's ID
```sql
-- The logged-in user's unique identifier
-- Returns NULL if not authenticated
SELECT auth.uid();  -- Returns: "user-123"
```

**user_id Column**: Record owner
```sql
-- Every listing has owner's ID
SELECT id, title, user_id FROM listings;
-- Returns: "listing-1" | "Desk Lamp" | "user-123"
```

---

**These diagrams should help visualize how RLS protects your marketplace!**
