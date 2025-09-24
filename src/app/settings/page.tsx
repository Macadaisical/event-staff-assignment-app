'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { Settings, Plus, X, Edit2, Trash2 } from 'lucide-react';
import type { AssignmentCategory } from '@/types';

export default function SettingsPage() {
  const { assignmentCategories } = useAppStore();
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      // TODO: Implement add category functionality
      setNewCategoryName('');
      setIsAddingCategory(false);
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
            onClick={() => setIsAddingCategory(true)}
            className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Category
          </button>
        </div>

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
                disabled={!newCategoryName.trim()}
                className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                Add
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
          {assignmentCategories.map((category, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
            >
              <span className="text-gray-900 dark:text-white">{category}</span>
              <div className="flex items-center space-x-1">
                <button className="p-1 text-gray-500 hover:text-gray-700">
                  <Edit2 className="h-3 w-3" />
                </button>
                <button className="p-1 text-red-500 hover:text-red-700">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
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
            <dd className="text-sm text-gray-900 dark:text-white">Local Storage (Browser)</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Data Persistence</dt>
            <dd className="text-sm text-gray-900 dark:text-white">Zustand with Persist</dd>
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