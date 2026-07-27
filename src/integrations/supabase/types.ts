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
      account_metrics_daily: {
        Row: {
          account_id: string
          day: string
          engagement: number | null
          followers: number | null
          following: number | null
          id: string
          impressions: number | null
          posts: number | null
          raw: Json
          reach: number | null
          user_id: string
        }
        Insert: {
          account_id: string
          day: string
          engagement?: number | null
          followers?: number | null
          following?: number | null
          id?: string
          impressions?: number | null
          posts?: number | null
          raw?: Json
          reach?: number | null
          user_id: string
        }
        Update: {
          account_id?: string
          day?: string
          engagement?: number | null
          followers?: number | null
          following?: number | null
          id?: string
          impressions?: number | null
          posts?: number | null
          raw?: Json
          reach?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_metrics_daily_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
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
      ai_command_history: {
        Row: {
          created_at: string
          error: string | null
          id: string
          prompt: string
          status: string
          text: string
          tool_calls: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          prompt: string
          status?: string
          text?: string
          tool_calls?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          prompt?: string
          status?: string
          text?: string
          tool_calls?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_command_settings: {
        Row: {
          created_at: string
          enter_behavior: string
          extras: Json
          ghost_autocomplete: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          enter_behavior?: string
          extras?: Json
          ghost_autocomplete?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          enter_behavior?: string
          extras?: Json
          ghost_autocomplete?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      asset_versions: {
        Row: {
          asset_id: string
          author: string | null
          created_at: string
          id: string
          note: string | null
          reason: string
          subtitle: string | null
          tags: string[]
          title: string
          type: string
          url: string | null
          user_id: string
          version: number
        }
        Insert: {
          asset_id: string
          author?: string | null
          created_at?: string
          id?: string
          note?: string | null
          reason?: string
          subtitle?: string | null
          tags?: string[]
          title?: string
          type?: string
          url?: string | null
          user_id: string
          version: number
        }
        Update: {
          asset_id?: string
          author?: string | null
          created_at?: string
          id?: string
          note?: string | null
          reason?: string
          subtitle?: string | null
          tags?: string[]
          title?: string
          type?: string
          url?: string | null
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      audience_segments: {
        Row: {
          created_at: string
          description: string
          engagement_bucket: string
          follower_bucket: string
          id: string
          keywords: string[]
          niche: string | null
          platforms: string[]
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          engagement_bucket?: string
          follower_bucket?: string
          id?: string
          keywords?: string[]
          niche?: string | null
          platforms?: string[]
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          engagement_bucket?: string
          follower_bucket?: string
          id?: string
          keywords?: string[]
          niche?: string | null
          platforms?: string[]
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          meta: Json
          target: string | null
          user_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          target?: string | null
          user_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          meta?: Json
          target?: string | null
          user_id?: string
        }
        Relationships: []
      }
      automation_rules: {
        Row: {
          account_id: string | null
          config: Json
          created_at: string
          enabled: boolean
          id: string
          kind: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          kind: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          kind?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_rules_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_runs: {
        Row: {
          actions_taken: number
          created_at: string
          data: Json
          id: string
          message: string | null
          rule_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          actions_taken?: number
          created_at?: string
          data?: Json
          id?: string
          message?: string | null
          rule_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          actions_taken?: number
          created_at?: string
          data?: Json
          id?: string
          message?: string | null
          rule_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_voices: {
        Row: {
          audience: string
          created_at: string
          donts: string[]
          dos: string[]
          emojis: string
          id: string
          is_active: boolean
          is_default: boolean
          length: string
          name: string
          platform_overrides: Json
          samples: string[]
          tone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          audience?: string
          created_at?: string
          donts?: string[]
          dos?: string[]
          emojis?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          length?: string
          name: string
          platform_overrides?: Json
          samples?: string[]
          tone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          audience?: string
          created_at?: string
          donts?: string[]
          dos?: string[]
          emojis?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          length?: string
          name?: string
          platform_overrides?: Json
          samples?: string[]
          tone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      competitors: {
        Row: {
          created_at: string
          data: Json
          display_name: string | null
          handle: string
          id: string
          notes: string | null
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          display_name?: string | null
          handle: string
          id?: string
          notes?: string | null
          platform: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          display_name?: string | null
          handle?: string
          id?: string
          notes?: string | null
          platform?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      content_categories: {
        Row: {
          cadence: string
          color: string
          created_at: string
          emoji: string
          id: string
          name: string
          updated_at: string
          user_id: string
          weekly_budget: number
        }
        Insert: {
          cadence?: string
          color?: string
          created_at?: string
          emoji?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
          weekly_budget?: number
        }
        Update: {
          cadence?: string
          color?: string
          created_at?: string
          emoji?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
          weekly_budget?: number
        }
        Relationships: []
      }
      content_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          name: string
          platform: string
          tags: string[]
          tool_key: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          body?: string
          created_at?: string
          id?: string
          name: string
          platform?: string
          tags?: string[]
          tool_key?: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          name?: string
          platform?: string
          tags?: string[]
          tool_key?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      credit_balances: {
        Row: {
          cap: number
          created_at: string
          included: number
          purchased: number
          renews_at: string
          updated_at: string
          used: number
          user_id: string
        }
        Insert: {
          cap?: number
          created_at?: string
          included?: number
          purchased?: number
          renews_at?: string
          updated_at?: string
          used?: number
          user_id: string
        }
        Update: {
          cap?: number
          created_at?: string
          included?: number
          purchased?: number
          renews_at?: string
          updated_at?: string
          used?: number
          user_id?: string
        }
        Relationships: []
      }
      credit_events: {
        Row: {
          created_at: string
          delta: number
          id: string
          kind: string
          label: string
          meta: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          kind: string
          label: string
          meta?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          kind?: string
          label?: string
          meta?: Json
          user_id?: string
        }
        Relationships: []
      }
      custom_reports: {
        Row: {
          cards: Json
          created_at: string
          id: string
          name: string
          range: string
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cards?: Json
          created_at?: string
          id: string
          name: string
          range?: string
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cards?: Json
          created_at?: string
          id?: string
          name?: string
          range?: string
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      follower_snapshots: {
        Row: {
          account_id: string
          captured_at: string
          data: Json
          delta: number | null
          followers: number
          id: string
          user_id: string
        }
        Insert: {
          account_id: string
          captured_at?: string
          data?: Json
          delta?: number | null
          followers: number
          id?: string
          user_id: string
        }
        Update: {
          account_id?: string
          captured_at?: string
          data?: Json
          delta?: number | null
          followers?: number
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follower_snapshots_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      home_summary_cache: {
        Row: {
          refreshed_at: string
          summary: Json
          user_id: string
        }
        Insert: {
          refreshed_at?: string
          summary: Json
          user_id: string
        }
        Update: {
          refreshed_at?: string
          summary?: Json
          user_id?: string
        }
        Relationships: []
      }
      hub_items: {
        Row: {
          created_at: string
          hub_key: string
          id: string
          meta: string | null
          metadata: Json
          order_index: number
          status: string
          subtitle: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          hub_key: string
          id?: string
          meta?: string | null
          metadata?: Json
          order_index?: number
          status: string
          subtitle?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          hub_key?: string
          id?: string
          meta?: string | null
          metadata?: Json
          order_index?: number
          status?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inbox_messages: {
        Row: {
          account_id: string | null
          author: string | null
          body: string | null
          created_at: string
          data: Json
          external_id: string | null
          id: string
          kind: string
          received_at: string
          sentiment: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          author?: string | null
          body?: string | null
          created_at?: string
          data?: Json
          external_id?: string | null
          id?: string
          kind: string
          received_at?: string
          sentiment?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          author?: string | null
          body?: string | null
          created_at?: string
          data?: Json
          external_id?: string | null
          id?: string
          kind?: string
          received_at?: string
          sentiment?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_messages_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      integration_settings: {
        Row: {
          created_at: string
          disabled_tools: string[]
          enabled: boolean
          id: string
          last_error: string | null
          last_status: string | null
          last_used_at: string | null
          slug: string
          tool_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          disabled_tools?: string[]
          enabled?: boolean
          id?: string
          last_error?: string | null
          last_status?: string | null
          last_used_at?: string | null
          slug: string
          tool_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          disabled_tools?: string[]
          enabled?: boolean
          id?: string
          last_error?: string | null
          last_status?: string | null
          last_used_at?: string | null
          slug?: string
          tool_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      linkbio_pages: {
        Row: {
          avatar_url: string | null
          bio: string | null
          blocks: Json
          created_at: string
          handle: string | null
          headline: string | null
          id: string
          links: Json
          overrides: Json
          published: boolean
          slug: string
          socials: Json
          theme_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          blocks?: Json
          created_at?: string
          handle?: string | null
          headline?: string | null
          id?: string
          links?: Json
          overrides?: Json
          published?: boolean
          slug: string
          socials?: Json
          theme_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          blocks?: Json
          created_at?: string
          handle?: string | null
          headline?: string | null
          id?: string
          links?: Json
          overrides?: Json
          published?: boolean
          slug?: string
          socials?: Json
          theme_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      linkbio_templates: {
        Row: {
          created_at: string
          id: string
          name: string
          snapshot: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          snapshot: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          snapshot?: Json
          user_id?: string
        }
        Relationships: []
      }
      linkbio_themes: {
        Row: {
          config: Json
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mcp_activity: {
        Row: {
          created_at: string
          id: string
          input: Json
          latency_ms: number | null
          output: Json
          status: string
          tool: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          input?: Json
          latency_ms?: number | null
          output?: Json
          status?: string
          tool: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          input?: Json
          latency_ms?: number | null
          output?: Json
          status?: string
          tool?: string
          user_id?: string
        }
        Relationships: []
      }
      mcp_inbox: {
        Row: {
          body: string | null
          created_at: string
          data: Json
          id: string
          is_read: boolean
          kind: string
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          is_read?: boolean
          kind: string
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          data?: Json
          id?: string
          is_read?: boolean
          kind?: string
          title?: string
          user_id?: string
        }
        Relationships: []
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
          last_status_label: string | null
          provider: string
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
          last_status_label?: string | null
          provider?: string
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
          last_status_label?: string | null
          provider?: string
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
      oauth_states: {
        Row: {
          code_verifier: string | null
          created_at: string
          expires_at: string
          extra: Json
          platform: string
          redirect_to: string | null
          state: string
          user_id: string
        }
        Insert: {
          code_verifier?: string | null
          created_at?: string
          expires_at?: string
          extra?: Json
          platform: string
          redirect_to?: string | null
          state: string
          user_id: string
        }
        Update: {
          code_verifier?: string | null
          created_at?: string
          expires_at?: string
          extra?: Json
          platform?: string
          redirect_to?: string | null
          state?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_tour_state: {
        Row: {
          completed: boolean
          completed_at: string | null
          dismissed: boolean
          step_index: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          dismissed?: boolean
          step_index?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          dismissed?: boolean
          step_index?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_presets: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_default: boolean
          name: string
          platform: string
          tool_key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_default?: boolean
          name: string
          platform: string
          tool_key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_default?: boolean
          name?: string
          platform?: string
          tool_key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_rollup_daily: {
        Row: {
          accounts: number
          day: string
          engagement: number
          followers: number
          id: string
          impressions: number
          platform: string
          posts: number
          reach: number
          updated_at: string
          user_id: string
        }
        Insert: {
          accounts?: number
          day: string
          engagement?: number
          followers?: number
          id?: string
          impressions?: number
          platform: string
          posts?: number
          reach?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          accounts?: number
          day?: string
          engagement?: number
          followers?: number
          id?: string
          impressions?: number
          platform?: string
          posts?: number
          reach?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_drafts: {
        Row: {
          content: Json
          created_at: string
          id: string
          platforms: string[]
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          platforms?: string[]
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          platforms?: string[]
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_metrics: {
        Row: {
          account_id: string | null
          captured_at: string
          clicks: number | null
          comments: number | null
          id: string
          impressions: number | null
          likes: number | null
          post_id: string | null
          raw: Json
          reach: number | null
          saves: number | null
          shares: number | null
          user_id: string
          video_views: number | null
        }
        Insert: {
          account_id?: string | null
          captured_at?: string
          clicks?: number | null
          comments?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          post_id?: string | null
          raw?: Json
          reach?: number | null
          saves?: number | null
          shares?: number | null
          user_id: string
          video_views?: number | null
        }
        Update: {
          account_id?: string | null
          captured_at?: string
          clicks?: number | null
          comments?: number | null
          id?: string
          impressions?: number | null
          likes?: number | null
          post_id?: string | null
          raw?: Json
          reach?: number | null
          saves?: number | null
          shares?: number | null
          user_id?: string
          video_views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_metrics_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_metrics_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "scheduled_posts"
            referencedColumns: ["id"]
          },
        ]
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
      posts_media: {
        Row: {
          bytes: number | null
          created_at: string
          height: number | null
          id: string
          kind: string
          post_id: string
          sort_order: number
          storage_bucket: string
          storage_path: string
          user_id: string
          width: number | null
        }
        Insert: {
          bytes?: number | null
          created_at?: string
          height?: number | null
          id?: string
          kind?: string
          post_id: string
          sort_order?: number
          storage_bucket?: string
          storage_path: string
          user_id: string
          width?: number | null
        }
        Update: {
          bytes?: number | null
          created_at?: string
          height?: number | null
          id?: string
          kind?: string
          post_id?: string
          sort_order?: number
          storage_bucket?: string
          storage_path?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "scheduled_posts"
            referencedColumns: ["id"]
          },
        ]
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
      recycling_rules: {
        Row: {
          cadence: string
          caption: string
          category_id: string | null
          created_at: string
          enabled: boolean
          hashtags: string[] | null
          hour: number
          id: string
          media_url: string | null
          name: string
          next_run_at: string
          platform_ids: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          cadence?: string
          caption?: string
          category_id?: string | null
          created_at?: string
          enabled?: boolean
          hashtags?: string[] | null
          hour?: number
          id?: string
          media_url?: string | null
          name: string
          next_run_at?: string
          platform_ids?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          cadence?: string
          caption?: string
          category_id?: string | null
          created_at?: string
          enabled?: boolean
          hashtags?: string[] | null
          hour?: number
          id?: string
          media_url?: string | null
          name?: string
          next_run_at?: string
          platform_ids?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      report_runs: {
        Row: {
          created_at: string
          data: Json | null
          format: string
          id: string
          name: string
          period_end: string | null
          period_label: string | null
          period_start: string | null
          sections: Json
          share_token: string | null
          size_bytes: number | null
          status: string
          storage_path: string | null
          template_id: string | null
          updated_at: string
          user_id: string
          whitelabel: boolean
        }
        Insert: {
          created_at?: string
          data?: Json | null
          format?: string
          id?: string
          name: string
          period_end?: string | null
          period_label?: string | null
          period_start?: string | null
          sections?: Json
          share_token?: string | null
          size_bytes?: number | null
          status?: string
          storage_path?: string | null
          template_id?: string | null
          updated_at?: string
          user_id: string
          whitelabel?: boolean
        }
        Update: {
          created_at?: string
          data?: Json | null
          format?: string
          id?: string
          name?: string
          period_end?: string | null
          period_label?: string | null
          period_start?: string | null
          sections?: Json
          share_token?: string | null
          size_bytes?: number | null
          status?: string
          storage_path?: string | null
          template_id?: string | null
          updated_at?: string
          user_id?: string
          whitelabel?: boolean
        }
        Relationships: []
      }
      report_schedules: {
        Row: {
          active: boolean
          cadence: string
          created_at: string
          filters: Json
          format: string
          id: string
          last_run_at: string | null
          name: string
          next_run_at: string | null
          recipients: string[]
          sections: Json
          share_public: boolean
          template_id: string | null
          timezone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          cadence?: string
          created_at?: string
          filters?: Json
          format?: string
          id?: string
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          recipients?: string[]
          sections?: Json
          share_public?: boolean
          template_id?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          cadence?: string
          created_at?: string
          filters?: Json
          format?: string
          id?: string
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          recipients?: string[]
          sections?: Json
          share_public?: boolean
          template_id?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rss_feeds: {
        Row: {
          active: boolean
          ai_rewrite: boolean
          auto_publish: boolean
          caption_template: string | null
          created_at: string
          exclude_keywords: string[]
          filter_keywords: string[]
          id: string
          last_error: string | null
          last_fetched_at: string | null
          last_item_count: number
          last_status: string | null
          owner_id: string
          poll_interval_minutes: number
          target_account_ids: Json
          target_platforms: Json
          title: string | null
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          ai_rewrite?: boolean
          auto_publish?: boolean
          caption_template?: string | null
          created_at?: string
          exclude_keywords?: string[]
          filter_keywords?: string[]
          id?: string
          last_error?: string | null
          last_fetched_at?: string | null
          last_item_count?: number
          last_status?: string | null
          owner_id: string
          poll_interval_minutes?: number
          target_account_ids?: Json
          target_platforms?: Json
          title?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          ai_rewrite?: boolean
          auto_publish?: boolean
          caption_template?: string | null
          created_at?: string
          exclude_keywords?: string[]
          filter_keywords?: string[]
          id?: string
          last_error?: string | null
          last_fetched_at?: string | null
          last_item_count?: number
          last_status?: string | null
          owner_id?: string
          poll_interval_minutes?: number
          target_account_ids?: Json
          target_platforms?: Json
          title?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      rss_items: {
        Row: {
          created_at: string
          feed_id: string
          guid: string
          id: string
          image_url: string | null
          imported: boolean
          link: string | null
          owner_id: string
          published_at: string | null
          scheduled_post_id: string | null
          summary: string | null
          thumbnail_url: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          feed_id: string
          guid: string
          id?: string
          image_url?: string | null
          imported?: boolean
          link?: string | null
          owner_id: string
          published_at?: string | null
          scheduled_post_id?: string | null
          summary?: string | null
          thumbnail_url?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          feed_id?: string
          guid?: string
          id?: string
          image_url?: string | null
          imported?: boolean
          link?: string | null
          owner_id?: string
          published_at?: string | null
          scheduled_post_id?: string | null
          summary?: string | null
          thumbnail_url?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rss_items_feed_id_fkey"
            columns: ["feed_id"]
            isOneToOne: false
            referencedRelation: "rss_feeds"
            referencedColumns: ["id"]
          },
        ]
      }
      run_history: {
        Row: {
          created_at: string
          data: Json
          id: string
          kind: string
          message: string | null
          ref_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          kind: string
          message?: string | null
          ref_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          kind?: string
          message?: string | null
          ref_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_views: {
        Row: {
          created_at: string
          filters: Json
          id: string
          name: string
          pinned: boolean
          scope: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filters?: Json
          id: string
          name: string
          pinned?: boolean
          scope: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filters?: Json
          id?: string
          name?: string
          pinned?: boolean
          scope?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          approval_status: string | null
          approved_at: string | null
          approved_by: string | null
          caption: string
          category_id: string | null
          created_at: string
          error: string | null
          first_comment: string | null
          hashtags: string[] | null
          id: string
          media_url: string | null
          platform_ids: string[]
          platform_overrides: Json
          recycle_rule_id: string | null
          rejection_reason: string | null
          scheduled_at: string
          send_progress: number | null
          sent_at: string | null
          series_id: string | null
          status: string
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          caption?: string
          category_id?: string | null
          created_at?: string
          error?: string | null
          first_comment?: string | null
          hashtags?: string[] | null
          id?: string
          media_url?: string | null
          platform_ids?: string[]
          platform_overrides?: Json
          recycle_rule_id?: string | null
          rejection_reason?: string | null
          scheduled_at: string
          send_progress?: number | null
          sent_at?: string | null
          series_id?: string | null
          status?: string
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_status?: string | null
          approved_at?: string | null
          approved_by?: string | null
          caption?: string
          category_id?: string | null
          created_at?: string
          error?: string | null
          first_comment?: string | null
          hashtags?: string[] | null
          id?: string
          media_url?: string | null
          platform_ids?: string[]
          platform_overrides?: Json
          recycle_rule_id?: string | null
          rejection_reason?: string | null
          scheduled_at?: string
          send_progress?: number | null
          sent_at?: string | null
          series_id?: string | null
          status?: string
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      social_account_tokens: {
        Row: {
          access_token: string
          account_id: string
          expires_at: string | null
          meta: Json
          platform: string
          refresh_token: string | null
          scope: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          account_id: string
          expires_at?: string | null
          meta?: Json
          platform: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          account_id?: string
          expires_at?: string | null
          meta?: Json
          platform?: string
          refresh_token?: string | null
          scope?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_account_tokens_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
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
      stories: {
        Row: {
          account_id: string | null
          caption: string | null
          created_at: string
          data: Json
          id: string
          scheduled_at: string | null
          status: string
          storage_path: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          caption?: string | null
          created_at?: string
          data?: Json
          id?: string
          scheduled_at?: string | null
          status?: string
          storage_path?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          caption?: string | null
          created_at?: string
          data?: Json
          id?: string
          scheduled_at?: string | null
          status?: string
          storage_path?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "social_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          accepted_at: string | null
          avatar_url: string | null
          created_at: string
          email: string
          id: string
          invite_expires_at: string | null
          invite_token: string | null
          joined_at: string
          last_active_at: string | null
          member_user_id: string | null
          name: string
          note: string | null
          owner_id: string
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          avatar_url?: string | null
          created_at?: string
          email: string
          id?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          joined_at?: string
          last_active_at?: string | null
          member_user_id?: string | null
          name: string
          note?: string | null
          owner_id: string
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string
          id?: string
          invite_expires_at?: string | null
          invite_token?: string | null
          joined_at?: string
          last_active_at?: string | null
          member_user_id?: string | null
          name?: string
          note?: string | null
          owner_id?: string
          role?: string
          status?: string
          updated_at?: string
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
      white_label_config: {
        Row: {
          accent_hsl: string
          brand_name: string
          created_at: string
          custom_login_tagline: string
          hide_badge: boolean
          logo_url: string
          support_email: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_hsl?: string
          brand_name?: string
          created_at?: string
          custom_login_tagline?: string
          hide_badge?: boolean
          logo_url?: string
          support_email?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_hsl?: string
          brand_name?: string
          created_at?: string
          custom_login_tagline?: string
          hide_badge?: boolean
          logo_url?: string
          support_email?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_team_invite: {
        Args: { _token: string }
        Returns: {
          owner_id: string
          role: string
        }[]
      }
      analytics_overview_top_posts: {
        Args: { _limit?: number; _since: string; _user_id: string }
        Returns: {
          comments: number
          impressions: number
          likes: number
          post_id: string
          reach: number
          saves: number
          shares: number
        }[]
      }
      analytics_overview_totals: {
        Args: { _since: string; _user_id: string }
        Returns: {
          clicks: number
          engaged: number
          impressions: number
          post_count: number
          reach: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_team_member_of: {
        Args: { _owner_id: string; _user_id: string }
        Returns: boolean
      }
      refresh_platform_rollup: {
        Args: { _days?: number; _user_id: string }
        Returns: number
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
