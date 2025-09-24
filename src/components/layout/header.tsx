'use client';

import { Navigation } from './navigation';
import { ClipboardList } from 'lucide-react';

export function Header() {
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
          <Navigation />
        </div>
      </div>
    </header>
  );
}