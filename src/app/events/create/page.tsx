'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAppStore } from '@/stores/app-store';
import { FormField, Input, Textarea } from '@/components/ui/form-field';
import { Calendar, Clock, MapPin, Users, Save, X, Plus, Trash2 } from 'lucide-react';
import { generateEventId } from '@/utils/id-generator';
import type { EventFormData } from '@/types';

interface FormErrors {
  [key: string]: string;
}

export default function CreateEventPage() {
  const router = useRouter();
  const { addEvent } = useAppStore();

  const [formData, setFormData] = useState<EventFormData>({
    event_name: '',
    event_date: '',
    location: '',
    start_time: '',
    end_time: '',
    team_meet_time: '',
    meet_location: '',
    prepared_by: '',
    prepared_date: new Date().toISOString().split('T')[0], // Today's date
    notes: '',
    supervisors: [{ supervisor_name: '' }],
    team_assignments: [],
    traffic_controls: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required field validations
    if (!formData.event_name.trim()) {
      newErrors.event_name = 'Event name is required';
    }
    if (!formData.event_date) {
      newErrors.event_date = 'Event date is required';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }
    if (!formData.end_time) {
      newErrors.end_time = 'End time is required';
    }
    if (!formData.team_meet_time) {
      newErrors.team_meet_time = 'Team meet time is required';
    }
    if (!formData.meet_location.trim()) {
      newErrors.meet_location = 'Meet location is required';
    }
    if (!formData.prepared_by.trim()) {
      newErrors.prepared_by = 'Prepared by is required';
    }

    // Time validation
    if (formData.start_time && formData.end_time) {
      if (formData.start_time >= formData.end_time) {
        newErrors.end_time = 'End time must be after start time';
      }
    }

    // Date validation
    if (formData.event_date) {
      const eventDate = new Date(formData.event_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (eventDate < today) {
        newErrors.event_date = 'Event date cannot be in the past';
      }
    }

    // Supervisor validation
    const validSupervisors = formData.supervisors.filter(s => s.supervisor_name.trim());
    if (validSupervisors.length === 0) {
      newErrors.supervisors = 'At least one supervisor is required';
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
      const eventData = {
        event_id: generateEventId(),
        event_name: formData.event_name.trim(),
        event_date: formData.event_date,
        location: formData.location.trim(),
        start_time: formData.start_time,
        end_time: formData.end_time,
        team_meet_time: formData.team_meet_time,
        meet_location: formData.meet_location.trim(),
        prepared_by: formData.prepared_by.trim(),
        prepared_date: formData.prepared_date,
        notes: formData.notes?.trim() || undefined,
        created_at: new Date().toISOString(),
      };

      addEvent(eventData);

      // TODO: Save supervisors, assignments, and traffic controls
      // This will be implemented when we add the assignment interfaces

      router.push('/events');
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSupervisor = () => {
    setFormData(prev => ({
      ...prev,
      supervisors: [...prev.supervisors, { supervisor_name: '' }]
    }));
  };

  const removeSupervisor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      supervisors: prev.supervisors.filter((_, i) => i !== index)
    }));
  };

  const updateSupervisor = (index: number, name: string) => {
    setFormData(prev => ({
      ...prev,
      supervisors: prev.supervisors.map((supervisor, i) =>
        i === index ? { supervisor_name: name } : supervisor
      )
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Event</h1>
          <Link
            href="/events"
            className="inline-flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Link>
        </div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Fill in the event details below. Fields marked with * are required.
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

            <FormField label="Location" required error={errors.location}>
              <Input
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Enter event location"
                error={!!errors.location}
              />
            </FormField>

            <FormField label="Start Time" required error={errors.start_time}>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  className="pl-10"
                  error={!!errors.start_time}
                />
              </div>
            </FormField>

            <FormField label="End Time" required error={errors.end_time}>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  className="pl-10"
                  error={!!errors.end_time}
                />
              </div>
            </FormField>

            <FormField label="Team Meet Time" required error={errors.team_meet_time}>
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="time"
                  value={formData.team_meet_time}
                  onChange={(e) => setFormData(prev => ({ ...prev, team_meet_time: e.target.value }))}
                  className="pl-10"
                  error={!!errors.team_meet_time}
                />
              </div>
            </FormField>

            <FormField label="Meet Location" required error={errors.meet_location}>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  value={formData.meet_location}
                  onChange={(e) => setFormData(prev => ({ ...prev, meet_location: e.target.value }))}
                  placeholder="Where team should meet"
                  className="pl-10"
                  error={!!errors.meet_location}
                />
              </div>
            </FormField>

            <FormField label="Prepared By" required error={errors.prepared_by}>
              <Input
                value={formData.prepared_by}
                onChange={(e) => setFormData(prev => ({ ...prev, prepared_by: e.target.value }))}
                placeholder="Your name"
                error={!!errors.prepared_by}
              />
            </FormField>

            <FormField label="Date Prepared" required>
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

        {/* Supervisors Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Supervisors</h2>
            </div>
            <button
              type="button"
              onClick={addSupervisor}
              className="inline-flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Supervisor
            </button>
          </div>

          {errors.supervisors && (
            <p className="text-sm text-red-600 dark:text-red-400 mb-4">{errors.supervisors}</p>
          )}

          <div className="space-y-4">
            {formData.supervisors.map((supervisor, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="flex-1">
                  <Input
                    value={supervisor.supervisor_name}
                    onChange={(e) => updateSupervisor(index, e.target.value)}
                    placeholder="Supervisor name"
                  />
                </div>
                {formData.supervisors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSupervisor(index)}
                    className="p-2 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6">
          <Link
            href="/events"
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
            {isSubmitting ? 'Creating Event...' : 'Create Event'}
          </button>
        </div>
      </form>
    </div>
  );
}