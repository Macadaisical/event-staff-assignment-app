'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth/auth-provider';

export default function DatabaseDiagnostics() {
  const { user } = useAuth();
  const [results, setResults] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const logs: string[] = [];

    try {
      logs.push('=== DATABASE DIAGNOSTICS ===\n');
      logs.push(`Timestamp: ${new Date().toISOString()}\n`);

      // Check auth user
      logs.push('\n--- AUTH USER ---');
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        logs.push(`❌ Auth Error: ${authError.message}`);
      } else {
        logs.push(`✅ User ID: ${authUser?.id}`);
        logs.push(`✅ Email: ${authUser?.email}`);
      }

      if (!authUser) {
        logs.push('\n❌ No authenticated user - stopping diagnostics');
        setResults(logs.join('\n'));
        setLoading(false);
        return;
      }

      // Check profile
      logs.push('\n--- PROFILE CHECK ---');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profileError) {
        logs.push(`❌ Profile Error: ${profileError.message}`);
        logs.push(`❌ Code: ${profileError.code}`);
        logs.push(`❌ Details: ${JSON.stringify(profileError.details)}`);
      } else if (!profile) {
        logs.push('❌ Profile not found');
      } else {
        logs.push('✅ Profile exists');
        logs.push(`   Email: ${profile.email}`);
        logs.push(`   Full Name: ${profile.full_name}`);
        logs.push(`   Role: ${profile.role}`);
      }

      // Check events
      logs.push('\n--- EVENTS CHECK ---');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: events, error: eventsError } = await (supabase as any)
        .from('events')
        .select('*')
        .eq('user_id', authUser.id);

      if (eventsError) {
        logs.push(`❌ Events Error: ${eventsError.message}`);
        logs.push(`❌ Code: ${eventsError.code}`);
      } else {
        logs.push(`✅ Events query succeeded`);
        logs.push(`   Count: ${events?.length || 0}`);
        if (events && events.length > 0) {
          logs.push(`   Sample: ${JSON.stringify(events[0], null, 2)}`);
        }
      }

      // Check team members
      logs.push('\n--- TEAM MEMBERS CHECK ---');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: members, error: membersError } = await (supabase as any)
        .from('team_members')
        .select('*')
        .eq('user_id', authUser.id);

      if (membersError) {
        logs.push(`❌ Team Members Error: ${membersError.message}`);
        logs.push(`❌ Code: ${membersError.code}`);
      } else {
        logs.push(`✅ Team Members query succeeded`);
        logs.push(`   Count: ${members?.length || 0}`);
        if (members && members.length > 0) {
          logs.push(`   Sample: ${JSON.stringify(members[0], null, 2)}`);
        }
      }

      // Check assignment categories
      logs.push('\n--- ASSIGNMENT CATEGORIES CHECK ---');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: categories, error: categoriesError } = await (supabase as any)
        .from('assignment_categories')
        .select('*')
        .eq('user_id', authUser.id);

      if (categoriesError) {
        logs.push(`❌ Categories Error: ${categoriesError.message}`);
        logs.push(`❌ Code: ${categoriesError.code}`);
      } else {
        logs.push(`✅ Assignment Categories query succeeded`);
        logs.push(`   Count: ${categories?.length || 0}`);
        if (categories && categories.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        logs.push(`   Categories: ${categories.map((c: any) => c.category_name).join(', ')}`);
        }
      }

      // Check task categories
      logs.push('\n--- TASK CATEGORIES CHECK ---');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: taskCategories, error: taskCategoriesError } = await (supabase as any)
        .from('task_categories')
        .select('*')
        .eq('user_id', authUser.id);

      if (taskCategoriesError) {
        logs.push(`❌ Task Categories Error: ${taskCategoriesError.message}`);
        logs.push(`❌ Code: ${taskCategoriesError.code}`);
      } else {
        logs.push(`✅ Task Categories query succeeded`);
        logs.push(`   Count: ${taskCategories?.length || 0}`);
      }

      logs.push('\n=== END DIAGNOSTICS ===');

    } catch (error) {
      logs.push(`\n❌ Unexpected Error: ${error}`);
    }

    setResults(logs.join('\n'));
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
        <p className="text-red-400">Not authenticated - please log in first</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
      <h2 className="mb-4 text-xl font-bold text-white">Database Diagnostics</h2>

      <button
        onClick={runDiagnostics}
        disabled={loading}
        className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Running Diagnostics...' : 'Run Database Check'}
      </button>

      {results && (
        <div className="mt-6">
          <pre className="overflow-x-auto rounded-xl bg-black/50 p-4 text-xs text-green-400">
            {results}
          </pre>
          <button
            onClick={() => {
              navigator.clipboard.writeText(results);
              alert('Copied to clipboard!');
            }}
            className="mt-2 rounded-lg bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600"
          >
            Copy to Clipboard
          </button>
        </div>
      )}
    </div>
  );
}
