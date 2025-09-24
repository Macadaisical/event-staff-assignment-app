import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppStore, Event, TeamMember, AssignmentCategory, TeamAssignment, TrafficControl, Supervisor } from '@/types';
import { generateId } from '@/utils/id-generator';

const defaultAssignmentCategories: AssignmentCategory[] = [
  'Equipment Operator',
  'Safety Monitor',
  'Setup/Breakdown',
  'Crowd Control',
  'Communications',
  'First Aid',
  'General Support',
  'Technical Support',
];

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // State
      events: [],
      currentEvent: null,
      isEventLoading: false,
      teamMembers: [],
      isTeamMembersLoading: false,
      assignmentCategories: defaultAssignmentCategories,
      teamAssignments: [],
      trafficControls: [],
      supervisors: [],

      // Event actions
      setEvents: (events) => set({ events }),

      setCurrentEvent: (event) => set({ currentEvent: event }),

      addEvent: (event) => {
        const { events } = get();
        const newEvent: Event = {
          ...event,
          event_id: event.event_id || generateId(),
          created_at: event.created_at || new Date().toISOString(),
        };
        set({ events: [...events, newEvent] });
      },

      updateEvent: (updatedEvent) => {
        const { events } = get();
        const updatedEvents = events.map(event =>
          event.event_id === updatedEvent.event_id ? updatedEvent : event
        );
        set({ events: updatedEvents });

        // Update currentEvent if it's the one being updated
        const { currentEvent } = get();
        if (currentEvent?.event_id === updatedEvent.event_id) {
          set({ currentEvent: updatedEvent });
        }
      },

      deleteEvent: (eventId) => {
        const { events, currentEvent } = get();
        const filteredEvents = events.filter(event => event.event_id !== eventId);
        set({
          events: filteredEvents,
          currentEvent: currentEvent?.event_id === eventId ? null : currentEvent
        });
      },

      // Team Member actions
      setTeamMembers: (teamMembers) => set({ teamMembers }),

      addTeamMember: (member) => {
        const { teamMembers } = get();
        const newMember: TeamMember = {
          ...member,
          member_id: member.member_id || generateId(),
        };
        set({ teamMembers: [...teamMembers, newMember] });
      },

      updateTeamMember: (updatedMember) => {
        const { teamMembers } = get();
        const updatedMembers = teamMembers.map(member =>
          member.member_id === updatedMember.member_id ? updatedMember : member
        );
        set({ teamMembers: updatedMembers });
      },

      deleteTeamMember: (memberId) => {
        const { teamMembers } = get();
        const filteredMembers = teamMembers.filter(member => member.member_id !== memberId);
        set({ teamMembers: filteredMembers });
      },

      // Assignment actions
      setTeamAssignments: (assignments) => set({ teamAssignments: assignments }),

      addTeamAssignments: (eventId, assignments) => {
        const { teamAssignments } = get();
        const newAssignments = assignments.map(assignment => ({
          ...assignment,
          assignment_id: assignment.assignment_id || generateId(),
          event_id: eventId,
        }));
        set({ teamAssignments: [...teamAssignments, ...newAssignments] });
      },

      getTeamAssignments: (eventId) => {
        const { teamAssignments } = get();
        return teamAssignments.filter(assignment => assignment.event_id === eventId);
      },

      // Traffic Control actions
      setTrafficControls: (controls) => set({ trafficControls: controls }),

      addTrafficControls: (eventId, controls) => {
        const { trafficControls } = get();
        const newControls = controls.map(control => ({
          ...control,
          traffic_id: control.traffic_id || generateId(),
          event_id: eventId,
        }));
        set({ trafficControls: [...trafficControls, ...newControls] });
      },

      getTrafficControls: (eventId) => {
        const { trafficControls } = get();
        return trafficControls.filter(control => control.event_id === eventId);
      },

      // Supervisor actions
      setSupervisors: (supervisors) => set({ supervisors: supervisors }),

      addSupervisors: (eventId, supervisors) => {
        const { supervisors: currentSupervisors } = get();
        const newSupervisors = supervisors.map(supervisor => ({
          ...supervisor,
          supervisor_id: supervisor.supervisor_id || generateId(),
          event_id: eventId,
        }));
        set({ supervisors: [...currentSupervisors, ...newSupervisors] });
      },

      getSupervisors: (eventId) => {
        const { supervisors } = get();
        return supervisors.filter(supervisor => supervisor.event_id === eventId);
      },

      // Loading states
      setIsEventLoading: (loading) => set({ isEventLoading: loading }),
      setIsTeamMembersLoading: (loading) => set({ isTeamMembersLoading: loading }),
    }),
    {
      name: 'event-staff-storage',
      storage: createJSONStorage(() => localStorage),
      // Only persist essential data, not loading states
      partialize: (state) => ({
        events: state.events,
        teamMembers: state.teamMembers,
        assignmentCategories: state.assignmentCategories,
        teamAssignments: state.teamAssignments,
        trafficControls: state.trafficControls,
        supervisors: state.supervisors,
      }),
    }
  )
);