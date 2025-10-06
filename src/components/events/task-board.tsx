'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import {
  CheckSquare,
  ClipboardList,
  Filter,
  ListFilter,
  Loader2,
  Plus,
  Search,
  Settings2,
  Trash2,
  Users,
  X,
} from 'lucide-react';

import type { EventTask, TaskCategory, TaskStatus, TeamMember } from '@/types';

const STATUS_COLUMNS: Array<{
  status: TaskStatus;
  label: string;
  accent: string;
  description: string;
}> = [
  {
    status: 'Not Started',
    label: 'To Prep',
    accent: 'border-[#94a7b5] bg-[#0b1f2c]',
    description: 'Ideas, outreach, and paperwork that still needs attention.',
  },
  {
    status: 'In Progress',
    label: 'Active',
    accent: 'border-[#f4b942] bg-[#302608]',
    description: 'Work currently underway by the pre-event team.',
  },
  {
    status: 'Completed',
    label: 'Ready',
    accent: 'border-emerald-400/50 bg-emerald-900/30',
    description: 'Items verified and cleared before the event begins.',
  },
];

interface CreateTaskPayload {
  title: string;
  description?: string | null;
  status?: TaskStatus;
  due_date?: string | null;
  due_time?: string | null;
  assignee_id?: string | null;
  category_id?: string | null;
  sort_order?: number;
}

interface EventTaskBoardProps {
  eventId: string;
  tasks: EventTask[];
  categories: TaskCategory[];
  teamMembers: TeamMember[];
  isLoading: boolean;
  isCategoryLoading: boolean;
  onCreateTask: (task: CreateTaskPayload) => Promise<void>;
  onUpdateTask: (taskId: string, updates: Partial<EventTask>) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onCreateCategory: (input: { name: string; color?: string }) => Promise<TaskCategory | null>;
  onUpdateCategory: (
    categoryId: string,
    updates: { name?: string; color?: string; sort_order?: number },
  ) => Promise<void>;
  onDeleteCategory: (categoryId: string) => Promise<void>;
}

const DEFAULT_TASK: CreateTaskPayload = {
  title: '',
  description: '',
  status: 'Not Started',
  due_date: '',
  due_time: '',
  assignee_id: '',
  category_id: '',
};

const DEFAULT_HEX_COLOR = '#2563EB';

const getMemberName = (teamMembers: TeamMember[], memberId: string | null | undefined): string => {
  if (!memberId) return 'Unassigned';
  const match = teamMembers.find((member) => member.member_id === memberId);
  return match ? match.member_name : 'Unassigned';
};

const getCategoryLabel = (categories: TaskCategory[], categoryId: string | null | undefined): string => {
  if (!categoryId) return 'Uncategorized';
  const match = categories.find((category) => category.category_id === categoryId);
  return match ? match.name : 'Uncategorized';
};

const getCategoryColor = (categories: TaskCategory[], categoryId: string | null | undefined): string => {
  if (!categoryId) return DEFAULT_HEX_COLOR;
  const match = categories.find((category) => category.category_id === categoryId);
  return match ? match.color : DEFAULT_HEX_COLOR;
};

