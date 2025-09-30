'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Calendar,
  Users,
  Settings,
  ChevronDown,
  ChevronUp,
  Plus,
  Loader2,
  TrafficCone,
  Tag,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { useAuth } from '@/components/auth/auth-provider';
import LoginForm from '@/components/auth/login-form';
import { useSupabaseStore } from '@/stores/supabase-store';
import type { Event, TeamAssignment, TrafficControl, Supervisor } from '@/types';

interface CollapsibleSectionProps {
  title: string;
  icon?: LucideIcon;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  footerAction?: ReactNode;
}

const CollapsibleSection = ({
  title,
  icon: Icon,
  isExpanded,
  onToggle,
  children,
  footerAction,
}: CollapsibleSectionProps) => (
  <div className="mb-3 text-[#e6e7e8]">
    <button
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-white/5"
    >
      <span className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4" />}
        {title}
      </span>
      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </button>
    {isExpanded && (
      <div className="mt-2 space-y-1.5 pl-6 text-sm text-[#b8b9ba]">
        {children}
        {footerAction && <div className="pt-2 text-xs text-[#e6e7e8]">{footerAction}</div>}
      </div>
    )}
  </div>
);

const parseEventDate = (eventDate: string | null | undefined): Date | null => {
  if (!eventDate) return null;
  const parsed = new Date(eventDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatEventDate = (eventDate: string | null | undefined): string => {
  const parsed = parseEventDate(eventDate);
  if (!parsed) return 'Date TBD';
  return parsed.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatShortDate = (eventDate: string | null | undefined): string => {
  const parsed = parseEventDate(eventDate);
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

const formatTimeRange = (
  start: string | null | undefined,
  end: string | null | undefined,
): string => {
  const formattedStart = formatTime(start);
  const formattedEnd = formatTime(end);

  if (formattedStart && formattedEnd) {
    return `${formattedStart} – ${formattedEnd}`;
  }

  if (formattedStart) return `${formattedStart}`;
  if (formattedEnd) return `${formattedEnd}`;
  return 'Time TBD';
};

const deriveSupervisorName = (supervisors: Supervisor[] | undefined, event: Event): string => {
  if (supervisors && supervisors.length > 0) {
    return supervisors[0]?.supervisor_name ?? 'Supervisor TBD';
  }

  if (event.prepared_by) return event.prepared_by;
  return 'Supervisor TBD';
};

const buildTrafficDisplayName = (
  control: TrafficControl,
  teamMemberById: Map<string, string>,
): string | null => {
  if (control.staff_name && control.staff_name.trim()) {
    return control.staff_name.trim();
  }

  if (control.member_id) {
    const match = teamMemberById.get(control.member_id);
    if (match) return match;
  }

  return null;
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const {
    events,
    teamMembers,
    assignmentCategories,
    teamAssignments,
    trafficControls,
    supervisors,
    fetchEvents,
    fetchTeamMembers,
    fetchAssignmentCategories,
    fetchTeamAssignments,
    fetchTrafficControls,
    fetchSupervisors,
    isEventLoading,
    isTeamMembersLoading,
  } = useSupabaseStore();

  const [eventsExpanded, setEventsExpanded] = useState(true);
  const [teamExpanded, setTeamExpanded] = useState(true);
  const [trafficExpanded, setTrafficExpanded] = useState(false);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);

  const hydratedEventIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      return;
    }

    fetchEvents().catch((error: unknown) => {
      console.error('Error loading events:', error);
    });
    fetchTeamMembers().catch((error: unknown) => {
      console.error('Error loading team members:', error);
    });
    fetchAssignmentCategories().catch((error: unknown) => {
      console.error('Error loading categories:', error);
    });
  }, [user, fetchEvents, fetchTeamMembers, fetchAssignmentCategories]);

  useEffect(() => {
    if (!user || events.length === 0) {
      return;
    }

    const eventsToHydrate = [...events]
      .sort((a, b) => {
        const aDate = parseEventDate(a.event_date)?.getTime() ?? Number.POSITIVE_INFINITY;
        const bDate = parseEventDate(b.event_date)?.getTime() ?? Number.POSITIVE_INFINITY;
        return aDate - bDate;
      })
      .slice(0, 6);

    eventsToHydrate.forEach((event) => {
      if (hydratedEventIdsRef.current.has(event.event_id)) {
        return;
      }

      hydratedEventIdsRef.current.add(event.event_id);

      fetchTeamAssignments(event.event_id).catch((error: unknown) => {
        console.error('Error loading assignments:', error);
      });
      fetchTrafficControls(event.event_id).catch((error: unknown) => {
        console.error('Error loading traffic controls:', error);
      });
      fetchSupervisors(event.event_id).catch((error: unknown) => {
        console.error('Error loading supervisors:', error);
      });
    });
  }, [user, events, fetchTeamAssignments, fetchTrafficControls, fetchSupervisors]);

  const teamMemberById = useMemo(() => {
    const map = new Map<string, string>();
    teamMembers.forEach((member) => {
      map.set(member.member_id, member.member_name);
    });
    return map;
  }, [teamMembers]);

  const assignmentsByEvent = useMemo(() => {
    const map = new Map<string, TeamAssignment[]>();
    teamAssignments.forEach((assignment) => {
      const existing = map.get(assignment.event_id) ?? [];
      existing.push(assignment);
      map.set(assignment.event_id, existing);
    });
    return map;
  }, [teamAssignments]);

  const trafficByEvent = useMemo(() => {
    const map = new Map<string, TrafficControl[]>();
    trafficControls.forEach((control) => {
      const existing = map.get(control.event_id) ?? [];
      existing.push(control);
      map.set(control.event_id, existing);
    });
    return map;
  }, [trafficControls]);

  const supervisorsByEvent = useMemo(() => {
    const map = new Map<string, Supervisor[]>();
    supervisors.forEach((supervisor) => {
      const existing = map.get(supervisor.event_id) ?? [];
      existing.push(supervisor);
      map.set(supervisor.event_id, existing);
    });
    return map;
  }, [supervisors]);

  const upcomingEvents = useMemo(() => {
    if (!events.length) return [] as Event[];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = events.filter((event) => {
      const parsed = parseEventDate(event.event_date);
      if (!parsed) return true;
      parsed.setHours(0, 0, 0, 0);
      return parsed >= today;
    });

    if (!upcoming.length) {
      return [...events].sort((a, b) => {
        const aDate = parseEventDate(a.event_date)?.getTime() ?? Number.POSITIVE_INFINITY;
        const bDate = parseEventDate(b.event_date)?.getTime() ?? Number.POSITIVE_INFINITY;
        return aDate - bDate;
      });
    }

    return upcoming.sort((a, b) => {
      const aDate = parseEventDate(a.event_date)?.getTime() ?? Number.POSITIVE_INFINITY;
      const bDate = parseEventDate(b.event_date)?.getTime() ?? Number.POSITIVE_INFINITY;
      return aDate - bDate;
    });
  }, [events]);

  const activeMembers = useMemo(
    () => teamMembers.filter((member) => member.active),
    [teamMembers],
  );

  const assignmentsTableData = useMemo(() => {
    const rows: {
      key: string;
      memberName: string;
      eventName: string;
      eventDate: string;
      hours: string;
      eventId: string;
    }[] = [];

    upcomingEvents.forEach((event) => {
      const assignments = assignmentsByEvent.get(event.event_id) ?? [];
      assignments.forEach((assignment) => {
        const memberName = assignment.member_id ? (teamMemberById.get(assignment.member_id) ?? 'Unassigned') : 'Unassigned';
        rows.push({
          key: `${event.event_id}-${assignment.assignment_id}`,
          memberName,
          eventName: event.event_name,
          eventDate: formatShortDate(event.event_date),
          hours: formatTimeRange(assignment.start_time, assignment.end_time),
          eventId: event.event_id,
        });
      });
    });

    return rows.sort((a, b) => a.eventName.localeCompare(b.eventName));
  }, [assignmentsByEvent, upcomingEvents, teamMemberById]);

  const trafficSidebarEntries = useMemo(() => {
    const entries: { name: string; eventName: string; eventId: string }[] = [];

    upcomingEvents.forEach((event) => {
      const controls = trafficByEvent.get(event.event_id) ?? [];
      controls.forEach((control) => {
        const name = buildTrafficDisplayName(control, teamMemberById);
        if (!name) return;
        entries.push({
          name,
          eventName: event.event_name,
          eventId: event.event_id,
        });
      });
    });

    return entries.slice(0, 6);
  }, [trafficByEvent, upcomingEvents, teamMemberById]);

  const categoriesSidebar = useMemo(() => assignmentCategories.slice(0, 8), [assignmentCategories]);

  const isLoadingDashboard = authLoading || (user ? isEventLoading || isTeamMembersLoading : false);

  if (authLoading || isLoadingDashboard) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center text-slate-200">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-300" />
          <p className="mt-4 text-sm text-slate-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm className="mt-12" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001a24] via-[#003446] to-[#002233] text-slate-100">
      <div className="flex">
        <aside className="fixed left-0 top-0 hidden h-screen w-80 shrink-0 flex-col border-r border-[#004d66] bg-gradient-to-b from-[#002535] to-[#003446] px-6 py-6 lg:flex">
          <div className="mb-10">
            <h1 className="text-3xl font-bold italic tracking-wide text-[#e9d29a]">S.C.O.P.E.</h1>
            <p className="mt-1 text-xs uppercase tracking-[0.35em] text-[#e6e7e8]">Event Assignments</p>
          </div>

          <Link
            href="/events/create"
            className="mb-8 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#004d66] to-[#003446] px-4 py-3 text-sm font-semibold text-[#e6e7e8] shadow-[0_4px_12px_rgba(0,0,0,0.35)] transition hover:opacity-90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Link>

          <nav className="flex-1 overflow-y-auto pr-2">
            <CollapsibleSection
              title={`Events (${events.length})`}
              icon={Calendar}
              isExpanded={eventsExpanded}
              onToggle={() => setEventsExpanded((prev) => !prev)}
              footerAction={
                <Link href="/events" className="inline-flex items-center gap-1 text-[#e9d29a] hover:text-[#f3e1b9]">
                  View all events
                </Link>
              }
            >
              {upcomingEvents.slice(0, 6).map((event) => (
                <Link
                  key={event.event_id}
                  href={`/events/${event.event_id}`}
                  className="group block rounded-lg px-3 py-2 transition hover:bg-white/5"
                >
                  <p className="text-sm text-[#e6e7e8] group-hover:text-white">{event.event_name}</p>
                  <p className="text-xs uppercase tracking-wide text-[#94a7b5]">
                    {formatShortDate(event.event_date)}
                  </p>
                </Link>
              ))}
              {events.length === 0 && (
                <p className="px-3 py-2 text-xs italic text-[#94a7b5]">No events yet.</p>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title={`Team Members (${activeMembers.length})`}
              icon={Users}
              isExpanded={teamExpanded}
              onToggle={() => setTeamExpanded((prev) => !prev)}
              footerAction={
                <Link href="/team-members" className="inline-flex items-center gap-1 text-[#e9d29a] hover:text-[#f3e1b9]">
                  Manage team members
                </Link>
              }
            >
              {activeMembers.slice(0, 8).map((member) => (
                <Link
                  key={member.member_id}
                  href="/team-members"
                  className="group block rounded-lg px-3 py-2 transition hover:bg-white/5"
                >
                  <span className="text-sm text-[#e6e7e8] group-hover:text-white">{member.member_name}</span>
                </Link>
              ))}
              {activeMembers.length === 0 && (
                <p className="px-3 py-2 text-xs italic text-[#94a7b5]">No active members.</p>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title={`Traffic Control (${trafficSidebarEntries.length})`}
              icon={TrafficCone}
              isExpanded={trafficExpanded}
              onToggle={() => setTrafficExpanded((prev) => !prev)}
            >
              {trafficSidebarEntries.length ? (
                trafficSidebarEntries.map((entry, index) => (
                  <Link
                    key={`${entry.eventId}-${index}`}
                    href={`/events/${entry.eventId}/traffic-control`}
                    className="group block rounded-lg px-3 py-2 transition hover:bg-white/5"
                  >
                    <p className="text-sm text-[#e6e7e8] group-hover:text-white">{entry.name}</p>
                    <p className="text-xs uppercase tracking-wide text-[#94a7b5]">{entry.eventName}</p>
                  </Link>
                ))
              ) : (
                <p className="px-3 py-2 text-xs italic text-[#94a7b5]">No traffic assignments.</p>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title={`Categories (${assignmentCategories.length})`}
              icon={Tag}
              isExpanded={categoriesExpanded}
              onToggle={() => setCategoriesExpanded((prev) => !prev)}
              footerAction={
                <Link href="/settings" className="inline-flex items-center gap-1 text-[#e9d29a] hover:text-[#f3e1b9]">
                  Manage categories
                </Link>
              }
            >
              {categoriesSidebar.map((category) => (
                <Link
                  key={category}
                  href="/settings"
                  className="group block rounded-lg px-3 py-2 text-sm text-[#b8b9ba] transition hover:bg-white/5 hover:text-white"
                >
                  {category}
                </Link>
              ))}
              {categoriesSidebar.length === 0 && (
                <p className="px-3 py-2 text-xs italic text-[#94a7b5]">No categories yet.</p>
              )}
            </CollapsibleSection>
          </nav>

          <Link
            href="/settings"
            className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#002535] to-[#003446] px-4 py-3 text-sm font-semibold text-[#e9d29a] shadow-[0_4px_12px_rgba(0,0,0,0.25)] transition hover:opacity-90"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </aside>

        <main className="ml-0 flex min-h-screen flex-1 flex-col lg:ml-80">
          <div className="px-6 py-10 lg:px-12">
            <div className="mb-10 rounded-3xl bg-gradient-to-r from-white/10 via-white/5 to-transparent p-8 text-[#f5f6f7] shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur">
              <p className="text-sm uppercase tracking-[0.4em] text-[#e9d29a]">Dashboard</p>
              <h2 className="mt-4 text-4xl font-semibold italic">Event Staffing Overview</h2>
              <p className="mt-3 max-w-2xl text-sm text-[#d0d6db]">
                Monitor upcoming events, confirm team coverage, and keep traffic control coordinated—all from one place.
              </p>
            </div>

            <section className="mb-14">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-2xl font-semibold uppercase tracking-wide text-[#e9d29a]">
                  Upcoming Events
                </h3>
                <Link href="/events" className="text-sm font-medium text-[#e9d29a] transition hover:text-[#f3e1b9]">
                  View schedule →
                </Link>
              </div>

              <div className="flex flex-wrap gap-6">
                {upcomingEvents.slice(0, 4).map((event) => {
                  const assignments = assignmentsByEvent.get(event.event_id) ?? [];
                  const assignedNames = assignments
                    .map((assignment) => (assignment.member_id ? teamMemberById.get(assignment.member_id) : null))
                    .filter((value, index, array): value is string => Boolean(value) && array.indexOf(value) === index);

                  const eventTraffic = trafficByEvent.get(event.event_id) ?? [];
                  const trafficLead = eventTraffic.length
                    ? buildTrafficDisplayName(eventTraffic[0], teamMemberById)
                    : null;

                  const supervisorName = deriveSupervisorName(
                    supervisorsByEvent.get(event.event_id),
                    event,
                  );

                  return (
                    <div
                      key={event.event_id}
                      className="w-full max-w-sm rounded-2xl border border-[#004d66] bg-gradient-to-br from-[rgba(0,52,70,0.45)] via-[rgba(0,36,53,0.35)] to-[rgba(0,36,53,0.25)] text-slate-900 shadow-[0_20px_35px_rgba(0,0,0,0.45)]"
                    >
                      <div className="flex items-start justify-between rounded-t-2xl bg-gradient-to-r from-[rgba(0,52,70,0.9)] to-[rgba(0,77,102,0.85)] px-4 py-3">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-[#f5f1e6]">Event</p>
                          <Link
                            href={`/events/${event.event_id}`}
                            className="text-lg font-semibold text-[#e9d29a] transition hover:text-[#f7e7be]"
                          >
                            {event.event_name}
                          </Link>
                        </div>
                        <Calendar className="h-5 w-5 text-[#f5f1e6]" />
                      </div>

                      <div className="space-y-4 px-5 pb-5 pt-4 text-sm">
                        <div className="rounded-xl bg-white/90 p-4 shadow-inner">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date &amp; Time</p>
                          <p className="mt-1 font-medium text-slate-800">{formatEventDate(event.event_date)}</p>
                          <p className="text-xs text-slate-600">
                            {formatTimeRange(event.start_time, event.end_time)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white/90 p-4 shadow-inner">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Supervisor</p>
                          <p className="mt-1 font-medium text-slate-800">{supervisorName}</p>
                        </div>

                        <div className="rounded-xl bg-white/90 p-4 shadow-inner">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assigned Team</p>
                          {assignedNames.length ? (
                            <ul className="mt-1 space-y-1 text-slate-800">
                              {assignedNames.slice(0, 4).map((name) => (
                                <li key={name}>{name}</li>
                              ))}
                              {assignedNames.length > 4 && (
                                <li className="text-xs text-blue-600">
                                  +{assignedNames.length - 4} more
                                </li>
                              )}
                            </ul>
                          ) : (
                            <p className="mt-1 text-xs italic text-slate-600">No assignments yet.</p>
                          )}
                        </div>

                        <div className="rounded-xl bg-white/90 p-4 shadow-inner">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Traffic</p>
                          <p className="mt-1 font-medium text-slate-800">{trafficLead ?? 'Unassigned'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {upcomingEvents.length === 0 && (
                  <div className="w-full rounded-2xl border border-dashed border-[#004d66] bg-white/10 p-8 text-center text-sm text-slate-200">
                    No upcoming events. <Link href="/events/create" className="text-[#e9d29a] underline">Create one now</Link>.
                  </div>
                )}
              </div>
            </section>

            <section>
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-2xl font-semibold uppercase tracking-wide text-[#e9d29a]">
                  Team Assignments
                </h3>
                <div className="flex items-center gap-3">
                  <Link
                    href="/events"
                    className="text-sm font-medium text-[#e9d29a] transition hover:text-[#f3e1b9]"
                  >
                    View events
                  </Link>
                  <Link
                    href="/team-members"
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#004d66] to-[#003446] px-4 py-2 text-sm font-semibold text-[#e6e7e8] shadow-[0_4px_12px_rgba(0,0,0,0.3)] transition hover:opacity-90"
                  >
                    <Plus className="h-4 w-4" />
                    Add Team Member
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-[#004d66] bg-gradient-to-br from-[rgba(0,52,70,0.45)] to-[rgba(0,36,53,0.3)] shadow-[0_20px_35px_rgba(0,0,0,0.45)]">
                <div className="max-h-[480px] overflow-x-auto">
                  <table className="min-w-full divide-y divide-[#004d66]/50 text-left text-sm text-[#e6e7e8]">
                    <thead className="sticky top-0 bg-gradient-to-r from-[rgba(0,52,70,0.95)] to-[rgba(0,77,102,0.9)] text-xs uppercase tracking-wide text-[#e9d29a]">
                      <tr>
                        <th className="px-6 py-4">Name</th>
                        <th className="px-6 py-4">Event</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignmentsTableData.length ? (
                        assignmentsTableData.map((row) => (
                          <tr
                            key={row.key}
                            className="border-b border-white/5 transition hover:bg-white/5"
                          >
                            <td className="px-6 py-3.5 text-sm text-[#f5f6f7]">{row.memberName}</td>
                            <td className="px-6 py-3.5 text-sm">
                              <Link
                                href={`/events/${row.eventId}`}
                                className="text-[#e9d29a] transition hover:text-[#f3e1b9]"
                              >
                                {row.eventName}
                              </Link>
                            </td>
                            <td className="px-6 py-3.5 text-sm text-[#d0d6db]">{row.eventDate}</td>
                            <td className="px-6 py-3.5 text-sm text-[#d0d6db]">{row.hours}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-sm text-[#94a7b5]">
                            No team assignments ready for review.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
