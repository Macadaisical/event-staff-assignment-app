'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseStore } from '@/stores/supabase-store';
import { useAuth } from '@/components/auth/auth-provider';
import { FormField, Input, Select, Textarea } from '@/components/ui/form-field';
import { Calendar, Clock, MapPin, Users, Save, X, Plus, Trash2 } from 'lucide-react';
import type { EventFormData } from '@/types';

interface FormErrors {
  [key: string]: string;
}

interface AssignmentFormState {
  member_id: string;
  assignment_type: string;
  equipment_area: string;
  start_time: string;
  end_time: string;
  notes: string;
}

interface TrafficFormState {
  member_id: string;
  member_name: string;
  patrol_vehicle: string;
  area_assignment: string;
}

const initialEventForm: EventFormData = {
  event_name: '',
  event_date: '',
  location: '',
  start_time: '',
  end_time: '',
  team_meet_time: '',
  meet_location: '',
  prepared_by: '',
  prepared_date: new Date().toISOString().split('T')[0],
  notes: '',
  supervisors: [{ supervisor_name: '', phone: '', email: '' }],
  team_assignments: [],
  traffic_controls: [],
};

export default function CreateEventPage() {
  const router = useRouter();
  const {
    addEvent,
    replaceSupervisors,
    addTeamAssignments,
    addTrafficControls,
    teamMembers,
    assignmentCategories,
    fetchTeamMembers,
    fetchAssignmentCategories,
  } = useSupabaseStore();
  const { user } = useAuth();

  const [formData, setFormData] = useState<EventFormData>(initialEventForm);
  const [assignments, setAssignments] = useState<AssignmentFormState[]>([]);
  const [trafficControls, setTrafficControls] = useState<TrafficFormState[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTeamMembers().catch((error: unknown) => {
      console.error('Error loading team members:', error);
    });
    fetchAssignmentCategories().catch((error: unknown) => {
      console.error('Error loading assignment categories:', error);
    });
  }, [fetchTeamMembers, fetchAssignmentCategories]);

  const assignmentMemberOptions = useMemo(
    () =>
      teamMembers
        .filter((member) => member.active)
        .map((member) => ({ value: member.member_id, label: member.member_name })),
    [teamMembers],
  );

  const assignmentCategoryOptions = useMemo(() => {
    const base = assignmentCategories.length ? assignmentCategories : ['General Support'];
    const unique = Array.from(new Set([...base, 'General Support']));
    return unique.map((category) => ({ value: category, label: category }));
  }, [assignmentCategories]);

  const teamMemberNameOptions = useMemo(
    () =>
      teamMembers.map((member) => ({
        value: member.member_name,
        label: member.member_name,
      })),
    [teamMembers],
  );

  const findMemberByName = (name: string) => {
    const normalized = name.trim().toLowerCase();
    if (!normalized) return undefined;
    return teamMembers.find((member) => member.member_name.trim().toLowerCase() === normalized);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.event_name.trim()) {
      newErrors.event_name = 'Event name is required';
    }

    if (!formData.event_date) {
      newErrors.event_date = 'Event date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user) {
      console.error('User not authenticated');
      return;
    }

    setIsSubmitting(true);

  try {
      const eventPayload = {
        event_name: formData.event_name.trim(),
        event_date: formData.event_date,
        location: formData.location?.trim() || null,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        team_meet_time: formData.team_meet_time || null,
        meet_location: formData.meet_location?.trim() || null,
        prepared_by: formData.prepared_by?.trim() || null,
        prepared_date: formData.prepared_date || formData.event_date,
        notes: formData.notes?.trim() || null,
      } as const;

      const newEvent = await addEvent(eventPayload);

      if (newEvent?.event_id) {
        const eventId = newEvent.event_id;

        const validSupervisors = formData.supervisors
          .map((supervisor) => {
            const name = supervisor.supervisor_name.trim();
            if (!name) return null;
            return {
              supervisor_name: name,
              phone: supervisor.phone?.trim() || null,
              email: supervisor.email?.trim() || null,
            };
          })
          .filter((value): value is { supervisor_name: string; phone: string | null; email: string | null } => value !== null);

        if (validSupervisors.length) {
          await replaceSupervisors(eventId, validSupervisors);
        }

        if (assignments.length) {
          const preparedAssignments = assignments
            .map((assignment, index) => ({
              member_id: assignment.member_id,
              assignment_type: assignment.assignment_type.trim() || 'General Support',
              equipment_area: assignment.equipment_area.trim(),
              start_time: assignment.start_time || null,
              end_time: assignment.end_time || null,
              notes: assignment.notes?.trim() || null,
              sort_order: index + 1,
            }))
            .filter((assignment) => assignment.member_id);

          if (preparedAssignments.length) {
            await addTeamAssignments(eventId, preparedAssignments);
          }
        }

        if (trafficControls.length) {
          const preparedTraffic = trafficControls
            .map((control, index) => ({
              member_id: control.member_id,
              patrol_vehicle: control.patrol_vehicle.trim(),
              area_assignment: control.area_assignment.trim(),
              sort_order: index + 1,
            }))
            .filter((control) => control.member_id);

          if (preparedTraffic.length) {
            await addTrafficControls(eventId, preparedTraffic);
          }
        }
      }

      router.push('/events');
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Unable to create the event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addSupervisor = () => {
    setFormData((prev) => ({
      ...prev,
      supervisors: [...prev.supervisors, { supervisor_name: '', phone: '', email: '' }],
    }));
  };

  const removeSupervisor = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      supervisors: prev.supervisors.filter((_, i) => i !== index),
    }));
  };

  const updateSupervisor = (index: number, field: 'supervisor_name' | 'phone' | 'email', value: string) => {
    setFormData((prev) => ({
      ...prev,
      supervisors: prev.supervisors.map((supervisor, i) =>
        i === index ? { ...supervisor, [field]: value } : supervisor,
      ),
    }));
  };

  const addAssignment = () => {
    setAssignments((prev) => [
      ...prev,
      {
        member_id: '',
        assignment_type: assignmentCategories[0] || 'General Support',
        equipment_area: '',
        start_time: '',
        end_time: '',
        notes: '',
      },
    ]);
  };

  const updateAssignment = (index: number, changes: Partial<AssignmentFormState>) => {
    setAssignments((prev) => prev.map((assignment, i) => (i === index ? { ...assignment, ...changes } : assignment)));
  };

  const removeAssignment = (index: number) => {
    setAssignments((prev) => prev.filter((_, i) => i !== index));
  };

  const addTraffic = () => {
    setTrafficControls((prev) => [...prev, { member_id: '', member_name: '', patrol_vehicle: '', area_assignment: '' }]);
  };

  const updateTraffic = (index: number, changes: Partial<TrafficFormState>) => {
    setTrafficControls((prev) => prev.map((traffic, i) => (i === index ? { ...traffic, ...changes } : traffic)));
  };

  const removeTraffic = (index: number) => {
    setTrafficControls((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="max-w-5xl mx-auto">
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
          Enter event details and optionally add assignments or traffic posts before saving.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Event Information */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center mb-6">
            <Calendar className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Event Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Event Name" required error={errors.event_name} className="md:col-span-2">
              <Input
                value={formData.event_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, event_name: e.target.value }))}
                placeholder="Community Parade"
                error={!!errors.event_name}
              />
            </FormField>

            <FormField label="Event Date" required error={errors.event_date}>
              <Input
                type="date"
                value={formData.event_date || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, event_date: e.target.value }))}
                error={!!errors.event_date}
              />
            </FormField>

            <FormField label="Location">
              <Input
                value={formData.location || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="123 Main St"
              />
            </FormField>

            <FormField label="Start Time">
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="time"
                  value={formData.start_time || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, start_time: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </FormField>

            <FormField label="End Time">
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="time"
                  value={formData.end_time || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, end_time: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </FormField>

            <FormField label="Team Meet Time">
              <div className="relative">
                <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="time"
                  value={formData.team_meet_time || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, team_meet_time: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </FormField>

            <FormField label="Meet Location">
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  value={formData.meet_location || ''}
                  onChange={(e) => setFormData((prev) => ({ ...prev, meet_location: e.target.value }))}
                  placeholder="Operations Center"
                  className="pl-10"
                />
              </div>
            </FormField>

            <FormField label="Prepared By">
              <Select
                value={formData.prepared_by || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, prepared_by: e.target.value }))}
                options={teamMemberNameOptions}
                placeholder="Select preparer"
              />
            </FormField>

            <FormField label="Date Prepared">
              <Input
                type="date"
                value={formData.prepared_date || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, prepared_date: e.target.value }))}
              />
            </FormField>

            <FormField label="Notes" className="md:col-span-2">
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional notes for the event"
                rows={4}
              />
            </FormField>
          </div>
        </section>

        {/* Supervisors */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Supervisors</h2>
            </div>
            <button
              type="button"
              onClick={addSupervisor}
              className="inline-flex items-center px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Supervisor
            </button>
          </div>

          <div className="space-y-4">
            {formData.supervisors.map((supervisor, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="flex-1">
                  <Select
                    value={supervisor.supervisor_name}
                    onChange={(e) => updateSupervisor(index, 'supervisor_name', e.target.value)}
                    options={teamMemberNameOptions}
                    placeholder="Select supervisor"
                  />
                </div>
                {formData.supervisors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSupervisor(index)}
                    className="p-2 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Team Assignments */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Users className="h-5 w-5 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Team Assignments</h2>
            </div>
            <button
              type="button"
              onClick={addAssignment}
              className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Assignment
            </button>
          </div>

          {!assignments.length ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No assignments added yet. You can add them now or later from the event page.
            </p>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Assignment #{index + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeAssignment(index)}
                      className="flex items-center px-2 py-1 text-sm text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField label="Team Member">
                      <Select
                        value={assignment.member_id}
                        onChange={(e) => {
                          updateAssignment(index, { member_id: e.target.value });
                        }}
                        options={assignmentMemberOptions}
                        placeholder="Select team member"
                      />
                    </FormField>

                    <FormField label="Assignment Type">
                      <Select
                        value={assignment.assignment_type}
                        onChange={(e) => {
                          updateAssignment(index, { assignment_type: e.target.value });
                        }}
                        options={assignmentCategoryOptions}
                        placeholder="Select assignment type"
                      />
                    </FormField>

                    <FormField label="Equipment / Area">
                      <Input
                        value={assignment.equipment_area}
                        onChange={(e) => {
                          updateAssignment(index, { equipment_area: e.target.value });
                        }}
                        placeholder="Stage Left, Radios"
                      />
                    </FormField>

                    <FormField label="Start Time">
                      <Input
                        type="time"
                        value={assignment.start_time}
                        onChange={(e) => {
                          updateAssignment(index, { start_time: e.target.value });
                        }}
                      />
                    </FormField>

                    <FormField label="End Time">
                      <Input
                        type="time"
                        value={assignment.end_time}
                        onChange={(e) => {
                          updateAssignment(index, { end_time: e.target.value });
                        }}
                      />
                    </FormField>

                    <FormField label="Notes">
                      <Input
                        value={assignment.notes}
                        onChange={(e) => updateAssignment(index, { notes: e.target.value })}
                        placeholder="Optional notes"
                      />
                    </FormField>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Traffic Control */}
        <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <MapPin className="h-5 w-5 text-orange-500 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Traffic Control</h2>
            </div>
            <button
              type="button"
              onClick={addTraffic}
              className="inline-flex items-center px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Traffic Post
            </button>
          </div>

          {!trafficControls.length ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No traffic assignments added yet. You can assign deputies now or later.
            </p>
          ) : (
            <div className="space-y-4">
              {trafficControls.map((control, index) => (
                <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Traffic Assignment #{index + 1}
                    </h3>
                    <button
                      type="button"
                      onClick={() => removeTraffic(index)}
                      className="flex items-center px-2 py-1 text-sm text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField label="Staff Member" required error={errors[`traffic_${index}_member_id`]}>
                      {(() => {
                        const datalistId = `traffic-members-${index}`;
                        return (
                          <>
                            <Input
                              value={control.member_name}
                              onChange={(e) => {
                                const value = e.target.value;
                                const match = findMemberByName(value);
                                updateTraffic(index, {
                                  member_name: value,
                                  member_id: match ? match.member_id : '',
                                });
                                if (errors[`traffic_${index}_member_id`]) {
                                  setErrors((prev) => {
                                    const updated = { ...prev };
                                    delete updated[`traffic_${index}_member_id`];
                                    return updated;
                                  });
                                }
                              }}
                              placeholder="Enter staff member"
                              list={datalistId}
                              error={!!errors[`traffic_${index}_member_id`]}
                            />
                            <datalist id={datalistId}>
                              {teamMemberNameOptions.map((option) => (
                                <option key={`${option.value}-${index}`} value={option.value} />
                              ))}
                            </datalist>
                          </>
                        );
                      })()}
                    </FormField>

                    <FormField label="Patrol Vehicle">
                      <Input
                        value={control.patrol_vehicle}
                        onChange={(e) => {
                          updateTraffic(index, { patrol_vehicle: e.target.value });
                        }}
                        placeholder="Unit 5"
                      />
                    </FormField>

                    <FormField label="Area Assignment">
                      <Input
                        value={control.area_assignment}
                        onChange={(e) => {
                          updateTraffic(index, { area_assignment: e.target.value });
                        }}
                        placeholder="North Lot"
                      />
                    </FormField>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 pt-4">
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
