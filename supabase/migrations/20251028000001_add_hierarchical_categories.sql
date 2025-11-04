-- Migration: Add Hierarchical Assignment Categories
-- Date: 2025-10-28
-- Description: Enhances assignment_categories table to support parent-child relationships

-- Step 1: Add new columns to assignment_categories table
ALTER TABLE public.assignment_categories
  ADD COLUMN IF NOT EXISTS parent_category_id UUID REFERENCES public.assignment_categories(category_id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Step 2: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assignment_categories_user_id
  ON public.assignment_categories(user_id);

CREATE INDEX IF NOT EXISTS idx_assignment_categories_parent_id
  ON public.assignment_categories(parent_category_id);

CREATE INDEX IF NOT EXISTS idx_assignment_categories_sort_order
  ON public.assignment_categories(sort_order);

CREATE INDEX IF NOT EXISTS idx_assignment_categories_active
  ON public.assignment_categories(is_active) WHERE is_active = true;

-- Step 3: Update unique constraint to allow same name under different parents
ALTER TABLE public.assignment_categories
  DROP CONSTRAINT IF EXISTS assignment_categories_user_id_category_name_key;

-- Add new composite unique constraint
ALTER TABLE public.assignment_categories
  ADD CONSTRAINT assignment_categories_user_category_parent_unique
  UNIQUE (user_id, category_name, COALESCE(parent_category_id, '00000000-0000-0000-0000-000000000000'::uuid));

-- Step 4: Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_assignment_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create trigger
DROP TRIGGER IF EXISTS update_assignment_categories_updated_at_trigger ON public.assignment_categories;

CREATE TRIGGER update_assignment_categories_updated_at_trigger
  BEFORE UPDATE ON public.assignment_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_assignment_categories_updated_at();

-- Step 6: Add check constraint to prevent circular references (max 2 levels)
CREATE OR REPLACE FUNCTION check_category_depth()
RETURNS TRIGGER AS $$
DECLARE
  parent_has_parent BOOLEAN;
BEGIN
  -- If this is a root category (no parent), allow it
  IF NEW.parent_category_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if parent has a parent (would create 3rd level)
  SELECT EXISTS (
    SELECT 1
    FROM public.assignment_categories
    WHERE category_id = NEW.parent_category_id
      AND parent_category_id IS NOT NULL
  ) INTO parent_has_parent;

  IF parent_has_parent THEN
    RAISE EXCEPTION 'Categories can only be nested 2 levels deep (parent and child)';
  END IF;

  -- Prevent circular reference
  IF NEW.category_id = NEW.parent_category_id THEN
    RAISE EXCEPTION 'Category cannot be its own parent';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS check_category_depth_trigger ON public.assignment_categories;

CREATE TRIGGER check_category_depth_trigger
  BEFORE INSERT OR UPDATE ON public.assignment_categories
  FOR EACH ROW
  EXECUTE FUNCTION check_category_depth();

-- Step 7: Add comment for documentation
COMMENT ON COLUMN public.assignment_categories.parent_category_id IS
  'References parent category for hierarchical structure. NULL for root categories.';

COMMENT ON COLUMN public.assignment_categories.sort_order IS
  'Controls display order within same parent. Lower numbers appear first.';

COMMENT ON COLUMN public.assignment_categories.is_active IS
  'Soft delete flag. Inactive categories are hidden but preserved for historical data.';

-- Step 8: Update RLS policies (if needed)
-- Note: Existing RLS policies should still work, but we can add more specific ones if needed

-- Optional: Create a view for easy hierarchy queries
CREATE OR REPLACE VIEW assignment_categories_hierarchy AS
SELECT
  c.category_id,
  c.user_id,
  c.category_name,
  c.parent_category_id,
  c.sort_order,
  c.is_active,
  c.created_at,
  c.updated_at,
  p.category_name as parent_category_name,
  CASE
    WHEN c.parent_category_id IS NULL THEN 0
    ELSE 1
  END as depth_level
FROM public.assignment_categories c
LEFT JOIN public.assignment_categories p ON c.parent_category_id = p.category_id
WHERE c.is_active = true
ORDER BY
  COALESCE(p.sort_order, c.sort_order),
  c.sort_order,
  c.category_name;

-- Grant permissions on view
GRANT SELECT ON assignment_categories_hierarchy TO authenticated;

-- Step 9: Migrate existing data
-- Set all existing categories as root categories (parent_category_id = NULL)
-- They already have NULL, but let's ensure sort_order is set
UPDATE public.assignment_categories
SET
  sort_order = COALESCE(sort_order, 0),
  is_active = COALESCE(is_active, true),
  updated_at = COALESCE(updated_at, NOW())
WHERE sort_order IS NULL OR is_active IS NULL OR updated_at IS NULL;

-- Step 10: Add sample data for testing (optional - comment out for production)
-- This creates example hierarchical categories for testing
/*
INSERT INTO public.assignment_categories (user_id, category_name, parent_category_id, sort_order, is_active)
SELECT
  user_id,
  'Technical Support' as category_name,
  NULL as parent_category_id,
  1 as sort_order,
  true as is_active
FROM public.profiles
LIMIT 1
ON CONFLICT DO NOTHING;

-- Add child categories (would need to get the category_id from above insert)
*/
