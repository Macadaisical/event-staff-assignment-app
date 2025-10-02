-- Phase 1: Event task foundations
-- Creates event task and task category tables, supporting policies, and duplication helper.

-- Ensure task status enum exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'event_task_status') THEN
    CREATE TYPE public.event_task_status AS ENUM ('Not Started', 'In Progress', 'Completed');
  END IF;
END
$$;

-- Task categories table
CREATE TABLE IF NOT EXISTS public.task_categories (
  category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#2563EB',
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT task_categories_unique_name UNIQUE (user_id, name),
  CONSTRAINT task_categories_color_format CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

ALTER TABLE public.task_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Task categories are visible to owners" ON public.task_categories
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Task categories insert restricted to owner" ON public.task_categories
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Task categories update restricted to owner" ON public.task_categories
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Task categories delete restricted to owner" ON public.task_categories
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS task_categories_user_id_idx ON public.task_categories (user_id, sort_order);

DROP TRIGGER IF EXISTS update_task_categories_updated_at ON public.task_categories;

CREATE TRIGGER update_task_categories_updated_at
  BEFORE UPDATE ON public.task_categories
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Event tasks table
CREATE TABLE IF NOT EXISTS public.event_tasks (
  task_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(event_id) ON DELETE CASCADE,
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status public.event_task_status NOT NULL DEFAULT 'Not Started',
  due_date DATE,
  due_time TIME WITHOUT TIME ZONE,
  assignee_id UUID REFERENCES public.team_members(member_id) ON DELETE SET NULL,
  category_id UUID REFERENCES public.task_categories(category_id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE public.event_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event tasks visible to owners" ON public.event_tasks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Event tasks insert restricted to owner" ON public.event_tasks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Event tasks update restricted to owner" ON public.event_tasks
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Event tasks delete restricted to owner" ON public.event_tasks
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS event_tasks_event_id_idx ON public.event_tasks (event_id, sort_order);
CREATE INDEX IF NOT EXISTS event_tasks_assignee_idx ON public.event_tasks (assignee_id);
CREATE INDEX IF NOT EXISTS event_tasks_category_idx ON public.event_tasks (category_id);
CREATE INDEX IF NOT EXISTS event_tasks_status_idx ON public.event_tasks (status);

DROP TRIGGER IF EXISTS update_event_tasks_updated_at ON public.event_tasks;

CREATE TRIGGER update_event_tasks_updated_at
  BEFORE UPDATE ON public.event_tasks
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Event duplication helper
CREATE OR REPLACE FUNCTION public.duplicate_event_with_children(
  source_event_id UUID,
  target_event_date DATE DEFAULT NULL,
  target_event_name TEXT DEFAULT NULL,
  due_date_offset INTEGER DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID := auth.uid();
  source_event public.events%ROWTYPE;
  new_event_id UUID;
BEGIN
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT *
    INTO source_event
    FROM public.events
   WHERE event_id = source_event_id
     AND user_id = current_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found or access denied';
  END IF;

  INSERT INTO public.events (
    user_id,
    event_name,
    event_date,
    location,
    start_time,
    end_time,
    team_meet_time,
    meet_location,
    prepared_by,
    prepared_date,
    notes
  )
  VALUES (
    current_user_id,
    COALESCE(target_event_name, source_event.event_name),
    COALESCE(target_event_date, source_event.event_date),
    source_event.location,
    source_event.start_time,
    source_event.end_time,
    source_event.team_meet_time,
    source_event.meet_location,
    source_event.prepared_by,
    COALESCE(target_event_date, source_event.prepared_date),
    source_event.notes
  )
  RETURNING event_id INTO new_event_id;

  -- Duplicate supervisors
  INSERT INTO public.supervisors (
    supervisor_id,
    event_id,
    supervisor_name,
    phone,
    email,
    sort_order
  )
  SELECT
    uuid_generate_v4(),
    new_event_id,
    supervisor_name,
    phone,
    email,
    sort_order
  FROM public.supervisors
  WHERE event_id = source_event.event_id;

  -- Duplicate team assignments
  INSERT INTO public.team_assignments (
    assignment_id,
    event_id,
    member_id,
    assignment_type,
    equipment_area,
    start_time,
    end_time,
    notes,
    sort_order
  )
  SELECT
    uuid_generate_v4(),
    new_event_id,
    member_id,
    assignment_type,
    equipment_area,
    start_time,
    end_time,
    notes,
    sort_order
  FROM public.team_assignments
  WHERE event_id = source_event.event_id;

  -- Duplicate traffic controls
  INSERT INTO public.traffic_controls (
    traffic_id,
    event_id,
    member_id,
    staff_name,
    patrol_vehicle,
    area_assignment,
    sort_order
  )
  SELECT
    uuid_generate_v4(),
    new_event_id,
    member_id,
    staff_name,
    patrol_vehicle,
    area_assignment,
    sort_order
  FROM public.traffic_controls
  WHERE event_id = source_event.event_id;

  -- Duplicate event tasks
  INSERT INTO public.event_tasks (
    task_id,
    event_id,
    user_id,
    title,
    description,
    status,
    due_date,
    due_time,
    assignee_id,
    category_id,
    sort_order
  )
  SELECT
    uuid_generate_v4(),
    new_event_id,
    current_user_id,
    title,
    description,
    status,
    CASE
      WHEN due_date IS NOT NULL AND due_date_offset IS NOT NULL THEN due_date + due_date_offset
      ELSE due_date
    END,
    due_time,
    assignee_id,
    category_id,
    sort_order
  FROM public.event_tasks
  WHERE event_id = source_event.event_id
    AND user_id = current_user_id;

  RETURN new_event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.duplicate_event_with_children(UUID, DATE, TEXT, INTEGER) TO authenticated;
