'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/app-store';
import { Plus, Users, Check, X, Edit2, Trash2 } from 'lucide-react';
import { generateMemberId } from '@/utils/id-generator';
import type { TeamMember } from '@/types';

export default function TeamMembersPage() {
  const { teamMembers, addTeamMember, updateTeamMember, deleteTeamMember } = useAppStore();
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

  const handleAddMember = () => {
    if (newMemberName.trim()) {
      const newMember: TeamMember = {
        member_id: generateMemberId(),
        member_name: newMemberName.trim(),
        active: true,
      };
      addTeamMember(newMember);
      setNewMemberName('');
      setIsAddingMember(false);
    }
  };

  const toggleMemberStatus = (member: TeamMember) => {
    updateTeamMember({ ...member, active: !member.active });
  };

  const handleDeleteMember = (memberId: string) => {
    if (confirm('Are you sure you want to delete this team member?')) {
      deleteTeamMember(memberId);
    }
  };

  const activeMembers = teamMembers.filter(member => member.active);
  const inactiveMembers = teamMembers.filter(member => !member.active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Team Members</h1>
        <button
          onClick={() => setIsAddingMember(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Team Member
        </button>
      </div>

      {/* Add Member Form */}
      {isAddingMember && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Add New Team Member</h3>
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              placeholder="Enter member name"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
              autoFocus
            />
            <button
              onClick={handleAddMember}
              disabled={!newMemberName.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={() => {
                setIsAddingMember(false);
                setNewMemberName('');
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Active Members */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Active Members ({activeMembers.length})
        </h3>
        {activeMembers.length > 0 ? (
          <div className="space-y-3">
            {activeMembers.map((member) => (
              <div
                key={member.member_id}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg"
              >
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {member.member_name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleMemberStatus(member)}
                    className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition-colors"
                  >
                    Deactivate
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member.member_id)}
                    className="p-1 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">
            No active team members
          </p>
        )}
      </div>

      {/* Inactive Members */}
      {inactiveMembers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Inactive Members ({inactiveMembers.length})
          </h3>
          <div className="space-y-3">
            {inactiveMembers.map((member) => (
              <div
                key={member.member_id}
                className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg opacity-60"
              >
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-3" />
                  <span className="font-medium text-gray-900 dark:text-white">
                    {member.member_name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleMemberStatus(member)}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
                  >
                    Reactivate
                  </button>
                  <button
                    onClick={() => handleDeleteMember(member.member_id)}
                    className="p-1 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {teamMembers.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No team members yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start by adding your first team member
          </p>
          <button
            onClick={() => setIsAddingMember(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Member
          </button>
        </div>
      )}
    </div>
  );
}