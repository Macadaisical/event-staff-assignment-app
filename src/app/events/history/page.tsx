'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, ListChecks, ArrowRight, History } from 'lucide-react';

import { useSupabaseStore } from '@/stores/supabase-store';

export default function EventHistoryPage() {
  const router = useRouter();
  const { events, fetchEvents, eventTasks } = useSupabaseStore();

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const pastEvents = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return events
      .filter(event => {
        if (!event.event_date) return false;
        const eventDate = new Date(event.event_date);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate < today;
      })
      .sort((a, b) => {
        const dateA = a.event_date ? new Date(a.event_date).getTime() : 0;
        const dateB = b.event_date ? new Date(b.event_date).getTime() : 0;
        return dateB - dateA;
      });
  }, [events]);

  const getEventMetrics = (eventId: string) => {
    const tasks = eventTasks.filter(task => task.event_id === eventId);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'Completed').length;
    const readinessScore = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

    return {
      totalTasks,
      completedTasks,
      readinessScore,
    };
  };

  const getReadinessColor = (score: number): string => {
    if (score === 100) return 'text-emerald-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getReadinessRingColor = (score: number): string => {
    if (score === 100) return 'ring-emerald-500/40';
    if (score >= 50) return 'ring-yellow-500/40';
    return 'ring-red-500/40';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001a24] via-[#003446] to-[#002233] text-slate-100">
      <main className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-10">
        <div className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-2xl">
              <History className="h-8 w-8 text-purple-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Event History</h1>
              <p className="mt-1 text-[#94a7b5]">Past events with completion metrics</p>
            </div>
          </div>
        </div>

        {pastEvents.length === 0 ? (
          <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
            <History className="h-16 w-16 text-gray-500 mb-4" />
            <h2 className="text-2xl font-semibold text-white mb-2">No Past Events</h2>
            <p className="text-gray-400 max-w-md">
              Events that have passed will appear here with completion statistics and readiness scores.
            </p>
            <Link
              href="/events"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              View All Events
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Showing {pastEvents.length} past event{pastEvents.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pastEvents.map(event => {
                const { totalTasks, completedTasks, readinessScore } = getEventMetrics(event.event_id);

                return (
                  <button
                    key={event.event_id}
                    onClick={() => router.push(`/events/${event.event_id}`)}
                    className={`group relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 p-6 text-left transition hover:from-white/10 hover:to-white/15 hover:shadow-xl ${getReadinessRingColor(readinessScore)} ring-1`}
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white group-hover:text-[#e9d29a] transition">
                          {event.event_name}
                        </h3>
                        <div className="mt-2 flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {event.event_date
                              ? new Date(event.event_date).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Date TBD'}
                          </span>
                        </div>
                        {event.location && (
                          <div className="mt-1 flex items-center gap-2 text-sm text-gray-400">
                            <MapPin className="h-4 w-4" />
                            <span>{event.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 border-t border-white/10 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <ListChecks className="h-4 w-4" />
                          <span>Task Completion</span>
                        </div>
                        <span className={`text-lg font-bold ${getReadinessColor(readinessScore)}`}>
                          {readinessScore}%
                        </span>
                      </div>

                      {totalTasks > 0 && (
                        <>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                            <div
                              className={`h-full transition-all ${
                                readinessScore === 100
                                  ? 'bg-emerald-500'
                                  : readinessScore >= 50
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${readinessScore}%` }}
                            />
                          </div>
                          <p className="mt-2 text-xs text-gray-400">
                            {completedTasks} of {totalTasks} task{totalTasks !== 1 ? 's' : ''} completed
                          </p>
                        </>
                      )}

                      {totalTasks === 0 && (
                        <p className="text-xs text-gray-500 italic">No tasks tracked</p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-end">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-400 opacity-0 transition group-hover:opacity-100">
                        View Details
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
