// Core data types based on ERD schema

export interface Event {
  event_id: string;
  event_name: string;
  event_date: string | null; // ISO date string
  location: string | null;
  start_time: string | null; // HH:MM format
  end_time: string | null; // HH:MM format
  team_meet_time: string | null; // HH:MM format
  meet_location: string | null;
  prepared_by: string | null;
  prepared_date: string | null; // ISO date string
  notes?: string | null;
  created_at: string; // ISO datetime string
}

export interface TeamMember {
  member_id: string;
  member_name: string;
  active: boolean;
}

export interface TeamAssignment {
  assignment_id: string;
  event_id: string;
  member_id: string;
  assignment_type: string | null;
  equipment_area: string | null;
  start_time: string | null; // HH:MM format
  end_time: string | null; // HH:MM format
  notes?: string | null;
  sort_order: number;
}

export interface TrafficControl {
  traffic_id: string;
  event_id: string;
  member_id: string | null;
  staff_name: string | null;
  patrol_vehicle: string | null;
  area_assignment: string | null;
  sort_order: number;
}

export interface Supervisor {
  supervisor_id: string;
  event_id: string;
  supervisor_name: string;
  phone: string | null;
  email: string | null;
  sort_order?: number | null;
}

export type TaskStatus = 'Not Started' | 'In Progress' | 'Completed';

export interface EventTask {
  task_id: string;
  event_id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  due_date: string | null; // ISO date string
  due_time: string | null; // HH:MM format
  assignee_id: string | null;
  category_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface TaskCategory {
  category_id: string;
  user_id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// UI-specific types
export interface EventFormData extends Omit<Event, 'event_id' | 'created_at'> {
  supervisors: Omit<Supervisor, 'supervisor_id' | 'event_id'>[];
  team_assignments: Omit<TeamAssignment, 'assignment_id' | 'event_id'>[];
  traffic_controls: Omit<TrafficControl, 'traffic_id' | 'event_id'>[];
}

// Common types
export type AssignmentCategory = string;

export interface SelectOption {
  value: string;
  label: string;
}
