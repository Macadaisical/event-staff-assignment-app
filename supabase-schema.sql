-- Supabase Database Schema for Event Staff Assignment App

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  organization TEXT,
  role TEXT DEFAULT 'coordinator',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Events table
CREATE TABLE public.events (
  event_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  location TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  team_meet_time TIME NOT NULL,
  meet_location TEXT NOT NULL,
  prepared_by TEXT NOT NULL,
  prepared_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Members table
CREATE TABLE public.team_members (
  member_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  phone TEXT,
  email TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assignment Categories table
CREATE TABLE public.assignment_categories (
  category_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category_name)
);

-- Team Assignments table
CREATE TABLE public.team_assignments (
  assignment_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(event_id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.team_members(member_id) ON DELETE CASCADE,
  assignment_type TEXT NOT NULL,
  equipment_area TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  notes TEXT,
  sort_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Traffic Control table
CREATE TABLE public.traffic_controls (
  traffic_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(event_id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.team_members(member_id) ON DELETE SET NULL,
  staff_name TEXT NOT NULL,
  patrol_vehicle TEXT NOT NULL,
  area_assignment TEXT NOT NULL,
  sort_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Supervisors table
CREATE TABLE public.supervisors (
  supervisor_id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES public.events(event_id) ON DELETE CASCADE,
  supervisor_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  sort_order INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.traffic_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisors ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Events policies
CREATE POLICY "Users can view own events" ON public.events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own events" ON public.events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events" ON public.events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events" ON public.events
  FOR DELETE USING (auth.uid() = user_id);

-- Team Members policies
CREATE POLICY "Users can view own team members" ON public.team_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own team members" ON public.team_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own team members" ON public.team_members
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own team members" ON public.team_members
  FOR DELETE USING (auth.uid() = user_id);

-- Assignment Categories policies
CREATE POLICY "Users can view own categories" ON public.assignment_categories
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories" ON public.assignment_categories
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories" ON public.assignment_categories
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories" ON public.assignment_categories
  FOR DELETE USING (auth.uid() = user_id);

-- Team Assignments policies (access through events)
CREATE POLICY "Users can view assignments for own events" ON public.team_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.event_id = team_assignments.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert assignments for own events" ON public.team_assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.event_id = team_assignments.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update assignments for own events" ON public.team_assignments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.event_id = team_assignments.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete assignments for own events" ON public.team_assignments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.event_id = team_assignments.event_id
      AND events.user_id = auth.uid()
    )
  );

-- Similar policies for traffic_controls and supervisors
CREATE POLICY "Users can view traffic controls for own events" ON public.traffic_controls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.event_id = traffic_controls.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert traffic controls for own events" ON public.traffic_controls
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.event_id = traffic_controls.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update traffic controls for own events" ON public.traffic_controls
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.event_id = traffic_controls.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete traffic controls for own events" ON public.traffic_controls
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.event_id = traffic_controls.event_id
      AND events.user_id = auth.uid()
    )
  );

-- Supervisors policies
CREATE POLICY "Users can view supervisors for own events" ON public.supervisors
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.event_id = supervisors.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert supervisors for own events" ON public.supervisors
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.event_id = supervisors.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update supervisors for own events" ON public.supervisors
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.event_id = supervisors.event_id
      AND events.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete supervisors for own events" ON public.supervisors
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.event_id = supervisors.event_id
      AND events.user_id = auth.uid()
    )
  );

-- Insert default assignment categories
INSERT INTO public.assignment_categories (user_id, category_name, description)
SELECT
  auth.uid(),
  category,
  'Default assignment category'
FROM (
  VALUES
    ('Equipment Operator'),
    ('Safety Monitor'),
    ('Setup/Breakdown'),
    ('Crowd Control'),
    ('Communications'),
    ('First Aid'),
    ('General Support'),
    ('Technical Support')
) AS t(category)
WHERE auth.uid() IS NOT NULL;

-- Functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON public.team_members FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_team_assignments_updated_at BEFORE UPDATE ON public.team_assignments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_traffic_controls_updated_at BEFORE UPDATE ON public.traffic_controls FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_supervisors_updated_at BEFORE UPDATE ON public.supervisors FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
