'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/stores/app-store';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Settings,
  Edit,
  ArrowLeft,
  Plus,
  FileText,
  Car
} from 'lucide-react';

export default function EventDetailPage() {
  const params = useParams();
  const { events } = useAppStore();

  const event = events.find(e => e.event_id === params.id);

  if (!event) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Event Not Found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The event you&apos;re looking for doesn&apos;t exist or may have been deleted.
        </p>
        <Link
          href="/events"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link
            href="/events"
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {event.event_name}
          </h1>
        </div>

        {/* Event Details */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center text-blue-800 dark:text-blue-200">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{new Date(event.event_date).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center text-blue-800 dark:text-blue-200">
              <Clock className="h-4 w-4 mr-2" />
              <span>{event.start_time} - {event.end_time}</span>
            </div>
            <div className="flex items-center text-blue-800 dark:text-blue-200">
              <MapPin className="h-4 w-4 mr-2" />
              <span>{event.location}</span>
            </div>
          </div>
          {event.notes && (
            <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-600">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                <strong>Notes:</strong> {event.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Edit Event */}
        <Link
          href={`/events/${event.event_id}/edit`}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
            <Edit className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Edit Event
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Update event details, time, and location
          </p>
        </Link>

        {/* Team Assignments */}
        <Link
          href={`/events/${event.event_id}/assignments`}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg mb-4 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
            <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Team Assignments
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Assign team members to different roles
          </p>
        </Link>

        {/* Traffic Control */}
        <Link
          href={`/events/${event.event_id}/traffic-control`}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg mb-4 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
            <Car className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Traffic Control
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Manage traffic control assignments
          </p>
        </Link>

        {/* Reports */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 opacity-50">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg mb-4">
            <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Reports
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Generate event reports (Coming Soon)
          </p>
        </div>
      </div>
    </div>
  );
}