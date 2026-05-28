# RLS Deployment Action Plan

## 📋 Deployment Checklist

### Phase 1: Pre-Deployment Review (Today)

**Read Documentation** (20 minutes):
- [ ] Read RLS_INDEX.md for navigation guide
- [ ] Read RLS_SUMMARY.md for overview
- [ ] Review RLS_DIAGRAMS.md for visual understanding
- [ ] Understand the 4 policies and what they protect

**Understand Security Model** (15 minutes):
- [ ] Understand auth.uid() and user_id matching
- [ ] Understand USING vs WITH CHECK clauses
- [ ] Understand why each policy is needed
- [ ] Understand attack scenarios and how they're blocked

**Check Current State** (10 minutes):
- [ ] Verify Supabase project is set up correctly
- [ ] Verify listings table has user_id column
- [ ] Verify users can currently create listings
- [ ] Verify marketplace is publicly accessible

**Total Time**: ~45 minutes

---

### Phase 2: Application (Tomorrow)

**Prepare** (5 minutes):
- [ ] Have Supabase console open
- [ ] Have scripts/rls-policies.sql file ready
- [ ] Have RLS_QUICK_START.md open for reference

**Apply RLS** (5 minutes):
- [ ] Go to Supabase SQL Editor
- [ ] Create new query
- [ ] Copy entire contents of scripts/rls-policies.sql
- [ ] Click Run button
- [ ] Verify query completes successfully

**Immediate Verification** (10 minutes):
- [ ] Go to Authentication → Policies
- [ ] Select listings table
- [ ] Verify 4 policies exist:
  - [ ] `listings_select_public`
  - [ ] `listings_insert_authenticated`
  - [ ] `listings_update_own`
  - [ ] `listings_delete_own`

**Total Time**: ~20 minutes

---

### Phase 3: Testing (Same Day)

**Browser Tests** (15 minutes):
- [ ] Open marketplace /marketplace (no login) → should see listings
- [ ] Open dev console → test anonymous SELECT
- [ ] Login → create test listing → verify in dashboard
- [ ] Edit your listing → verify changes save
- [ ] Delete your listing → verify removed

**Dashboard Tests** (10 minutes):
- [ ] Login and go to /dashboard
- [ ] Should see only your listings
- [ ] Create a new listing
- [ ] Try editing → should work
- [ ] Try deleting → should work with confirmation

**Security Tests** (10 minutes):
- [ ] Follow Scenario 4-8 from RLS_VERIFICATION.md
- [ ] Test that unauthenticated insert fails
- [ ] Test that unauthorized edit fails
- [ ] Test that unauthorized delete fails
- [ ] Verify error messages are clear

**Total Time**: ~35 minutes

---

### Phase 4: Monitoring (Next 24 Hours)

**Check Supabase Logs** (5 minutes):
- [ ] Go to Logs in Supabase dashboard
- [ ] Look for "policy" or "permission" errors
- [ ] Verify no RLS violations
- [ ] Note any unexpected errors

**Test Real User Scenarios** (10 minutes):
- [ ] Create account as User A
- [ ] Create test listing
- [ ] Create account as User B
- [ ] Verify User B cannot see User A's edit controls
- [ ] Verify User B cannot edit/delete User A's listing

**Browser Console Check** (5 minutes):
- [ ] Check for any JavaScript errors
- [ ] Verify API responses are normal
- [ ] No console warnings related to RLS

**Build Verification** (2 minutes):
- [ ] Run `npm run build`
- [ ] Verify build succeeds
- [ ] Verify no TypeScript errors

**Total Time**: ~20 minutes

---

### Phase 5: Production Deployment

**Final Checks**:
- [ ] All documentation files in place
- [ ] All RLS policies applied
- [ ] All tests passing
- [ ] No errors in Supabase logs
- [ ] No errors in browser console
- [ ] Build succeeds

