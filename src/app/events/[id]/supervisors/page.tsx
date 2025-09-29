'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseStore } from '@/stores/supabase-store';
import { FormField, Input } from '@/components/ui/form-field';
import {
  ArrowLeft,
  Calendar,
  Mail,
  Phone,
  Plus,
  Save,
  Trash2,
  Users,
} from 'lucide-react';

interface SupervisorForm {
  supervisor_name: string;
  phone: string;
  email: string;
}

const emailRegex = /.+@.+\..+/;

export default function EventSupervisorsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    events,
    fetchEvents,
    isEventLoading,
    fetchSupervisors,
    getSupervisors,
    replaceSupervisors,
    supervisors: storeSupervisors,
  } = useSupabaseStore();

  useEffect(() => {
    if (!events.length) {
      fetchEvents().catch((error: unknown) => {
        console.error('Error loading events:', error);
      });
    }
  }, [events.length, fetchEvents]);

  const event = events.find((e) => e.event_id === params.id);
  const eventId = event?.event_id;

  const [supervisors, setSupervisors] = useState<SupervisorForm[]>([{ supervisor_name: '', phone: '', email: '' }]);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!eventId) {
      return;
    }

    fetchSupervisors(eventId).catch((error: unknown) => {
      console.error('Error loading supervisors:', error);
    });
  }, [eventId, fetchSupervisors]);

  useEffect(() => {
    if (!eventId || hasInitialized) {
      return;
    }

    const existing = getSupervisors(eventId);
    if (existing.length) {
      setSupervisors(
        existing.map((supervisor) => ({
          supervisor_name: supervisor.supervisor_name ?? '',
          phone: supervisor.phone ?? '',
          email: supervisor.email ?? '',
        })),
      );
    }

    setHasInitialized(true);
  }, [eventId, getSupervisors, hasInitialized, storeSupervisors]);

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

  if (!event || !eventId) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Event Not Found</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {"The event you're trying to manage supervisors for doesn't exist."}
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

  const updateSupervisor = (index: number, field: keyof SupervisorForm, value: string) => {
    setSupervisors((prev) =>
      prev.map((supervisor, i) => (i === index ? { ...supervisor, [field]: value } : supervisor)),
    );

    const errorKey = `supervisor_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[errorKey];
        return updated;
      });
    }
  };

  const addSupervisor = () => {
    setSupervisors((prev) => [...prev, { supervisor_name: '', phone: '', email: '' }]);
  };

  const removeSupervisor = (index: number) => {
    setSupervisors((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((key) => {
        if (key.startsWith(`supervisor_${index}_`)) {
          delete updated[key];
        }
      });
      return updated;
    });
  };

  const validateSupervisors = () => {
    const validationErrors: Record<string, string> = {};

    const validCount = supervisors.filter((supervisor) => supervisor.supervisor_name.trim()).length;
    if (!validCount) {
      validationErrors.general = 'Add at least one supervisor for this event.';
    }

    supervisors.forEach((supervisor, index) => {
      if (!supervisor.supervisor_name.trim()) {
        validationErrors[`supervisor_${index}_supervisor_name`] = 'Supervisor name is required';
      }

      if (supervisor.email && !emailRegex.test(supervisor.email.trim())) {
        validationErrors[`supervisor_${index}_email`] = 'Enter a valid email address';
      }
    });

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateSupervisors()) {
      return;
    }

    if (!eventId) {
      return;
    }

    setIsSaving(true);

    try {
      const cleaned = supervisors
        .map((supervisor) => ({
          supervisor_name: supervisor.supervisor_name.trim(),
          phone: supervisor.phone.trim() ? supervisor.phone.trim() : null,
          email: supervisor.email.trim() ? supervisor.email.trim() : null,
        }))
        .filter((supervisor) => supervisor.supervisor_name.length);

      await replaceSupervisors(eventId, cleaned);
      await fetchSupervisors(eventId);

      router.push(`/events/${eventId}`);
    } catch (error) {
      console.error('Error saving supervisors:', error);
      alert('Unable to save supervisors. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
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
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Supervisors</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {event.event_name} · {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'Date TBD'}
              </p>
            </div>
          </div>
          <button
            onClick={addSupervisor}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Supervisor
          </button>
        </div>
      </div>

      {errors.general && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{errors.general}</p>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700 mb-6">
        <div className="flex items-center space-x-3 text-blue-900 dark:text-blue-100">
          <Users className="h-5 w-5" />
          <span>Assign supervisors who can oversee this event and coordinate staff.</span>
        </div>
      </div>

      {supervisors.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Supervisors</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Add supervisors to help manage this event.
          </p>
          <button
            onClick={addSupervisor}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Supervisor
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {supervisors.map((supervisor, index) => {
            const nameKey = `supervisor_${index}_supervisor_name`;
            const emailKey = `supervisor_${index}_email`;
            const nameError = errors[nameKey];
            const emailError = errors[emailKey];

            return (
              <div
                key={`supervisor-${index}`}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Supervisor #{index + 1}</h3>
                  {supervisors.length > 1 && (
                    <button
                      onClick={() => removeSupervisor(index)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    label="Name"
                    required
                    error={nameError}
                  >
                    <Input
                      value={supervisor.supervisor_name}
                      onChange={(e) => updateSupervisor(index, 'supervisor_name', e.target.value)}
                      placeholder="Supervisor name"
                    />
                  </FormField>

                  <FormField label="Phone">
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        value={supervisor.phone}
                        onChange={(e) => updateSupervisor(index, 'phone', e.target.value)}
                        placeholder="Optional phone number"
                        className="pl-10"
                      />
                    </div>
                  </FormField>

                  <FormField
                    label="Email"
                    error={emailError}
                  >
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        type="email"
                        value={supervisor.email}
                        onChange={(e) => updateSupervisor(index, 'email', e.target.value)}
                        placeholder="Optional email"
                        className="pl-10"
                      />
                    </div>
                  </FormField>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center justify-end space-x-4 mt-8">
        <Link
          href={`/events/${eventId}`}
          className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancel
        </Link>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Supervisors'}
        </button>
      </div>
    </div>
  );
}
