'use client';

import { useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseStore } from '@/stores/supabase-store';
import { exportEventToPDF } from '@/utils/pdf-export';
import {
  Calendar,
  Users,
  Edit,
  ArrowLeft,
  FileText,
  Car,
} from 'lucide-react';

const formatDate = (value: string | null | undefined): string => {
  if (!value) return 'Date TBD';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? 'Date TBD' : parsed.toLocaleDateString();
};

const formatTimeRange = (start: string | null | undefined, end: string | null | undefined): string => {
  if (!start && !end) return 'Time TBD';
  return `${start || 'TBD'} – ${end || 'TBD'}`;
};

const formatText = (value: string | null | undefined, fallback = 'Not specified'): string => {
  if (!value) return fallback;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : fallback;
};

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  const {
    events,
    fetchEvents,
    isEventLoading,
    teamMembers,
    fetchTeamMembers,
    fetchTeamAssignments,
    fetchTrafficControls,
    fetchSupervisors,
    teamAssignments,
    trafficControls,
    supervisors,
  } = useSupabaseStore();

  useEffect(() => {
    if (!events.length) {
      fetchEvents().catch((error: unknown) => {
        console.error('Error loading events:', error);
      });
    }
  }, [events.length, fetchEvents]);

  useEffect(() => {
    if (!teamMembers.length) {
      fetchTeamMembers().catch((error: unknown) => {
        console.error('Error loading team members:', error);
      });
    }
  }, [teamMembers.length, fetchTeamMembers]);

  const eventId = params.id;
  const event = events.find((e) => e.event_id === eventId);

  useEffect(() => {
    if (!eventId) return;
    const loadRelatedData = async () => {
      try {
        await Promise.all([
          fetchTeamAssignments(eventId),
          fetchTrafficControls(eventId),
          fetchSupervisors(eventId),
        ]);
      } catch (error) {
        console.error('Error loading event-related data:', error);
      }
    };

    loadRelatedData();
  }, [eventId, fetchTeamAssignments, fetchTrafficControls, fetchSupervisors]);

  const eventAssignments = useMemo(() => {
    if (!eventId) return [];
    return teamAssignments
      .filter((assignment) => assignment.event_id === eventId)
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [eventId, teamAssignments]);

  const eventTraffic = useMemo(() => {
    if (!eventId) return [];
    return trafficControls
      .filter((control) => control.event_id === eventId)
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [eventId, trafficControls]);

  const eventSupervisors = useMemo(() => {
    if (!eventId) return [];
    return supervisors
      .filter((supervisor) => supervisor.event_id === eventId)
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [eventId, supervisors]);

  if (!event && isEventLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading event...</p>
        </div>
      </div>
    );
  }

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

  const getMemberName = (memberId: string | null | undefined): string => {
    if (!memberId) return 'Not specified';
    const member = teamMembers.find((m) => m.member_id === memberId);
    return member ? member.member_name : 'Not specified';
  };

  const handleExport = () => {
    exportEventToPDF({
      event,
      teamMembers,
      teamAssignments: eventAssignments,
      trafficControls: eventTraffic,
      supervisors: eventSupervisors,
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/events"
            className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{event.event_name}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formatDate(event.event_date)} · {formatTimeRange(event.start_time, event.end_time)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/events/${event.event_id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Event
          </Link>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FileText className="h-4 w-4 mr-2" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Event Overview */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700 dark:text-gray-300">
          <div className="space-y-3">
            <p><span className="font-semibold">Location:</span> {formatText(event.location)}</p>
            <p><span className="font-semibold">Team Meet Time:</span> {event.team_meet_time || 'Time TBD'}</p>
            <p><span className="font-semibold">Meet Location:</span> {formatText(event.meet_location)}</p>
          </div>
          <div className="space-y-3">
            <p><span className="font-semibold">Prepared By:</span> {formatText(event.prepared_by)}</p>
            <p><span className="font-semibold">Date Prepared:</span> {formatDate(event.prepared_date)}</p>
            <p><span className="font-semibold">Notes:</span> {formatText(event.notes, 'No additional notes')}</p>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href={`/events/${event.event_id}/assignments`}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg mb-4 group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
            <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Manage Assignments</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Create or update staff assignments for this event.
          </p>
        </Link>

        <Link
          href={`/events/${event.event_id}/traffic-control`}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg mb-4 group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
            <Car className="h-6 w-6 text-orange-600 dark:text-orange-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Traffic Assignments</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Coordinate deputies and patrol vehicles for traffic control.
          </p>
        </Link>

        <Link
          href={`/events/${event.event_id}/supervisors`}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
            <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Manage Supervisors</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {eventSupervisors.length ? `${eventSupervisors.length} supervisor(s) assigned` : 'No supervisors assigned yet'}
          </p>
        </Link>
      </div>

      {/* Supervisors */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Supervisors</h2>
        {eventSupervisors.length ? (
          <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            {eventSupervisors.map((supervisor, index) => (
              <li key={supervisor.supervisor_id} className="flex items-center gap-2">
                <span className="font-medium">Supervisor {index + 1}:</span>
                <span>{formatText(supervisor.supervisor_name, 'Unnamed supervisor')}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No supervisors assigned.</p>
        )}
      </section>

      {/* Team Assignments */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Team Assignments</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {eventAssignments.length} assignment{eventAssignments.length === 1 ? '' : 's'}
          </span>
        </div>
        {eventAssignments.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Team Member</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Assignment</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Equipment / Area</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Time</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {eventAssignments.map((assignment) => (
                  <tr key={assignment.assignment_id}>
                    <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{getMemberName(assignment.member_id)}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{formatText(assignment.assignment_type, '—')}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{formatText(assignment.equipment_area, '—')}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{formatTimeRange(assignment.start_time, assignment.end_time)}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{formatText(assignment.notes, '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No assignments recorded for this event.</p>
        )}
      </section>

      {/* Traffic Control */}
      <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Traffic Control</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {eventTraffic.length} post{eventTraffic.length === 1 ? '' : 's'}
          </span>
        </div>
        {eventTraffic.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/40">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Staff Member</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Patrol Vehicle</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700 dark:text-gray-300">Area Assignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {eventTraffic.map((control) => (
                  <tr key={control.traffic_id}>
                    <td className="px-4 py-2 text-gray-800 dark:text-gray-200">
                      {formatText(control.staff_name, getMemberName(control.member_id))}
                    </td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{formatText(control.patrol_vehicle, '—')}</td>
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{formatText(control.area_assignment, '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No traffic control assignments recorded.</p>
        )}
      </section>
    </div>
  );
}
