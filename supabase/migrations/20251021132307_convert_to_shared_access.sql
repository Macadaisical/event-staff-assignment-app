-- Convert from Multi-Tenant to Single Shared Organization
-- This migration changes the app from isolated per-user data to shared organization-wide access
-- All authenticated users can now view and edit all data

-- ============================================================================
-- STEP 1: Drop existing restrictive RLS policies
-- ============================================================================

-- Events policies
DROP POLICY IF EXISTS "Users can view own events" ON public.events;
DROP POLICY IF EXISTS "Users can insert own events" ON public.events;
DROP POLICY IF EXISTS "Users can update own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete own events" ON public.events;

-- Team Members policies
DROP POLICY IF EXISTS "Users can view own team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can insert own team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can update own team members" ON public.team_members;
DROP POLICY IF EXISTS "Users can delete own team members" ON public.team_members;

-- Assignment Categories policies
DROP POLICY IF EXISTS "Users can view own categories" ON public.assignment_categories;
DROP POLICY IF EXISTS "Users can insert own categories" ON public.assignment_categories;
DROP POLICY IF EXISTS "Users can update own categories" ON public.assignment_categories;
DROP POLICY IF EXISTS "Users can delete own categories" ON public.assignment_categories;

-- Task Categories policies
DROP POLICY IF EXISTS "Task categories are visible to owners" ON public.task_categories;
DROP POLICY IF EXISTS "Task categories insert restricted to owner" ON public.task_categories;
DROP POLICY IF EXISTS "Task categories update restricted to owner" ON public.task_categories;
DROP POLICY IF EXISTS "Task categories delete restricted to owner" ON public.task_categories;

-- Event Tasks policies
DROP POLICY IF EXISTS "Event tasks visible to owners" ON public.event_tasks;
DROP POLICY IF EXISTS "Event tasks insert restricted to owner" ON public.event_tasks;
DROP POLICY IF EXISTS "Event tasks update restricted to owner" ON public.event_tasks;
DROP POLICY IF EXISTS "Event tasks delete restricted to owner" ON public.event_tasks;

-- Team Assignments policies
DROP POLICY IF EXISTS "Users can view assignments for own events" ON public.team_assignments;
DROP POLICY IF EXISTS "Users can insert assignments for own events" ON public.team_assignments;
DROP POLICY IF EXISTS "Users can update assignments for own events" ON public.team_assignments;
DROP POLICY IF EXISTS "Users can delete assignments for own events" ON public.team_assignments;

-- Traffic Controls policies
DROP POLICY IF EXISTS "Users can view traffic controls for own events" ON public.traffic_controls;
DROP POLICY IF EXISTS "Users can insert traffic controls for own events" ON public.traffic_controls;
DROP POLICY IF EXISTS "Users can update traffic controls for own events" ON public.traffic_controls;
DROP POLICY IF EXISTS "Users can delete traffic controls for own events" ON public.traffic_controls;

-- Supervisors policies
DROP POLICY IF EXISTS "Users can view supervisors for own events" ON public.supervisors;
DROP POLICY IF EXISTS "Users can insert supervisors for own events" ON public.supervisors;
DROP POLICY IF EXISTS "Users can update supervisors for own events" ON public.supervisors;
DROP POLICY IF EXISTS "Users can delete supervisors for own events" ON public.supervisors;

-- ============================================================================
-- STEP 2: Create new shared access policies (any authenticated user can access all data)
-- ============================================================================

-- Events: All authenticated users can do everything
CREATE POLICY "Authenticated users can view all events" ON public.events
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update all events" ON public.events
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all events" ON public.events
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Team Members: All authenticated users can do everything
CREATE POLICY "Authenticated users can view all team members" ON public.team_members
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert team members" ON public.team_members
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update all team members" ON public.team_members
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all team members" ON public.team_members
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Assignment Categories: All authenticated users can do everything
CREATE POLICY "Authenticated users can view all categories" ON public.assignment_categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert categories" ON public.assignment_categories
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update all categories" ON public.assignment_categories
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all categories" ON public.assignment_categories
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Task Categories: All authenticated users can do everything
CREATE POLICY "Authenticated users can view all task categories" ON public.task_categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert task categories" ON public.task_categories
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update all task categories" ON public.task_categories
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all task categories" ON public.task_categories
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Event Tasks: All authenticated users can do everything
CREATE POLICY "Authenticated users can view all event tasks" ON public.event_tasks
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert event tasks" ON public.event_tasks
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update all event tasks" ON public.event_tasks
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all event tasks" ON public.event_tasks
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Team Assignments: All authenticated users can do everything
CREATE POLICY "Authenticated users can view all assignments" ON public.team_assignments
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert assignments" ON public.team_assignments
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update all assignments" ON public.team_assignments
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all assignments" ON public.team_assignments
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Traffic Controls: All authenticated users can do everything
CREATE POLICY "Authenticated users can view all traffic controls" ON public.traffic_controls
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert traffic controls" ON public.traffic_controls
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update all traffic controls" ON public.traffic_controls
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all traffic controls" ON public.traffic_controls
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- Supervisors: All authenticated users can do everything
CREATE POLICY "Authenticated users can view all supervisors" ON public.supervisors
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert supervisors" ON public.supervisors
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update all supervisors" ON public.supervisors
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete all supervisors" ON public.supervisors
  FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- user_id columns are kept in tables for audit trail purposes (tracking who created what)
-- but are no longer used for access control filtering
--
-- All authenticated users now share the same data pool
-- This creates a single-organization collaborative environment
--
-- To revert to per-user isolation, you would need to:
-- 1. Re-apply the original restrictive RLS policies
-- 2. Update client queries to filter by user_id
