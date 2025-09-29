'use client';

import { useEffect, useState } from 'react';
import { useSupabaseStore } from '@/stores/supabase-store';
import { Settings, Plus, X, Edit2, Trash2, Check } from 'lucide-react';

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
    <div className="space-y-6">
      <div className="flex items-center">
        <Settings className="h-8 w-8 text-gray-600 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
      </div>

      {/* Assignment Categories */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Assignment Categories
          </h3>
          <button
            onClick={() => {
              setIsAddingCategory(true);
              setCategoryError(null);
              setNewCategoryName('');
            }}
            className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Category
          </button>
        </div>

        {categoryError && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {categoryError}
          </div>
        )}

        {/* Add Category Form */}
        {isAddingCategory && (
          <div className="mb-4 p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter category name"
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white"
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                autoFocus
              />
              <button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim() || isSavingCategory}
                className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {isSavingCategory ? 'Saving...' : 'Add'}
              </button>
              <button
                onClick={() => {
                  setIsAddingCategory(false);
                  setNewCategoryName('');
                }}
                className="px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {assignmentCategories.map((category) => (
            <div
              key={category}
              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
            >
              {editingCategory === category ? (
                <div className="flex w-full items-center space-x-2">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory()}
                    className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    onClick={handleUpdateCategory}
                    disabled={isSavingCategory}
                    className="inline-flex items-center rounded bg-green-600 px-2 py-2 text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="inline-flex items-center rounded bg-gray-500 px-2 py-2 text-white hover:bg-gray-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-gray-900 dark:text-white">{category}</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => startEditingCategory(category)}
                      className="p-1 text-gray-500 hover:text-gray-700"
                    >
                      <Edit2 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      className="p-1 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Application Info */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Application Information
        </h3>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Version</dt>
            <dd className="text-sm text-gray-900 dark:text-white">1.0.0</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Built with</dt>
            <dd className="text-sm text-gray-900 dark:text-white">Next.js, TypeScript, Tailwind CSS</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Storage</dt>
            <dd className="text-sm text-gray-900 dark:text-white">Supabase PostgreSQL</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Data Persistence</dt>
            <dd className="text-sm text-gray-900 dark:text-white">Supabase-backed Zustand Store</dd>
          </div>
        </dl>
      </div>

      {/* Future Features */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4">
          🚀 Coming Soon
        </h3>
        <ul className="space-y-2 text-blue-800 dark:text-blue-200">
          <li>• Cloud storage integration (Airtable/Google Sheets)</li>
          <li>• User authentication and permissions</li>
          <li>• Real-time collaboration</li>
          <li>• Mobile app for team members</li>
          <li>• Advanced reporting and analytics</li>
          <li>• Calendar integration</li>
        </ul>
      </div>
    </div>
  );
}
