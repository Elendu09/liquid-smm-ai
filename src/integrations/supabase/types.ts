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
      account_preferences: {
        Row: {
          active_account_id: string | null
          created_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_account_id?: string | null
          created_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_account_id?: string | null
          created_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_preferences_active_account_id_fkey"
            columns: ["active_account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_state: {
        Row: {
          account_id: string
          id: string
          last_threshold: number
          metric: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id: string
          id?: string
          last_threshold?: number
          metric: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string
          id?: string
          last_threshold?: number
          metric?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_events: {
        Row: {
          created_at: string
          event: string
          id: string
          meta: Json | null
          notif_severity: string | null
          notif_type: string | null
          notification_id: string | null
          rule_key: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          meta?: Json | null
          notif_severity?: string | null
          notif_type?: string | null
          notification_id?: string | null
          rule_key?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          meta?: Json | null
          notif_severity?: string | null
          notif_type?: string | null
          notification_id?: string | null
          rule_key?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          auto_tune_enabled: boolean
          channels: Json
          created_at: string
          digest_mode: string
          muted_accounts: string[]
          muted_platforms: string[]
          quiet_hours: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_tune_enabled?: boolean
          channels?: Json
          created_at?: string
          digest_mode?: string
          muted_accounts?: string[]
          muted_platforms?: string[]
          quiet_hours?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_tune_enabled?: boolean
          channels?: Json
          created_at?: string
          digest_mode?: string
          muted_accounts?: string[]
          muted_platforms?: string[]
          quiet_hours?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_rules: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          params: Json
          rule_key: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          params?: Json
          rule_key: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          params?: Json
          rule_key?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_webhooks: {
        Row: {
          active: boolean
          created_at: string
          event_types: string[]
          failure_count: number
          id: string
          label: string | null
          last_fired_at: string | null
          last_status: number | null
          secret: string | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          event_types?: string[]
          failure_count?: number
          id?: string
          label?: string | null
          last_fired_at?: string | null
          last_status?: number | null
          secret?: string | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          event_types?: string[]
          failure_count?: number
          id?: string
          label?: string | null
          last_fired_at?: string | null
          last_status?: number | null
          secret?: string | null
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          account_id: string | null
          action_url: string | null
          created_at: string
          group_key: string | null
          id: string
          message: string
          metric: Json | null
          pinned: boolean
          platform_id: string | null
          post_id: string | null
          read_at: string | null
          severity: string
          snoozed_until: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          action_url?: string | null
          created_at?: string
          group_key?: string | null
          id?: string
          message: string
          metric?: Json | null
          pinned?: boolean
          platform_id?: string | null
          post_id?: string | null
          read_at?: string | null
          severity?: string
          snoozed_until?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          action_url?: string | null
          created_at?: string
          group_key?: string | null
          id?: string
          message?: string
          metric?: Json | null
          pinned?: boolean
          platform_id?: string | null
          post_id?: string | null
          read_at?: string | null
          severity?: string
          snoozed_until?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_metrics_baseline: {
        Row: {
          account_id: string
          id: string
          metric: string
          sample_size: number
          updated_at: string
          user_id: string
          value: number
          window_hours: number
        }
        Insert: {
          account_id: string
          id?: string
          metric: string
          sample_size?: number
          updated_at?: string
          user_id: string
          value?: number
          window_hours?: number
        }
        Update: {
          account_id?: string
          id?: string
          metric?: string
          sample_size?: number
          updated_at?: string
          user_id?: string
          value?: number
          window_hours?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          brand_voice: Json
          created_at: string
          display_name: string | null
          id: string
          onboarding_state: Json
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          brand_voice?: Json
          created_at?: string
          display_name?: string | null
          id: string
          onboarding_state?: Json
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          brand_voice?: Json
          created_at?: string
          display_name?: string | null
          id?: string
          onboarding_state?: Json
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_accounts: {
        Row: {
          avatar_url: string | null
          connected_at: string
          created_at: string
          display_name: string
          engagement: number
          followers: number
          following: number
          health_score: number
          id: string
          is_active: boolean
          last_sync: string | null
          metadata: Json
          platform_id: string
          posts: number
          status: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          connected_at?: string
          created_at?: string
          display_name: string
          engagement?: number
          followers?: number
          following?: number
          health_score?: number
          id?: string
          is_active?: boolean
          last_sync?: string | null
          metadata?: Json
          platform_id: string
          posts?: number
          status?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          connected_at?: string
          created_at?: string
          display_name?: string
          engagement?: number
          followers?: number
          following?: number
          health_score?: number
          id?: string
          is_active?: boolean
          last_sync?: string | null
          metadata?: Json
          platform_id?: string
          posts?: number
          status?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
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
    }
    Enums: {
      app_role: "owner" | "admin" | "editor" | "viewer"
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
      app_role: ["owner", "admin", "editor", "viewer"],
    },
  },
} as const
