'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useSupabaseStore } from '@/stores/supabase-store';
import type { Event, EventTask, TaskStatus } from '@/types';
import Link from 'next/link';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  events: Event[];
  tasks: EventTask[];
}

export default function CalendarPage() {
  const {
    events,
    eventTasks,
    taskCategories,
    fetchEvents,
    fetchEventTasks,
    fetchTaskCategories,
  } = useSupabaseStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');

  useEffect(() => {
    fetchEvents().catch(console.error);
    fetchTaskCategories().catch(console.error);
  }, [fetchEvents, fetchTaskCategories]);

  useEffect(() => {
    events.forEach(event => {
      fetchEventTasks(event.event_id).catch(console.error);
    });
  }, [events, fetchEventTasks]);

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const calendarDays = useMemo((): CalendarDay[] => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: CalendarDay[] = [];

    // Previous month days
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
      days.push({ date, isCurrentMonth: false, events: [], tasks: [] });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dayEvents = events.filter(event => {
        if (!event.event_date) return false;
        const eventDate = new Date(event.event_date);
        return eventDate.toDateString() === date.toDateString();
      });

      const dayTasks = eventTasks.filter(task => {
        if (!task.due_date) return false;
        const taskDate = new Date(task.due_date);
        return taskDate.toDateString() === date.toDateString();
      });

      days.push({ date, isCurrentMonth: true, events: dayEvents, tasks: dayTasks });
    }

    // Next month days
    const remainingDays = 42 - days.length; // 6 weeks
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(currentYear, currentMonth + 1, day);
      days.push({ date, isCurrentMonth: false, events: [], tasks: [] });
    }

    return days;
  }, [currentYear, currentMonth, events, eventTasks]);

  const filteredTasks = useMemo(() => {
    return eventTasks.filter(task => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (categoryFilter !== 'all' && task.category_id !== categoryFilter) return false;
      if (eventFilter !== 'all' && task.event_id !== eventFilter) return false;
      return true;
    });
  }, [eventTasks, statusFilter, categoryFilter, eventFilter]);

  const previousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const getEventForTask = (taskEventId: string) => {
    return events.find(e => e.event_id === taskEventId);
  };

  const getCategoryColor = (categoryId: string | null) => {
    if (!categoryId) return '#64748B';
    const category = taskCategories.find(c => c.category_id === categoryId);
    return category?.color || '#64748B';
  };

  const statusCounts = useMemo(() => {
    return filteredTasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {} as Record<TaskStatus, number>);
  }, [filteredTasks]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001a24] via-[#003446] to-[#002233] text-slate-100">
      <main className="mx-auto w-full max-w-7xl px-6 py-12 lg:px-10">
        <div className="mb-10 rounded-3xl border border-[#004d66] bg-gradient-to-r from-white/10 via-white/5 to-transparent p-8 text-[#f5f6f7] shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#e9d29a]">
                <CalendarIcon className="h-4 w-4" />
                Calendar View
              </div>
              <h1 className="mt-4 text-4xl font-semibold italic text-[#fdfbf7]">Events & Task Deadlines</h1>
              <p className="mt-3 max-w-2xl text-sm text-[#d0d6db]">
                Track event dates and pre-event task deadlines across your entire schedule.
              </p>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-[#004d66] bg-gradient-to-br from-[rgba(0,52,70,0.45)] via-[rgba(0,36,53,0.35)] to-[rgba(0,36,53,0.28)] p-6 shadow-[0_18px_36px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={previousMonth}
                className="inline-flex items-center justify-center rounded-full bg-white/10 p-2 text-[#e9d29a] transition hover:bg-white/20"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-2xl font-semibold text-white">
                {MONTHS[currentMonth]} {currentYear}
              </h2>
              <button
                onClick={nextMonth}
                className="inline-flex items-center justify-center rounded-full bg-white/10 p-2 text-[#e9d29a] transition hover:bg-white/20"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={goToToday}
              className="rounded-xl bg-gradient-to-r from-[#004d66] to-[#003446] px-4 py-2 text-sm font-semibold text-[#e6e7e8] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:opacity-90"
            >
              Today
            </button>
          </div>

          <div className="mt-6 grid grid-cols-7 gap-2">
            {DAYS.map(day => (
              <div key={day} className="p-2 text-center text-xs font-semibold uppercase tracking-wide text-[#e9d29a]">
                {day}
              </div>
            ))}
            {calendarDays.map((day, index) => {
              const dayTasks = filteredTasks.filter(task => {
                if (!task.due_date) return false;
                const taskDate = new Date(task.due_date);
                return taskDate.toDateString() === day.date.toDateString();
              });

              return (
                <div
                  key={index}
                  className={`min-h-[120px] rounded-xl border p-2 ${
                    day.isCurrentMonth
                      ? 'border-white/10 bg-white/5'
                      : 'border-white/5 bg-white/[0.02]'
                  } ${isToday(day.date) ? 'ring-2 ring-[#e9d29a]' : ''}`}
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`text-sm font-semibold ${
                      day.isCurrentMonth ? 'text-white' : 'text-[#94a7b5]'
                    } ${isToday(day.date) ? 'text-[#e9d29a]' : ''}`}>
                      {day.date.getDate()}
                    </span>
                    {day.events.length > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#e9d29a] text-xs font-bold text-[#001a24]">
                        {day.events.length}
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {day.events.map(event => (
                      <Link
                        key={event.event_id}
                        href={`/events/${event.event_id}`}
                        className="block truncate rounded bg-[#e9d29a]/20 px-2 py-1 text-xs text-[#e9d29a] transition hover:bg-[#e9d29a]/30"
                      >
                        {event.event_name}
                      </Link>
                    ))}
                    {dayTasks.slice(0, 2).map(task => (
                      <div
                        key={task.task_id}
                        className="flex items-center gap-1 truncate rounded px-2 py-1 text-xs"
                        style={{ backgroundColor: `${getCategoryColor(task.category_id)}20` }}
                      >
                        <span
                          className="h-2 w-2 flex-shrink-0 rounded-full"
                          style={{ backgroundColor: getCategoryColor(task.category_id) }}
                        />
                        <span className="truncate text-white">{task.title}</span>
                      </div>
                    ))}
                    {dayTasks.length > 2 && (
                      <div className="px-2 text-xs text-[#94a7b5]">+{dayTasks.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-[#004d66] bg-gradient-to-br from-[rgba(0,52,70,0.45)] via-[rgba(0,36,53,0.35)] to-[rgba(0,36,53,0.28)] p-6 shadow-[0_18px_36px_rgba(0,0,0,0.45)]">
            <div className="mb-4 flex items-center gap-2">
              <Filter className="h-5 w-5 text-[#e9d29a]" />
              <h3 className="text-lg font-semibold text-white">Filters</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs uppercase tracking-wide text-[#94a7b5]">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="w-full rounded-xl border border-white/10 bg-[#001a24]/60 px-3 py-2 text-sm text-white outline-none transition focus:border-[#e9d29a] focus:ring-2 focus:ring-[#e9d29a]/30"
                >
                  <option value="all">All Statuses</option>
                  <option value="Not Started">Not Started</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-wide text-[#94a7b5]">Category</label>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#001a24]/60 px-3 py-2 text-sm text-white outline-none transition focus:border-[#e9d29a] focus:ring-2 focus:ring-[#e9d29a]/30"
                >
                  <option value="all">All Categories</option>
                  {taskCategories.map(cat => (
                    <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs uppercase tracking-wide text-[#94a7b5]">Event</label>
                <select
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#001a24]/60 px-3 py-2 text-sm text-white outline-none transition focus:border-[#e9d29a] focus:ring-2 focus:ring-[#e9d29a]/30"
                >
                  <option value="all">All Events</option>
                  {events.map(event => (
                    <option key={event.event_id} value={event.event_id}>{event.event_name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-4">
            <div className="rounded-3xl border border-[#004d66] bg-gradient-to-br from-[rgba(0,52,70,0.45)] via-[rgba(0,36,53,0.35)] to-[rgba(0,36,53,0.28)] p-6 shadow-[0_18px_36px_rgba(0,0,0,0.45)]">
              <h3 className="mb-4 text-lg font-semibold text-white">Task Summary</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-xl bg-white/10 p-4 text-center">
                  <AlertCircle className="mx-auto h-6 w-6 text-red-400" />
                  <p className="mt-2 text-2xl font-bold text-white">{statusCounts['Not Started'] || 0}</p>
                  <p className="text-xs uppercase tracking-wide text-[#94a7b5]">Not Started</p>
                </div>
                <div className="rounded-xl bg-white/10 p-4 text-center">
                  <Clock className="mx-auto h-6 w-6 text-yellow-400" />
                  <p className="mt-2 text-2xl font-bold text-white">{statusCounts['In Progress'] || 0}</p>
                  <p className="text-xs uppercase tracking-wide text-[#94a7b5]">In Progress</p>
                </div>
                <div className="rounded-xl bg-white/10 p-4 text-center">
                  <CheckCircle2 className="mx-auto h-6 w-6 text-emerald-400" />
                  <p className="mt-2 text-2xl font-bold text-white">{statusCounts['Completed'] || 0}</p>
                  <p className="text-xs uppercase tracking-wide text-[#94a7b5]">Completed</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-[#004d66] bg-gradient-to-br from-[rgba(0,52,70,0.45)] via-[rgba(0,36,53,0.35)] to-[rgba(0,36,53,0.28)] p-6 shadow-[0_18px_36px_rgba(0,0,0,0.45)]">
              <h3 className="mb-4 text-lg font-semibold text-white">Upcoming Task Deadlines</h3>
              <div className="max-h-[400px] space-y-3 overflow-y-auto">
                {filteredTasks
                  .filter(task => task.due_date)
                  .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
                  .slice(0, 10)
                  .map(task => {
                    const event = getEventForTask(task.event_id);
                    return (
                      <Link
                        key={task.task_id}
                        href={`/events/${task.event_id}?tab=tasks`}
                        className="block rounded-xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: getCategoryColor(task.category_id) }}
                              />
                              <p className="font-semibold text-white">{task.title}</p>
                            </div>
                            <p className="mt-1 text-xs text-[#94a7b5]">{event?.event_name || 'Unknown Event'}</p>
                            <p className="mt-1 text-xs text-[#d0d6db]">
                              Due: {new Date(task.due_date!).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                              {task.due_time && ` • ${task.due_time}`}
                            </p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            task.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-200' :
                            task.status === 'In Progress' ? 'bg-yellow-500/20 text-yellow-200' :
                            'bg-red-500/20 text-red-200'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                {filteredTasks.filter(task => task.due_date).length === 0 && (
                  <p className="text-center text-sm text-[#94a7b5]">No task deadlines found</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
