'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseStore } from '@/stores/supabase-store';
import { FormField, Input, Select } from '@/components/ui/form-field';
import {
  Calendar,
  Car,
  Plus,
  Trash2,
  User,
  ArrowLeft,
  Save,
  AlertTriangle,
  MapPin
} from 'lucide-react';


interface TrafficControlForm {
  member_id: string;
  patrol_vehicle: string;
  area_assignment: string;
}

export default function TrafficControlPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    events,
    teamMembers,
    addTrafficControls,
    fetchEvents,
    fetchTeamMembers,
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

  const event = events.find(e => e.event_id === params.id);
  const activeMembers = teamMembers.filter(member => member.active);

  const [trafficControls, setTrafficControls] = useState<TrafficControlForm[]>([]);
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
          The event you&apos;re trying to manage traffic control for doesn&apos;t exist.
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
              Traffic Control
            </h1>
          </div>
        </div>

        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Active Team Members
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to add active team members before creating traffic control assignments.
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

  const addTrafficControl = () => {
    setTrafficControls(prev => [...prev, {
      member_id: '',
      patrol_vehicle: '',
      area_assignment: ''
    }]);
  };

  const removeTrafficControl = (index: number) => {
    setTrafficControls(prev => prev.filter((_, i) => i !== index));
    // Clear related errors
    setErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`traffic_${index}_`)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  };

  const updateTrafficControl = (index: number, field: keyof TrafficControlForm, value: string) => {
    setTrafficControls(prev => prev.map((control, i) =>
      i === index ? { ...control, [field]: value } : control
    ));

    // Clear field error when user starts typing
    const errorKey = `traffic_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  const validateTrafficControls = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (trafficControls.length === 0) {
      newErrors.general = 'At least one traffic control assignment is required';
      setErrors(newErrors);
      return false;
    }

    trafficControls.forEach((control, index) => {
      if (!control.member_id) {
        newErrors[`traffic_${index}_member_id`] = 'Team member is required';
      }
      if (!control.patrol_vehicle.trim()) {
        newErrors[`traffic_${index}_patrol_vehicle`] = 'Patrol vehicle is required';
      }
      if (!control.area_assignment.trim()) {
        newErrors[`traffic_${index}_area_assignment`] = 'Area assignment is required';
      }
    });

    // Check for duplicate member assignments
    const memberIds = trafficControls.map(tc => tc.member_id).filter(Boolean);
    const duplicates = memberIds.filter((id, index) => memberIds.indexOf(id) !== index);
    if (duplicates.length > 0) {
      trafficControls.forEach((control, index) => {
        if (duplicates.includes(control.member_id)) {
          newErrors[`traffic_${index}_member_id`] = 'This team member is already assigned to traffic control';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateTrafficControls()) {
      return;
    }

    setIsSaving(true);

    try {
      const trafficControlsData = trafficControls.map((control, index) => ({
        member_id: control.member_id,
        patrol_vehicle: control.patrol_vehicle.trim(),
        area_assignment: control.area_assignment.trim(),
        sort_order: index + 1,
      }));

      await addTrafficControls(event.event_id, trafficControlsData);

      // Small delay for user feedback
      await new Promise(resolve => setTimeout(resolve, 500));

      router.push(`/events/${event.event_id}`);
    } catch (error) {
      console.error('Error saving traffic controls:', error);
      alert('Error saving traffic controls. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const memberOptions = activeMembers.map(member => ({
    value: member.member_id,
    label: member.member_name
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
                Traffic Control
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {event.event_name} - {new Date(event.event_date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={addTrafficControl}
              className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Traffic Control
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
      <div className="mb-6 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center text-orange-800 dark:text-orange-200">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{new Date(event.event_date).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center text-orange-800 dark:text-orange-200">
            <User className="h-4 w-4 mr-2" />
            <span>{activeMembers.length} available team members</span>
          </div>
        </div>
      </div>

      {/* Traffic Controls */}
      {trafficControls.length === 0 ? (
        <div className="text-center py-12">
          <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Traffic Control Assignments Yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start by adding traffic control assignments for this event.
          </p>
          <button
            onClick={addTrafficControl}
            className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Assignment
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {trafficControls.map((control, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Car className="h-5 w-5 text-orange-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Traffic Control #{index + 1}
                  </h3>
                </div>
                <button
                  onClick={() => removeTrafficControl(index)}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  label="Staff Member"
                  required
                  error={errors[`traffic_${index}_member_id`]}
                >
                  <Select
                    value={control.member_id}
                    onChange={(e) => updateTrafficControl(index, 'member_id', e.target.value)}
                    options={memberOptions}
                    placeholder="Select staff member"
                    error={!!errors[`traffic_${index}_member_id`]}
                  />
                </FormField>

                <FormField
                  label="Patrol Vehicle"
                  required
                  error={errors[`traffic_${index}_patrol_vehicle`]}
                >
                  <div className="relative">
                    <Car className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      value={control.patrol_vehicle}
                      onChange={(e) => updateTrafficControl(index, 'patrol_vehicle', e.target.value)}
                      placeholder="e.g., Unit 1, Bike Patrol, Golf Cart"
                      className="pl-10"
                      error={!!errors[`traffic_${index}_patrol_vehicle`]}
                    />
                  </div>
                </FormField>

                <FormField
                  label="Area Assignment"
                  required
                  error={errors[`traffic_${index}_area_assignment`]}
                >
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      value={control.area_assignment}
                      onChange={(e) => updateTrafficControl(index, 'area_assignment', e.target.value)}
                      placeholder="e.g., Main Entrance, Parking Lot A"
                      className="pl-10"
                      error={!!errors[`traffic_${index}_area_assignment`]}
                    />
                  </div>
                </FormField>
              </div>
            </div>
          ))}

          {/* Actions */}
          <div className="flex items-center justify-between pt-6">
            <button
              onClick={addTrafficControl}
              className="inline-flex items-center px-4 py-2 text-orange-700 bg-orange-100 rounded-lg hover:bg-orange-200 transition-colors"
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
                disabled={isSaving || trafficControls.length === 0}
                className="inline-flex items-center px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : `Save ${trafficControls.length} Assignment${trafficControls.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
