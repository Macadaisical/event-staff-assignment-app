'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  Loader2,
  Plus,
  Trash2,
  Users,
  UserPlus,
  UserX,
  X,
} from 'lucide-react';

import { useAuth } from '@/components/auth/auth-provider';
import { useSupabaseStore } from '@/stores/supabase-store';
import type { TeamMember } from '@/types';

export default function TeamMembersPage() {
  const {
    teamMembers,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    fetchTeamMembers,
  } = useSupabaseStore();
  const { user } = useAuth();

  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchTeamMembers()
      .catch((error: unknown) => {
        console.error('Error loading team members:', error);
      })
      .finally(() => setLoading(false));
  }, [user, fetchTeamMembers]);

  const handleAddMember = async () => {
    const name = newMemberName.trim();
    if (!name || !user) {
      return;
    }

    try {
      await addTeamMember({
        member_name: name,
        active: true,
      });
      setNewMemberName('');
      setIsAddingMember(false);
    } catch (error) {
      console.error('Error adding team member:', error);
    }
  };

  const toggleMemberStatus = async (member: TeamMember) => {
    try {
      await updateTeamMember({ ...member, active: !member.active });
    } catch (error) {
      console.error('Error updating team member:', error);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to delete this team member?')) {
      return;
    }

    try {
      await deleteTeamMember(memberId);
    } catch (error) {
      console.error('Error deleting team member:', error);
    }
  };

  const activeMembers = teamMembers.filter((member) => member.active);
  const inactiveMembers = teamMembers.filter((member) => !member.active);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#001a24] via-[#003446] to-[#002233] text-slate-100">
        <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
            <Users className="h-12 w-12 text-[#e9d29a]" />
          </div>
          <h2 className="mt-6 text-3xl font-semibold">Sign in required</h2>
          <p className="mt-3 text-sm text-[#d0d6db]">
            You must be signed in to view and manage team members. Please log in to continue coordinating assignments.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#004d66] to-[#003446] px-6 py-3 text-sm font-semibold text-[#e6e7e8] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:opacity-90"
          >
            Return home
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-gradient-to-br from-[#001a24] via-[#003446] to-[#002233]">
        <div className="text-center text-slate-200">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#e9d29a]" />
          <p className="mt-4 text-sm text-[#d0d6db]">Loading team members...</p>
        </div>
      </div>
    );
  }

  const renderMemberRow = (member: TeamMember) => (
    <div
      key={member.member_id}
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-[#f5f6f7] shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
    >
      <div className="flex items-center gap-3">
        <span
          className={`h-2.5 w-2.5 rounded-full ${member.active ? 'bg-emerald-400' : 'bg-slate-400'}`}
        />
        <p className="text-base font-medium text-white">{member.member_name}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => toggleMemberStatus(member)}
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${member.active ? 'bg-yellow-200/20 text-yellow-100 hover:bg-yellow-200/30' : 'bg-emerald-200/20 text-emerald-100 hover:bg-emerald-200/30'}`}
        >
          {member.active ? (
            <>
              <UserX className="h-4 w-4" />
              Deactivate
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4" />
              Reactivate
            </>
          )}
        </button>
        <button
          onClick={() => handleDeleteMember(member.member_id)}
          className="inline-flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-100 transition hover:bg-red-500/30"
        >
          <Trash2 className="h-4 w-4" />
          Remove
        </button>
      </div>
    </div>
  );

  const showEmptyState = teamMembers.length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001a24] via-[#003446] to-[#002233] text-slate-100">
      <main className="mx-auto w-full max-w-6xl px-6 py-12 lg:px-10">
        <div className="mb-10 rounded-3xl border border-[#004d66] bg-gradient-to-r from-white/10 via-white/5 to-transparent p-8 text-[#f5f6f7] shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-[#e9d29a]">Team</p>
              <h1 className="mt-3 text-4xl font-semibold italic">Manage your roster</h1>
              <p className="mt-3 max-w-2xl text-sm text-[#d0d6db]">
                Activate, deactivate, and curate the deputies you rely on for event staffing. Keep this list current so assignments stay accurate.
              </p>
            </div>
            <button
              onClick={() => setIsAddingMember(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#004d66] to-[#003446] px-6 py-3 text-sm font-semibold text-[#e6e7e8] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Add Team Member
            </button>
          </div>
        </div>

        {isAddingMember && (
          <section className="mb-10 overflow-hidden rounded-3xl border border-[#004d66] bg-gradient-to-br from-[rgba(0,52,70,0.55)] via-[rgba(0,36,53,0.42)] to-[rgba(0,36,53,0.32)] p-6 text-[#f5f6f7] shadow-[0_18px_36px_rgba(0,0,0,0.45)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-[#e9d29a]">Add new member</h2>
                <p className="mt-2 text-sm text-[#d0d6db]">Capture the deputy’s full name so they can be scheduled for events and traffic assignments.</p>
              </div>
              <button
                onClick={() => {
                  setIsAddingMember(false);
                  setNewMemberName('');
                }}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#e9d29a] transition hover:bg-white/20"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-3 md:flex-row">
              <input
                type="text"
                value={newMemberName}
                onChange={(event) => setNewMemberName(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleAddMember()}
                placeholder="Enter member name"
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-base text-white shadow-inner outline-none transition placeholder:text-[#9aa7b5] focus:border-[#e9d29a] focus:shadow-[0_0_0_2px_rgba(233,210,154,0.25)]"
                autoFocus
              />
              <div className="flex gap-3 md:w-auto">
                <button
                  onClick={handleAddMember}
                  disabled={!newMemberName.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500/80 to-emerald-600/80 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(16,185,129,0.35)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Check className="h-4 w-4" />
                  Save Member
                </button>
                <button
                  onClick={() => {
                    setIsAddingMember(false);
                    setNewMemberName('');
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-6 py-3 text-sm font-semibold text-[#e6e7e8] transition hover:bg-white/15"
                >
                  <X className="h-4 w-4" />
                  Close
                </button>
              </div>
            </div>
          </section>
        )}

        {showEmptyState ? (
          <div className="mt-16 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
              <Users className="h-12 w-12 text-[#e9d29a]" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-[#f5f6f7]">No team members yet</h2>
            <p className="mt-3 text-sm text-[#d0d6db]">
              Add your first deputy or volunteer so you can begin building event assignments.
            </p>
            <button
              onClick={() => setIsAddingMember(true)}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#004d66] to-[#003446] px-6 py-3 text-sm font-semibold text-[#e6e7e8] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Add First Member
            </button>
          </div>
        ) : (
          <div className="space-y-10">
            <section className="rounded-3xl border border-[#004d66] bg-gradient-to-br from-[rgba(0,52,70,0.45)] via-[rgba(0,36,53,0.35)] to-[rgba(0,36,53,0.28)] p-6 text-[#f5f6f7] shadow-[0_18px_36px_rgba(0,0,0,0.45)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-[#e9d29a]">Active Members</h2>
                  <p className="text-xs uppercase tracking-wide text-[#d0d6db]">
                    {activeMembers.length} active member{activeMembers.length === 1 ? '' : 's'}
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-100">
                  <Users className="h-4 w-4" />
                  Active roster
                </span>
              </div>

              {activeMembers.length ? (
                <div className="mt-6 space-y-4">
                  {activeMembers.map(renderMemberRow)}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-[#d0d6db]">
                  No active team members yet. Reactivate someone or add a new teammate.
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-[#004d66] bg-gradient-to-br from-[rgba(0,52,70,0.35)] via-[rgba(0,36,53,0.28)] to-[rgba(0,36,53,0.22)] p-6 text-[#f5f6f7] shadow-[0_14px_28px_rgba(0,0,0,0.35)]">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-semibold text-[#e9d29a]">Inactive Members</h2>
                  <p className="text-xs uppercase tracking-wide text-[#d0d6db]">
                    {inactiveMembers.length} inactive member{inactiveMembers.length === 1 ? '' : 's'}
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#f5f6f7]">
                  <Users className="h-4 w-4" />
                  Off-duty list
                </span>
              </div>

              {inactiveMembers.length ? (
                <div className="mt-6 space-y-4 opacity-80">
                  {inactiveMembers.map(renderMemberRow)}
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-[#d0d6db]">
                  Everyone is currently active.
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
