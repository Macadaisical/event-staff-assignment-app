-- Fix automatic profile creation for new users
-- This migration addresses the critical issue where new users cannot access the database
-- because their profile record is not automatically created on signup.

-- Step 1: Add missing INSERT policy for profiles table (if not exists)
-- Without this, users cannot create their own profile records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
    AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile" ON public.profiles
      FOR INSERT WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Step 2: Create function to handle new user registration
-- This function automatically creates a profile record when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert new profile record
  INSERT INTO public.profiles (id, email, full_name, organization, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
    NULL,
    'coordinator'
  );

  -- Insert default assignment categories for new user
  INSERT INTO public.assignment_categories (user_id, category_name, description)
  SELECT
    NEW.id,
    category,
    'Default assignment category'
  FROM (
    VALUES
      ('Equipment Operator'),
      ('Safety Monitor'),
      ('Setup/Breakdown'),
      ('Crowd Control'),
      ('Communications'),
      ('First Aid'),
      ('General Support'),
      ('Technical Support')
  ) AS t(category);

  RETURN NEW;
END;
$$;

-- Step 3: Create trigger to automatically call handle_new_user on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Fix existing users who are missing profile records
-- This recovers any users who signed up before this fix was applied
DO $$
DECLARE
  user_record RECORD;
BEGIN
  -- Find auth.users without corresponding profiles
  FOR user_record IN
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
  LOOP
    -- Create missing profile
    INSERT INTO public.profiles (id, email, full_name, organization, role)
    VALUES (
      user_record.id,
      user_record.email,
      COALESCE(user_record.raw_user_meta_data->>'full_name', SPLIT_PART(user_record.email, '@', 1)),
      NULL,
      'coordinator'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Create default assignment categories for recovered user
    INSERT INTO public.assignment_categories (user_id, category_name, description)
    SELECT
      user_record.id,
      category,
      'Default assignment category'
    FROM (
      VALUES
        ('Equipment Operator'),
        ('Safety Monitor'),
        ('Setup/Breakdown'),
        ('Crowd Control'),
        ('Communications'),
        ('First Aid'),
        ('General Support'),
        ('Technical Support')
    ) AS t(category)
    ON CONFLICT (user_id, category_name) DO NOTHING;

    RAISE NOTICE 'Recovered profile for user: %', user_record.email;
  END LOOP;
END $$;

-- Verification query (comment out for production)
-- SELECT
--   (SELECT COUNT(*) FROM auth.users) AS total_auth_users,
--   (SELECT COUNT(*) FROM public.profiles) AS total_profiles,
--   (SELECT COUNT(*) FROM auth.users au LEFT JOIN public.profiles p ON au.id = p.id WHERE p.id IS NULL) AS missing_profiles;
