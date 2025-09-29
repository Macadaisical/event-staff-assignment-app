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
  AssignmentCategory
} from '@/types';

// Database row types
type EventRow = Database['public']['Tables']['events']['Row'];
type TeamMemberRow = Database['public']['Tables']['team_members']['Row'];
type TeamAssignmentRow = Database['public']['Tables']['team_assignments']['Row'];
type TrafficControlRow = Database['public']['Tables']['traffic_controls']['Row'];
type SupervisorRow = Database['public']['Tables']['supervisors']['Row'];

const DEFAULT_LOCATION = 'Location TBD';
const DEFAULT_MEET_LOCATION = 'Meet TBD';
const DEFAULT_PREPARED_BY = 'Unassigned';
const DEFAULT_TIME = '00:00';
const DEFAULT_ASSIGNMENT_TYPE = 'General Support';
const DEFAULT_EQUIPMENT_AREA = 'Assignment TBD';
const DEFAULT_PATROL_VEHICLE = 'Vehicle TBD';
const DEFAULT_AREA_ASSIGNMENT = 'Area TBD';

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

  // Event actions
  fetchEvents: () => Promise<void>;
  addEvent: (event: Omit<Event, 'event_id' | 'created_at'>) => Promise<Event | null>;
  updateEvent: (event: Event) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  setCurrentEvent: (event: Event | null) => void;

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
  assignmentCategories: [
    'Equipment Operator',
    'Safety Monitor',
    'Setup/Breakdown',
    'Crowd Control',
    'Communications',
    'First Aid',
    'General Support',
    'Technical Support',
  ] as AssignmentCategory[],
  teamAssignments: [],
  trafficControls: [],
  supervisors: [],

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
      if (!user) return; // Use defaults if not authenticated

      const { data, error } = await supabase
        .from('assignment_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('category_name');

      if (error) throw error;

      if (data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const categories = data.map((cat: any) => cat.category_name as AssignmentCategory);
        set({ assignmentCategories: categories });
      }
    } catch (error) {
      console.error('Error fetching assignment categories:', error);
      // Keep default categories on error
    }
  },

  // Loading states
  setIsEventLoading: (loading) => set({ isEventLoading: loading }),
  setIsTeamMembersLoading: (loading) => set({ isTeamMembersLoading: loading }),
}));
