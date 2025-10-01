'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Users, Settings, Home, Menu, X } from 'lucide-react';
import { cn } from '@/utils/cn';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Events', href: '/events', icon: Calendar },
  { name: 'Team Members', href: '/team-members', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Navigation() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden items-center gap-2 md:flex">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-wide transition',
                isActive
                  ? 'bg-white/20 text-[#e9d29a] shadow-[0_6px_16px_rgba(0,0,0,0.35)]'
                  : 'text-[#d0d6db] hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Mobile Navigation Button */}
      <div className="md:hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center rounded-full bg-white/10 p-2 text-[#d0d6db] transition hover:bg-white/20"
        >
          <span className="sr-only">Open main menu</span>
          {isOpen ? (
            <X className="block h-6 w-6" />
          ) : (
            <Menu className="block h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-40 rounded-b-3xl border border-[#004d66]/40 bg-gradient-to-br from-[#001a24] via-[#003446] to-[#002233] shadow-[0_14px_30px_rgba(0,0,0,0.45)] md:hidden">
          <div className="space-y-2 px-4 py-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold uppercase tracking-wide transition',
                    isActive
                      ? 'bg-white/15 text-[#e9d29a] shadow-[0_8px_24px_rgba(0,0,0,0.35)]'
                      : 'text-[#d0d6db] hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
