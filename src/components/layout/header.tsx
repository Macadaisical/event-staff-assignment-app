'use client';

import { Navigation } from './navigation';
import { useAuth } from '@/components/auth/auth-provider';
import { ClipboardList, LogOut, User } from 'lucide-react';

export function Header() {
  const { user, signOut } = useAuth();

  return (
    <header className="relative z-50 border-b border-[#004d66]/40 bg-gradient-to-r from-[#001a24] via-[#003446] to-[#002233] text-[#f5f6f7] shadow-[0_12px_30px_rgba(0,0,0,0.45)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 lg:px-10">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 shadow-[0_8px_20px_rgba(0,0,0,0.35)]">
            <ClipboardList className="h-6 w-6 text-[#e9d29a]" />
          </div>
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.45em] text-[#e9d29a] sm:text-xs">S.C.O.P.E.</p>
            <h1 className="text-xl font-semibold text-white sm:text-2xl">Event Staff Assignments</h1>
            <p className="text-xs text-[#d0d6db] sm:text-sm">Plan. Assign. Coordinate.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Navigation />
          </div>
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden shrink-0 items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-[#d0d6db] md:flex">
                <User className="h-4 w-4 text-[#e9d29a]" />
                <span className="truncate max-w-[160px]">{user.email}</span>
              </div>
              <button
                onClick={signOut}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-[#e6e7e8] transition hover:bg-white/20"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
