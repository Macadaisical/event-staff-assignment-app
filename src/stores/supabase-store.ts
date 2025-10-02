import { create } from 'zustand';
import { supabase as supabaseClient } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const supabase = supabaseClient as any;
import type {
  Event,
  TeamMember,
  TeamAssignment,
  TrafficControl,
  Supervisor,
  AssignmentCategory,
  EventTask,
  TaskCategory,
  TaskStatus,
} from '@/types';

// Database row types
type EventRow = Database['public']['Tables']['events']['Row'];
type TeamMemberRow = Database['public']['Tables']['team_members']['Row'];
type TeamAssignmentRow = Database['public']['Tables']['team_assignments']['Row'];
type TrafficControlRow = Database['public']['Tables']['traffic_controls']['Row'];
type SupervisorRow = Database['public']['Tables']['supervisors']['Row'];
type TaskCategoryRow = Database['public']['Tables']['task_categories']['Row'];
type EventTaskRow = Database['public']['Tables']['event_tasks']['Row'];

const DEFAULT_LOCATION = 'Location TBD';
const DEFAULT_MEET_LOCATION = 'Meet TBD';
const DEFAULT_PREPARED_BY = 'Unassigned';
const DEFAULT_TIME = '00:00';
const DEFAULT_ASSIGNMENT_TYPE = 'General Support';
const DEFAULT_EQUIPMENT_AREA = 'Assignment TBD';
const DEFAULT_PATROL_VEHICLE = 'Vehicle TBD';
const DEFAULT_AREA_ASSIGNMENT = 'Area TBD';
const DEFAULT_ASSIGNMENT_CATEGORIES: AssignmentCategory[] = [
  'Equipment Operator',
  'Safety Monitor',
  'Setup/Breakdown',
  'Crowd Control',
  'Communications',
  'First Aid',
  'General Support',
  'Technical Support',
];
const DEFAULT_TASK_COLOR = '#2563EB';
const DEFAULT_TASK_STATUS: TaskStatus = 'Not Started';

const normalizeCategoryName = (value: string): string => value.trim().replace(/\s+/g, ' ');
const dedupeAndSortCategories = (categories: string[]): string[] => {
  const unique: string[] = [];
  categories.forEach((name) => {
    const normalized = normalizeCategoryName(name);
    if (!normalized) {
      return;
    }
    if (!unique.some((existing) => existing.toLowerCase() === normalized.toLowerCase())) {
      unique.push(normalized);
    }
  });
  return unique.sort((a, b) => a.localeCompare(b));
};

const normalizeDbText = (value: string | null, fallback: string): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed === fallback ? null : trimmed;
};

const normalizeDbTime = (value: string | null): string | null => {
  if (!value) return null;
  return value === '00:00' || value === '00:00:00' ? null : value;
};

const prepareTextForDb = (value: string | null | undefined, fallback: string): string => {
  if (!value) return fallback;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback;
};

const prepareTimeForDb = (value: string | null | undefined, fallback: string = DEFAULT_TIME): string => {
  if (!value) return fallback;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback;
};

// Conversion functions from database rows to app types
const dbEventToEvent = (dbEvent: EventRow): Event => ({
  event_id: dbEvent.event_id,
  event_name: dbEvent.event_name,
  event_date: dbEvent.event_date,
  location: normalizeDbText(dbEvent.location, DEFAULT_LOCATION),
  start_time: normalizeDbTime(dbEvent.start_time),
  end_time: normalizeDbTime(dbEvent.end_time),
  team_meet_time: normalizeDbTime(dbEvent.team_meet_time),
  meet_location: normalizeDbText(dbEvent.meet_location, DEFAULT_MEET_LOCATION),
  prepared_by: normalizeDbText(dbEvent.prepared_by, DEFAULT_PREPARED_BY),
  prepared_date: dbEvent.prepared_date,
  notes: dbEvent.notes,
  created_at: dbEvent.created_at,
});

const dbTeamMemberToTeamMember = (dbMember: TeamMemberRow): TeamMember => ({
  member_id: dbMember.member_id,
  member_name: dbMember.member_name,
  active: dbMember.active,
});

const dbTeamAssignmentToTeamAssignment = (dbAssignment: TeamAssignmentRow): TeamAssignment => ({
  assignment_id: dbAssignment.assignment_id,
  event_id: dbAssignment.event_id,
  member_id: dbAssignment.member_id,
  assignment_type: dbAssignment.assignment_type,
  equipment_area: normalizeDbText(dbAssignment.equipment_area, DEFAULT_EQUIPMENT_AREA),
  start_time: normalizeDbTime(dbAssignment.start_time),
  end_time: normalizeDbTime(dbAssignment.end_time),
  notes: dbAssignment.notes,
  sort_order: dbAssignment.sort_order,
});

