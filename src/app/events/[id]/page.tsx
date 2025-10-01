'use client';

import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Calendar,
  Car,
  ClipboardList,
  Clock,
  Edit,
  FileText,
  Loader2,
  MapPin,
  ShieldCheck,
  Users,
} from 'lucide-react';

import { useSupabaseStore } from '@/stores/supabase-store';
import { exportEventToPDF } from '@/utils/pdf-export';

const parseEventDate = (value: string | null | undefined): Date | null => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatEventDate = (value: string | null | undefined): string => {
  const parsed = parseEventDate(value);
  if (!parsed) return 'Date TBD';
  return parsed.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatShortDate = (value: string | null | undefined): string => {
  const parsed = parseEventDate(value);
  if (!parsed) return 'TBD';
  return parsed.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (value: string | null | undefined): string | null => {
  if (!value) return null;
  const [hours, minutes] = value.split(':');
  if (hours === undefined || minutes === undefined) return null;
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
};

const formatTimeRange = (start: string | null | undefined, end: string | null | undefined): string => {
  const formattedStart = formatTime(start);
  const formattedEnd = formatTime(end);

  if (formattedStart && formattedEnd) {
    return `${formattedStart} – ${formattedEnd}`;
  }
  if (formattedStart) return formattedStart;
  if (formattedEnd) return formattedEnd;
  return 'Time TBD';
};

const formatText = (value: string | null | undefined, fallback = 'Not specified'): string => {
  if (!value) return fallback;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback;
};

const determineEventStatus = (value: string | null | undefined): 'upcoming' | 'past' | 'unknown' => {
  const parsed = parseEventDate(value);
  if (!parsed) return 'unknown';
  const today = new Date();
  parsed.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return parsed >= today ? 'upcoming' : 'past';
};

const STATUS_STYLES: Record<'upcoming' | 'past' | 'unknown', { label: string; badge: string; ring: string }> = {
  upcoming: {
    label: 'Upcoming',
    badge: 'bg-emerald-500/20 text-emerald-200',
    ring: 'ring-emerald-500/40',
  },
  past: {
    label: 'Completed',
    badge: 'bg-red-500/20 text-red-200',
    ring: 'ring-red-500/40',
  },
  unknown: {
    label: 'Scheduled',
    badge: 'bg-slate-500/20 text-slate-200',
    ring: 'ring-slate-500/40',
  },
};

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const {
    events,
    fetchEvents,
    isEventLoading,
    teamMembers,
    fetchTeamMembers,
    fetchTeamAssignments,
    fetchTrafficControls,
    fetchSupervisors,
    teamAssignments,
    trafficControls,
    supervisors,
  } = useSupabaseStore();

  useEffect(() => {
    if (!events.length) {
      fetchEvents().catch((error: unknown) => {
        console.error('Error loading events:', error);
      });
    }
  }, [events.length, fetchEvents]);

  useEffect(() => {
    if (!teamMembers.length) {
      fetchTeamMembers().catch((error: unknown) => {
        console.error('Error loading team members:', error);
      });
    }
  }, [teamMembers.length, fetchTeamMembers]);

  const eventId = params.id;
  const event = events.find((item) => item.event_id === eventId);

  useEffect(() => {
    if (!eventId) {
      return;
    }
    const loadRelated = async () => {
      try {
        await Promise.all([
          fetchTeamAssignments(eventId),
          fetchTrafficControls(eventId),
          fetchSupervisors(eventId),
        ]);
      } catch (error) {
        console.error('Error loading event relationships:', error);
      }
    };

    loadRelated();
  }, [eventId, fetchTeamAssignments, fetchTrafficControls, fetchSupervisors]);

  const eventAssignments = useMemo(() => {
    if (!eventId) return [];
    return teamAssignments
      .filter((assignment) => assignment.event_id === eventId)
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [eventId, teamAssignments]);

  const eventTraffic = useMemo(() => {
    if (!eventId) return [];
    return trafficControls
      .filter((control) => control.event_id === eventId)
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [eventId, trafficControls]);

  const eventSupervisors = useMemo(() => {
    if (!eventId) return [];
    return supervisors
      .filter((supervisor) => supervisor.event_id === eventId)
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [eventId, supervisors]);

  const getMemberName = (memberId: string | null | undefined): string => {
    if (!memberId) return 'Not specified';
    const match = teamMembers.find((member) => member.member_id === memberId);
    return match ? match.member_name : 'Not specified';
  };

  const handleExport = () => {
    if (!event) return;
    exportEventToPDF({
      event,
      teamMembers,
      teamAssignments: eventAssignments,
      trafficControls: eventTraffic,
      supervisors: eventSupervisors,
    });
  };

  if (!event && isEventLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-gradient-to-br from-[#001a24] via-[#003446] to-[#002233]">
        <div className="text-center text-slate-200">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#e9d29a]" />
          <p className="mt-4 text-sm text-[#d0d6db]">Loading event...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#001a24] via-[#003446] to-[#002233] text-slate-100">
        <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
            <Calendar className="h-12 w-12 text-[#e9d29a]" />
          </div>
          <h2 className="mt-6 text-3xl font-semibold">Event not found</h2>
          <p className="mt-3 max-w-md text-sm text-[#d0d6db]">
            The event you are looking for may have been deleted or is unavailable. Return to the events list to continue planning.
          </p>
          <Link
            href="/events"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#004d66] to-[#003446] px-6 py-3 text-sm font-semibold text-[#e6e7e8] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:opacity-90"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  const eventStatus = determineEventStatus(event.event_date);
  const { badge: statusBadge, label: statusLabel, ring: statusRing } = STATUS_STYLES[eventStatus];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001a24] via-[#003446] to-[#002233] text-slate-100">
      <main className="mx-auto w-full max-w-6xl px-6 py-12 lg:px-10">
        {/* Hero */}
        <div className="mb-10 overflow-hidden rounded-3xl border border-[#004d66] bg-gradient-to-r from-white/10 via-white/5 to-transparent p-8 text-[#f5f6f7] shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/events"
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#e9d29a] transition hover:bg-white/20"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Events
                </Link>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusBadge}`}>{statusLabel}</span>
              </div>

              <div>
                <h1 className="text-4xl font-semibold italic text-[#fdfbf7]">{event.event_name}</h1>
                <p className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[#d0d6db]">
                  <span className="inline-flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#e9d29a]" />
                    {formatEventDate(event.event_date)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#e9d29a]" />
                    {formatTimeRange(event.start_time, event.end_time)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#e9d29a]" />
                    {formatText(event.location, 'Location TBD')}
                  </span>
                </p>
              </div>

              <div className="grid gap-4 text-sm text-[#d0d6db] md:grid-cols-3">
                <div className="rounded-2xl bg-white/10 p-4 shadow-inner">
                  <p className="text-xs uppercase tracking-wide text-[#94a7b5]">Team Meet</p>
                  <p className="mt-2 flex items-center gap-2 text-base font-medium text-white">
                    <Clock className="h-4 w-4 text-[#e9d29a]" />
                    {formatTime(event.team_meet_time) ?? 'Time TBD'}
                  </p>
                  <p className="mt-2 text-xs text-[#d0d6db]">Meet at {formatText(event.meet_location, 'Location TBD')}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 shadow-inner">
                  <p className="text-xs uppercase tracking-wide text-[#94a7b5]">Prepared By</p>
                  <p className="mt-2 text-base font-medium text-white">{formatText(event.prepared_by, 'Unassigned')}</p>
                  <p className="mt-2 text-xs text-[#d0d6db]">Updated {formatShortDate(event.prepared_date)}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4 shadow-inner">
                  <p className="text-xs uppercase tracking-wide text-[#94a7b5]">Notes</p>
                  <p className="mt-2 text-sm text-white/90">{formatText(event.notes, 'No additional notes')}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:w-56">
              <Link
                href={`/events/${event.event_id}/edit`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#004d66] to-[#003446] px-5 py-2.5 text-sm font-semibold text-[#e6e7e8] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:opacity-90"
              >
                <Edit className="h-4 w-4" />
                Edit Event
              </Link>
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[rgba(233,210,154,0.25)] to-[rgba(233,210,154,0.15)] px-5 py-2.5 text-sm font-semibold text-[#e9d29a] transition hover:from-[rgba(233,210,154,0.35)] hover:to-[rgba(233,210,154,0.25)]"
              >
                <FileText className="h-4 w-4" />
                Export PDF
              </button>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <section className="mb-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Link
            href={`/events/${event.event_id}/assignments`}
            className="group overflow-hidden rounded-3xl border border-[#004d66] bg-gradient-to-br from-[rgba(0,52,70,0.55)] via-[rgba(0,36,53,0.42)] to-[rgba(0,36,53,0.32)] p-6 text-[#f5f6f7] shadow-[0_18px_36px_rgba(0,0,0,0.45)] transition hover:translate-y-[-2px] hover:shadow-[0_22px_40px_rgba(0,0,0,0.55)]"
          >
            <div className="mb-5 inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#e9d29a]">
              <Users className="h-4 w-4" />
              Assignments
            </div>
            <h3 className="text-xl font-semibold text-white">Manage Team Coverage</h3>
            <p className="mt-3 text-sm text-[#d0d6db]">Create and refine assignments so every post has coverage.</p>
            <p className="mt-4 text-xs uppercase tracking-wide text-[#e9d29a]">Go to assignments →</p>
          </Link>

          <Link
            href={`/events/${event.event_id}/traffic-control`}
            className="group overflow-hidden rounded-3xl border border-[#004d66] bg-gradient-to-br from-[rgba(0,52,70,0.55)] via-[rgba(0,36,53,0.42)] to-[rgba(0,36,53,0.32)] p-6 text-[#f5f6f7] shadow-[0_18px_36px_rgba(0,0,0,0.45)] transition hover:translate-y-[-2px] hover:shadow-[0_22px_40px_rgba(0,0,0,0.55)]"
          >
            <div className="mb-5 inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#e9d29a]">
              <Car className="h-4 w-4" />
              Traffic Control
            </div>
            <h3 className="text-xl font-semibold text-white">Coordinate Traffic Posts</h3>
            <p className="mt-3 text-sm text-[#d0d6db]">Assign deputies, vehicles, and coverage areas for ingress and egress.</p>
            <p className="mt-4 text-xs uppercase tracking-wide text-[#e9d29a]">Manage traffic →</p>
          </Link>

          <Link
            href={`/events/${event.event_id}/supervisors`}
            className="group overflow-hidden rounded-3xl border border-[#004d66] bg-gradient-to-br from-[rgba(0,52,70,0.55)] via-[rgba(0,36,53,0.42)] to-[rgba(0,36,53,0.32)] p-6 text-[#f5f6f7] shadow-[0_18px_36px_rgba(0,0,0,0.45)] transition hover:translate-y-[-2px] hover:shadow-[0_22px_40px_rgba(0,0,0,0.55)]"
          >
            <div className="mb-5 inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#e9d29a]">
              <ShieldCheck className="h-4 w-4" />
              Supervisors
            </div>
            <h3 className="text-xl font-semibold text-white">Confirm Command Staff</h3>
            <p className="mt-3 text-sm text-[#d0d6db]">Document supervisory contacts so everyone knows the chain of command.</p>
            <p className="mt-4 text-xs uppercase tracking-wide text-[#e9d29a]">Manage supervisors →</p>
          </Link>
        </section>

        {/* Supervisors */}
        <section className="mb-10 rounded-3xl border border-[#004d66] bg-gradient-to-br from-[rgba(0,52,70,0.45)] via-[rgba(0,36,53,0.35)] to-[rgba(0,36,53,0.28)] p-6 text-[#f5f6f7] shadow-[0_18px_36px_rgba(0,0,0,0.45)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-[#e9d29a]">Supervisors</h2>
            <span className="text-xs uppercase tracking-wide text-[#d0d6db]">
              {eventSupervisors.length} supervisor{eventSupervisors.length === 1 ? '' : 's'} assigned
            </span>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {eventSupervisors.length ? (
              eventSupervisors.map((supervisor, index) => (
                <div
                  key={supervisor.supervisor_id ?? index}
                  className={`rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-[#f5f6f7] ${statusRing}`}
                >
                  <p className="text-xs uppercase tracking-wide text-[#94a7b5]">Supervisor {index + 1}</p>
                  <p className="mt-2 text-base font-medium text-white">{formatText(supervisor.supervisor_name, 'Unnamed supervisor')}</p>
                  <p className="mt-2 text-xs text-[#d0d6db]">Phone: {formatText(supervisor.phone, '—')}</p>
                  <p className="text-xs text-[#d0d6db]">Email: {formatText(supervisor.email, '—')}</p>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-[#d0d6db]">
                No supervisors recorded yet.
              </div>
            )}
          </div>
        </section>

        {/* Team assignments */}
        <section className="mb-10 rounded-3xl border border-[#004d66] bg-gradient-to-br from-[rgba(0,52,70,0.45)] via-[rgba(0,36,53,0.35)] to-[rgba(0,36,53,0.28)] p-6 text-[#f5f6f7] shadow-[0_18px_36px_rgba(0,0,0,0.45)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-[#e9d29a]">Team Assignments</h2>
              <p className="text-xs uppercase tracking-wide text-[#d0d6db]">{eventAssignments.length} assignment{eventAssignments.length === 1 ? '' : 's'} published</p>
            </div>
            <Link
              href={`/events/${event.event_id}/assignments`}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#e9d29a] transition hover:bg-white/20"
            >
              <ClipboardList className="h-4 w-4" />
              Update assignments
            </Link>
          </div>

          {eventAssignments.length ? (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
              <table className="min-w-full divide-y divide-white/10 text-sm">
                <thead className="bg-white/5 text-xs uppercase tracking-wide text-[#e9d29a]">
                  <tr>
                    <th className="px-5 py-3 text-left">Team Member</th>
                    <th className="px-5 py-3 text-left">Assignment</th>
                    <th className="px-5 py-3 text-left">Equipment / Area</th>
                    <th className="px-5 py-3 text-left">Hours</th>
                    <th className="px-5 py-3 text-left">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {eventAssignments.map((assignment) => (
                    <tr key={assignment.assignment_id} className="transition hover:bg-white/5">
                      <td className="px-5 py-3 text-[#f5f6f7]">{getMemberName(assignment.member_id)}</td>
                      <td className="px-5 py-3 text-[#d0d6db]">{formatText(assignment.assignment_type, '—')}</td>
                      <td className="px-5 py-3 text-[#d0d6db]">{formatText(assignment.equipment_area, '—')}</td>
                      <td className="px-5 py-3 text-[#d0d6db]">{formatTimeRange(assignment.start_time, assignment.end_time)}</td>
                      <td className="px-5 py-3 text-[#d0d6db]">{formatText(assignment.notes, '—')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-[#d0d6db]">
              No assignments recorded yet. Add staffing coverage from the assignments page.
            </div>
          )}
        </section>

        {/* Traffic control */}
        <section className="mb-4 rounded-3xl border border-[#004d66] bg-gradient-to-br from-[rgba(0,52,70,0.45)] via-[rgba(0,36,53,0.35)] to-[rgba(0,36,53,0.28)] p-6 text-[#f5f6f7] shadow-[0_18px_36px_rgba(0,0,0,0.45)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-[#e9d29a]">Traffic Control</h2>
              <p className="text-xs uppercase tracking-wide text-[#d0d6db]">{eventTraffic.length} post{eventTraffic.length === 1 ? '' : 's'} planned</p>
            </div>
            <Link
              href={`/events/${event.event_id}/traffic-control`}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#e9d29a] transition hover:bg-white/20"
            >
              <Car className="h-4 w-4" />
              Update traffic plan
            </Link>
          </div>

          {eventTraffic.length ? (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
              <table className="min-w-full divide-y divide-white/10 text-sm">
                <thead className="bg-white/5 text-xs uppercase tracking-wide text-[#e9d29a]">
                  <tr>
                    <th className="px-5 py-3 text-left">Staff Member</th>
                    <th className="px-5 py-3 text-left">Patrol Vehicle</th>
                    <th className="px-5 py-3 text-left">Area Assignment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {eventTraffic.map((control) => (
                    <tr key={control.traffic_id} className="transition hover:bg-white/5">
                      <td className="px-5 py-3 text-[#f5f6f7]">
                        {formatText(control.staff_name, getMemberName(control.member_id))}
                      </td>
                      <td className="px-5 py-3 text-[#d0d6db]">{formatText(control.patrol_vehicle, '—')}</td>
                      <td className="px-5 py-3 text-[#d0d6db]">{formatText(control.area_assignment, '—')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-[#d0d6db]">
              No traffic control assignments recorded yet. Configure details from the traffic control page.
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
