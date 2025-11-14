'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Settings,
  Plus,
  X,
  Edit2,
  Trash2,
  Check,
  Info,
  Sparkles,
  ClipboardList,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

import { useSupabaseStore } from '@/stores/supabase-store';
import type { AssignmentCategory } from '@/types';

export default function SettingsPage() {
  const {
    assignmentCategories,
    fetchAssignmentCategories,
    addAssignmentCategory,
    updateAssignmentCategory,
    deleteAssignmentCategory,
    getCategoryHierarchy,
    taskCategories,
    fetchTaskCategories,
    createTaskCategory,
    updateTaskCategory,
    deleteTaskCategory,
  } = useSupabaseStore();

  // Assignment category state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [isAddingSubcategory, setIsAddingSubcategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Task category state
  const [isAddingTaskCategory, setIsAddingTaskCategory] = useState(false);
  const [newTaskCategoryName, setNewTaskCategoryName] = useState('');
  const [newTaskCategoryColor, setNewTaskCategoryColor] = useState('#3b82f6');
  const [taskCategoryError, setTaskCategoryError] = useState<string | null>(null);
  const [editingTaskCategory, setEditingTaskCategory] = useState<string | null>(null);
  const [editingTaskCategoryName, setEditingTaskCategoryName] = useState('');
  const [editingTaskCategoryColor, setEditingTaskCategoryColor] = useState('');
  const [isSavingTaskCategory, setIsSavingTaskCategory] = useState(false);

  useEffect(() => {
    fetchAssignmentCategories().catch((error: unknown) => {
      console.error('Error loading assignment categories:', error);
    });
  }, [fetchAssignmentCategories]);

  useEffect(() => {
    fetchTaskCategories().catch((error: unknown) => {
      console.error('Error loading task categories:', error);
    });
  }, [fetchTaskCategories]);

  // Get hierarchical category structure
  const hierarchicalCategories = useMemo(() => getCategoryHierarchy(), [getCategoryHierarchy, assignmentCategories]);

  // Auto-expand categories that have children (only once on initial load)
  useEffect(() => {
    const newExpanded = new Set<string>();
    hierarchicalCategories.forEach((category) => {
      if (category.children && category.children.length > 0) {
        newExpanded.add(category.category_id);
      }
    });
    setExpandedCategories(newExpanded);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignmentCategories.length]);

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const handleAddCategory = async (parentId?: string | null) => {
    if (!newCategoryName.trim()) {
      return;
    }

    setIsSavingCategory(true);
    setCategoryError(null);

    try {
      await addAssignmentCategory({
        category_name: newCategoryName,
        parent_category_id: parentId || null,
      });
      setNewCategoryName('');
      setIsAddingCategory(false);
      setIsAddingSubcategory(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to add category.';
      setCategoryError(message);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const startEditingCategory = (categoryId: string, categoryName: string) => {
    setEditingCategory(categoryId);
    setEditingName(categoryName);
    setCategoryError(null);
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    setEditingName('');
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) {
      return;
    }

    if (!editingName.trim()) {
      setCategoryError('Category name is required.');
      return;
    }

    setIsSavingCategory(true);
    setCategoryError(null);

    try {
      await updateAssignmentCategory(editingCategory, {
        category_name: editingName,
      });
      cancelEditing();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update category.';
      setCategoryError(message);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    if (!confirm(`Delete category "${categoryName}"? This will also delete any subcategories. This cannot be undone.`)) {
      return;
    }

    setCategoryError(null);

    try {
      await deleteAssignmentCategory(categoryId);
      if (editingCategory === categoryId) {
        cancelEditing();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete category.';
      setCategoryError(message);
    }
  };

  const handleAddTaskCategory = async () => {
    if (!newTaskCategoryName.trim()) {
      return;
    }

    setIsSavingTaskCategory(true);
    setTaskCategoryError(null);

    try {
      await createTaskCategory({
        name: newTaskCategoryName,
        color: newTaskCategoryColor,
      });
      setNewTaskCategoryName('');
      setNewTaskCategoryColor('#3b82f6');
      setIsAddingTaskCategory(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to add task category.';
      setTaskCategoryError(message);
    } finally {
      setIsSavingTaskCategory(false);
    }
  };

  const startEditingTaskCategory = (categoryId: string) => {
    const category = taskCategories.find((c) => c.category_id === categoryId);
    if (!category) return;

    setEditingTaskCategory(categoryId);
    setEditingTaskCategoryName(category.name);
    setEditingTaskCategoryColor(category.color);
    setTaskCategoryError(null);
  };

  const cancelEditingTaskCategory = () => {
    setEditingTaskCategory(null);
    setEditingTaskCategoryName('');
    setEditingTaskCategoryColor('');
  };

  const handleUpdateTaskCategory = async () => {
    if (!editingTaskCategory) {
      return;
    }

    if (!editingTaskCategoryName.trim()) {
      setTaskCategoryError('Category name is required.');
      return;
    }

    setIsSavingTaskCategory(true);
    setTaskCategoryError(null);

    try {
      await updateTaskCategory(editingTaskCategory, {
        name: editingTaskCategoryName,
        color: editingTaskCategoryColor,
      });
      cancelEditingTaskCategory();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update task category.';
      setTaskCategoryError(message);
    } finally {
      setIsSavingTaskCategory(false);
    }
  };

  const handleDeleteTaskCategory = async (categoryId: string) => {
    const category = taskCategories.find((c) => c.category_id === categoryId);
    if (!confirm(`Delete task category "${category?.name}"? This cannot be undone.`)) {
      return;
    }

    setTaskCategoryError(null);

    try {
      await deleteTaskCategory(categoryId);
      if (editingTaskCategory === categoryId) {
        cancelEditingTaskCategory();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete task category.';
      setTaskCategoryError(message);
    }
  };

  const renderCategory = (category: AssignmentCategory, isChild: boolean = false) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.category_id);
    const isEditing = editingCategory === category.category_id;

    return (
      <div key={category.category_id} className={isChild ? 'ml-6' : ''}>
        <div
          className={`rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-[#f5f6f7] shadow-[0_12px_28px_rgba(0,0,0,0.35)] ${
            isChild ? 'bg-white/5' : ''
          }`}
        >
          {isEditing ? (
            <div className="flex flex-col gap-3">
              <input
                type="text"
                value={editingName}
                onChange={(event) => setEditingName(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleUpdateCategory()}
                className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none transition focus:border-[#e9d29a] focus:shadow-[0_0_0_2px_rgba(233,210,154,0.25)]"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleUpdateCategory}
                  disabled={isSavingCategory}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/80 to-emerald-600/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Check className="h-4 w-4" />
                  Save
                </button>
                <button
                  onClick={cancelEditing}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#e6e7e8] transition hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-1">
                  {hasChildren && (
                    <button
                      onClick={() => toggleCategory(category.category_id)}
                      className="inline-flex items-center justify-center rounded-full bg-white/10 p-1 text-[#e6e7e8] transition hover:bg-white/20"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>
                  )}
                  <div>
                    <p className="text-base font-medium text-white">
                      {category.category_name}
                      {hasChildren && (
                        <span className="ml-2 text-xs text-[#9aa7b5]">
                          ({category.children?.length} subcategor{category.children?.length === 1 ? 'y' : 'ies'})
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-[#d0d6db]">
                      {isChild ? 'Subcategory' : 'Parent category'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isChild && (
                    <button
                      onClick={() => {
                        setIsAddingSubcategory(category.category_id);
                        setIsAddingCategory(false);
                        setNewCategoryName('');
                        setCategoryError(null);
                      }}
                      className="inline-flex items-center justify-center gap-1 rounded-full bg-blue-500/20 px-2 py-1 text-xs font-semibold text-blue-100 transition hover:bg-blue-500/30"
                      aria-label={`Add subcategory to ${category.category_name}`}
                    >
                      <Plus className="h-3 w-3" />
                      Sub
                    </button>
                  )}
                  <button
                    onClick={() => startEditingCategory(category.category_id, category.category_name)}
                    className="inline-flex items-center justify-center rounded-full bg-white/10 p-2 text-[#e6e7e8] transition hover:bg-white/20"
                    aria-label={`Edit ${category.category_name}`}
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(category.category_id, category.category_name)}
                    className="inline-flex items-center justify-center rounded-full bg-red-500/20 p-2 text-red-100 transition hover:bg-red-500/30"
                    aria-label={`Delete ${category.category_name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Add subcategory form inline */}
              {isAddingSubcategory === category.category_id && (
                <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.target.value)}
                    onKeyDown={(event) => event.key === 'Enter' && handleAddCategory(category.category_id)}
                    placeholder="e.g. Camera Operator, Audio Tech"
                    className="w-full rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white shadow-inner outline-none transition placeholder:text-[#9aa7b5] focus:border-[#e9d29a] focus:shadow-[0_0_0_2px_rgba(233,210,154,0.25)]"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddCategory(category.category_id)}
                      disabled={!newCategoryName.trim() || isSavingCategory}
                      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/80 to-emerald-600/80 px-4 py-1.5 text-xs font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Check className="h-3 w-3" />
                      {isSavingCategory ? 'Saving…' : 'Add'}
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingSubcategory(null);
                        setNewCategoryName('');
                      }}
                      className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-[#e6e7e8] transition hover:bg-white/15"
                    >
                      <X className="h-3 w-3" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2">
            {category.children?.map((child) => renderCategory(child, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001a24] via-[#003446] to-[#002233] text-slate-100">
      <main className="mx-auto w-full max-w-6xl px-6 py-12 lg:px-10">
        <header className="mb-10 rounded-3xl border border-[#004d66] bg-gradient-to-r from-white/10 via-white/5 to-transparent p-8 text-[#f5f6f7] shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-[#e9d29a]">
                <Settings className="h-4 w-4" />
                Settings
              </div>
              <div>
                <h1 className="text-4xl font-semibold italic text-[#fdfbf7]">Configure your workspace</h1>
                <p className="mt-3 max-w-2xl text-sm text-[#d0d6db]">
                  Maintain assignment categories and review system information so everyone stays aligned on staffing expectations.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsAddingCategory(true);
                setIsAddingSubcategory(null);
                setEditingCategory(null);
                setEditingName('');
                setCategoryError(null);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#004d66] to-[#003446] px-6 py-3 text-sm font-semibold text-[#e6e7e8] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Add Parent Category
            </button>
          </div>
        </header>

        {categoryError && (
          <div className="mb-8 rounded-3xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100 shadow-[0_10px_30px_rgba(185,28,28,0.25)]">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4" />
              <span>{categoryError}</span>
            </div>
          </div>
        )}

        {isAddingCategory && (
          <section className="mb-10 rounded-3xl border border-[#004d66] bg-gradient-to-br from-[rgba(0,52,70,0.55)] via-[rgba(0,36,53,0.42)] to-[rgba(0,36,53,0.32)] p-6 text-[#f5f6f7] shadow-[0_18px_36px_rgba(0,0,0,0.45)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-[#e9d29a]">Add parent category</h2>
                <p className="mt-2 text-sm text-[#d0d6db]">Create a top-level category that can contain subcategories for better organization.</p>
              </div>
              <button
                onClick={() => {
                  setIsAddingCategory(false);
                  setNewCategoryName('');
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
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleAddCategory(null)}
                placeholder="e.g. Technical Support, Crowd Control, Logistics"
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-base text-white shadow-inner outline-none transition placeholder:text-[#9aa7b5] focus:border-[#e9d29a] focus:shadow-[0_0_0_2px_rgba(233,210,154,0.25)]"
                autoFocus
              />
              <div className="flex gap-3 md:w-auto">
                <button
                  onClick={() => handleAddCategory(null)}
                  disabled={!newCategoryName.trim() || isSavingCategory}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500/80 to-emerald-600/80 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(16,185,129,0.3)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Check className="h-4 w-4" />
                  {isSavingCategory ? 'Saving…' : 'Save Category'}
                </button>
                <button
                  onClick={() => {
                    setIsAddingCategory(false);
                    setNewCategoryName('');
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

        <section className="mb-10 rounded-3xl border border-[#004d66] bg-gradient-to-br from-[rgba(0,52,70,0.45)] via-[rgba(0,36,53,0.35)] to-[rgba(0,36,53,0.28)] p-6 text-[#f5f6f7] shadow-[0_18px_36px_rgba(0,0,0,0.45)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-[#e9d29a]">Assignment Categories</h2>
              <p className="text-xs uppercase tracking-wide text-[#d0d6db]">
                {assignmentCategories.length} categor{assignmentCategories.length === 1 ? 'y' : 'ies'} in use
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#f5f6f7]">
              <ClipboardList className="h-4 w-4" />
              Staffing taxonomy
            </span>
          </div>

          {/* Scrollable hierarchical category list */}
          <div className="mt-6 max-h-[600px] overflow-y-auto space-y-3 pr-2">
            {hierarchicalCategories.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
                <p className="text-sm text-[#d0d6db]">No categories yet. Click &ldquo;Add Parent Category&rdquo; to get started.</p>
              </div>
            ) : (
              hierarchicalCategories.map((category) => renderCategory(category))
            )}
          </div>
        </section>

        {taskCategoryError && (
          <div className="mb-8 rounded-3xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100 shadow-[0_10px_30px_rgba(185,28,28,0.25)]">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4" />
              <span>{taskCategoryError}</span>
            </div>
          </div>
        )}

        {isAddingTaskCategory && (
          <section className="mb-10 rounded-3xl border border-[#004d66] bg-gradient-to-br from-[rgba(0,52,70,0.55)] via-[rgba(0,36,53,0.42)] to-[rgba(0,36,53,0.32)] p-6 text-[#f5f6f7] shadow-[0_18px_36px_rgba(0,0,0,0.45)]">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-[#e9d29a]">Add task category</h2>
                <p className="mt-2 text-sm text-[#d0d6db]">Organize pre-event tasks into color-coded categories for better visibility and tracking.</p>
              </div>
              <button
                onClick={() => {
                  setIsAddingTaskCategory(false);
                  setNewTaskCategoryName('');
                  setNewTaskCategoryColor('#3b82f6');
                }}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#e9d29a] transition hover:bg-white/20"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <div className="flex flex-col gap-3 md:flex-row">
                <input
                  type="text"
                  value={newTaskCategoryName}
                  onChange={(event) => setNewTaskCategoryName(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && handleAddTaskCategory()}
                  placeholder="e.g. Permits, Logistics, Outreach"
                  className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-base text-white shadow-inner outline-none transition placeholder:text-[#9aa7b5] focus:border-[#e9d29a] focus:shadow-[0_0_0_2px_rgba(233,210,154,0.25)]"
                  autoFocus
                />
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newTaskCategoryColor}
                    onChange={(event) => setNewTaskCategoryColor(event.target.value)}
                    className="h-12 w-12 cursor-pointer rounded-2xl border border-white/10 bg-white/10"
                  />
                </div>
              </div>
              <div className="flex gap-3 md:w-auto">
                <button
                  onClick={handleAddTaskCategory}
                  disabled={!newTaskCategoryName.trim() || isSavingTaskCategory}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500/80 to-emerald-600/80 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(16,185,129,0.3)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Check className="h-4 w-4" />
                  {isSavingTaskCategory ? 'Saving…' : 'Save Category'}
                </button>
                <button
                  onClick={() => {
                    setIsAddingTaskCategory(false);
                    setNewTaskCategoryName('');
                    setNewTaskCategoryColor('#3b82f6');
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

        <section className="mb-10 rounded-3xl border border-[#004d66] bg-gradient-to-br from-[rgba(0,52,70,0.45)] via-[rgba(0,36,53,0.35)] to-[rgba(0,36,53,0.28)] p-6 text-[#f5f6f7] shadow-[0_18px_36px_rgba(0,0,0,0.45)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-[#e9d29a]">Task Categories</h2>
              <p className="text-xs uppercase tracking-wide text-[#d0d6db]">
                {taskCategories.length} category{taskCategories.length === 1 ? '' : 'ies'} for pre-event tasks
              </p>
            </div>
            <button
              onClick={() => {
                setIsAddingTaskCategory(true);
                setEditingTaskCategory(null);
                setEditingTaskCategoryName('');
                setEditingTaskCategoryColor('');
                setTaskCategoryError(null);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#e9d29a] transition hover:bg-white/20"
            >
              <Plus className="h-4 w-4" />
              Add Task Category
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {taskCategories.map((category) => (
              <div
                key={category.category_id}
                className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-[#f5f6f7] shadow-[0_12px_28px_rgba(0,0,0,0.35)]"
              >
                {editingTaskCategory === category.category_id ? (
                  <div className="flex flex-col gap-3">
                    <input
                      type="text"
                      value={editingTaskCategoryName}
                      onChange={(event) => setEditingTaskCategoryName(event.target.value)}
                      onKeyDown={(event) => event.key === 'Enter' && handleUpdateTaskCategory()}
                      className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm text-white outline-none transition focus:border-[#e9d29a] focus:shadow-[0_0_0_2px_rgba(233,210,154,0.25)]"
                    />
                    <input
                      type="color"
                      value={editingTaskCategoryColor}
                      onChange={(event) => setEditingTaskCategoryColor(event.target.value)}
                      className="h-10 w-full cursor-pointer rounded-xl border border-white/10 bg-white/10"
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleUpdateTaskCategory}
                        disabled={isSavingTaskCategory}
                        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500/80 to-emerald-600/80 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Check className="h-4 w-4" />
                        Save
                      </button>
                      <button
                        onClick={cancelEditingTaskCategory}
                        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#e6e7e8] transition hover:bg-white/20"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <p className="text-base font-medium text-white">{category.name}</p>
                        <p className="mt-1 text-xs uppercase tracking-wide text-[#d0d6db]">Task grouping</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={() => startEditingTaskCategory(category.category_id)}
                        className="inline-flex items-center justify-center rounded-full bg-white/10 p-2 text-[#e6e7e8] transition hover:bg-white/20"
                        aria-label={`Edit ${category.name}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTaskCategory(category.category_id)}
                        className="inline-flex items-center justify-center rounded-full bg-red-500/20 p-2 text-red-100 transition hover:bg-red-500/30"
                        aria-label={`Delete ${category.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10 rounded-3xl border border-[#004d66] bg-gradient-to-br from-[rgba(0,52,70,0.35)] via-[rgba(0,36,53,0.28)] to-[rgba(0,36,53,0.22)] p-6 text-[#f5f6f7] shadow-[0_14px_28px_rgba(0,0,0,0.35)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-[#e9d29a]">Application Information</h2>
              <p className="text-xs uppercase tracking-wide text-[#d0d6db]">Platform overview</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#f5f6f7]">
              <Info className="h-4 w-4" />
              System
            </span>
          </div>
          <dl className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm">
              <dt className="text-xs uppercase tracking-wide text-[#94a7b5]">Version</dt>
              <dd className="mt-2 text-base font-medium text-white">1.0.0</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm">
              <dt className="text-xs uppercase tracking-wide text-[#94a7b5]">Built with</dt>
              <dd className="mt-2 text-base font-medium text-white">Next.js · TypeScript · Tailwind CSS</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm">
              <dt className="text-xs uppercase tracking-wide text-[#94a7b5]">Storage</dt>
              <dd className="mt-2 text-base font-medium text-white">Supabase PostgreSQL</dd>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm">
              <dt className="text-xs uppercase tracking-wide text-[#94a7b5]">Data Persistence</dt>
              <dd className="mt-2 text-base font-medium text-white">Supabase-backed Zustand store</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-3xl border border-[#004d66] bg-gradient-to-br from-[rgba(30,64,175,0.35)] via-[rgba(15,52,92,0.32)] to-[rgba(4,31,56,0.28)] p-6 text-[#f5f6f7] shadow-[0_18px_36px_rgba(10,28,61,0.45)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-[#c7d2fe]">Coming Soon</h2>
              <p className="text-xs uppercase tracking-wide text-[#d0d6f7]">Future roadmap highlights</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#c7d2fe]">
              <Sparkles className="h-4 w-4" />
              Roadmap
            </span>
          </div>
          <ul className="mt-6 space-y-3 text-sm text-[#d0d6f7]">
            <li>• Cloud storage integrations (Airtable, Google Sheets)</li>
            <li>• Role-based permissions and custom access levels</li>
            <li>• Real-time collaboration for on-the-fly staffing adjustments</li>
            <li>• Mobile experience for field teams</li>
            <li>• Deep-dive analytics and printable reports</li>
            <li>• Calendar sync with agency scheduling systems</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
