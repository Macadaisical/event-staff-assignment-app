# Supabase Implementation Guide

## Overview
This guide walks through integrating Supabase with your Event Staff Assignment app, replacing localStorage with a PostgreSQL database, adding authentication, and enabling real-time features.

## 🚀 Quick Setup Steps

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and enter project details
4. Wait for project to be created (~2 minutes)
5. Copy your project URL and anon key from Settings > API

### 2. Configure Environment Variables
```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local with your Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Set Up Database Schema
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Click "Run" to create all tables and policies

### 4. Update Your App Structure

#### A. Wrap your app with AuthProvider
```tsx
// src/app/layout.tsx
import { AuthProvider } from '@/components/auth/auth-provider'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

#### B. Replace localStorage store with Supabase store
```tsx
// Replace useAppStore with useSupabaseStore in components
import { useSupabaseStore } from '@/stores/supabase-store'
import { useAuth } from '@/components/auth/auth-provider'

// In your components:
const { user, loading } = useAuth()
const { events, fetchEvents, addEvent } = useSupabaseStore()

// Show login if not authenticated
if (loading) return <div>Loading...</div>
if (!user) return <LoginForm />
```

#### C. Add authentication checks to pages
```tsx
// Example: src/app/events/page.tsx
'use client'

import { useAuth } from '@/components/auth/auth-provider'
import { useSupabaseStore } from '@/stores/supabase-store'
import LoginForm from '@/components/auth/login-form'

export default function EventsPage() {
  const { user, loading } = useAuth()
  const { events, fetchEvents } = useSupabaseStore()

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>
  }

  if (!user) {
    return <LoginForm />
  }

  // Your existing component logic...
}
```

## 📊 Database Schema Highlights

### Key Features
- **Row Level Security (RLS)**: Users can only access their own data
- **Multi-tenant**: Each user has isolated data
- **Audit Trail**: `created_at` and `updated_at` timestamps
- **Foreign Key Constraints**: Data integrity maintained
- **UUID Primary Keys**: Better for distributed systems

### Main Tables
- `profiles` - User profiles (extends Supabase auth.users)
- `events` - Event information
- `team_members` - Team member roster
- `team_assignments` - Staff assignments for events
- `traffic_controls` - Traffic control assignments
- `supervisors` - Event supervisors
- `assignment_categories` - Customizable assignment types

## 🔄 Migration Strategy

### Phase 1: Parallel Implementation
1. Keep existing localStorage store functional
2. Add Supabase alongside current system
3. Test authentication and basic CRUD operations
4. Migrate user data manually or build import tool

### Phase 2: Feature-by-Feature Migration
1. **Events**: Migrate event creation/editing first
2. **Team Members**: Migrate team member management
3. **Assignments**: Migrate assignment creation
4. **Settings**: Migrate assignment categories

### Phase 3: Real-time Features
1. Add real-time subscriptions for live updates
2. Implement collaborative editing
3. Add notification system

## 🔐 Authentication Features

### Supported Auth Methods
- Email/Password
- Magic Link (passwordless)
- Google OAuth
- GitHub OAuth
- More providers available

### User Management
- Automatic profile creation
- Password reset flows
- Email confirmation
- Session management

## 🌟 Advanced Features to Add

### Real-time Subscriptions
```tsx
// Example: Real-time event updates
useEffect(() => {
  const channel = supabase
    .channel('events_channel')
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'events'
      },
      (payload) => {
        // Update local state when events change
        fetchEvents()
      }
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [])
```

### File Uploads (Event Documents)
```tsx
// Upload event documents to Supabase Storage
const uploadDocument = async (file: File, eventId: string) => {
  const { data, error } = await supabase.storage
    .from('event-documents')
    .upload(`${eventId}/${file.name}`, file)

  return data?.path
}
```

### Advanced Permissions
- **Admin Role**: Manage organization settings
- **Coordinator Role**: Create and manage events
- **Viewer Role**: Read-only access to assignments

## 🔧 Development Workflow

### Local Development
1. Run Supabase locally (optional):
   ```bash
   npx supabase start
   ```

2. Generate TypeScript types:
   ```bash
   npx supabase gen types typescript --local > src/types/database.ts
   ```

3. Run migrations:
   ```bash
   npx supabase db reset --local
   ```

### Production Deployment
1. Push schema to production:
   ```bash
   npx supabase db push
   ```

2. Deploy app with environment variables set

## 🛠 Troubleshooting

### Common Issues

#### 1. RLS Policy Errors
```
Error: new row violates row-level security policy
```
**Solution**: Ensure user is authenticated and policies allow the operation

#### 2. Foreign Key Violations
```
Error: insert or update on table violates foreign key constraint
```
**Solution**: Ensure referenced records exist before inserting

#### 3. Type Errors
```
Argument of type 'X' is not assignable to parameter of type 'Y'
```
**Solution**: Update TypeScript types or check database schema changes

### Debugging Tips
1. Check Supabase dashboard logs
2. Use browser network tab to inspect API calls
3. Test queries in Supabase SQL editor
4. Verify RLS policies in dashboard

## 🚀 Next Steps After Implementation

1. **Performance Optimization**
   - Add database indexes
   - Implement caching strategies
   - Optimize queries with joins

2. **Enhanced UX**
   - Add loading states
   - Implement optimistic updates
   - Add offline support

3. **Monitoring**
   - Set up error tracking (Sentry)
   - Monitor database performance
   - Track user analytics

4. **Scaling**
   - Implement database backups
   - Add read replicas for performance
   - Consider CDN for static assets

This implementation provides a solid foundation for a production-ready event management system with modern authentication, real-time updates, and scalable database architecture.