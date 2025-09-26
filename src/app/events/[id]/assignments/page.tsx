'use client';


import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseStore } from '@/stores/supabase-store';
import { FormField, Input, Select } from '@/components/ui/form-field';
import {
  Calendar,
  Users,
  Plus,
  Trash2,
  Clock,
  ArrowLeft,
  Save,
  AlertTriangle
} from 'lucide-react';
import type { AssignmentCategory } from '@/types';

interface AssignmentForm {
  member_id: string;
  assignment_type: AssignmentCategory;
  equipment_area: string;
  start_time: string;
  end_time: string;
  notes: string;
}

export default function EventAssignmentsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    events,
    teamMembers,
    assignmentCategories,
    addTeamAssignments,
    fetchEvents,
    fetchTeamMembers,
    fetchAssignmentCategories,
    isEventLoading,
    isTeamMembersLoading,
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

  useEffect(() => {
    fetchAssignmentCategories().catch((error: unknown) => {
      console.error('Error loading assignment categories:', error);
    });
  }, [fetchAssignmentCategories]);

  const event = events.find(e => e.event_id === params.id);
  const activeMembers = teamMembers.filter(member => member.active);

  const [assignments, setAssignments] = useState<AssignmentForm[]>([]);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSaving, setIsSaving] = useState(false);

  if (!event && (isEventLoading || events.length === 0)) {
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
          The event you&apos;re trying to assign teams to doesn&apos;t exist.
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

  if (!activeMembers.length && isTeamMembersLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading team members...</p>
        </div>
      </div>
    );
  }

  if (activeMembers.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <Link
              href={`/events/${event.event_id}`}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Team Assignments
            </h1>
          </div>
        </div>

        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Active Team Members
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to add active team members before creating assignments.
          </p>
          <Link
            href="/team-members"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Team Members
          </Link>
        </div>
      </div>
    );
  }

  const addAssignment = () => {
    setAssignments(prev => [...prev, {
      member_id: '',
      assignment_type: 'General Support',
      equipment_area: '',
      start_time: event.start_time,
      end_time: event.end_time,
      notes: ''
    }]);
  };

  const removeAssignment = (index: number) => {
    setAssignments(prev => prev.filter((_, i) => i !== index));
    // Clear related errors
    setErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`assignment_${index}_`)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  };

  const updateAssignment = (index: number, field: keyof AssignmentForm, value: string) => {
    setAssignments(prev => prev.map((assignment, i) =>
      i === index ? { ...assignment, [field]: value } : assignment
    ));

    // Clear field error when user starts typing
    const errorKey = `assignment_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const validateAssignments = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (assignments.length === 0) {
      newErrors.general = 'At least one assignment is required';
      setErrors(newErrors);
      return false;
    }

    assignments.forEach((assignment, index) => {
      if (!assignment.member_id) {
        newErrors[`assignment_${index}_member_id`] = 'Team member is required';
      }
      if (!assignment.assignment_type) {
        newErrors[`assignment_${index}_assignment_type`] = 'Assignment type is required';
      }
      if (!assignment.equipment_area.trim()) {
        newErrors[`assignment_${index}_equipment_area`] = 'Equipment/Area is required';
      }
      if (!assignment.start_time) {
        newErrors[`assignment_${index}_start_time`] = 'Start time is required';
      }
      if (!assignment.end_time) {
        newErrors[`assignment_${index}_end_time`] = 'End time is required';
      }

      // Time validation
      if (assignment.start_time && assignment.end_time) {
        if (assignment.start_time >= assignment.end_time) {
          newErrors[`assignment_${index}_end_time`] = 'End time must be after start time';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateAssignments()) {
      return;
    }

    setIsSaving(true);

    try {
      // Convert form data to TeamAssignment objects
      const assignmentsToInsert = assignments.map((assignment, index) => ({
        member_id: assignment.member_id,
        assignment_type: assignment.assignment_type,
        equipment_area: assignment.equipment_area.trim(),
        start_time: assignment.start_time,
        end_time: assignment.end_time,
        notes: assignment.notes?.trim() || undefined,
        sort_order: index + 1,
      }));

      await addTeamAssignments(event.event_id, assignmentsToInsert);

      // Small delay for user feedback
      await new Promise(resolve => setTimeout(resolve, 500));

      router.push(`/events/${event.event_id}`);
    } catch (error) {
      console.error('Error saving assignments:', error);
      alert('Error saving assignments. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const memberOptions = activeMembers.map(member => ({
    value: member.member_id,
    label: member.member_name
  }));

  const categoryOptions = assignmentCategories.map(category => ({
    value: category,
    label: category
  }));

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href={`/events/${event.event_id}`}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Team Assignments
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {event.event_name} - {new Date(event.event_date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={addAssignment}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Assignment
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errors.general && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{errors.general}</p>
        </div>
      )}

      {/* Event Info Summary */}
      <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
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
            <Users className="h-4 w-4 mr-2" />
            <span>{activeMembers.length} active members</span>
          </div>
        </div>
      </div>

      {/* Assignments */}
      {assignments.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Assignments Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start by adding team member assignments for this event.
          </p>
          <button
            onClick={addAssignment}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Assignment
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {assignments.map((assignment, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Assignment #{index + 1}
                </h3>
                <button
                  onClick={() => removeAssignment(index)}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  label="Team Member"
                  required
                  error={errors[`assignment_${index}_member_id`]}
                >
                  <Select
                    value={assignment.member_id}
                    onChange={(e) => updateAssignment(index, 'member_id', e.target.value)}
                    options={memberOptions}
                    placeholder="Select team member"
                    error={!!errors[`assignment_${index}_member_id`]}
                  />
                </FormField>

                <FormField
                  label="Assignment Type"
                  required
                  error={errors[`assignment_${index}_assignment_type`]}
                >
                  <Select
                    value={assignment.assignment_type}
                    onChange={(e) => updateAssignment(index, 'assignment_type', e.target.value as AssignmentCategory)}
                    options={categoryOptions}
                    error={!!errors[`assignment_${index}_assignment_type`]}
                  />
                </FormField>

                <FormField
                  label="Equipment/Area"
                  required
                  error={errors[`assignment_${index}_equipment_area`]}
                >
                  <Input
                    value={assignment.equipment_area}
                    onChange={(e) => updateAssignment(index, 'equipment_area', e.target.value)}
                    placeholder="e.g., Sound System, Stage Left"
                    error={!!errors[`assignment_${index}_equipment_area`]}
                  />
                </FormField>

                <FormField
                  label="Start Time"
                  required
                  error={errors[`assignment_${index}_start_time`]}
                >
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      type="time"
                      value={assignment.start_time}
                      onChange={(e) => updateAssignment(index, 'start_time', e.target.value)}
                      className="pl-10"
                      error={!!errors[`assignment_${index}_start_time`]}
                    />
                  </div>
                </FormField>

                <FormField
                  label="End Time"
                  required
                  error={errors[`assignment_${index}_end_time`]}
                >
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      type="time"
                      value={assignment.end_time}
                      onChange={(e) => updateAssignment(index, 'end_time', e.target.value)}
                      className="pl-10"
                      error={!!errors[`assignment_${index}_end_time`]}
                    />
                  </div>
                </FormField>

                <FormField label="Notes">
                  <Input
                    value={assignment.notes}
                    onChange={(e) => updateAssignment(index, 'notes', e.target.value)}
                    placeholder="Additional notes (optional)"
                  />
                </FormField>
              </div>
            </div>
          ))}

          {/* Actions */}
          <div className="flex items-center justify-between pt-6">
            <button
              onClick={addAssignment}
              className="inline-flex items-center px-4 py-2 text-green-700 bg-green-100 rounded-lg hover:bg-green-200 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Another Assignment
            </button>

            <div className="flex items-center space-x-3">
              <Link
                href={`/events/${event.event_id}`}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={isSaving || assignments.length === 0}
                className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : `Save ${assignments.length} Assignment${assignments.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
