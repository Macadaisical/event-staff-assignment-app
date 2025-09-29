'use client';


import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseStore } from '@/stores/supabase-store';
import { FormField, Input, Textarea } from '@/components/ui/form-field';
import { Calendar, Clock, MapPin, Save, X, ArrowLeft } from 'lucide-react';
import type { EventFormData } from '@/types';

interface FormErrors {
  [key: string]: string;
}

export default function EditEventPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { events, fetchEvents, updateEvent, isEventLoading } = useSupabaseStore();

  useEffect(() => {
    if (!events.length) {
      fetchEvents().catch((error: unknown) => {
        console.error('Error loading events:', error);
      });
    }
  }, [events.length, fetchEvents]);

  const event = events.find(e => e.event_id === params.id);

  const [formData, setFormData] = useState<EventFormData>({
    event_name: '',
    event_date: '',
    location: '',
    start_time: '',
    end_time: '',
    team_meet_time: '',
    meet_location: '',
    prepared_by: '',
    prepared_date: '',
    notes: '',
    supervisors: [{ supervisor_name: '', phone: '', email: '' }],
    team_assignments: [],
    traffic_controls: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (event) {
      setFormData({
        event_name: event.event_name,
        event_date: event.event_date ?? '',
        location: event.location ?? '',
        start_time: event.start_time ?? '',
        end_time: event.end_time ?? '',
        team_meet_time: event.team_meet_time ?? '',
        meet_location: event.meet_location ?? '',
        prepared_by: event.prepared_by ?? '',
        prepared_date: event.prepared_date ?? new Date().toISOString().split('T')[0],
        notes: event.notes ?? '',
        supervisors: [{ supervisor_name: '', phone: '', email: '' }], // TODO: Load actual supervisors
        team_assignments: [], // TODO: Load actual assignments
        traffic_controls: [], // TODO: Load actual traffic controls
      });
    }
  }, [event]);

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
          The event you&apos;re trying to edit doesn&apos;t exist or has been deleted.
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

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required field validations
    if (!formData.event_name.trim()) {
      newErrors.event_name = 'Event name is required';
    }
    // Time validation (optional but ordered)
    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
      newErrors.end_time = 'End time must be after start time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedEvent = {
        ...event,
        event_name: formData.event_name.trim(),
        event_date: formData.event_date || null,
        location: formData.location.trim() || null,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        team_meet_time: formData.team_meet_time || null,
        meet_location: formData.meet_location.trim() || null,
        prepared_by: formData.prepared_by.trim() || null,
        prepared_date: formData.prepared_date || null,
        notes: formData.notes?.trim() || null,
      };

      await updateEvent(updatedEvent);
      await fetchEvents();
      router.push(`/events/${event.event_id}`);
    } catch (error) {
      console.error('Error updating event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href={`/events/${event.event_id}`}
              className="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Event</h1>
          </div>
          <Link
            href={`/events/${event.event_id}`}
            className="inline-flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Link>
        </div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Update the event details below. Fields marked with * are required.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Event Information Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-6">
            <Calendar className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Event Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Event Name"
              required
              error={errors.event_name}
              className="md:col-span-2"
            >
              <Input
                value={formData.event_name}
                onChange={(e) => setFormData(prev => ({ ...prev, event_name: e.target.value }))}
                placeholder="Enter event name"
                error={!!errors.event_name}
              />
            </FormField>

            <FormField label="Event Date" required error={errors.event_date}>
              <Input
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                error={!!errors.event_date}
              />
            </FormField>

            <FormField label="Location">
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter event location"
              />
            </FormField>

            <FormField label="Start Time">
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </FormField>

            <FormField label="End Time" error={errors.end_time}>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </FormField>

            <FormField label="Team Meet Time">
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="time"
                  value={formData.team_meet_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, team_meet_time: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </FormField>

            <FormField label="Meet Location">
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  value={formData.meet_location}
                  onChange={(e) => setFormData(prev => ({ ...prev, meet_location: e.target.value }))}
                  placeholder="Where team should meet"
                  className="pl-10"
                />
              </div>
            </FormField>

            <FormField label="Prepared By">
              <Input
                value={formData.prepared_by}
                onChange={(e) => setFormData(prev => ({ ...prev, prepared_by: e.target.value }))}
                placeholder="Your name"
              />
            </FormField>

            <FormField label="Date Prepared">
              <Input
                type="date"
                value={formData.prepared_date}
                onChange={(e) => setFormData(prev => ({ ...prev, prepared_date: e.target.value }))}
              />
            </FormField>

            <FormField label="Notes" className="md:col-span-2">
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional event notes (optional)"
                rows={4}
              />
            </FormField>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6">
          <Link
            href={`/events/${event.event_id}`}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Updating Event...' : 'Update Event'}
          </button>
        </div>
      </form>
    </div>
  );
}