const dbTrafficControlToTrafficControl = (dbControl: TrafficControlRow): TrafficControl => ({
  traffic_id: dbControl.traffic_id,
  event_id: dbControl.event_id,
  member_id: dbControl.member_id ?? null,
  staff_name: dbControl.staff_name ?? null,
  patrol_vehicle: normalizeDbText(dbControl.patrol_vehicle, DEFAULT_PATROL_VEHICLE),
  area_assignment: normalizeDbText(dbControl.area_assignment, DEFAULT_AREA_ASSIGNMENT),
  sort_order: dbControl.sort_order,
});

const dbSupervisorToSupervisor = (dbSupervisor: SupervisorRow): Supervisor => ({
  supervisor_id: dbSupervisor.supervisor_id,
  event_id: dbSupervisor.event_id,
  supervisor_name: dbSupervisor.supervisor_name,
  phone: dbSupervisor.phone,
  email: dbSupervisor.email,
  sort_order: dbSupervisor.sort_order ?? null,
});

const normalizeHexColor = (value: string | null | undefined): string => {
  if (!value) return DEFAULT_TASK_COLOR;
  const trimmed = value.trim();
  return /^#[0-9A-Fa-f]{6}$/.test(trimmed) ? trimmed.toUpperCase() : DEFAULT_TASK_COLOR;
};

const formatTimeString = (value: string | null): string | null => {
  if (!value) return null;
  return value.length >= 5 ? value.slice(0, 5) : value;
};

