'use client';

import Link from 'next/link';
import { useAppStore } from '@/stores/app-store';
import { Plus, Calendar, MapPin, Clock } from 'lucide-react';

export default function EventsPage() {
  const { events } = useAppStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Events</h1>
        <Link
          href="/events/create"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Link>
      </div>

      {events.length > 0 ? (
        <div className="grid gap-6">
          {events.map((event) => (
            <div
              key={event.event_id}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {event.event_name}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(event.event_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2" />
                      {event.start_time} - {event.end_time}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {event.location}
                    </div>
                  </div>

                  {event.notes && (
                    <p className="mt-3 text-gray-600 dark:text-gray-300 text-sm">
                      {event.notes}
                    </p>
                  )}
                </div>

                <div className="ml-6 flex flex-col space-y-2">
                  <Link
                    href={`/events/${event.event_id}`}
                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    View
                  </Link>
                  <Link
                    href={`/events/${event.event_id}/edit`}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No events yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Get started by creating your first event
          </p>
          <Link
            href="/events/create"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create First Event
          </Link>
        </div>
      )}
    </div>
  );
}