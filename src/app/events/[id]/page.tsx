'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  ListChecks,
  ListTodo,
  MapPin,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';

import { useSupabaseStore } from '@/stores/supabase-store';
import { exportEventToPDF } from '@/utils/pdf-export';
import type { TaskStatus } from '@/types';

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
  const router = useRouter();
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
    taskCategories,
    fetchTaskCategories,
    eventTasks,
    fetchEventTasks,
    createEventTask,
    updateEventTask,
    deleteEventTask,
    duplicateEventWithChildren,
    isEventTasksLoading,
    isTaskCategoriesLoading,
  } = useSupabaseStore();

  const [activeSection, setActiveSection] = useState('overview');
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [newTask, setNewTask] = useState({
    title: '',
    category_id: '',
    assignee_id: '',
    due_date: '',
    due_time: '',
    status: 'Not Started' as TaskStatus,
    description: '',
  });
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [taskStatusFilter, setTaskStatusFilter] = useState<'all' | TaskStatus>('all');
  const [isDuplicatingEvent, setIsDuplicatingEvent] = useState(false);

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

  useEffect(() => {
    fetchTaskCategories().catch((error: unknown) => {
      console.error('Error loading task categories:', error);
    });
  }, [fetchTaskCategories]);

  const eventId = params.id;
  const event = events.find((item) => item.event_id === eventId);

  useEffect(() => {
    if (!eventId) {
      return;
    }
    fetchEventTasks(eventId).catch((error: unknown) => {
      console.error('Error loading event tasks:', error);
    });
  }, [eventId, fetchEventTasks]);

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

  const eventTaskList = useMemo(() => {
    if (!eventId) return [];
    return eventTasks
      .filter((task) => task.event_id === eventId)
      .slice()
      .sort((a, b) => {
        if (a.sort_order === b.sort_order) {
          return a.created_at.localeCompare(b.created_at);
        }
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      });
  }, [eventId, eventTasks]);

  const filteredTasks = useMemo(() => {
    if (taskStatusFilter === 'all') {
      return eventTaskList;
    }
    return eventTaskList.filter((task) => task.status === taskStatusFilter);
  }, [eventTaskList, taskStatusFilter]);

  const taskStatusCounts = useMemo(() => {
    return eventTaskList.reduce(
      (acc, task) => {
        acc.total += 1;
        acc[task.status] = (acc[task.status] ?? 0) + 1;
        return acc;
      },
      { total: eventTaskList.length, 'Not Started': 0, 'In Progress': 0, Completed: 0 } as Record<'total' | TaskStatus, number>,
    );
  }, [eventTaskList]);

  const sections = useMemo(
    () => [
      { id: 'overview', label: 'Overview', icon: Calendar },
      { id: 'pre-event-tasks', label: 'Pre-Event Tasks', icon: ListChecks },
      { id: 'staffing', label: 'Staffing', icon: Users },
      { id: 'traffic', label: 'Traffic', icon: Car },
      { id: 'documents', label: 'Documents', icon: FileText },
    ],
    [],
  );

  const TASK_STATUS_OPTIONS: TaskStatus[] = ['Not Started', 'In Progress', 'Completed'];
  const TASK_STATUS_FILTERS: Array<{ id: 'all' | TaskStatus; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'Not Started', label: 'Not Started' },
    { id: 'In Progress', label: 'In Progress' },
    { id: 'Completed', label: 'Completed' },
  ];

  const registerSectionRef = (id: string) => (element: HTMLDivElement | null) => {
    sectionRefs.current[id] = element;
  };

  const handleSectionClick = (id: string) => {
    setActiveSection(id);
    const target = sectionRefs.current[id];
    if (target) {
      const offsetTop = target.getBoundingClientRect().top + window.scrollY - 96;
      window.scrollTo({ top: offsetTop, behavior: 'smooth' });
    }
  };

  const resetNewTask = () => {
    setNewTask({
      title: '',
      category_id: '',
      assignee_id: '',
      due_date: '',
      due_time: '',
      status: 'Not Started',
      description: '',
    });
  };

  const handleNewTaskFieldChange = (field: keyof typeof newTask, value: string) => {
    setNewTask((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleCreateTask = async (eventInstance: React.FormEvent<HTMLFormElement>) => {
    eventInstance.preventDefault();
    if (!eventId) return;
    const trimmedTitle = newTask.title.trim();
    if (!trimmedTitle) {
      return;
    }

    setIsCreatingTask(true);
    try {
      await createEventTask(eventId, {
        title: trimmedTitle,
        status: newTask.status,
        due_date: newTask.due_date || null,
        due_time: newTask.due_time || null,
        assignee_id: newTask.assignee_id || null,
        category_id: newTask.category_id || null,
        sort_order: eventTaskList.length + 1,
        description: newTask.description.trim() || null,
      });
      resetNewTask();
      setTaskStatusFilter('all');
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: Parameters<typeof updateEventTask>[1]) => {
    try {
      await updateEventTask(taskId, updates);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    if (!window.confirm('Remove this pre-event task?')) {
      return;
    }
    try {
      await deleteEventTask(taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleDuplicateEvent = async () => {
    if (!eventId || !event) {
      return;
    }
    setIsDuplicatingEvent(true);
    try {
      const duplicatedId = await duplicateEventWithChildren(eventId, {
        eventName: `${event.event_name} Copy`,
      });
      if (duplicatedId) {
        await fetchEvents();
        router.push(`/events/${duplicatedId}`);
      }
    } catch (error) {
      console.error('Error duplicating event:', error);
    } finally {
      setIsDuplicatingEvent(false);
    }
  };

  const getTaskCategory = (categoryId: string | null) => {
    if (!categoryId) return undefined;
    return taskCategories.find((category) => category.category_id === categoryId);
  };

  const getTaskCategoryLabel = (categoryId: string | null) => {
    const match = getTaskCategory(categoryId);
    return match ? match.name : 'Uncategorized';
  };

  const getTaskCategoryColor = (categoryId: string | null) => {
    const match = getTaskCategory(categoryId);
    return match ? match.color : '#64748B';
  };

  const getTaskDueDateLabel = (dueDate: string | null, dueTime: string | null) => {
    if (!dueDate && !dueTime) {
      return 'No deadline';
    }
    const parts: string[] = [];
    const parsedDate = parseEventDate(dueDate ?? undefined);
    if (parsedDate) {
      parts.push(parsedDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }));
    }
    if (dueTime) {
      const formatted = formatTime(dueTime);
      if (formatted) {
        parts.push(formatted);
      }
    }
    return parts.length ? parts.join(' • ') : 'No deadline';
  };

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
        <nav className="mb-10 flex flex-wrap gap-3 overflow-x-auto pb-2">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleSectionClick(id)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                activeSection === id
                  ? 'border-[#e9d29a] bg-[#e9d29a]/20 text-[#e9d29a]'
                  : 'border-white/10 bg-white/5 text-[#d0d6db] hover:border-[#e9d29a]/40 hover:text-[#e9d29a]'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </nav>

        <section ref={registerSectionRef('overview')} id="overview" className="mb-16 space-y-12">
          <div className="overflow-hidden rounded-3xl border border-[#004d66] bg-gradient-to-r from-white/10 via-white/5 to-transparent p-8 text-[#f5f6f7] shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur">
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

              <div className="flex flex-col gap-3 md:w-60">
                <Link
                  href={`/events/${event.event_id}/edit`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#004d66] to-[#003446] px-5 py-2.5 text-sm font-semibold text-[#e6e7e8] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:opacity-90"
                >
                  <Edit className="h-4 w-4" />
                  Edit Event
                </Link>
                <button
                  type="button"
                  onClick={handleDuplicateEvent}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-[#e9d29a] transition hover:border-[#e9d29a]/40 hover:text-[#ffe7b7] disabled:opacity-60"
                  disabled={isDuplicatingEvent}
                >
                  {isDuplicatingEvent ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ListTodo className="h-4 w-4" />
                  )}
                  Duplicate Event
                </button>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
          </div>
        </section>

        <section
          ref={registerSectionRef('pre-event-tasks')}
          id="pre-event-tasks"
          className="mb-16 rounded-3xl border border-[#004d66] bg-gradient-to-br from-[rgba(0,52,70,0.45)] via-[rgba(0,36,53,0.35)] to-[rgba(0,36,53,0.28)] p-6 text-[#f5f6f7] shadow-[0_18px_36px_rgba(0,0,0,0.45)]"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#e9d29a]">
                <ListChecks className="h-4 w-4" />
                Pre-Event Tasks
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-white">Stay ahead of event readiness</h2>
              <p className="mt-2 max-w-xl text-sm text-[#d0d6db]">
                Capture permits, outreach, and setup tasks so the team arrives ready. Assign owners, due dates, and track status without
                leaving the workspace.
              </p>
            </div>

            <div className="flex flex-col gap-1 text-xs uppercase tracking-wide text-[#d0d6db]">
              <span>Total: {taskStatusCounts.total}</span>
              <span className="text-[#f4b942]">In Progress: {taskStatusCounts['In Progress']}</span>
              <span className="text-emerald-200">Completed: {taskStatusCounts.Completed}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {TASK_STATUS_FILTERS.map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTaskStatusFilter(id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition ${
                    taskStatusFilter === id
                      ? 'border-[#e9d29a] bg-[#e9d29a]/20 text-[#e9d29a]'
                      : 'border-white/10 bg-white/5 text-[#d0d6db] hover:border-[#e9d29a]/40 hover:text-[#e9d29a]'
                  }`}
                >
                  {label}
                  {id === 'all' ? null : <span className="text-[10px] text-[#94a7b5]">{taskStatusCounts[id]}</span>}
                </button>
              ))}
            </div>
            {isEventTasksLoading ? <p className="text-xs uppercase tracking-wide text-[#d0d6db]">Syncing tasks...</p> : null}
          </div>

          <form onSubmit={handleCreateTask} className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="grid gap-4 md:grid-cols-5">
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase tracking-wide text-[#94a7b5]">Task title</label>
                <input
                  required
                  value={newTask.title}
                  onChange={(eventInstance) => handleNewTaskFieldChange('title', eventInstance.target.value)}
                  placeholder="e.g. Finalize road closure permits"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#001a24]/60 px-3 py-2 text-sm text-white outline-none transition focus:border-[#e9d29a] focus:ring-2 focus:ring-[#e9d29a]/30"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-[#94a7b5]">Category</label>
                <select
                  value={newTask.category_id}
                  onChange={(eventInstance) => handleNewTaskFieldChange('category_id', eventInstance.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#001a24]/60 px-3 py-2 text-sm text-white outline-none transition focus:border-[#e9d29a] focus:ring-2 focus:ring-[#e9d29a]/30"
                >
                  <option value="">Uncategorized</option>
                  {taskCategories.map((category) => (
                    <option key={category.category_id} value={category.category_id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-[#94a7b5]">Assignee</label>
                <select
                  value={newTask.assignee_id}
                  onChange={(eventInstance) => handleNewTaskFieldChange('assignee_id', eventInstance.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#001a24]/60 px-3 py-2 text-sm text-white outline-none transition focus:border-[#e9d29a] focus:ring-2 focus:ring-[#e9d29a]/30"
                >
                  <option value="">Unassigned</option>
                  {teamMembers
                    .filter((member) => member.active)
                    .map((member) => (
                      <option key={member.member_id} value={member.member_id}>
                        {member.member_name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-[#94a7b5]">Status</label>
                <select
                  value={newTask.status}
                  onChange={(eventInstance) => handleNewTaskFieldChange('status', eventInstance.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#001a24]/60 px-3 py-2 text-sm text-white outline-none transition focus:border-[#e9d29a] focus:ring-2 focus:ring-[#e9d29a]/30"
                >
                  {TASK_STATUS_OPTIONS.map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusOption}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <div>
                <label className="text-[10px] uppercase tracking-wide text-[#94a7b5]">Due date</label>
                <input
                  type="date"
                  value={newTask.due_date}
                  onChange={(eventInstance) => handleNewTaskFieldChange('due_date', eventInstance.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#001a24]/60 px-3 py-2 text-sm text-white outline-none transition focus:border-[#e9d29a] focus:ring-2 focus:ring-[#e9d29a]/30"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-[#94a7b5]">Due time</label>
                <input
                  type="time"
                  value={newTask.due_time}
                  onChange={(eventInstance) => handleNewTaskFieldChange('due_time', eventInstance.target.value)}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#001a24]/60 px-3 py-2 text-sm text-white outline-none transition focus:border-[#e9d29a] focus:ring-2 focus:ring-[#e9d29a]/30"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase tracking-wide text-[#94a7b5]">Details (optional)</label>
                <textarea
                  value={newTask.description}
                  onChange={(eventInstance) => handleNewTaskFieldChange('description', eventInstance.target.value)}
                  placeholder="Add quick context or links"
                  className="mt-2 h-20 w-full rounded-xl border border-white/10 bg-[#001a24]/60 px-3 py-2 text-sm text-white outline-none transition focus:border-[#e9d29a] focus:ring-2 focus:ring-[#e9d29a]/30"
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-wide text-[#94a7b5]">Press enter to capture a new task</p>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#004d66] to-[#003446] px-4 py-2 text-sm font-semibold text-[#e6e7e8] transition hover:opacity-90 disabled:opacity-50"
                disabled={isCreatingTask}
              >
                {isCreatingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add Task
              </button>
            </div>
          </form>

          <div className="mt-8 grid gap-4">
            {!filteredTasks.length && !isEventTasksLoading ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-[#d0d6db]">
                No pre-event tasks yet. Capture outreach, logistics, and follow-ups to keep the team aligned.
              </div>
            ) : null}

            {filteredTasks.map((task) => (
              <div key={task.task_id} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-[#d0d6db]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{task.title}</h3>
                    <p className="mt-1 text-xs uppercase tracking-wide text-[#94a7b5]">
                      Owner: <span className="text-[#f5f6f7]">{getMemberName(task.assignee_id)}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={task.status}
                      onChange={(eventInstance) =>
                        handleTaskUpdate(task.task_id, { status: eventInstance.target.value as TaskStatus })
                      }
                      className="rounded-full border border-white/10 bg-[#001a24]/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#e9d29a] outline-none transition focus:border-[#e9d29a]"
                    >
                      {TASK_STATUS_OPTIONS.map((statusOption) => (
                        <option key={statusOption} value={statusOption}>
                          {statusOption}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleTaskDelete(task.task_id)}
                      className="rounded-full border border-white/10 p-2 text-[#f5c6c6] transition hover:border-[#f5c6c6] hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: getTaskCategoryColor(task.category_id) }}
                    />
                    <div className="w-full">
                      <p className="text-[10px] uppercase tracking-wide text-[#94a7b5]">Category</p>
                      <select
                        value={task.category_id ?? ''}
                        onChange={(eventInstance) =>
                          handleTaskUpdate(task.task_id, {
                            category_id: eventInstance.target.value ? eventInstance.target.value : null,
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-white/10 bg-[#001a24]/60 px-3 py-2 text-xs text-white outline-none transition focus:border-[#e9d29a]"
                      >
                        <option value="">Uncategorized</option>
                        {taskCategories.map((category) => (
                          <option key={category.category_id} value={category.category_id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[#94a7b5]">Due date</p>
                    <input
                      type="date"
                      value={task.due_date ?? ''}
                      onChange={(eventInstance) =>
                        handleTaskUpdate(task.task_id, {
                          due_date: eventInstance.target.value || null,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-[#001a24]/60 px-3 py-2 text-xs text-white outline-none transition focus:border-[#e9d29a]"
                    />
                    <p className="mt-2 text-[11px] text-[#d0d6db]">{getTaskDueDateLabel(task.due_date, task.due_time)}</p>
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[#94a7b5]">Due time</p>
                    <input
                      type="time"
                      value={task.due_time ?? ''}
                      onChange={(eventInstance) =>
                        handleTaskUpdate(task.task_id, {
                          due_time: eventInstance.target.value || null,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-[#001a24]/60 px-3 py-2 text-xs text-white outline-none transition focus:border-[#e9d29a]"
                    />
                  </div>

                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-[#94a7b5]">Assignee</p>
                    <select
                      value={task.assignee_id ?? ''}
                      onChange={(eventInstance) =>
                        handleTaskUpdate(task.task_id, {
                          assignee_id: eventInstance.target.value || null,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-white/10 bg-[#001a24]/60 px-3 py-2 text-xs text-white outline-none transition focus:border-[#e9d29a]"
                    >
                      <option value="">Unassigned</option>
                      {teamMembers
                        .filter((member) => member.active)
                        .map((member) => (
                          <option key={member.member_id} value={member.member_id}>
                            {member.member_name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {task.description ? (
                  <p className="mt-4 text-sm text-[#cbd5db]">{task.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section
          ref={registerSectionRef('staffing')}
          id="staffing"
          className="mb-16 space-y-10 rounded-3xl border border-[#004d66] bg-gradient-to-br from-[rgba(0,52,70,0.45)] via-[rgba(0,36,53,0.35)] to-[rgba(0,36,53,0.28)] p-6 text-[#f5f6f7] shadow-[0_18px_36px_rgba(0,0,0,0.45)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-[#e9d29a]">Staffing Overview</h2>
              <p className="text-sm text-[#d0d6db]">Supervisors and team assignments ready for publishing.</p>
            </div>
            <span className="text-xs uppercase tracking-wide text-[#d0d6db]">
              {eventSupervisors.length} supervisor{eventSupervisors.length === 1 ? '' : 's'} • {eventAssignments.length} assignment{eventAssignments.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Supervisors</h3>
                <Link
                  href={`/events/${event.event_id}/supervisors`}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#e9d29a] transition hover:bg-white/20"
                >
                  Manage
                </Link>
              </div>
              <div className="mt-4 grid gap-4">
                {eventSupervisors.length ? (
                  eventSupervisors.map((supervisor, index) => (
                    <div
                      key={supervisor.supervisor_id ?? index}
                      className={`rounded-2xl border border-white/10 bg-[#001a24]/40 p-4 text-sm text-[#f5f6f7] ${statusRing}`}
                    >
                      <p className="text-xs uppercase tracking-wide text-[#94a7b5]">Supervisor {index + 1}</p>
                      <p className="mt-2 text-base font-medium text-white">{formatText(supervisor.supervisor_name, 'Unnamed supervisor')}</p>
                      <p className="mt-2 text-xs text-[#d0d6db]">Phone: {formatText(supervisor.phone, '—')}</p>
                      <p className="text-xs text-[#d0d6db]">Email: {formatText(supervisor.email, '—')}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-[#d0d6db]">
                    No supervisors recorded yet. Capture command staff so teams know who to contact on site.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Team Assignments</h3>
                <Link
                  href={`/events/${event.event_id}/assignments`}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#e9d29a] transition hover:bg-white/20"
                >
                  Update
                </Link>
              </div>

              {eventAssignments.length ? (
                <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
                  <table className="min-w-full divide-y divide-white/10 text-xs">
                    <thead className="bg-white/5 text-[10px] uppercase tracking-wide text-[#e9d29a]">
                      <tr>
                        <th className="px-4 py-3 text-left">Team Member</th>
                        <th className="px-4 py-3 text-left">Assignment</th>
                        <th className="px-4 py-3 text-left">Equipment / Area</th>
                        <th className="px-4 py-3 text-left">Hours</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {eventAssignments.map((assignment) => (
                        <tr key={assignment.assignment_id} className="transition hover:bg-white/5">
                          <td className="px-4 py-3 text-[#f5f6f7]">{getMemberName(assignment.member_id)}</td>
                          <td className="px-4 py-3 text-[#d0d6db]">{formatText(assignment.assignment_type, '—')}</td>
                          <td className="px-4 py-3 text-[#d0d6db]">{formatText(assignment.equipment_area, '—')}</td>
                          <td className="px-4 py-3 text-[#d0d6db]">{formatTimeRange(assignment.start_time, assignment.end_time)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-white/10 bg-white/5 p-6 text-sm text-[#d0d6db]">
                  No assignments recorded yet. Add staffing coverage from the assignments page.
                </div>
              )}
            </div>
          </div>
        </section>

        <section
          ref={registerSectionRef('traffic')}
          id="traffic"
          className="mb-16 rounded-3xl border border-[#004d66] bg-gradient-to-br from-[rgba(0,52,70,0.45)] via-[rgba(0,36,53,0.35)] to-[rgba(0,36,53,0.28)] p-6 text-[#f5f6f7] shadow-[0_18px_36px_rgba(0,0,0,0.45)]"
        >
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

        <section
          ref={registerSectionRef('documents')}
          id="documents"
          className="rounded-3xl border border-[#004d66] bg-gradient-to-br from-[rgba(0,52,70,0.45)] via-[rgba(0,36,53,0.35)] to-[rgba(0,36,53,0.28)] p-6 text-[#f5f6f7] shadow-[0_18px_36px_rgba(0,0,0,0.45)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-[#e9d29a]">Documents & Reporting</h2>
              <p className="text-sm text-[#d0d6db]">Package the event plan or duplicate it to start a new season.</p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold uppercase tracking-wide text-[#e9d29a] transition hover:bg-white/20"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </button>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-[#d0d6db]">
              <h3 className="text-base font-semibold text-white">Event Packet</h3>
              <p className="mt-2">Build a polished PDF with event details, assignments, supervisors, and traffic coverage.</p>
              <p className="mt-4 text-xs uppercase tracking-wide text-[#94a7b5]">Includes: event summary, staffing, traffic, notes</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-[#d0d6db]">
              <h3 className="text-base font-semibold text-white">Ready for future phases</h3>
              <p className="mt-2">Task attachments, cost prep, and readiness metrics land here next so the whole plan lives in one workspace.</p>
              <p className="mt-4 text-xs uppercase tracking-wide text-[#94a7b5]">Phase roadmap: attachments → cost prep → reporting</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