**Deployment**:
- [ ] Deploy your Next.js app (if not already live)
- [ ] Verify marketplace is accessible
- [ ] Verify listings can be created/edited/deleted
- [ ] Monitor Supabase logs for 30 minutes

**Post-Deployment**:
- [ ] Send to QA for testing
- [ ] Monitor error logs
- [ ] Be ready to rollback if issues
- [ ] Document any issues found

---

## 🎯 Success Criteria

After deployment, verify:

✅ **Public Access**
- Anonymous users can browse marketplace
- No login required to view listings
- Listings load without errors

✅ **Authenticated Write**
- Logged-in users can create listings
- New listings appear immediately
- user_id is automatically set

✅ **Ownership Enforcement**
- Users can only edit their own listings
- Users can only delete their own listings
- Dashboard shows only user's listings
- Error when trying to access others' data

✅ **Security**
- Unauthenticated INSERT fails
- Unauthorized UPDATE fails
- Unauthorized DELETE fails
- No privilege escalation possible

✅ **Compatibility**
- Existing frontend code works unchanged
- No TypeScript errors
- Build succeeds
- No console errors

---

## ⏰ Time Estimate

| Phase | Activity | Time | When |
|-------|----------|------|------|
| 1 | Review & Understand | 45 min | Day 1 |
| 2 | Apply RLS | 20 min | Day 2 |
| 3 | Test | 35 min | Day 2 |
| 4 | Monitor | 20 min | Day 3 |
| 5 | Deploy | Varies | Ready |

**Total Active Time**: ~2 hours  
**Total Calendar Time**: 3 days

---

## 🚨 Rollback Plan

If you need to rollback RLS:

```sql
-- Disable RLS (reverts to no enforcement)
ALTER TABLE public.listings DISABLE ROW LEVEL SECURITY;

-- This restores the previous state
-- But you lose database-level security
-- Only do this if there's a critical issue
```

⚠️ **Note**: Only rollback if you encounter a critical issue. Contact support if needed.

---

## 📞 Quick Reference During Implementation

### If Marketplace Shows No Listings
Check: `listings_select_public` policy exists
Fix: Verify USING (true) - should allow everyone

### If Cannot Create Listing
Check: `listings_insert_authenticated` policy exists
Fix: Verify logged in + user_id matches

### If Cannot Edit Own Listing
Check: `listings_update_own` policy exists
Fix: Verify you're logged in as the owner

### If See "Policy Violation" Error
This is working correctly - RLS blocked unauthorized access
Check which policy and verify your permissions

### If Build Fails
RLS SQL shouldn't affect build
Check: Database connection in .env.local
Solution: Restart development server

---

## 📚 Documentation Files Provided

```
RLS_INDEX.md              ← Navigation guide
├─ RLS_SUMMARY.md         ← Quick overview
├─ RLS_QUICK_START.md     ← How to apply
├─ RLS_POLICIES.md        ← Detailed docs
├─ RLS_VERIFICATION.md    ← Testing guide
├─ RLS_DIAGRAMS.md        ← Visual flows
└─ scripts/rls-policies.sql ← SQL to run
```

## ✅ Completion Checklist

- [ ] Completed Phase 1 (Pre-Deployment Review)
- [ ] Completed Phase 2 (Application)
- [ ] Completed Phase 3 (Testing)
- [ ] Completed Phase 4 (Monitoring)
- [ ] Completed Phase 5 (Production)
- [ ] All success criteria met
- [ ] Documentation updated
- [ ] Team informed

---

## 🎉 You're Done!

Once all phases complete, you have:

✅ Production-ready RLS enforcement  
✅ Database-level security  
✅ Public marketplace access  
✅ Authenticated user write access  
✅ Ownership-enforced operations  
✅ Zero frontend code changes  
✅ Complete documentation  
✅ Testing procedures  
✅ Monitoring setup  

**Your marketplace is now production-ready with enterprise-grade security! 🚀**
