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

// Conversion functions from database rows to app types
const dbEventToEvent = (dbEvent: EventRow): Event => ({
  event_id: dbEvent.event_id,
  event_name: dbEvent.event_name,
  event_date: dbEvent.event_date,
  location: dbEvent.location,
  start_time: dbEvent.start_time,
  end_time: dbEvent.end_time,
  team_meet_time: dbEvent.team_meet_time,
  meet_location: dbEvent.meet_location,
  prepared_by: dbEvent.prepared_by,
  prepared_date: dbEvent.prepared_date,
  notes: dbEvent.notes || undefined,
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
  equipment_area: dbAssignment.equipment_area,
  start_time: dbAssignment.start_time,
  end_time: dbAssignment.end_time,
  notes: dbAssignment.notes || undefined,
  sort_order: dbAssignment.sort_order,
});

const dbTrafficControlToTrafficControl = (dbControl: TrafficControlRow): TrafficControl => ({
  traffic_id: dbControl.traffic_id,
  event_id: dbControl.event_id,
  member_id: dbControl.member_id,
  patrol_vehicle: dbControl.patrol_vehicle,
  area_assignment: dbControl.area_assignment,
  sort_order: dbControl.sort_order,
});

const dbSupervisorToSupervisor = (dbSupervisor: SupervisorRow): Supervisor => ({
  supervisor_id: dbSupervisor.supervisor_id,
  event_id: dbSupervisor.event_id,
  supervisor_name: dbSupervisor.supervisor_name,
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
  getTeamAssignments: (eventId: string) => TeamAssignment[];

  // Traffic Control actions
  fetchTrafficControls: (eventId: string) => Promise<void>;
  addTrafficControls: (eventId: string, controls: Omit<TrafficControl, 'traffic_id' | 'event_id'>[]) => Promise<void>;
  getTrafficControls: (eventId: string) => TrafficControl[];

  // Supervisor actions
  fetchSupervisors: (eventId: string) => Promise<void>;
  addSupervisors: (eventId: string, supervisors: Omit<Supervisor, 'supervisor_id' | 'event_id'>[]) => Promise<void>;
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

      // Generate event_id to avoid constraint issues
      const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🆔 Generated event_id:', eventId);

      const insertData = {
        ...eventData,
        event_id: eventId,
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
          event_name: event.event_name,
          event_date: event.event_date,
          location: event.location,
          start_time: event.start_time,
          end_time: event.end_time,
          team_meet_time: event.team_meet_time,
          meet_location: event.meet_location,
          prepared_by: event.prepared_by,
          prepared_date: event.prepared_date,
          notes: event.notes,
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

      // Generate member_id to avoid constraint issues
      const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('🆔 Generated member_id:', memberId);

      const insertData = {
        ...memberData,
        member_id: memberId,
        user_id: user.id,
        phone: null,
        email: null,
        emergency_contact: null,
        emergency_phone: null,
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
        .eq('user_id', user.id)
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

      const assignmentsToInsert = assignmentData.map(assignment => ({
        ...assignment,
        event_id: eventId,
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
        .eq('user_id', user.id)
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

      const controlsToInsert = controlData.map(control => ({
        ...control,
        event_id: eventId,
      }));

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
        .eq('user_id', user.id);

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

  addSupervisors: async (eventId, supervisorData) => {
    console.log('👥 Adding supervisors for event:', eventId, supervisorData);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const supervisorsToInsert = supervisorData.map((supervisor, index) => ({
        ...supervisor,
        supervisor_id: `supervisor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${index}`,
        event_id: eventId,
        sort_order: index,
      }));

      console.log('📝 Supervisors to insert:', supervisorsToInsert);

      const { data, error } = await supabase
        .from('supervisors')
        .insert(supervisorsToInsert)
        .select();

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

      const newSupervisors = data.map(dbSupervisorToSupervisor);
      set((state) => ({
        supervisors: [...state.supervisors, ...newSupervisors]
      }));
    } catch (error) {
      console.error('Error adding supervisors:', error);
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