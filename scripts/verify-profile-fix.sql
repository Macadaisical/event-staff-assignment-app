-- Verification Script: Check Profile Creation Fix
-- Run this in Supabase SQL Editor AFTER applying the migration

-- 1. Check total users vs profiles
SELECT
  'User Account Summary' as check_name,
  (SELECT COUNT(*) FROM auth.users) AS total_auth_users,
  (SELECT COUNT(*) FROM public.profiles) AS total_profiles,
  (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.profiles p ON au.id = p.id WHERE p.id IS NULL) AS missing_profiles;

-- 2. List any users still missing profiles (should be empty)
SELECT
  'Missing Profiles' as check_name,
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- 3. Verify trigger exists
SELECT
  'Trigger Status' as check_name,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 4. Verify INSERT policy exists
SELECT
  'Profile INSERT Policy' as check_name,
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'profiles' AND cmd = 'INSERT';

-- 5. Check assignment categories for all users
SELECT
  'Assignment Categories' as check_name,
  p.email,
  COUNT(ac.category_id) as category_count
FROM public.profiles p
LEFT JOIN public.assignment_categories ac ON p.id = ac.user_id
GROUP BY p.id, p.email
ORDER BY category_count ASC, p.email;
