export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_analysis: {
        Row: {
          category: Database["public"]["Enums"]["report_category"] | null
          created_at: string
          id: string
          priority: Database["public"]["Enums"]["report_priority"] | null
          raw: Json | null
          reason: string | null
          report_id: string
          service_code: Database["public"]["Enums"]["report_category"] | null
          solution: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["report_category"] | null
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["report_priority"] | null
          raw?: Json | null
          reason?: string | null
          report_id: string
          service_code?: Database["public"]["Enums"]["report_category"] | null
          solution?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["report_category"] | null
          created_at?: string
          id?: string
          priority?: Database["public"]["Enums"]["report_priority"] | null
          raw?: Json | null
          reason?: string | null
          report_id?: string
          service_code?: Database["public"]["Enums"]["report_category"] | null
          solution?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      report_history: {
        Row: {
          action: string
          actor_id: string | null
          comment: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["report_status"] | null
          id: string
          report_id: string
          to_status: Database["public"]["Enums"]["report_status"] | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          comment?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["report_status"] | null
          id?: string
          report_id: string
          to_status?: Database["public"]["Enums"]["report_status"] | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          comment?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["report_status"] | null
          id?: string
          report_id?: string
          to_status?: Database["public"]["Enums"]["report_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "report_history_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          address: string | null
          anon_name: string | null
          anon_phone: string | null
          assigned_to: string | null
          awaiting_at: string | null
          category: Database["public"]["Enums"]["report_category"] | null
          completed_at: string | null
          completion_comment: string | null
          completion_photo_url: string | null
          created_at: string
          created_by: string | null
          description: string
          district: string | null
          id: string
          lat: number
          lng: number
          photo_url: string | null
          priority: Database["public"]["Enums"]["report_priority"] | null
          service_id: string | null
          status: Database["public"]["Enums"]["report_status"]
          taken_at: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          anon_name?: string | null
          anon_phone?: string | null
          assigned_to?: string | null
          awaiting_at?: string | null
          category?: Database["public"]["Enums"]["report_category"] | null
          completed_at?: string | null
          completion_comment?: string | null
          completion_photo_url?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          district?: string | null
          id?: string
          lat: number
          lng: number
          photo_url?: string | null
          priority?: Database["public"]["Enums"]["report_priority"] | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          taken_at?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          anon_name?: string | null
          anon_phone?: string | null
          assigned_to?: string | null
          awaiting_at?: string | null
          category?: Database["public"]["Enums"]["report_category"] | null
          completed_at?: string | null
          completion_comment?: string | null
          completion_photo_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          district?: string | null
          id?: string
          lat?: number
          lng?: number
          photo_url?: string | null
          priority?: Database["public"]["Enums"]["report_priority"] | null
          service_id?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          taken_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          code: Database["public"]["Enums"]["report_category"]
          created_at: string
          id: string
          name_kk: string
          name_ru: string
        }
        Insert: {
          code: Database["public"]["Enums"]["report_category"]
          created_at?: string
          id?: string
          name_kk: string
          name_ru: string
        }
        Update: {
          code?: Database["public"]["Enums"]["report_category"]
          created_at?: string
          id?: string
          name_kk?: string
          name_ru?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          department_text: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          service_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          department_text?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          service_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          department_text?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          service_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_service_id: { Args: { _user_id: string }; Returns: string }
    }
    Enums: {
      app_role: "citizen" | "worker" | "admin"
      report_category:
        | "roads"
        | "water"
        | "electricity"
        | "sanitation"
        | "transport"
        | "emergency"
        | "other"
      report_priority: "low" | "medium" | "high"
      report_status:
        | "new"
        | "approved"
        | "in_progress"
        | "awaiting_confirmation"
        | "completed"
        | "returned"
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
      app_role: ["citizen", "worker", "admin"],
      report_category: [
        "roads",
        "water",
        "electricity",
        "sanitation",
        "transport",
        "emergency",
        "other",
      ],
      report_priority: ["low", "medium", "high"],
      report_status: [
        "new",
        "approved",
        "in_progress",
        "awaiting_confirmation",
        "completed",
        "returned",
      ],
    },
  },
} as const
