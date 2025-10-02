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
          event_date: string | null;
          location: string | null;
          start_time: string | null;
          end_time: string | null;
          team_meet_time: string | null;
          meet_location: string | null;
          prepared_by: string | null;
          prepared_date: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          event_id?: string;
          user_id: string;
          event_name: string;
          event_date?: string | null;
          location?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          team_meet_time?: string | null;
          meet_location?: string | null;
          prepared_by?: string | null;
          prepared_date?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          event_id?: string;
          user_id?: string;
          event_name?: string;
          event_date?: string | null;
          location?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          team_meet_time?: string | null;
          meet_location?: string | null;
          prepared_by?: string | null;
          prepared_date?: string | null;
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
          assignment_type: string | null;
          equipment_area: string | null;
          start_time: string | null;
          end_time: string | null;
          notes: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          assignment_id?: string;
          event_id: string;
          member_id: string;
          assignment_type?: string | null;
          equipment_area?: string | null;
          start_time?: string | null;
          end_time?: string | null;
          notes?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          assignment_id?: string;
          event_id?: string;
          member_id?: string;
          assignment_type?: string | null;
          equipment_area?: string | null;
          start_time?: string | null;
          end_time?: string | null;
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
          member_id: string | null;
          staff_name: string | null;
          patrol_vehicle: string | null;
          area_assignment: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          traffic_id?: string;
          event_id: string;
          member_id?: string | null;
          staff_name?: string | null;
          patrol_vehicle?: string | null;
          area_assignment?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          traffic_id?: string;
          event_id?: string;
          member_id?: string | null;
          staff_name?: string | null;
          patrol_vehicle?: string | null;
          area_assignment?: string | null;
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
      task_categories: {
        Row: {
          category_id: string;
          user_id: string;
          name: string;
          color: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          category_id?: string;
          user_id: string;
          name: string;
          color?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          user_id?: string;
          name?: string;
          color?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      event_tasks: {
        Row: {
          task_id: string;
          event_id: string;
          user_id: string;
          title: string;
          description: string | null;
          status: 'Not Started' | 'In Progress' | 'Completed';
          due_date: string | null;
          due_time: string | null;
          assignee_id: string | null;
          category_id: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          task_id?: string;
          event_id: string;
          user_id: string;
          title: string;
          description?: string | null;
          status?: 'Not Started' | 'In Progress' | 'Completed';
          due_date?: string | null;
          due_time?: string | null;
          assignee_id?: string | null;
          category_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          task_id?: string;
          event_id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          status?: 'Not Started' | 'In Progress' | 'Completed';
          due_date?: string | null;
          due_time?: string | null;
          assignee_id?: string | null;
          category_id?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      duplicate_event_with_children: {
        Args: {
          source_event_id: string;
          target_event_date?: string | null;
          target_event_name?: string | null;
          due_date_offset?: number | null;
        };
        Returns: string;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
