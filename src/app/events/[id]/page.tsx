'use client';


import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/stores/app-store';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Edit,
  Share2,
  Download,
  ArrowLeft,
  User,
  Plus
} from 'lucide-react';

export default function EventDetailPage() {
  const params = useParams();
  const {
    events,
    teamMembers,
    getTeamAssignments,
    getTrafficControls,
    getSupervisors
  } = useAppStore();

  const event = events.find(e => e.event_id === params.id);

  if (!event) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Event Not Found
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          The event you&apos;re looking for doesn&apos;t exist or has been deleted.
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

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/events/${event.event_id}/public`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.event_name,
          text: `Event: ${event.event_name} on ${new Date(event.event_date).toLocaleDateString()}`,
          url: shareUrl,
        });
      } catch {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl);
        alert('Share link copied to clipboard!');
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(shareUrl);
      alert('Share link copied to clipboard!');
    }
  };

  const handleExportPDF = () => {
    // Import PDF export function dynamically to avoid SSR issues
    import('@/utils/pdf-export').then(({ exportEventToPDF }) => {
      // Get real data from the store
      const teamAssignments = getTeamAssignments(event.event_id);
      const trafficControls = getTrafficControls(event.event_id);
      const supervisors = getSupervisors(event.event_id);

      const exportData = {
        event,
        teamMembers,
        teamAssignments,
        trafficControls,
        supervisors
      };

      try {
        exportEventToPDF(exportData);
      } catch (error) {
        console.error('Error exporting PDF:', error);
        alert('Error generating PDF. Please try again.');
      }
    }).catch(error => {
      console.error('Error loading PDF export module:', error);
      alert('Error loading PDF export functionality.');
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
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
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button
              onClick={handleShare}
              className="inline-flex items-center justify-center px-4 py-3 sm:px-3 sm:py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors touch-manipulation"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </button>
            <div className="relative">
              <button
                onClick={handleExportPDF}
                className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-3 sm:px-3 sm:py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors touch-manipulation"
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </button>
            </div>
            <Link
              href={`/events/${event.event_id}/edit`}
              className="inline-flex items-center justify-center px-4 py-3 sm:px-4 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors touch-manipulation"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Event
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Event Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-6">
            <Calendar className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Event Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <Calendar className="h-4 w-4 mr-3" />
                <span className="font-medium mr-2">Date:</span>
                <span>{new Date(event.event_date).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <Clock className="h-4 w-4 mr-3" />
                <span className="font-medium mr-2">Event Time:</span>
                <span>{event.start_time} - {event.end_time}</span>
              </div>

              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <Clock className="h-4 w-4 mr-3" />
                <span className="font-medium mr-2">Team Meet:</span>
                <span>{event.team_meet_time}</span>
              </div>

              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <MapPin className="h-4 w-4 mr-3" />
                <span className="font-medium mr-2">Location:</span>
                <span>{event.location}</span>
              </div>

              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <MapPin className="h-4 w-4 mr-3" />
                <span className="font-medium mr-2">Meet Location:</span>
                <span>{event.meet_location}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <User className="h-4 w-4 mr-3" />
                <span className="font-medium mr-2">Prepared By:</span>
                <span>{event.prepared_by}</span>
              </div>

              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <Calendar className="h-4 w-4 mr-3" />
                <span className="font-medium mr-2">Date Prepared:</span>
                <span>{new Date(event.prepared_date).toLocaleDateString()}</span>
              </div>

              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <Calendar className="h-4 w-4 mr-3" />
                <span className="font-medium mr-2">Created:</span>
                <span>{new Date(event.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {event.notes && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-start">
                <FileText className="h-4 w-4 mr-3 mt-1 text-gray-400" />
                <div>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Notes:</span>
                  <p className="mt-1 text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {event.notes}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Supervisors - Placeholder */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-4">
            <Users className="h-5 w-5 text-green-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Supervisors</h2>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Supervisor assignments will be displayed here once the assignment interface is implemented.
          </p>
        </div>

        {/* Team Assignments */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-purple-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Team Assignments</h2>
            </div>
            <Link
              href={`/events/${event.event_id}/assignments`}
              className="inline-flex items-center px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
            >
              Manage Assignments
            </Link>
          </div>

          {(() => {
            const eventAssignments = getTeamAssignments(event.event_id);

            if (eventAssignments.length === 0) {
              return (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No team assignments yet
                  </p>
                  <Link
                    href={`/events/${event.event_id}/assignments`}
                    className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Assignments
                  </Link>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {eventAssignments.map((assignment) => {
                  const member = teamMembers.find(m => m.member_id === assignment.member_id);
                  return (
                    <div
                      key={assignment.assignment_id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {member?.member_name || 'Unknown Member'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {assignment.assignment_type} • {assignment.equipment_area}
                        </div>
                        <div className="text-sm text-gray-500">
                          {assignment.start_time} - {assignment.end_time}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                  <Link
                    href={`/events/${event.event_id}/assignments`}
                    className="inline-flex items-center px-3 py-1 text-sm text-purple-600 hover:text-purple-700"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add More Assignments
                  </Link>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Traffic Control */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-orange-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Traffic Control</h2>
            </div>
            <Link
              href={`/events/${event.event_id}/traffic-control`}
              className="inline-flex items-center px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
            >
              Manage Traffic Control
            </Link>
          </div>

          {(() => {
            const eventTrafficControls = getTrafficControls(event.event_id);

            if (eventTrafficControls.length === 0) {
              return (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    No traffic control assignments yet
                  </p>
                  <Link
                    href={`/events/${event.event_id}/traffic-control`}
                    className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Traffic Control
                  </Link>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                {eventTrafficControls.map((trafficControl) => {
                  const member = teamMembers.find(m => m.member_id === trafficControl.member_id);
                  return (
                    <div
                      key={trafficControl.traffic_id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {member?.member_name || 'Unknown Member'}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {trafficControl.patrol_vehicle} • {trafficControl.area_assignment}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="pt-3 border-t border-gray-200 dark:border-gray-600">
                  <Link
                    href={`/events/${event.event_id}/traffic-control`}
                    className="inline-flex items-center px-3 py-1 text-sm text-orange-600 hover:text-orange-700"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add More Traffic Control
                  </Link>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}