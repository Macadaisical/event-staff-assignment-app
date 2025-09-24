'use client';

import Link from 'next/link';
import { useAppStore } from '@/stores/app-store';
import { Calendar, Users, FileText, Plus } from 'lucide-react';

export default function Home() {
  const { events, teamMembers } = useAppStore();

  const recentEvents = events.slice(-3).reverse();
  const activeMembers = teamMembers.filter(member => member.active);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome to Event Staff Assignments
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-lg">
          Manage your event staffing with ease. Create events, assign team members, and track everything in one place.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Events</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{events.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Team Members</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activeMembers.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Team Members</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{teamMembers.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/events/create"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors group"
          >
            <Plus className="h-5 w-5 text-gray-400 group-hover:text-blue-500 mr-2" />
            <span className="text-gray-600 dark:text-gray-300 group-hover:text-blue-500 font-medium">
              Create New Event
            </span>
          </Link>
          <Link
            href="/team-members"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 dark:hover:border-green-400 transition-colors group"
          >
            <Plus className="h-5 w-5 text-gray-400 group-hover:text-green-500 mr-2" />
            <span className="text-gray-600 dark:text-gray-300 group-hover:text-green-500 font-medium">
              Add Team Member
            </span>
          </Link>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Events</h3>
          <Link href="/events" className="text-blue-600 hover:text-blue-500 text-sm font-medium">
            View All →
          </Link>
        </div>
        {recentEvents.length > 0 ? (
          <div className="space-y-3">
            {recentEvents.map((event) => (
              <div key={event.event_id} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{event.event_name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {new Date(event.event_date).toLocaleDateString()} at {event.location}
                  </p>
                </div>
                <Link
                  href={`/events/${event.event_id}`}
                  className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No events created yet. <Link href="/events/create" className="text-blue-600 hover:text-blue-500">Create your first event</Link>
          </p>
        )}
      </div>
    </div>
  );
}
