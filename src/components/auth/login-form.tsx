'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';

interface LoginFormProps {
  className?: string;
}

export default function LoginForm({ className = '' }: LoginFormProps) {
  return (
    <div className={`max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md ${className}`}>
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Event Staff Assignments
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Sign in to manage your event staffing
        </p>
      </div>

      <Auth
        supabaseClient={supabase}
        appearance={{
          theme: ThemeSupa,
          variables: {
            default: {
              colors: {
                brand: '#3b82f6',
                brandAccent: '#2563eb',
              },
            },
          },
          className: {
            container: 'auth-container',
            button: 'auth-button',
            input: 'auth-input',
          },
        }}
        providers={['google', 'github']}
        redirectTo={typeof window !== 'undefined' ? window.location.origin : undefined}
        showLinks={true}
      />
    </div>
  );
}