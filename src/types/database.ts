export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          organization: string | null;
          role: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          organization?: string | null;
          role?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          organization?: string | null;
          role?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          event_id: string;
          user_id: string;
          event_name: string;
          event_date: string;
          location: string;
          start_time: string;
          end_time: string;
          team_meet_time: string;
          meet_location: string;
          prepared_by: string;
          prepared_date: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          event_id?: string;
          user_id: string;
          event_name: string;
          event_date: string;
          location: string;
          start_time: string;
          end_time: string;
          team_meet_time: string;
          meet_location: string;
          prepared_by: string;
          prepared_date: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          event_id?: string;
          user_id?: string;
          event_name?: string;
          event_date?: string;
          location?: string;
          start_time?: string;
          end_time?: string;
          team_meet_time?: string;
          meet_location?: string;
          prepared_by?: string;
          prepared_date?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      team_members: {
        Row: {
          member_id: string;
          user_id: string;
          member_name: string;
          active: boolean;
          phone: string | null;
          email: string | null;
          emergency_contact: string | null;
          emergency_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          member_id?: string;
          user_id: string;
          member_name: string;
          active?: boolean;
          phone?: string | null;
          email?: string | null;
          emergency_contact?: string | null;
          emergency_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          member_id?: string;
          user_id?: string;
          member_name?: string;
          active?: boolean;
          phone?: string | null;
          email?: string | null;
          emergency_contact?: string | null;
          emergency_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      team_assignments: {
        Row: {
          assignment_id: string;
          event_id: string;
          member_id: string;
          assignment_type: string;
          equipment_area: string;
          start_time: string;
          end_time: string;
          notes: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          assignment_id?: string;
          event_id: string;
          member_id: string;
          assignment_type: string;
          equipment_area: string;
          start_time: string;
          end_time: string;
          notes?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          assignment_id?: string;
          event_id?: string;
          member_id?: string;
          assignment_type?: string;
          equipment_area?: string;
          start_time?: string;
          end_time?: string;
          notes?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      traffic_controls: {
        Row: {
          traffic_id: string;
          event_id: string;
          member_id: string;
          patrol_vehicle: string;
          area_assignment: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          traffic_id?: string;
          event_id: string;
          member_id: string;
          patrol_vehicle: string;
          area_assignment: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          traffic_id?: string;
          event_id?: string;
          member_id?: string;
          patrol_vehicle?: string;
          area_assignment?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      supervisors: {
        Row: {
          supervisor_id: string;
          event_id: string;
          supervisor_name: string;
          phone: string | null;
          email: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          supervisor_id?: string;
          event_id: string;
          supervisor_name: string;
          phone?: string | null;
          email?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          supervisor_id?: string;
          event_id?: string;
          supervisor_name?: string;
          phone?: string | null;
          email?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      assignment_categories: {
        Row: {
          category_id: string;
          user_id: string;
          category_name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          category_id?: string;
          user_id: string;
          category_name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          category_id?: string;
          user_id?: string;
          category_name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}