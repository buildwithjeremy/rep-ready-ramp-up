export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      checklist_template_subtasks: {
        Row: {
          created_at: string
          id: string
          order_index: number
          template_id: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_index?: number
          template_id: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          order_index?: number
          template_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklist_template_subtasks_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          created_at: string
          description: string
          id: string
          milestone: number
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          milestone: number
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          milestone?: number
          title?: string
        }
        Relationships: []
      }
      milestone_subtasks: {
        Row: {
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          milestone_id: string
          notes: string | null
          template_subtask_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          milestone_id: string
          notes?: string | null
          template_subtask_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          milestone_id?: string
          notes?: string | null
          template_subtask_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_subtasks_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_subtasks_template_subtask_id_fkey"
            columns: ["template_subtask_id"]
            isOneToOne: false
            referencedRelation: "checklist_template_subtasks"
            referencedColumns: ["id"]
          },
        ]
      }
      milestones: {
        Row: {
          completed: boolean
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          rep_id: string
          step_number: number
          template_id: string | null
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          rep_id: string
          step_number: number
          template_id?: string | null
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          rep_id?: string
          step_number?: number
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestones_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_rep_id_fkey"
            columns: ["rep_id"]
            isOneToOne: false
            referencedRelation: "reps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestones_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          trainer_id: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          trainer_id?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          trainer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reps: {
        Row: {
          address: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          join_date: string
          last_activity: string
          milestone: number
          overall_progress: number
          phone: string | null
          promotion_date: string | null
          stage: Database["public"]["Enums"]["rep_stage"]
          status: string
          trainer_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          join_date?: string
          last_activity?: string
          milestone?: number
          overall_progress?: number
          phone?: string | null
          promotion_date?: string | null
          stage?: Database["public"]["Enums"]["rep_stage"]
          status?: string
          trainer_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          join_date?: string
          last_activity?: string
          milestone?: number
          overall_progress?: number
          phone?: string | null
          promotion_date?: string | null
          stage?: Database["public"]["Enums"]["rep_stage"]
          status?: string
          trainer_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reps_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reps_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      trainers: {
        Row: {
          active_reps: number
          assigned_reps: number
          avatar_url: string | null
          average_time_to_independent: number
          created_at: string
          email: string
          full_name: string
          id: string
          independent_reps: number
          stuck_reps: number
          success_rate: number
          updated_at: string
          user_id: string
        }
        Insert: {
          active_reps?: number
          assigned_reps?: number
          avatar_url?: string | null
          average_time_to_independent?: number
          created_at?: string
          email: string
          full_name: string
          id?: string
          independent_reps?: number
          stuck_reps?: number
          success_rate?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          active_reps?: number
          assigned_reps?: number
          avatar_url?: string | null
          average_time_to_independent?: number
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          independent_reps?: number
          stuck_reps?: number
          success_rate?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_dashboard_metrics: {
        Row: {
          active_reps: number | null
          avg_time_to_independent: number | null
          conversion_rate: number | null
          independent_reps: number | null
          stuck_reps_by_activity: number | null
          stuck_reps_by_status: number | null
          total_reps: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_rep_progress: {
        Args: { rep_id: string }
        Returns: number
      }
      get_activity_rate: {
        Args: { trainer_id_param: string }
        Returns: number
      }
      get_available_trainers: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          full_name: string
          assigned_reps: number
        }[]
      }
      get_avg_progress_per_rep: {
        Args: { trainer_id_param: string }
        Returns: number
      }
      get_avg_time_to_independent: {
        Args: { trainer_id_param?: string }
        Returns: number
      }
      get_conversion_rate: {
        Args: { trainer_id_param?: string }
        Returns: number
      }
      get_stuck_reps_count: {
        Args: { trainer_id_param?: string }
        Returns: number
      }
      get_trainer_performance_rank: {
        Args: { trainer_id_param: string }
        Returns: number
      }
      get_user_role: {
        Args: Record<PropertyKey, never> | { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      promote_user_role: {
        Args: {
          target_user_id: string
          new_role: Database["public"]["Enums"]["user_role"]
          promoted_by_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      rep_stage: "board_a" | "board_b" | "board_c" | "independent"
      user_role: "ADMIN" | "TRAINER" | "REP"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      rep_stage: ["board_a", "board_b", "board_c", "independent"],
      user_role: ["ADMIN", "TRAINER", "REP"],
    },
  },
} as const
