'use client';

import { Navigation } from './navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { ClipboardList, LogOut, User } from 'lucide-react';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 md:py-6">
          <div className="flex items-center">
            <ClipboardList className="h-6 w-6 md:h-8 md:w-8 text-blue-600 mr-2 md:mr-3" />
            <h1 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">
              <span className="hidden sm:inline">Event Staff Assignments</span>
              <span className="sm:hidden">Event Staff</span>
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <Navigation />
            {user && (
              <div className="flex items-center space-x-3">
                <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                  <User className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <button
                  onClick={signOut}
                  className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}