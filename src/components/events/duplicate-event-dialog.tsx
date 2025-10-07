'use client';

import { useState, FormEvent } from 'react';
import { Dialog } from '@headlessui/react';
import { Copy, X, Calendar, FileText, Users, Clipboard, AlertCircle } from 'lucide-react';
import type { Event } from '@/types';

interface DuplicateEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event;
  taskCount: number;
  assignmentCount: number;
  supervisorCount: number;
  trafficCount: number;
  onDuplicate: (newEventName: string, dateOffsetDays: number) => Promise<boolean>;
}

export default function DuplicateEventDialog({
  isOpen,
  onClose,
  event,
  taskCount,
  assignmentCount,
  supervisorCount,
  trafficCount,
  onDuplicate
}: DuplicateEventDialogProps) {
  const [newEventName, setNewEventName] = useState(`${event.event_name} (Copy)`);
  const [dateOffsetDays, setDateOffsetDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateNewDate = (offsetDays: number): string => {
    if (!event.event_date) return 'Not set';
    const originalDate = new Date(event.event_date);
    const newDate = new Date(originalDate);
    newDate.setDate(originalDate.getDate() + offsetDays);
    return newDate.toLocaleDateString();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!newEventName.trim()) {
      setError('Event name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await onDuplicate(newEventName.trim(), dateOffsetDays);
      if (success) {
        onClose();
        setNewEventName(`${event.event_name} (Copy)`);
        setDateOffsetDays(7);
      } else {
        setError('Failed to duplicate event. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl shadow-2xl border border-white/10">
          <div className="relative p-8">
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="absolute right-6 top-6 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-500/20 rounded-2xl">
                <Copy className="h-6 w-6 text-blue-400" />
              </div>
              <Dialog.Title className="text-2xl font-bold text-white">
                Duplicate Event
              </Dialog.Title>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Original Event Info */}
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <p className="text-sm text-gray-400 mb-2">Duplicating:</p>
                <p className="text-white font-semibold">{event.event_name}</p>
                {event.event_date && (
                  <p className="text-sm text-gray-400 mt-1">
                    Original date: {new Date(event.event_date).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* New Event Name */}
              <div>
                <label htmlFor="newEventName" className="block text-sm font-medium text-gray-300 mb-2">
                  New Event Name
                </label>
                <input
                  type="text"
                  id="newEventName"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  placeholder="Enter new event name"
                  required
                />
              </div>

              {/* Date Offset */}
              <div>
                <label htmlFor="dateOffset" className="block text-sm font-medium text-gray-300 mb-2">
                  Date Offset (days)
                </label>
                <input
                  type="number"
                  id="dateOffset"
                  value={dateOffsetDays}
                  onChange={(e) => setDateOffsetDays(parseInt(e.target.value) || 0)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  placeholder="Number of days to offset"
                />
                <p className="text-sm text-gray-400 mt-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  New event date: {calculateNewDate(dateOffsetDays)}
                </p>
              </div>

              {/* Preview */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                <p className="text-sm font-medium text-blue-400 mb-3 flex items-center gap-2">
                  <Clipboard className="h-4 w-4" />
                  This will duplicate:
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <FileText className="h-4 w-4 text-blue-400" />
                    <span>{taskCount} task{taskCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users className="h-4 w-4 text-blue-400" />
                    <span>{assignmentCount} assignment{assignmentCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users className="h-4 w-4 text-blue-400" />
                    <span>{supervisorCount} supervisor{supervisorCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users className="h-4 w-4 text-blue-400" />
                    <span>{trafficCount} traffic assignment{trafficCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-3">
                  Note: All tasks will be reset to &quot;Not Started&quot; status
                </p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-medium transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Duplicating...
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Duplicate Event
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
