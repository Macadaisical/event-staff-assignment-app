# Profile Creation Fix - Migration Instructions

## Problem Summary
New users could not access the database because profile records were not automatically created on signup, causing all RLS policies to block access.

## Solution Applied
Created database migration with:
1. **INSERT policy** for profiles table
2. **Automatic trigger** to create profiles on user signup
3. **Recovery logic** to fix existing broken users
4. **Enhanced error logging** in client code

## How to Apply the Fix

### Step 1: Apply the Database Migration

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of: `supabase/migrations/20251021123917_fix_profile_creation.sql`
5. Paste into the SQL editor
6. Click **Run** (or press Ctrl/Cmd + Enter)
7. Check for success message and any NOTICE messages about recovered users

**Option B: Via Supabase CLI**
```bash
cd /Users/tjjaglinski/Desktop/Apps/Event_Assignments_Codex/event-staff-app
supabase db push
```

### Step 2: Verify the Fix

1. In Supabase SQL Editor, run the verification script:
   - Copy contents of `scripts/verify-profile-fix.sql`
   - Paste and run in SQL Editor
   - Check results:
     - `missing_profiles` should be **0**
     - Trigger `on_auth_user_created` should exist
     - INSERT policy should exist for profiles
     - All users should have 8 assignment categories

2. Test with the affected user:
   - Have them log out completely
   - Clear browser cache/cookies (or use incognito)
   - Log back in
   - Should now see all data and be able to create events

### Step 3: Deploy Client-Side Changes

The enhanced error logging in `auth-provider.tsx` will help diagnose future issues:

```bash
# Build and deploy to Vercel
npm run build
git add .
git commit -m "fix: Add automatic profile creation trigger and recovery for existing users"
git push origin Additional-Features
```

## What the Migration Does

### 1. Adds Missing INSERT Policy
```sql
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
```
Without this, users couldn't create their own profile records.

### 2. Creates Automatic Trigger
- **Function**: `handle_new_user()` - Runs when user signs up
- **Trigger**: `on_auth_user_created` - Calls function on INSERT to `auth.users`
- **Actions**:
  - Creates profile record
  - Adds 8 default assignment categories
  - All happens automatically in database

### 3. Recovers Existing Broken Users
- Finds auth.users without matching profiles
- Creates missing profiles
- Adds default categories
- Shows NOTICE messages for each recovered user

## Testing Checklist

- [ ] Migration runs without errors
- [ ] Verification script shows 0 missing profiles
- [ ] Trigger exists in database
- [ ] INSERT policy exists for profiles
- [ ] Affected user can log in and see data
- [ ] Affected user can create new events
- [ ] New user signup creates profile automatically
- [ ] Browser console shows detailed error logging

## Rollback (if needed)

If something goes wrong, you can rollback with:

```sql
-- Remove trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Remove function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Remove policy (optional - this is actually helpful to keep)
-- DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
```

## Future Prevention

✅ **Going forward**, all new users will automatically get:
- Profile record in `public.profiles`
- 8 default assignment categories
- Full database access via RLS policies

✅ **No manual intervention needed** - the trigger handles everything

## Troubleshooting

**If user still can't access data after migration:**

1. Check browser console for errors (enhanced logging added)
2. Verify user has profile:
   ```sql
   SELECT * FROM public.profiles WHERE email = 'user@example.com';
   ```
3. Check assignment categories:
   ```sql
   SELECT * FROM public.assignment_categories
   WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'user@example.com');
   ```
4. Manually create profile if needed:
   ```sql
   INSERT INTO public.profiles (id, email, full_name, role)
   VALUES (
     (SELECT id FROM auth.users WHERE email = 'user@example.com'),
     'user@example.com',
     'User Name',
     'coordinator'
   );
   ```

## Questions?

Check the verification script results first. If issues persist, review:
- Supabase logs for error messages
- Browser console for client-side errors
- RLS policies are enabled on all tables
