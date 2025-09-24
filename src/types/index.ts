// Core data types based on ERD schema

export interface Event {
  event_id: string;
  event_name: string;
  event_date: string; // ISO date string
  location: string;
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  team_meet_time: string; // HH:MM format
  meet_location: string;
  prepared_by: string;
  prepared_date: string; // ISO date string
  notes?: string;
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
  assignment_type: string;
  equipment_area: string;
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  notes?: string;
  sort_order: number;
}

export interface TrafficControl {
  traffic_id: string;
  event_id: string;
  member_id: string;
  patrol_vehicle: string;
  area_assignment: string;
  sort_order: number;
}

export interface Supervisor {
  supervisor_id: string;
  event_id: string;
  supervisor_name: string;
}

// UI-specific types
export interface EventFormData extends Omit<Event, 'event_id' | 'created_at'> {
  supervisors: Omit<Supervisor, 'supervisor_id' | 'event_id'>[];
  team_assignments: Omit<TeamAssignment, 'assignment_id' | 'event_id'>[];
  traffic_controls: Omit<TrafficControl, 'traffic_id' | 'event_id'>[];
}

// Common types
export type AssignmentCategory =
  | 'Equipment Operator'
  | 'Safety Monitor'
  | 'Setup/Breakdown'
  | 'Crowd Control'
  | 'Communications'
  | 'First Aid'
  | 'General Support'
  | 'Technical Support';

export interface SelectOption {
  value: string;
  label: string;
}

// Store states
export interface AppStore {
  // Events
  events: Event[];
  currentEvent: Event | null;
  isEventLoading: boolean;

  // Team Members
  teamMembers: TeamMember[];
  isTeamMembersLoading: boolean;

  // Assignment Categories
  assignmentCategories: AssignmentCategory[];

  // Assignments and Controls
  teamAssignments: TeamAssignment[];
  trafficControls: TrafficControl[];
  supervisors: Supervisor[];

  // Event Actions
  setEvents: (events: Event[]) => void;
  setCurrentEvent: (event: Event | null) => void;
  addEvent: (event: Event) => void;
  updateEvent: (event: Event) => void;
  deleteEvent: (eventId: string) => void;

  // Team Member Actions
  setTeamMembers: (members: TeamMember[]) => void;
  addTeamMember: (member: TeamMember) => void;
  updateTeamMember: (member: TeamMember) => void;
  deleteTeamMember: (memberId: string) => void;

  // Assignment Actions
  setTeamAssignments: (assignments: TeamAssignment[]) => void;
  addTeamAssignments: (eventId: string, assignments: TeamAssignment[]) => void;
  getTeamAssignments: (eventId: string) => TeamAssignment[];

  // Traffic Control Actions
  setTrafficControls: (controls: TrafficControl[]) => void;
  addTrafficControls: (eventId: string, controls: TrafficControl[]) => void;
  getTrafficControls: (eventId: string) => TrafficControl[];

  // Supervisor Actions
  setSupervisors: (supervisors: Supervisor[]) => void;
  addSupervisors: (eventId: string, supervisors: Supervisor[]) => void;
  getSupervisors: (eventId: string) => Supervisor[];

  // Loading States
  setIsEventLoading: (loading: boolean) => void;
  setIsTeamMembersLoading: (loading: boolean) => void;
}