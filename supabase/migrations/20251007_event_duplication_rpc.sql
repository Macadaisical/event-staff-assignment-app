-- Event Duplication RPC for Phase 4
-- Creates a complete copy of an event with all related records

CREATE OR REPLACE FUNCTION duplicate_event_with_tasks(
  p_event_id UUID,
  p_new_event_name TEXT,
  p_date_offset_days INTEGER DEFAULT 0
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_event_id UUID;
  v_user_id UUID;
  v_original_event_date DATE;
  v_new_event_date DATE;
  v_new_prepared_date DATE;
  v_supervisor_record RECORD;
  v_assignment_record RECORD;
  v_traffic_record RECORD;
  v_task_record RECORD;
BEGIN
  -- Get user_id and original event date
  SELECT user_id, event_date
  INTO v_user_id, v_original_event_date
  FROM public.events
  WHERE event_id = p_event_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found: %', p_event_id;
  END IF;

  -- Calculate new dates
  v_new_event_date := v_original_event_date + (p_date_offset_days || ' days')::INTERVAL;
  v_new_prepared_date := CURRENT_DATE;

  -- Create new event
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
  SELECT
    user_id,
    p_new_event_name,
    v_new_event_date,
    location,
    start_time,
    end_time,
    team_meet_time,
    meet_location,
    prepared_by,
    v_new_prepared_date,
    CASE
      WHEN notes IS NOT NULL THEN 'Duplicated from: ' || event_name || E'\n\n' || notes
      ELSE 'Duplicated from: ' || event_name
    END
  FROM public.events
  WHERE event_id = p_event_id
  RETURNING event_id INTO v_new_event_id;

  -- Duplicate supervisors
  FOR v_supervisor_record IN
    SELECT supervisor_name, phone, email, sort_order
    FROM public.supervisors
    WHERE event_id = p_event_id
    ORDER BY sort_order
  LOOP
    INSERT INTO public.supervisors (event_id, supervisor_name, phone, email, sort_order)
    VALUES (v_new_event_id, v_supervisor_record.supervisor_name, v_supervisor_record.phone,
            v_supervisor_record.email, v_supervisor_record.sort_order);
  END LOOP;

  -- Duplicate team assignments
  FOR v_assignment_record IN
    SELECT member_id, assignment_type, equipment_area, start_time, end_time, notes, sort_order
    FROM public.team_assignments
    WHERE event_id = p_event_id
    ORDER BY sort_order
  LOOP
    INSERT INTO public.team_assignments (event_id, member_id, assignment_type, equipment_area,
                                         start_time, end_time, notes, sort_order)
    VALUES (v_new_event_id, v_assignment_record.member_id, v_assignment_record.assignment_type,
            v_assignment_record.equipment_area, v_assignment_record.start_time,
            v_assignment_record.end_time, v_assignment_record.notes, v_assignment_record.sort_order);
  END LOOP;

  -- Duplicate traffic control
  FOR v_traffic_record IN
    SELECT member_id, staff_name, patrol_vehicle, area_assignment, sort_order
    FROM public.traffic_control
    WHERE event_id = p_event_id
    ORDER BY sort_order
  LOOP
    INSERT INTO public.traffic_control (event_id, member_id, staff_name, patrol_vehicle,
                                        area_assignment, sort_order)
    VALUES (v_new_event_id, v_traffic_record.member_id, v_traffic_record.staff_name,
            v_traffic_record.patrol_vehicle, v_traffic_record.area_assignment,
            v_traffic_record.sort_order);
  END LOOP;

  -- Duplicate event tasks with date offset
  FOR v_task_record IN
    SELECT title, description, assignee_id, category_id, due_date, due_time, sort_order
    FROM public.event_tasks
    WHERE event_id = p_event_id
    ORDER BY sort_order
  LOOP
    INSERT INTO public.event_tasks (
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
    VALUES (
      v_new_event_id,
      v_user_id,
      v_task_record.title,
      v_task_record.description,
      'Not Started', -- Reset all tasks to Not Started
      CASE
        WHEN v_task_record.due_date IS NOT NULL
        THEN v_task_record.due_date + (p_date_offset_days || ' days')::INTERVAL
        ELSE NULL
      END,
      v_task_record.due_time,
      v_task_record.assignee_id,
      v_task_record.category_id,
      v_task_record.sort_order
    );
  END LOOP;

  RETURN v_new_event_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION duplicate_event_with_tasks(UUID, TEXT, INTEGER) TO authenticated;

-- Comment
COMMENT ON FUNCTION duplicate_event_with_tasks IS 'Duplicates an event with all related records (supervisors, assignments, traffic, tasks). Tasks are reset to Not Started status.';