const dbTaskCategoryToTaskCategory = (row: TaskCategoryRow): TaskCategory => ({
  category_id: row.category_id,
  user_id: row.user_id,
  name: row.name,
  color: normalizeHexColor(row.color),
  sort_order: row.sort_order,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const dbEventTaskToEventTask = (row: EventTaskRow): EventTask => ({
  task_id: row.task_id,
  event_id: row.event_id,
  user_id: row.user_id,
  title: row.title,
  description: row.description,
  status: row.status,
  due_date: row.due_date,
  due_time: formatTimeString(row.due_time),
  assignee_id: row.assignee_id,
  category_id: row.category_id,
  sort_order: row.sort_order,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

interface SupabaseStore {
  // State
  user: User | null;
  events: Event[];
  currentEvent: Event | null;
  isEventLoading: boolean;
  teamMembers: TeamMember[];
  isTeamMembersLoading: boolean;
  assignmentCategories: AssignmentCategory[];
  teamAssignments: TeamAssignment[];
  trafficControls: TrafficControl[];
  supervisors: Supervisor[];
  taskCategories: TaskCategory[];
  isTaskCategoriesLoading: boolean;
  eventTasks: EventTask[];
  isEventTasksLoading: boolean;

  // Event actions
  fetchEvents: () => Promise<void>;
  addEvent: (event: Omit<Event, 'event_id' | 'created_at'>) => Promise<Event | null>;
  updateEvent: (event: Event) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  setCurrentEvent: (event: Event | null) => void;
  duplicateEventWithChildren: (sourceEventId: string, options?: {
    eventDate?: string | null;
    eventName?: string | null;
    dueDateOffset?: number | null;
  }) => Promise<string | null>;

  // Team Member actions
  fetchTeamMembers: () => Promise<void>;
  addTeamMember: (member: Omit<TeamMember, 'member_id'>) => Promise<TeamMember | null>;
  updateTeamMember: (member: TeamMember) => Promise<void>;
  deleteTeamMember: (memberId: string) => Promise<void>;

  // Assignment actions
  fetchTeamAssignments: (eventId: string) => Promise<void>;
  addTeamAssignments: (eventId: string, assignments: Omit<TeamAssignment, 'assignment_id' | 'event_id'>[]) => Promise<void>;
  replaceTeamAssignments: (eventId: string, assignments: Omit<TeamAssignment, 'assignment_id' | 'event_id'>[]) => Promise<void>;
  getTeamAssignments: (eventId: string) => TeamAssignment[];

  // Traffic Control actions
  fetchTrafficControls: (eventId: string) => Promise<void>;
  addTrafficControls: (eventId: string, controls: Omit<TrafficControl, 'traffic_id' | 'event_id'>[]) => Promise<void>;
  replaceTrafficControls: (eventId: string, controls: Omit<TrafficControl, 'traffic_id' | 'event_id'>[]) => Promise<void>;
  getTrafficControls: (eventId: string) => TrafficControl[];

  // Supervisor actions
  fetchSupervisors: (eventId: string) => Promise<void>;
  replaceSupervisors: (eventId: string, supervisors: Omit<Supervisor, 'supervisor_id' | 'event_id'>[]) => Promise<void>;
  getSupervisors: (eventId: string) => Supervisor[];

  // Assignment categories
  fetchAssignmentCategories: () => Promise<void>;
  addAssignmentCategory: (categoryName: string) => Promise<void>;
  updateAssignmentCategory: (currentName: string, updatedName: string) => Promise<void>;
  deleteAssignmentCategory: (categoryName: string) => Promise<void>;

  // Task categories
  fetchTaskCategories: () => Promise<void>;
  createTaskCategory: (input: { name: string; color?: string; sort_order?: number }) => Promise<TaskCategory | null>;
  updateTaskCategory: (
    categoryId: string,
    updates: { name?: string; color?: string; sort_order?: number },
  ) => Promise<void>;
  deleteTaskCategory: (categoryId: string) => Promise<void>;
  reorderTaskCategories: (updates: { category_id: string; sort_order: number }[]) => Promise<void>;

  // Event task actions
  fetchEventTasks: (eventId: string) => Promise<void>;
  createEventTask: (
    eventId: string,
    task: {
      title: string;
      description?: string | null;
      status?: TaskStatus;
      due_date?: string | null;
      due_time?: string | null;
      assignee_id?: string | null;
      category_id?: string | null;
      sort_order?: number;
    },
  ) => Promise<EventTask | null>;
  updateEventTask: (
    taskId: string,
    updates: {
      title?: string;
      description?: string | null;
      status?: TaskStatus;
      due_date?: string | null;
      due_time?: string | null;
      assignee_id?: string | null;
      category_id?: string | null;
      sort_order?: number;
    },
  ) => Promise<void>;
  deleteEventTask: (taskId: string) => Promise<void>;
  reorderEventTasks: (
    eventId: string,
    updates: { task_id: string; sort_order: number }[],
  ) => Promise<void>;
  getEventTasks: (eventId: string) => EventTask[];

  // Loading states
  setIsEventLoading: (loading: boolean) => void;
  setIsTeamMembersLoading: (loading: boolean) => void;
}

export const useSupabaseStore = create<SupabaseStore>((set, get) => ({
  // Initial state
  user: null,
  events: [],
  currentEvent: null,
  isEventLoading: false,
  teamMembers: [],
  isTeamMembersLoading: false,
  assignmentCategories: [...DEFAULT_ASSIGNMENT_CATEGORIES],
  teamAssignments: [],
  trafficControls: [],
  supervisors: [],
  taskCategories: [],
  isTaskCategoriesLoading: false,
  eventTasks: [],
  isEventTasksLoading: false,

  // Event actions
  fetchEvents: async () => {
    set({ isEventLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: false });

      if (error) throw error;

      const events = data.map(dbEventToEvent);
      set({ events });
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      set({ isEventLoading: false });
    }
  },

  addEvent: async (eventData) => {
    console.log('📅 Adding event:', eventData);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      console.log('👤 User authenticated:', user.id);

      const insertData = {
        event_name: eventData.event_name.trim(),
        event_date: eventData.event_date,
        location: prepareTextForDb(eventData.location, DEFAULT_LOCATION),
        start_time: prepareTimeForDb(eventData.start_time),
        end_time: prepareTimeForDb(eventData.end_time),
        team_meet_time: prepareTimeForDb(eventData.team_meet_time ?? eventData.start_time),
        meet_location: prepareTextForDb(eventData.meet_location, DEFAULT_MEET_LOCATION),
        prepared_by: prepareTextForDb(eventData.prepared_by, DEFAULT_PREPARED_BY),
        prepared_date: eventData.prepared_date || eventData.event_date,
        notes: eventData.notes?.trim() || null,
        user_id: user.id,
      };
      console.log('📝 Insert data:', insertData);

      const { data, error } = await supabase
        .from('events')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('❌ Database error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error,
        });
        throw new Error(`Database error: ${error.message || 'Unknown error'} (Code: ${error.code || 'unknown'})`);
      }
      console.log('✅ Event added successfully:', data);

      const newEvent = dbEventToEvent(data);
      set((state) => {
        const updatedEvents = [newEvent, ...state.events];
        console.log('🔄 Updated events count:', updatedEvents.length);
        return { events: updatedEvents };
      });
      return newEvent;
    } catch (error) {
      console.error('❌ Error adding event:', error);
      return null;
    }
  },

  updateEvent: async (event) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('events')
        .update({
          event_name: event.event_name.trim(),
          event_date: event.event_date,
          location: prepareTextForDb(event.location, DEFAULT_LOCATION),
          start_time: prepareTimeForDb(event.start_time),
          end_time: prepareTimeForDb(event.end_time),
          team_meet_time: prepareTimeForDb(event.team_meet_time ?? event.start_time),
          meet_location: prepareTextForDb(event.meet_location, DEFAULT_MEET_LOCATION),
          prepared_by: prepareTextForDb(event.prepared_by, DEFAULT_PREPARED_BY),
          prepared_date: event.prepared_date || event.event_date,
          notes: event.notes?.trim() || null,
        })
        .eq('event_id', event.event_id)
        .eq('user_id', user.id);

      if (error) throw error;

      set((state) => ({
        events: state.events.map(e => e.event_id === event.event_id ? event : e),
        currentEvent: state.currentEvent?.event_id === event.event_id ? event : state.currentEvent,
      }));
    } catch (error) {
      console.error('Error updating event:', error);
    }
  },

  deleteEvent: async (eventId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      set((state) => ({
        events: state.events.filter(e => e.event_id !== eventId),
        currentEvent: state.currentEvent?.event_id === eventId ? null : state.currentEvent,
      }));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  },

  setCurrentEvent: (event) => set({ currentEvent: event }),

  duplicateEventWithChildren: async (
    sourceEventId,
    options: { eventDate?: string | null; eventName?: string | null; dueDateOffset?: number | null } = {},
  ) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: duplicatedEventId, error } = await supabase
        .rpc('duplicate_event_with_children', {
          source_event_id: sourceEventId,
          target_event_date: options.eventDate ?? null,
          target_event_name: options.eventName ?? null,
          due_date_offset: options.dueDateOffset ?? null,
        });

      if (error) throw error;

      if (!duplicatedEventId) {
        return null;
      }

      const { data: eventRow, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('event_id', duplicatedEventId)
        .eq('user_id', user.id)
        .single();

      if (eventError) throw eventError;

      const newEvent = dbEventToEvent(eventRow as EventRow);
      set((state) => ({
        events: [newEvent, ...state.events.filter((event) => event.event_id !== newEvent.event_id)],
      }));

      return duplicatedEventId as string;
    } catch (error) {
      console.error('Error duplicating event with children:', error);
      return null;
    }
  },

  // Team Member actions
  fetchTeamMembers: async () => {
    set({ isTeamMembersLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .order('member_name');

      if (error) throw error;

      const teamMembers = data.map(dbTeamMemberToTeamMember);
      set({ teamMembers });
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      set({ isTeamMembersLoading: false });
    }
  },

  addTeamMember: async (memberData) => {
    console.log('🔄 Adding team member:', memberData);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      console.log('👤 User authenticated:', user.id);

      const insertData = {
        ...memberData,
        user_id: user.id,
      };
      console.log('📝 Insert data:', insertData);

      const { data, error } = await supabase
        .from('team_members')
        .insert([insertData])
        .select()
        .single();

      if (error) {
        console.error('❌ Database error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error,
        });
        throw new Error(`Database error: ${error.message || 'Unknown error'} (Code: ${error.code || 'unknown'})`);
      }
      console.log('✅ Team member added successfully:', data);

      const newMember = dbTeamMemberToTeamMember(data);
      set((state) => {
        const updatedMembers = [...state.teamMembers, newMember];
        console.log('🔄 Updated team members count:', updatedMembers.length);
        return { teamMembers: updatedMembers };
      });
      return newMember;
    } catch (error) {
      console.error('❌ Error adding team member:', error);
      throw error;
    }
  },

  updateTeamMember: async (member) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('team_members')
        .update({
          member_name: member.member_name,
          active: member.active,
        })
        .eq('member_id', member.member_id)
        .eq('user_id', user.id);

      if (error) throw error;

      set((state) => ({
        teamMembers: state.teamMembers.map(m => m.member_id === member.member_id ? member : m)
      }));
    } catch (error) {
      console.error('Error updating team member:', error);
    }
  },

  deleteTeamMember: async (memberId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('member_id', memberId)
        .eq('user_id', user.id);

      if (error) throw error;

      set((state) => ({
        teamMembers: state.teamMembers.filter(m => m.member_id !== memberId)
      }));
    } catch (error) {
      console.error('Error deleting team member:', error);
    }
  },

  // Assignment actions
  fetchTeamAssignments: async (eventId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('team_assignments')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order');

      if (error) throw error;

      const assignments = data.map(dbTeamAssignmentToTeamAssignment);
      set((state) => ({
        teamAssignments: [
          ...state.teamAssignments.filter(a => a.event_id !== eventId),
          ...assignments
        ]
      }));
    } catch (error) {
      console.error('Error fetching team assignments:', error);
    }
  },

  addTeamAssignments: async (eventId, assignmentData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const filteredAssignments = assignmentData.filter((assignment) => assignment.member_id);

      if (!filteredAssignments.length) {
        return;
      }

      const assignmentsToInsert = filteredAssignments.map((assignment, index) => ({
        event_id: eventId,
        member_id: assignment.member_id,
        assignment_type: prepareTextForDb(assignment.assignment_type, DEFAULT_ASSIGNMENT_TYPE),
        equipment_area: prepareTextForDb(assignment.equipment_area, DEFAULT_EQUIPMENT_AREA),
        start_time: prepareTimeForDb(assignment.start_time),
        end_time: prepareTimeForDb(assignment.end_time),
        notes: assignment.notes?.trim() || null,
        sort_order: assignment.sort_order ?? index + 1,
      }));

      const { data, error } = await supabase
        .from('team_assignments')
        .insert(assignmentsToInsert)
        .select();

      if (error) throw error;

      const newAssignments = data.map(dbTeamAssignmentToTeamAssignment);
      set((state) => ({
        teamAssignments: [...state.teamAssignments, ...newAssignments]
      }));
    } catch (error) {
      console.error('Error adding team assignments:', error);
    }
  },

  replaceTeamAssignments: async (eventId, assignmentData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: deleteError } = await supabase
        .from('team_assignments')
        .delete()
        .eq('event_id', eventId);

      if (deleteError) throw deleteError;

      if (!assignmentData.length) {
        set((state) => ({
          teamAssignments: state.teamAssignments.filter(a => a.event_id !== eventId),
        }));
        return;
      }

      const filteredAssignments = assignmentData.filter((assignment) => assignment.member_id);

      if (!filteredAssignments.length) {
        set((state) => ({
          teamAssignments: state.teamAssignments.filter(a => a.event_id !== eventId),
        }));
        return;
      }

      const assignmentsToInsert = filteredAssignments.map((assignment, index) => ({
        event_id: eventId,
        member_id: assignment.member_id,
        assignment_type: prepareTextForDb(assignment.assignment_type, DEFAULT_ASSIGNMENT_TYPE),
        equipment_area: prepareTextForDb(assignment.equipment_area, DEFAULT_EQUIPMENT_AREA),
        start_time: prepareTimeForDb(assignment.start_time),
        end_time: prepareTimeForDb(assignment.end_time),
        notes: assignment.notes?.trim() || null,
        sort_order: assignment.sort_order ?? index + 1,
      }));

      const { data, error } = await supabase
        .from('team_assignments')
        .insert(assignmentsToInsert)
        .select();

      if (error) throw error;

      const newAssignments = data.map(dbTeamAssignmentToTeamAssignment);
      set((state) => ({
        teamAssignments: [
          ...state.teamAssignments.filter(a => a.event_id !== eventId),
          ...newAssignments,
        ],
      }));
    } catch (error) {
      console.error('Error replacing team assignments:', error);
      throw error;
    }
  },

  getTeamAssignments: (eventId) => {
    const { teamAssignments } = get();
    return teamAssignments.filter(assignment => assignment.event_id === eventId);
  },

  // Traffic Control actions
  fetchTrafficControls: async (eventId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('traffic_controls')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order');

      if (error) throw error;

      const controls = data.map(dbTrafficControlToTrafficControl);
      set((state) => ({
        trafficControls: [
          ...state.trafficControls.filter(c => c.event_id !== eventId),
          ...controls
        ]
      }));
    } catch (error) {
      console.error('Error fetching traffic controls:', error);
    }
  },

  addTrafficControls: async (eventId, controlData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const filteredControls = controlData.filter((control) => control.staff_name && control.staff_name.trim());

      if (!filteredControls.length) {
        return;
      }

      const controlsToInsert = filteredControls.map((control, index) => {
        const staffName = (control.staff_name ?? '').trim();
        return {
          event_id: eventId,
          member_id: control.member_id ?? null,
          staff_name: staffName,
          patrol_vehicle: prepareTextForDb(control.patrol_vehicle, DEFAULT_PATROL_VEHICLE),
          area_assignment: prepareTextForDb(control.area_assignment, DEFAULT_AREA_ASSIGNMENT),
          sort_order: control.sort_order ?? index + 1,
        };
      });

      const { data, error } = await supabase
        .from('traffic_controls')
        .insert(controlsToInsert)
        .select();

      if (error) throw error;

      const newControls = data.map(dbTrafficControlToTrafficControl);
      set((state) => ({
        trafficControls: [...state.trafficControls, ...newControls]
      }));
    } catch (error) {
      console.error('Error adding traffic controls:', error);
    }
  },

  replaceTrafficControls: async (eventId, controlData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: deleteError } = await supabase
        .from('traffic_controls')
        .delete()
        .eq('event_id', eventId);

      if (deleteError) throw deleteError;

      if (!controlData.length) {
        set((state) => ({
          trafficControls: state.trafficControls.filter(c => c.event_id !== eventId),
        }));
        return;
      }

      const filteredControls = controlData.filter((control) => control.staff_name && control.staff_name.trim());

      if (!filteredControls.length) {
        set((state) => ({
          trafficControls: state.trafficControls.filter(c => c.event_id !== eventId),
        }));
        return;
      }

      const controlsToInsert = filteredControls.map((control, index) => {
        const staffName = (control.staff_name ?? '').trim();
        return {
          event_id: eventId,
          member_id: control.member_id ?? null,
          staff_name: staffName,
          patrol_vehicle: prepareTextForDb(control.patrol_vehicle, DEFAULT_PATROL_VEHICLE),
          area_assignment: prepareTextForDb(control.area_assignment, DEFAULT_AREA_ASSIGNMENT),
          sort_order: control.sort_order ?? index + 1,
        };
      });

      const { data, error } = await supabase
        .from('traffic_controls')
        .insert(controlsToInsert)
        .select();

      if (error) throw error;

      const newControls = data.map(dbTrafficControlToTrafficControl);
      set((state) => ({
        trafficControls: [
          ...state.trafficControls.filter(c => c.event_id !== eventId),
          ...newControls,
        ],
      }));
    } catch (error) {
      console.error('Error replacing traffic controls:', error);
      throw error;
    }
  },

  getTrafficControls: (eventId) => {
    const { trafficControls } = get();
    return trafficControls.filter(control => control.event_id === eventId);
  },

  // Supervisor actions
  fetchSupervisors: async (eventId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('supervisors')
        .select('*')
        .eq('event_id', eventId)
        .order('sort_order');

      if (error) throw error;

      const supervisors = data.map(dbSupervisorToSupervisor);
      set((state) => ({
        supervisors: [
          ...state.supervisors.filter(s => s.event_id !== eventId),
          ...supervisors
        ]
      }));
    } catch (error) {
      console.error('Error fetching supervisors:', error);
    }
  },

  replaceSupervisors: async (eventId, supervisorData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error: deleteError } = await supabase
        .from('supervisors')
        .delete()
        .eq('event_id', eventId);

      if (deleteError) throw deleteError;

      if (!supervisorData.length) {
        set((state) => ({
          supervisors: state.supervisors.filter((supervisor) => supervisor.event_id !== eventId),
        }));
        return;
      }

      const supervisorsToInsert = supervisorData.map((supervisor, index) => ({
        event_id: eventId,
        supervisor_name: supervisor.supervisor_name,
        phone: supervisor.phone?.trim() || null,
        email: supervisor.email?.trim() || null,
        sort_order: index,
      }));

      const { data, error } = await supabase
        .from('supervisors')
        .insert(supervisorsToInsert)
        .select();

      if (error) throw error;

      const newSupervisors = data.map(dbSupervisorToSupervisor);
      set((state) => ({
        supervisors: [
          ...state.supervisors.filter((supervisor) => supervisor.event_id !== eventId),
          ...newSupervisors,
        ],
      }));
    } catch (error) {
      console.error('Error replacing supervisors:', error);
      throw error;
    }
  },

  getSupervisors: (eventId) => {
    const { supervisors } = get();
    return supervisors.filter(supervisor => supervisor.event_id === eventId);
  },

  // Assignment categories
  fetchAssignmentCategories: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ assignmentCategories: [...DEFAULT_ASSIGNMENT_CATEGORIES] });
        return;
      }

      const { data, error } = await supabase
        .from('assignment_categories')
        .select('category_name')
        .eq('user_id', user.id)
        .order('category_name');

      if (error) throw error;

      if (!data || data.length === 0) {
        set({ assignmentCategories: [...DEFAULT_ASSIGNMENT_CATEGORIES] });
        return;
      }

      const categoryRows = data as { category_name: string | null }[];
      const categories = dedupeAndSortCategories(
        categoryRows.map(({ category_name }) => category_name ?? ''),
      );

      set({ assignmentCategories: categories });
    } catch (error) {
      console.error('Error fetching assignment categories:', error);
      set({ assignmentCategories: [...DEFAULT_ASSIGNMENT_CATEGORIES] });
    }
  },

  addAssignmentCategory: async (categoryName) => {
    const normalizedName = normalizeCategoryName(categoryName);
    if (!normalizedName) {
      throw new Error('Category name is required');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { error } = await supabase
      .from('assignment_categories')
      .insert({
        user_id: user.id,
        category_name: normalizedName,
      })
      .select('category_name')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Category already exists.');
      }
      throw error;
    }

    set((state) => ({
      assignmentCategories: dedupeAndSortCategories([
        ...state.assignmentCategories,
        normalizedName,
      ]),
    }));
  },

  updateAssignmentCategory: async (currentName, updatedName) => {
    const existingName = normalizeCategoryName(currentName);
    const normalizedName = normalizeCategoryName(updatedName);

    if (!normalizedName) {
      throw new Error('Category name is required');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const shouldPersist = existingName !== normalizedName;

    if (shouldPersist) {
      const { data, error } = await supabase
        .from('assignment_categories')
        .update({ category_name: normalizedName })
        .eq('user_id', user.id)
        .eq('category_name', existingName)
        .select('category_name');

      if (error) {
        if (error.code === '23505') {
          throw new Error('Category already exists.');
        }
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('Category not found.');
      }
    }

    set((state) => ({
      assignmentCategories: dedupeAndSortCategories(
        state.assignmentCategories.map((name) =>
          name.toLowerCase() === existingName.toLowerCase() ? normalizedName : name,
        ),
      ),
    }));
  },

  deleteAssignmentCategory: async (categoryName) => {
    const normalizedName = normalizeCategoryName(categoryName);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { error } = await supabase
      .from('assignment_categories')
      .delete()
      .eq('user_id', user.id)
      .eq('category_name', normalizedName);

    if (error) {
      throw error;
    }

    set((state) => {
      const remaining = state.assignmentCategories.filter(
        (name) => name.toLowerCase() !== normalizedName.toLowerCase(),
      );
      return {
        assignmentCategories: remaining.length
          ? dedupeAndSortCategories(remaining)
          : [...DEFAULT_ASSIGNMENT_CATEGORIES],
      };
    });
  },

  // Task categories
  fetchTaskCategories: async () => {
    set({ isTaskCategoriesLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ taskCategories: [] });
        return;
      }

      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('sort_order')
        .order('name');

      if (error) throw error;

      const categories = (data as TaskCategoryRow[]).map(dbTaskCategoryToTaskCategory);
      set({ taskCategories: categories });
    } catch (error) {
      console.error('Error fetching task categories:', error);
    } finally {
      set({ isTaskCategoriesLoading: false });
    }
  },

  createTaskCategory: async ({ name, color, sort_order }) => {
    const normalizedName = normalizeCategoryName(name);
    if (!normalizedName) {
      throw new Error('Task category name is required');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const insertData = {
      user_id: user.id,
      name: normalizedName,
      color: normalizeHexColor(color ?? null),
      sort_order: typeof sort_order === 'number' ? sort_order : get().taskCategories.length + 1,
    } satisfies Database['public']['Tables']['task_categories']['Insert'];

    try {
      const { data, error } = await supabase
        .from('task_categories')
        .insert(insertData)
        .select('*')
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('Task category already exists.');
        }
        throw error;
      }

      const newCategory = dbTaskCategoryToTaskCategory(data as TaskCategoryRow);
      set((state) => ({
        taskCategories: [...state.taskCategories, newCategory].sort((a, b) => {
          if (a.sort_order === b.sort_order) {
            return a.name.localeCompare(b.name);
          }
          return a.sort_order - b.sort_order;
        }),
      }));

      return newCategory;
    } catch (error) {
      console.error('Error creating task category:', error);
      throw error;
    }
  },

  updateTaskCategory: async (categoryId, updates) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const payload: Database['public']['Tables']['task_categories']['Update'] = {};

    if (Object.prototype.hasOwnProperty.call(updates, 'name')) {
      const normalizedName = normalizeCategoryName(updates.name ?? '');
      if (!normalizedName) {
        throw new Error('Task category name is required');
      }
      payload.name = normalizedName;
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'color')) {
      payload.color = normalizeHexColor(updates.color ?? null);
    }

    if (Object.prototype.hasOwnProperty.call(updates, 'sort_order') && typeof updates.sort_order === 'number') {
      payload.sort_order = updates.sort_order;
    }

    if (!Object.keys(payload).length) {
      return;
    }

    const { data, error } = await supabase
      .from('task_categories')
      .update(payload)
      .eq('category_id', categoryId)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Task category already exists.');
      }
      throw error;
    }

    const updatedCategory = dbTaskCategoryToTaskCategory(data as TaskCategoryRow);
    set((state) => ({
      taskCategories: state.taskCategories
        .map((category) => (category.category_id === categoryId ? updatedCategory : category))
        .sort((a, b) => {
          if (a.sort_order === b.sort_order) {
            return a.name.localeCompare(b.name);
          }
          return a.sort_order - b.sort_order;
        }),
    }));
  },

  deleteTaskCategory: async (categoryId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { error } = await supabase
      .from('task_categories')
      .delete()
      .eq('category_id', categoryId)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    set((state) => ({
      taskCategories: state.taskCategories.filter((category) => category.category_id !== categoryId),
    }));
  },

  reorderTaskCategories: async (updates) => {
    if (!updates.length) {
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    for (const update of updates) {
      const { error } = await supabase
        .from('task_categories')
        .update({ sort_order: update.sort_order })
        .eq('category_id', update.category_id)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }
    }

    set((state) => ({
      taskCategories: state.taskCategories
        .map((category) => {
          const match = updates.find((entry) => entry.category_id === category.category_id);
          return match ? { ...category, sort_order: match.sort_order } : category;
        })
        .sort((a, b) => {
          if (a.sort_order === b.sort_order) {
            return a.name.localeCompare(b.name);
          }
          return a.sort_order - b.sort_order;
        }),
    }));
  },

  // Event task actions
  fetchEventTasks: async (eventId) => {
    set({ isEventTasksLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('event_tasks')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .order('sort_order');

      if (error) throw error;

      const tasks = (data as EventTaskRow[]).map(dbEventTaskToEventTask);
      set((state) => ({
        eventTasks: [
          ...state.eventTasks.filter((task) => task.event_id !== eventId),
          ...tasks,
        ],
      }));
    } catch (error) {
      console.error('Error fetching event tasks:', error);
    } finally {
      set({ isEventTasksLoading: false });
    }
  },

  createEventTask: async (eventId, task) => {
    const title = task.title?.trim();
    if (!title) {
      throw new Error('Task title is required');
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const nextSortOrder = task.sort_order ?? (get().getEventTasks(eventId).length + 1);

      const insertData: Database['public']['Tables']['event_tasks']['Insert'] = {
        event_id: eventId,
        user_id: user.id,
        title,
        description: task.description?.trim() || null,
        status: task.status ?? DEFAULT_TASK_STATUS,
        due_date: task.due_date || null,
        due_time: task.due_time ? task.due_time : null,
        assignee_id: task.assignee_id || null,
        category_id: task.category_id || null,
        sort_order: nextSortOrder,
      };

      const { data, error } = await supabase
        .from('event_tasks')
        .insert(insertData)
        .select('*')
        .single();

      if (error) throw error;

      const newTask = dbEventTaskToEventTask(data as EventTaskRow);
      set((state) => ({
        eventTasks: [
          ...state.eventTasks,
          newTask,
        ],
      }));

      return newTask;
    } catch (error) {
      console.error('Error creating event task:', error);
      return null;
    }
  },

  updateEventTask: async (taskId, updates) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const payload: Database['public']['Tables']['event_tasks']['Update'] = {};

      if (Object.prototype.hasOwnProperty.call(updates, 'title')) {
        const trimmedTitle = updates.title?.trim() ?? '';
        if (!trimmedTitle) {
          throw new Error('Task title is required');
        }
        payload.title = trimmedTitle;
      }

      if (Object.prototype.hasOwnProperty.call(updates, 'description')) {
        payload.description = updates.description?.trim() || null;
      }

      if (Object.prototype.hasOwnProperty.call(updates, 'status')) {
        payload.status = updates.status ?? DEFAULT_TASK_STATUS;
      }

      if (Object.prototype.hasOwnProperty.call(updates, 'due_date')) {
        payload.due_date = updates.due_date || null;
      }

      if (Object.prototype.hasOwnProperty.call(updates, 'due_time')) {
        payload.due_time = updates.due_time || null;
      }

      if (Object.prototype.hasOwnProperty.call(updates, 'assignee_id')) {
        payload.assignee_id = updates.assignee_id || null;
      }

      if (Object.prototype.hasOwnProperty.call(updates, 'category_id')) {
        payload.category_id = updates.category_id || null;
      }

      if (Object.prototype.hasOwnProperty.call(updates, 'sort_order') && typeof updates.sort_order === 'number') {
        payload.sort_order = updates.sort_order;
      }

      if (!Object.keys(payload).length) {
        return;
      }

      const { data, error } = await supabase
        .from('event_tasks')
        .update(payload)
        .eq('task_id', taskId)
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (error) throw error;

      const updatedTask = dbEventTaskToEventTask(data as EventTaskRow);
      set((state) => ({
        eventTasks: state.eventTasks.map((task) =>
          task.task_id === taskId ? updatedTask : task,
        ),
      }));
    } catch (error) {
      console.error('Error updating event task:', error);
      throw error;
    }
  },

  deleteEventTask: async (taskId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('event_tasks')
        .delete()
        .eq('task_id', taskId)
        .eq('user_id', user.id);

      if (error) throw error;

      set((state) => ({
        eventTasks: state.eventTasks.filter((task) => task.task_id !== taskId),
      }));
    } catch (error) {
      console.error('Error deleting event task:', error);
      throw error;
    }
  },

  reorderEventTasks: async (eventId, updates) => {
    if (!updates.length) {
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      for (const update of updates) {
        const { error } = await supabase
          .from('event_tasks')
          .update({ sort_order: update.sort_order })
          .eq('task_id', update.task_id)
          .eq('user_id', user.id)
          .eq('event_id', eventId);

        if (error) throw error;
      }

      set((state) => ({
        eventTasks: state.eventTasks.map((task) => {
          const match = updates.find((entry) => entry.task_id === task.task_id);
          return match ? { ...task, sort_order: match.sort_order } : task;
        }),
      }));
    } catch (error) {
      console.error('Error reordering event tasks:', error);
      throw error;
    }
  },

  getEventTasks: (eventId) => {
    const { eventTasks } = get();
    return eventTasks
      .filter((task) => task.event_id === eventId)
      .sort((a, b) => {
        if (a.sort_order === b.sort_order) {
          return a.created_at.localeCompare(b.created_at);
        }
        return a.sort_order - b.sort_order;
      });
  },

  // Loading states
  setIsEventLoading: (loading) => set({ isEventLoading: loading }),
  setIsTeamMembersLoading: (loading) => set({ isTeamMembersLoading: loading }),
}));
