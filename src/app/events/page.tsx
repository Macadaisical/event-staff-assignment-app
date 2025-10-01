'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Loader2,
  ChevronRight,
  Pencil,
} from 'lucide-react';

import LoginForm from '@/components/auth/login-form';
import { useAuth } from '@/components/auth/auth-provider';
import { useSupabaseStore } from '@/stores/supabase-store';
import type { Event } from '@/types';

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

  if (formattedStart) return formattedStart;
  if (formattedEnd) return formattedEnd;
  return 'Time TBD';
};

const determineEventStatus = (eventDate: string | null | undefined): 'upcoming' | 'past' | 'unknown' => {
  const parsed = parseEventDate(eventDate);
  if (!parsed) return 'unknown';
  const now = new Date();
  parsed.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return parsed >= now ? 'upcoming' : 'past';
};

export default function EventsPage() {
  const { user, loading: authLoading } = useAuth();
  const { events, fetchEvents, deleteEvent } = useSupabaseStore();
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      if (!authLoading) {
        setLoading(false);
      }
      return;
    }

    fetchEvents()
      .catch((error: unknown) => {
        console.error('Error loading events:', error);
      })
      .finally(() => setLoading(false));
  }, [user, authLoading, fetchEvents]);

  const sortedEvents = useMemo(() => {
    if (!events.length) return [] as Event[];
    return [...events].sort((a, b) => {
      const aDate = parseEventDate(a.event_date)?.getTime() ?? Number.POSITIVE_INFINITY;
      const bDate = parseEventDate(b.event_date)?.getTime() ?? Number.POSITIVE_INFINITY;
      return aDate - bDate;
    });
  }, [events]);

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (!confirm(`Delete event "${eventName}"? This cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(eventId);
      await deleteEvent(eventId);
      await fetchEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Could not delete the event. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center bg-gradient-to-br from-[#001a24] via-[#003446] to-[#002233]">
        <div className="text-center text-slate-200">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-[#e9d29a]" />
          <p className="mt-4 text-sm text-[#d0d6db]">Loading events...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm className="mt-12" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001a24] via-[#003446] to-[#002233] text-slate-100">
      <main className="mx-auto w-full max-w-6xl px-6 py-12 lg:px-10">
        <div className="mb-10 rounded-3xl bg-gradient-to-r from-white/10 via-white/5 to-transparent p-8 text-[#f5f6f7] shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-[#e9d29a]">Events</p>
              <h1 className="mt-3 text-4xl font-semibold italic">Plan and manage your assignments</h1>
              <p className="mt-3 max-w-2xl text-sm text-[#d0d6db]">
                Browse every scheduled event, confirm details, and jump directly into staffing and traffic planning.
              </p>
            </div>
            <Link
              href="/events/create"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#004d66] to-[#003446] px-6 py-3 text-sm font-semibold text-[#e6e7e8] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Create Event
            </Link>
          </div>
        </div>

        {sortedEvents.length ? (
          <div className="space-y-8">
            {sortedEvents.map((event) => {
              const eventStatus = determineEventStatus(event.event_date);
              const statusColor = eventStatus === 'past' ? 'bg-red-500/20 text-red-200' : eventStatus === 'upcoming' ? 'bg-emerald-500/20 text-emerald-200' : 'bg-slate-500/20 text-slate-200';
              const location = event.location || 'Location TBD';
              const timeRange = formatTimeRange(event.start_time, event.end_time);

              return (
                <div
                  key={event.event_id}
                  className="overflow-hidden rounded-3xl border border-[#004d66] bg-gradient-to-br from-[rgba(0,52,70,0.55)] via-[rgba(0,36,53,0.4)] to-[rgba(0,36,53,0.32)] shadow-[0_20px_45px_rgba(0,0,0,0.45)]"
                >
                  <div className="flex flex-col gap-6 p-6 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusColor}`}>
                          {eventStatus === 'past' ? 'Completed' : eventStatus === 'upcoming' ? 'Upcoming' : 'Scheduled'}
                        </span>
                        <span className="flex items-center gap-2 text-xs uppercase tracking-wide text-[#e9d29a]">
                          <Calendar className="h-4 w-4" />
                          {formatEventDate(event.event_date)}
                        </span>
                      </div>

                      <div>
                        <Link
                          href={`/events/${event.event_id}`}
                          className="group inline-flex items-center gap-2 text-2xl font-semibold text-[#e9d29a] transition hover:text-[#f7e7be]"
                        >
                          {event.event_name}
                          <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Link>
                        {event.notes && (
                          <p className="mt-3 max-w-2xl text-sm text-[#d0d6db]">{event.notes}</p>
                        )}
                      </div>

                      <div className="grid gap-3 text-sm text-[#f5f6f7] sm:grid-cols-2 lg:grid-cols-3">
                        <div className="rounded-2xl bg-white/10 p-4 shadow-inner">
                          <p className="text-xs uppercase tracking-wide text-[#94a7b5]">When</p>
                          <p className="mt-1 flex items-center gap-2 font-medium text-white">
                            <Calendar className="h-4 w-4 text-[#e9d29a]" />
                            {formatEventDate(event.event_date)}
                          </p>
                          <p className="mt-2 flex items-center gap-2 text-xs text-[#d0d6db]">
                            <Clock className="h-4 w-4 text-[#94a7b5]" />
                            {timeRange}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white/10 p-4 shadow-inner">
                          <p className="text-xs uppercase tracking-wide text-[#94a7b5]">Location</p>
                          <p className="mt-1 font-medium text-white flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-[#e9d29a]" />
                            {location}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-white/10 p-4 shadow-inner">
                          <p className="text-xs uppercase tracking-wide text-[#94a7b5]">Prepared By</p>
                          <p className="mt-1 font-medium text-white">{event.prepared_by ?? 'Unassigned'}</p>
                          <p className="text-xs text-[#d0d6db]">Prepared {formatEventDate(event.prepared_date)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 md:w-auto md:min-w-[200px]">
                      <Link
                        href={`/events/${event.event_id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[rgba(233,210,154,0.25)] to-[rgba(233,210,154,0.15)] px-4 py-2 text-sm font-semibold text-[#e9d29a] transition hover:from-[rgba(233,210,154,0.35)] hover:to-[rgba(233,210,154,0.2)]"
                      >
                        <Calendar className="h-4 w-4" />
                        View Event
                      </Link>
                      <Link
                        href={`/events/${event.event_id}/edit`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[rgba(0,77,102,0.55)] to-[rgba(0,52,70,0.45)] px-4 py-2 text-sm font-semibold text-[#e6e7e8] transition hover:opacity-90"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit Details
                      </Link>
                      <button
                        onClick={() => handleDeleteEvent(event.event_id, event.event_name)}
                        disabled={deletingId === event.event_id}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[rgba(220,38,38,0.2)] to-[rgba(185,28,28,0.25)] px-4 py-2 text-sm font-semibold text-red-200 transition hover:from-[rgba(220,38,38,0.3)] hover:to-[rgba(185,28,28,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deletingId === event.event_id ? 'Deleting...' : 'Delete Event'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="mt-16 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/10">
              <Calendar className="h-12 w-12 text-[#e9d29a]" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-[#f5f6f7]">No events scheduled yet</h2>
            <p className="mt-3 text-sm text-[#d0d6db]">
              When you create events they will appear here with quick access to staffing, traffic control, and more.
            </p>
            <Link
              href="/events/create"
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#004d66] to-[#003446] px-6 py-3 text-sm font-semibold text-[#e6e7e8] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Create First Event
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
