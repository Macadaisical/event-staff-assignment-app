// Temporarily disabled Supabase store to allow build
// This will be re-enabled once database types are properly generated

import { create } from 'zustand';

interface DisabledSupabaseStore {
  // Mock the interface for now
  user: unknown;
  events: unknown[];
  teamMembers: unknown[];
  fetchEvents: () => Promise<void>;
  fetchTeamMembers: () => Promise<void>;
  addTeamMember: (member: unknown) => Promise<unknown>;
  updateTeamMember: (id: string, updates: unknown) => Promise<void>;
  deleteTeamMember: (id: string) => Promise<void>;
}

export const useSupabaseStore = create<DisabledSupabaseStore>(() => ({
  user: null,
  events: [],
  teamMembers: [],
  fetchEvents: async () => console.log('Supabase store temporarily disabled'),
  fetchTeamMembers: async () => console.log('Supabase store temporarily disabled'),
  addTeamMember: async () => null,
  updateTeamMember: async () => {},
  deleteTeamMember: async () => {},
}));