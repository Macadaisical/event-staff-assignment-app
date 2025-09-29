'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseStore } from '@/stores/supabase-store';
import { FormField, Input } from '@/components/ui/form-field';
import {
  Calendar,
  Car,
  Plus,
  Trash2,
  ArrowLeft,
  Save,
  MapPin,
} from 'lucide-react';


interface TrafficControlForm {
  staff_name: string;
  patrol_vehicle: string;
  area_assignment: string;
}

export default function TrafficControlPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    events,
    replaceTrafficControls,
    fetchEvents,
    fetchTrafficControls,
    getTrafficControls,
    trafficControls: storeTrafficControls,
    isEventLoading,
  } = useSupabaseStore();

  useEffect(() => {
    if (!events.length) {
      fetchEvents().catch((error: unknown) => {
        console.error('Error loading events:', error);
      });
    }
  }, [events.length, fetchEvents]);

  const event = events.find(e => e.event_id === params.id);
  const eventId = event?.event_id;

  const [trafficControls, setTrafficControls] = useState<TrafficControlForm[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!eventId) {
      return;
    }

    fetchTrafficControls(eventId).catch((error: unknown) => {
      console.error('Error loading traffic controls:', error);
    });
  }, [eventId, fetchTrafficControls]);

  useEffect(() => {
    if (!eventId || hasInitialized) {
      return;
    }

    const existingControls = getTrafficControls(eventId);
    if (existingControls.length) {
      setTrafficControls(existingControls.map((control) => ({
        staff_name: control.staff_name ?? '',
        patrol_vehicle: control.patrol_vehicle || '',
        area_assignment: control.area_assignment || '',
      })));
    }

    setHasInitialized(true);
  }, [eventId, getTrafficControls, hasInitialized, storeTrafficControls]);

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

  const addTrafficControl = () => {
    setTrafficControls(prev => [...prev, {
      staff_name: '',
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
    setTrafficControls((prev) =>
      prev.map((control, i) => (i === index ? { ...control, [field]: value } : control)),
    );

    // Clear field error when user starts typing
    const errorKey = `traffic_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[errorKey];
        return updated;
      });
    }
  };

  const validateTrafficControls = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    trafficControls.forEach((control, index) => {
      if (!control.staff_name.trim()) {
        newErrors[`traffic_${index}_staff_name`] = 'Staff member is required';
      }
    });

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
        member_id: null,
        staff_name: control.staff_name.trim(),
        patrol_vehicle: control.patrol_vehicle.trim() || null,
        area_assignment: control.area_assignment.trim() || null,
        sort_order: index + 1,
      }));

      await replaceTrafficControls(event.event_id, trafficControlsData);

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
                {event.event_name} · {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'Date TBD'}
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
      {/* Event Info Summary */}
      <div className="mb-6 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
        <div className="flex items-center text-sm text-orange-800 dark:text-orange-200">
          <Calendar className="h-4 w-4 mr-2" />
          <span>{event.event_date ? new Date(event.event_date).toLocaleDateString() : 'Date TBD'}</span>
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
                  error={errors[`traffic_${index}_staff_name`]}
                >
                  <Input
                    value={control.staff_name}
                    onChange={(e) => updateTrafficControl(index, 'staff_name', e.target.value)}
                    placeholder="Enter staff member"
                    error={!!errors[`traffic_${index}_staff_name`]}
                  />
                </FormField>

                <FormField label="Patrol Vehicle">
                  <div className="relative">
                    <Car className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      value={control.patrol_vehicle}
                      onChange={(e) => updateTrafficControl(index, 'patrol_vehicle', e.target.value)}
                      placeholder="e.g., Unit 1, Bike Patrol, Golf Cart"
                      className="pl-10"
                    />
                  </div>
                </FormField>

                <FormField label="Area Assignment">
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      value={control.area_assignment}
                      onChange={(e) => updateTrafficControl(index, 'area_assignment', e.target.value)}
                      placeholder="e.g., Main Entrance, Parking Lot A"
                      className="pl-10"
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
