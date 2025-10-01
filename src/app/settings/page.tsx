'use client';

import { useEffect, useState } from 'react';
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
} from 'lucide-react';

import { useSupabaseStore } from '@/stores/supabase-store';

export default function SettingsPage() {
  const {
    assignmentCategories,
    fetchAssignmentCategories,
    addAssignmentCategory,
    updateAssignmentCategory,
    deleteAssignmentCategory,
  } = useSupabaseStore();

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  useEffect(() => {
    fetchAssignmentCategories().catch((error: unknown) => {
      console.error('Error loading assignment categories:', error);
    });
  }, [fetchAssignmentCategories]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      return;
    }

    setIsSavingCategory(true);
    setCategoryError(null);

    try {
      await addAssignmentCategory(newCategoryName);
      setNewCategoryName('');
      setIsAddingCategory(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to add category.';
      setCategoryError(message);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const startEditingCategory = (category: string) => {
    setEditingCategory(category);
    setEditingName(category);
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
      await updateAssignmentCategory(editingCategory, editingName);
      cancelEditing();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update category.';
      setCategoryError(message);
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (category: string) => {
    if (!confirm(`Delete category "${category}"? This cannot be undone.`)) {
      return;
    }

    setCategoryError(null);

    try {
      await deleteAssignmentCategory(category);
      if (editingCategory === category) {
        cancelEditing();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete category.';
      setCategoryError(message);
    }
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
                setEditingCategory(null);
                setEditingName('');
                setCategoryError(null);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#004d66] to-[#003446] px-6 py-3 text-sm font-semibold text-[#e6e7e8] shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition hover:opacity-90"
            >
              <Plus className="h-4 w-4" />
              Add Category
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
                <h2 className="text-2xl font-semibold text-[#e9d29a]">Add assignment category</h2>
                <p className="mt-2 text-sm text-[#d0d6db]">Group staffing assignments under clear categories so supervisors can plan coverage efficiently.</p>
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
                onKeyDown={(event) => event.key === 'Enter' && handleAddCategory()}
                placeholder="e.g. Crowd Control, Logistics, Incident Command"
                className="w-full rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-base text-white shadow-inner outline-none transition placeholder:text-[#9aa7b5] focus:border-[#e9d29a] focus:shadow-[0_0_0_2px_rgba(233,210,154,0.25)]"
                autoFocus
              />
              <div className="flex gap-3 md:w-auto">
                <button
                  onClick={handleAddCategory}
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
                {assignmentCategories.length} category{assignmentCategories.length === 1 ? '' : 'ies'} in use
              </p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#f5f6f7]">
              <ClipboardList className="h-4 w-4" />
              Staffing taxonomy
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {assignmentCategories.map((category) => (
              <div
                key={category}
                className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-[#f5f6f7] shadow-[0_12px_28px_rgba(0,0,0,0.35)]"
              >
                {editingCategory === category ? (
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
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-medium text-white">{category}</p>
                      <p className="mt-1 text-xs uppercase tracking-wide text-[#d0d6db]">Assignment grouping</p>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <button
                        onClick={() => startEditingCategory(category)}
                        className="inline-flex items-center justify-center rounded-full bg-white/10 p-2 text-[#e6e7e8] transition hover:bg-white/20"
                        aria-label={`Edit ${category}`}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category)}
                        className="inline-flex items-center justify-center rounded-full bg-red-500/20 p-2 text-red-100 transition hover:bg-red-500/30"
                        aria-label={`Delete ${category}`}
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
