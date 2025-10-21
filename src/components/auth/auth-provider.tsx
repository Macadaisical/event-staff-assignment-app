'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('Error getting session:', error);
      } else {
        setSession(session);
        setUser(session?.user || null);
      }
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user || null);
        setLoading(false);

        // Ensure profile exists (backup to database trigger)
        // The database trigger should handle this automatically, but this provides
        // a client-side fallback in case the trigger hasn't been applied yet
        if (event === 'SIGNED_IN' && session?.user) {
          const profileData = {
            id: session.user.id,
            email: session.user.email || null,
            full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || null,
          };

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { error } = await (supabase as any)
            .from('profiles')
            .upsert(profileData, { onConflict: 'id' });

          if (error) {
            console.error('Error creating/updating profile:', error);
            console.error('Profile data attempted:', profileData);
            console.error('User should still have access if database trigger is working');

            // Verify profile exists
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: profile, error: fetchError } = await (supabase as any)
              .from('profiles')
              .select('id')
              .eq('id', session.user.id)
              .single();

            if (fetchError || !profile) {
              console.error('CRITICAL: Profile does not exist for user:', session.user.id);
              console.error('Please run the latest database migration to fix profile creation');
            } else {
              console.log('Profile exists despite upsert error - database trigger is working');
            }
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};