const matchesFilter = (
  task: EventTask,
  options: {
    categoryId: string;
    memberId: string;
    search: string;
  },
  teamMembers: TeamMember[],
  categories: TaskCategory[],
): boolean => {
  const { categoryId, memberId, search } = options;
  if (categoryId && task.category_id !== categoryId) {
    return false;
  }
  if (memberId && task.assignee_id !== memberId) {
    return false;
  }
  if (!search.trim()) {
    return true;
  }
  const haystack = [
    task.title,
    task.description ?? '',
    getMemberName(teamMembers, task.assignee_id),
    getCategoryLabel(categories, task.category_id),
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(search.trim().toLowerCase());
};

const getDueDateLabel = (dueDate: string | null, dueTime: string | null): string => {
  if (!dueDate && !dueTime) {
    return 'No deadline';
  }
  const parts: string[] = [];
  if (dueDate) {
    const parsed = new Date(dueDate);
    if (!Number.isNaN(parsed.getTime())) {
      parts.push(
        parsed.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
      );
    }
  }
  if (dueTime) {
    const [hours, minutes] = dueTime.split(':');
    if (hours !== undefined && minutes !== undefined) {
      const date = new Date();
      date.setHours(Number(hours), Number(minutes), 0, 0);
      parts.push(
        date.toLocaleTimeString(undefined, {
          hour: 'numeric',
          minute: '2-digit',
        }),
      );
    }
  }
  return parts.length ? parts.join(' • ') : 'No deadline';
};

export function EventTaskBoard(props: EventTaskBoardProps) {
  const {
    tasks,
    categories,
    teamMembers,
    isLoading,
    isCategoryLoading,
    onCreateTask,
    onUpdateTask,
    onDeleteTask,
    onCreateCategory,
    onUpdateCategory,
    onDeleteCategory,
  } = props;

  const [newTask, setNewTask] = useState<CreateTaskPayload>(DEFAULT_TASK);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [categoryIdFilter, setCategoryIdFilter] = useState('');
  const [memberIdFilter, setMemberIdFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [bulkDueDate, setBulkDueDate] = useState('');
  const [bulkDueTime, setBulkDueTime] = useState('');
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryDrafts, setCategoryDrafts] = useState<Record<string, { name: string; color: string }>>({});

  useEffect(() => {
    const drafts = categories.reduce<Record<string, { name: string; color: string }>>((accumulator, category) => {
      accumulator[category.category_id] = {
        name: category.name,
        color: category.color,
      };
      return accumulator;
    }, {});
    setCategoryDrafts(drafts);
  }, [categories]);

  const filteredTasks = useMemo(() =>
    tasks.filter((task) =>
      matchesFilter(
        task,
        {
          categoryId: categoryIdFilter,
          memberId: memberIdFilter,
          search: searchQuery,
        },
        teamMembers,
        categories,
      ),
    ),
  [tasks, categoryIdFilter, memberIdFilter, searchQuery, teamMembers, categories]);

  const groupedTasks = useMemo(() =>
    STATUS_COLUMNS.map(({ status }) => ({
      status,
      tasks: filteredTasks
        .filter((task) => task.status === status)
        .slice()
        .sort((a, b) => {
          if (a.sort_order === b.sort_order) {
            return a.created_at.localeCompare(b.created_at);
          }
          return (a.sort_order ?? 0) - (b.sort_order ?? 0);
        }),
    })),
  [filteredTasks]);

  const toggleSelection = (taskId: string) => {
    setSelectedTaskIds((previous) =>
      previous.includes(taskId)
        ? previous.filter((id) => id !== taskId)
        : [...previous, taskId],
    );
  };

  const selectColumn = (taskIds: string[]) => {
    setSelectedTaskIds(taskIds);
  };

  const clearSelection = () => setSelectedTaskIds([]);

  const handleCreateTaskInternal = async () => {
    const trimmedTitle = newTask.title.trim();
    if (!trimmedTitle) return;

    setIsCreatingTask(true);
    try {
      await onCreateTask({
        ...newTask,
        title: trimmedTitle,
        status: newTask.status ?? 'Not Started',
        due_date: newTask.due_date ? newTask.due_date : null,
        due_time: newTask.due_time ? newTask.due_time : null,
        assignee_id: newTask.assignee_id ? newTask.assignee_id : null,
        category_id: newTask.category_id ? newTask.category_id : null,
        sort_order: tasks.length + 1,
      });
      setNewTask(DEFAULT_TASK);
      setCategoryIdFilter('');
      setMemberIdFilter('');
      setSearchQuery('');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleBulkStatusUpdate = async (status: TaskStatus) => {
    if (!selectedTaskIds.length) return;
    await Promise.all(selectedTaskIds.map((taskId) => onUpdateTask(taskId, { status })));
    clearSelection();
  };

  const handleBulkDueUpdate = async () => {
    if (!selectedTaskIds.length) return;
    const dueDateValue = bulkDueDate || null;
    const dueTimeValue = bulkDueTime || null;
    await Promise.all(
      selectedTaskIds.map((taskId) =>
        onUpdateTask(taskId, {
          due_date: dueDateValue,
          due_time: dueTimeValue,
        }),
      ),
    );
    setBulkDueDate('');
    setBulkDueTime('');
    clearSelection();
  };

  const handleBulkDelete = async () => {
    if (!selectedTaskIds.length) return;
    if (!window.confirm('Delete selected tasks? This cannot be undone.')) {
      return;
    }
    for (const taskId of selectedTaskIds) {
      await onDeleteTask(taskId);
    }
    clearSelection();
  };

  const handleCategoryDraftChange = (categoryId: string, key: 'name' | 'color', value: string) => {
    setCategoryDrafts((previous) => ({
      ...previous,
      [categoryId]: {
        ...previous[categoryId],
        [key]: value,
      },
    }));
  };

  const handlePersistCategory = async (categoryId: string) => {
    const draft = categoryDrafts[categoryId];
    if (!draft || !draft.name.trim()) {
      return;
    }
    await onUpdateCategory(categoryId, {
      name: draft.name.trim(),
      color: /^#[0-9A-Fa-f]{6}$/.test(draft.color) ? draft.color : DEFAULT_HEX_COLOR,
    });
  };

  const handleCreateCategoryInternal = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    const created = await onCreateCategory({ name: trimmed });
    if (created) {
      setNewCategoryName('');
    }
  };

  const handleDeleteCategoryInternal = async (categoryId: string) => {
    if (!window.confirm('Delete this category? Tasks will become uncategorized.')) {
      return;
    }
    await onDeleteCategory(categoryId);
  };

  const selectedTasksCount = selectedTaskIds.length;

  return (
    <section className="space-y-8">
      <header className="rounded-3xl border border-[#004d66] bg-[#052335]/80 p-6 text-[#f5f6f7] shadow-[0_18px_36px_rgba(0,0,0,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#e9d29a]">
              <ClipboardList className="h-4 w-4" />
              Pre-Event Task Board
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-white">Organize prep work before teams deploy</h2>
            <p className="mt-2 max-w-2xl text-sm text-[#d0d6db]">
              Track permits, logistics, and outreach in one board. Assign owners, monitor deadlines, and keep everyone aligned ahead of the event.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3 text-sm text-[#d0d6db]">
            <button
              type="button"
              onClick={() => setIsCategoryManagerOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#e9d29a] transition hover:border-[#e9d29a]/40 hover:text-[#ffe7b7]"
            >
              <Settings2 className="h-4 w-4" />
              Manage Categories
            </button>
            <div className="flex items-center gap-6 text-xs uppercase tracking-wide">
              <span>Total Tasks: {tasks.length}</span>
              <span>Not Started: {tasks.filter((task) => task.status === 'Not Started').length}</span>
              <span>In Progress: {tasks.filter((task) => task.status === 'In Progress').length}</span>
              <span>Completed: {tasks.filter((task) => task.status === 'Completed').length}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
          <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#001a24] px-3 py-2 text-sm text-[#d0d6db]">
            <Search className="h-4 w-4 text-[#e9d29a]" />
            <input
              value={searchQuery}
              onChange={(eventInstance) => setSearchQuery(eventInstance.target.value)}
              placeholder="Search tasks, notes, or people"
              className="w-full bg-transparent text-sm text-[#f5f6f7] outline-none"
            />
          </label>

          <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#001a24] px-3 py-2 text-sm text-[#d0d6db]">
            <Filter className="h-4 w-4 text-[#e9d29a]" />
            <select
              value={categoryIdFilter}
              onChange={(eventInstance) => setCategoryIdFilter(eventInstance.target.value)}
              className="w-full bg-transparent text-sm text-[#f5f6f7] outline-none"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.category_id} value={category.category_id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#001a24] px-3 py-2 text-sm text-[#d0d6db]">
            <Users className="h-4 w-4 text-[#e9d29a]" />
            <select
              value={memberIdFilter}
              onChange={(eventInstance) => setMemberIdFilter(eventInstance.target.value)}
              className="w-full bg-transparent text-sm text-[#f5f6f7] outline-none"
            >
              <option value="">All assignees</option>
              {teamMembers
                .filter((member) => member.active)
                .map((member) => (
                  <option key={member.member_id} value={member.member_id}>
                    {member.member_name}
                  </option>
                ))}
            </select>
          </label>
        </div>

        <form
          onSubmit={(eventInstance) => {
            eventInstance.preventDefault();
            void handleCreateTaskInternal();
          }}
          className="mt-6 rounded-2xl border border-white/10 bg-[#001a24]/70 p-5"
        >
          <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
            <div>
              <label className="text-[10px] uppercase tracking-wide text-[#94a7b5]">Task title</label>
              <input
                required
                value={newTask.title}
                onChange={(eventInstance) => setNewTask((previous) => ({
                  ...previous,
                  title: eventInstance.target.value,
                }))}
                placeholder="e.g. Finalize road closure permits"
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#00141d] px-3 py-2 text-sm text-[#f5f6f7] outline-none transition focus:border-[#e9d29a] focus:ring-2 focus:ring-[#e9d29a]/30"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wide text-[#94a7b5]">Category</label>
              <select
                value={newTask.category_id ?? ''}
                onChange={(eventInstance) => setNewTask((previous) => ({
                  ...previous,
                  category_id: eventInstance.target.value,
                }))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#00141d] px-3 py-2 text-sm text-[#f5f6f7] outline-none transition focus:border-[#e9d29a] focus:ring-2 focus:ring-[#e9d29a]/30"
              >
                <option value="">Uncategorized</option>
                {categories.map((category) => (
                  <option key={category.category_id} value={category.category_id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wide text-[#94a7b5]">Assignee</label>
              <select
                value={newTask.assignee_id ?? ''}
                onChange={(eventInstance) => setNewTask((previous) => ({
                  ...previous,
                  assignee_id: eventInstance.target.value,
                }))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#00141d] px-3 py-2 text-sm text-[#f5f6f7] outline-none transition focus:border-[#e9d29a] focus:ring-2 focus:ring-[#e9d29a]/30"
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
                value={newTask.status ?? 'Not Started'}
                onChange={(eventInstance) => setNewTask((previous) => ({
                  ...previous,
                  status: eventInstance.target.value as TaskStatus,
                }))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-[#00141d] px-3 py-2 text-sm text-[#f5f6f7] outline-none transition focus:border-[#e9d29a] focus:ring-2 focus:ring-[#e9d29a]/30"
              >
                {STATUS_COLUMNS.map(({ status, label }) => (
                  <option key={status} value={status}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] uppercase tracking-wide text-[#94a7b5]">Due date</label>
                <input
                  type="date"
                  value={newTask.due_date ?? ''}
                  onChange={(eventInstance) => setNewTask((previous) => ({
                    ...previous,
                    due_date: eventInstance.target.value,
                  }))}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#00141d] px-3 py-2 text-sm text-[#f5f6f7] outline-none transition focus:border-[#e9d29a] focus:ring-2 focus:ring-[#e9d29a]/30"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-wide text-[#94a7b5]">Due time</label>
                <input
                  type="time"
                  value={newTask.due_time ?? ''}
                  onChange={(eventInstance) => setNewTask((previous) => ({
                    ...previous,
                    due_time: eventInstance.target.value,
                  }))}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#00141d] px-3 py-2 text-sm text-[#f5f6f7] outline-none transition focus:border-[#e9d29a] focus:ring-2 focus:ring-[#e9d29a]/30"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-[3fr_1fr]">
            <textarea
              value={newTask.description ?? ''}
              onChange={(eventInstance) => setNewTask((previous) => ({
                ...previous,
                description: eventInstance.target.value,
              }))}
              placeholder="Optional notes or links"
              className="h-20 w-full rounded-xl border border-white/10 bg-[#00141d] px-3 py-2 text-sm text-[#f5f6f7] outline-none transition focus:border-[#e9d29a] focus:ring-2 focus:ring-[#e9d29a]/30"
            />
            <div className="flex items-end justify-end">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#004d66] to-[#003446] px-4 py-2 text-sm font-semibold text-[#e6e7e8] transition hover:opacity-90 disabled:opacity-50"
                disabled={isCreatingTask}
              >
                {isCreatingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Add Task
              </button>
            </div>
          </div>
        </form>
      </header>

      <div className="rounded-3xl border border-[#004d66] bg-[#041a27]/80 p-6 shadow-[0_18px_36px_rgba(0,0,0,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#e9d29a]">
            <ListFilter className="h-4 w-4" />
            Bulk Actions
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-[#d0d6db]">
            <span>{selectedTasksCount} selected</span>
            {selectedTasksCount ? (
              <button
                type="button"
                onClick={clearSelection}
                className="inline-flex items-center gap-1 rounded-full border border-white/15 px-2 py-1 text-[#f5f6f7] transition hover:border-[#f5f6f7]"
              >
                <X className="h-3 w-3" />
                Clear
              </button>
            ) : null}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <button
            type="button"
            onClick={() => void handleBulkStatusUpdate('In Progress')}
            disabled={!selectedTasksCount}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#f4b942]/40 bg-[#2a1d03] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#f4b942] transition enabled:hover:border-[#f4b942] enabled:hover:text-[#ffe7b7] disabled:opacity-40"
          >
            <CheckSquare className="h-4 w-4" />
            Mark In Progress
          </button>
          <button
            type="button"
            onClick={() => void handleBulkStatusUpdate('Completed')}
            disabled={!selectedTasksCount}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-950/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-200 transition enabled:hover:border-emerald-300 enabled:hover:text-white disabled:opacity-40"
          >
            <CheckSquare className="h-4 w-4" />
            Mark Completed
          </button>
          <button
            type="button"
            onClick={() => void handleBulkStatusUpdate('Not Started')}
            disabled={!selectedTasksCount}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#94a7b5]/40 bg-[#0b1f2c] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#94a7b5] transition enabled:hover:border-[#c5d8e6] enabled:hover:text-[#c5d8e6] disabled:opacity-40"
          >
            <CheckSquare className="h-4 w-4" />
            Reset to Not Started
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#d0d6db]">
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#00141d] px-3 py-2">
            <span className="text-[10px] uppercase tracking-wide text-[#94a7b5]">Due date</span>
            <input
              type="date"
              value={bulkDueDate}
              onChange={(eventInstance) => setBulkDueDate(eventInstance.target.value)}
              className="bg-transparent text-sm text-[#f5f6f7] outline-none"
            />
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#00141d] px-3 py-2">
            <span className="text-[10px] uppercase tracking-wide text-[#94a7b5]">Due time</span>
            <input
              type="time"
              value={bulkDueTime}
              onChange={(eventInstance) => setBulkDueTime(eventInstance.target.value)}
              className="bg-transparent text-sm text-[#f5f6f7] outline-none"
            />
          </label>
          <button
            type="button"
            onClick={() => void handleBulkDueUpdate()}
            disabled={!selectedTaskIds.length || (!bulkDueDate && !bulkDueTime)}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#e9d29a] transition enabled:hover:border-[#e9d29a] enabled:hover:text-white disabled:opacity-40"
          >
            Apply Deadlines
          </button>
          <button
            type="button"
            onClick={() => void handleBulkDelete()}
            disabled={!selectedTaskIds.length}
            className="inline-flex items-center gap-2 rounded-full border border-[#f87171]/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#f87171] transition enabled:hover:border-[#fca5a5] enabled:hover:text-[#fca5a5] disabled:opacity-40"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {groupedTasks.map(({ status, tasks: tasksInColumn }) => (
          <div key={status} className="flex min-h-[320px] flex-col rounded-3xl border border-[#004d66]/70 bg-[#02131d]/90 p-5 shadow-[0_18px_36px_rgba(0,0,0,0.45)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-wide text-[#94a7b5]">
                  {STATUS_COLUMNS.find((column) => column.status === status)?.label}
                </div>
                <p className="mt-1 text-sm text-[#d0d6db]">
                  {STATUS_COLUMNS.find((column) => column.status === status)?.description}
                </p>
              </div>
              <button
                type="button"
                onClick={() => selectColumn(tasksInColumn.map((task) => task.task_id))}
                className="inline-flex items-center gap-1 rounded-full border border-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#e9d29a] transition hover:border-[#e9d29a] hover:text-white"
              >
                <CheckSquare className="h-3.5 w-3.5" />
                Select {tasksInColumn.length}
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {tasksInColumn.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-[#00141d] p-6 text-center text-sm text-[#94a7b5]">
                  No tasks yet. Use the form above to add one.
                </div>
              ) : (
                tasksInColumn.map((task) => {
                  const isSelected = selectedTaskIds.includes(task.task_id);
                  return (
                    <article
                      key={task.task_id}
                      className={`rounded-2xl border border-white/10 bg-[#00141d] p-4 text-sm text-[#d0d6db] transition ${
                        isSelected ? 'ring-2 ring-[#e9d29a]/60' : ''
                      }`}
                    >
                      <header className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleSelection(task.task_id)}
                              className={`flex h-4 w-4 items-center justify-center rounded border ${
                                isSelected
                                  ? 'border-[#e9d29a] bg-[#e9d29a] text-[#00141d]'
                                  : 'border-white/20 bg-transparent'
                              }`}
                              aria-label={isSelected ? 'Deselect task' : 'Select task'}
                            >
                              {isSelected ? '✓' : ''}
                            </button>
                            <h3 className="text-base font-semibold text-white">{task.title}</h3>
                          </div>
                          <p className="mt-1 text-xs uppercase tracking-wide text-[#94a7b5]">
                            Owner: <span className="text-[#f5f6f7]">{getMemberName(teamMembers, task.assignee_id)}</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void onDeleteTask(task.task_id)}
                          className="rounded-full border border-white/10 p-2 text-[#f5c6c6] transition hover:border-[#f5c6c6] hover:text-white"
                          aria-label="Delete task"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </header>

                      {task.description ? (
                        <p className="mt-3 text-sm text-[#cbd5db]">{task.description}</p>
                      ) : null}

                      <div className="mt-4 grid gap-3 md:grid-cols-2">
                        <label className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase tracking-wide text-[#94a7b5]">Category</span>
                          <select
                            value={task.category_id ?? ''}
                            onChange={(eventInstance) =>
                              void onUpdateTask(task.task_id, {
                                category_id: eventInstance.target.value || null,
                              })
                            }
                            className="rounded-xl border border-white/10 bg-[#021824] px-3 py-2 text-xs text-[#f5f6f7] outline-none transition focus:border-[#e9d29a]"
                          >
                            <option value="">Uncategorized</option>
                            {categories.map((category) => (
                              <option key={category.category_id} value={category.category_id}>
                                {category.name}
                              </option>
                            ))}
                          </select>
                        </label>

                        <div className="rounded-xl border border-white/10 bg-[#021824] px-3 py-2 text-xs text-[#f5f6f7]">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: getCategoryColor(categories, task.category_id) }}
                            />
                            {getCategoryLabel(categories, task.category_id)}
                          </div>
                          <p className="mt-2 text-[11px] text-[#94a7b5]">{getDueDateLabel(task.due_date, task.due_time)}</p>
                        </div>

                        <label className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase tracking-wide text-[#94a7b5]">Due date</span>
                          <input
                            type="date"
                            value={task.due_date ?? ''}
                            onChange={(eventInstance) =>
                              void onUpdateTask(task.task_id, {
                                due_date: eventInstance.target.value || null,
                              })
                            }
                            className="rounded-xl border border-white/10 bg-[#021824] px-3 py-2 text-xs text-[#f5f6f7] outline-none transition focus:border-[#e9d29a]"
                          />
                        </label>

                        <label className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase tracking-wide text-[#94a7b5]">Due time</span>
                          <input
                            type="time"
                            value={task.due_time ? task.due_time.slice(0, 5) : ''}
                            onChange={(eventInstance) =>
                              void onUpdateTask(task.task_id, {
                                due_time: eventInstance.target.value || null,
                              })
                            }
                            className="rounded-xl border border-white/10 bg-[#021824] px-3 py-2 text-xs text-[#f5f6f7] outline-none transition focus:border-[#e9d29a]"
                          />
                        </label>

                        <label className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase tracking-wide text-[#94a7b5]">Assignee</span>
                          <select
                            value={task.assignee_id ?? ''}
                            onChange={(eventInstance) =>
                              void onUpdateTask(task.task_id, {
                                assignee_id: eventInstance.target.value || null,
                              })
                            }
                            className="rounded-xl border border-white/10 bg-[#021824] px-3 py-2 text-xs text-[#f5f6f7] outline-none transition focus:border-[#e9d29a]"
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
                        </label>

                        <label className="flex flex-col gap-1">
                          <span className="text-[10px] uppercase tracking-wide text-[#94a7b5]">Status</span>
                          <select
                            value={task.status}
                            onChange={(eventInstance) =>
                              void onUpdateTask(task.task_id, {
                                status: eventInstance.target.value as TaskStatus,
                              })
                            }
                            className="rounded-xl border border-white/10 bg-[#021824] px-3 py-2 text-xs text-[#f5f6f7] outline-none transition focus:border-[#e9d29a]"
                          >
                            {STATUS_COLUMNS.map(({ status: statusValue, label }) => (
                              <option key={statusValue} value={statusValue}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>

      <Transition show={isCategoryManagerOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsCategoryManagerOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-3xl border border-white/20 bg-[#02141f] p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Dialog.Title className="text-lg font-semibold text-white">Task Categories</Dialog.Title>
                      <p className="mt-2 text-sm text-[#d0d6db]">
                        Personalize categories to match your pre-event workflow. Updates apply instantly across the board.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-full border border-white/10 p-2 text-[#f5f6f7] transition hover:border-[#f5f6f7]"
                      onClick={() => setIsCategoryManagerOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#00141d] p-4">
                      <label className="text-[11px] uppercase tracking-wide text-[#94a7b5]">Create new category</label>
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          value={newCategoryName}
                          onChange={(eventInstance) => setNewCategoryName(eventInstance.target.value)}
                          placeholder="e.g. Permits"
                          className="flex-1 rounded-xl border border-white/10 bg-[#02141f] px-3 py-2 text-sm text-[#f5f6f7] outline-none transition focus:border-[#e9d29a]"
                        />
                        <button
                          type="button"
                          onClick={() => void handleCreateCategoryInternal()}
                          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#004d66] to-[#003446] px-4 py-2 text-sm font-semibold text-[#e6e7e8] transition hover:opacity-90"
                        >
                          <Plus className="h-4 w-4" />
                          Add
                        </button>
                      </div>
                    </div>

                    <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                      {categories.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-[#02141f] p-6 text-sm text-[#94a7b5]">
                          No custom categories yet. Add one above to get started.
                        </div>
                      ) : (
                        categories.map((category) => {
                          const draft = categoryDrafts[category.category_id];
                          return (
                            <div
                              key={category.category_id}
                              className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/15 bg-[#02141f] p-4"
                            >
                              <div className="flex-1 space-y-2">
                                <label className="text-[11px] uppercase tracking-wide text-[#94a7b5]">Category name</label>
                                <input
                                  value={draft?.name ?? ''}
                                  onChange={(eventInstance) =>
                                    handleCategoryDraftChange(category.category_id, 'name', eventInstance.target.value)
                                  }
                                  className="w-full rounded-xl border border-white/10 bg-[#01111a] px-3 py-2 text-sm text-[#f5f6f7] outline-none transition focus:border-[#e9d29a]"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] uppercase tracking-wide text-[#94a7b5]">Color</label>
                                <input
                                  type="color"
                                  value={draft?.color ?? DEFAULT_HEX_COLOR}
                                  onChange={(eventInstance) =>
                                    handleCategoryDraftChange(category.category_id, 'color', eventInstance.target.value.toUpperCase())
                                  }
                                  className="h-10 w-16 rounded-xl border border-white/10 bg-[#01111a]"
                                />
                              </div>
                              <div className="flex flex-col gap-2">
                                <button
                                  type="button"
                                  onClick={() => void handlePersistCategory(category.category_id)}
                                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#e9d29a] transition hover:border-[#e9d29a] hover:text-[#ffe7b7]"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteCategoryInternal(category.category_id)}
                                  className="inline-flex items-center gap-2 rounded-full border border-[#f87171]/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#f87171] transition hover:border-[#fca5a5] hover:text-[#fca5a5]"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {isCategoryLoading ? (
                      <p className="text-xs uppercase tracking-wide text-[#94a7b5]">Syncing categories...</p>
                    ) : null}
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {isLoading ? (
        <div className="flex items-center justify-center gap-3 text-sm text-[#d0d6db]">
          <Loader2 className="h-4 w-4 animate-spin text-[#e9d29a]" />
          Loading tasks…
        </div>
      ) : null}
    </section>
  );
}

export type { CreateTaskPayload, EventTaskBoardProps };
