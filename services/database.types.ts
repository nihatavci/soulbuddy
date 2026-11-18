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
    PostgrestVersion: "14.17"
  }
  resense: {
    Tables: {
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id?: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          reply_to_id: string | null
          sender_id: string
          space_id: string
          text: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          reply_to_id?: string | null
          sender_id?: string
          space_id: string
          text: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          reply_to_id?: string | null
          sender_id?: string
          space_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "space_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      private_spaces: {
        Row: {
          created_at: string
          id: string
          pair_key: string | null
          signal_id: string | null
          user_a: string
          user_b: string
        }
        Insert: {
          created_at?: string
          id?: string
          pair_key?: string | null
          signal_id?: string | null
          user_a: string
          user_b: string
        }
        Update: {
          created_at?: string
          id?: string
          pair_key?: string | null
          signal_id?: string | null
          user_a?: string
          user_b?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_spaces_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "public_signals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_spaces_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_confirmed_at: string | null
          alias: string
          boundaries: string[]
          created_at: string
          intent: string[]
          onboarded: boolean
          trust_level: number
          updated_at: string
          user_id: string
        }
        Insert: {
          age_confirmed_at?: string | null
          alias: string
          boundaries?: string[]
          created_at?: string
          intent?: string[]
          onboarded?: boolean
          trust_level?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          age_confirmed_at?: string | null
          alias?: string
          boundaries?: string[]
          created_at?: string
          intent?: string[]
          onboarded?: boolean
          trust_level?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      push_tokens: {
        Row: {
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          platform?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      replies: {
        Row: {
          author_id: string
          created_at: string
          id: string
          moderation_state: string
          signal_id: string
          text: string
        }
        Insert: {
          author_id?: string
          created_at?: string
          id?: string
          moderation_state?: string
          signal_id: string
          text: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          moderation_state?: string
          signal_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "replies_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "public_signals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "replies_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          author_id: string
          created_at: string
          expires_at: string | null
          format: string
          id: string
          moderation_state: string
          text: string
        }
        Insert: {
          author_id?: string
          created_at?: string
          expires_at?: string | null
          format: string
          id?: string
          moderation_state?: string
          text: string
        }
        Update: {
          author_id?: string
          created_at?: string
          expires_at?: string | null
          format?: string
          id?: string
          moderation_state?: string
          text?: string
        }
        Relationships: []
      }
      space_events: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          kind: string
          space_id: string
        }
        Insert: {
          actor_id?: string
          created_at?: string
          id?: string
          kind: string
          space_id: string
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          kind?: string
          space_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_events_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_events_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "space_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      space_reveals: {
        Row: {
          age_verified: boolean
          created_at: string
          first_name: string | null
          space_id: string
          user_id: string
        }
        Insert: {
          age_verified?: boolean
          created_at?: string
          first_name?: string | null
          space_id: string
          user_id?: string
        }
        Update: {
          age_verified?: boolean
          created_at?: string
          first_name?: string | null
          space_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "space_reveals_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "private_spaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "space_reveals_space_id_fkey"
            columns: ["space_id"]
            isOneToOne: false
            referencedRelation: "space_overview"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_profiles: {
        Row: {
          alias: string | null
          boundaries: string[] | null
          intent: string[] | null
          user_id: string | null
        }
        Insert: {
          alias?: string | null
          boundaries?: string[] | null
          intent?: string[] | null
          user_id?: string | null
        }
        Update: {
          alias?: string | null
          boundaries?: string[] | null
          intent?: string[] | null
          user_id?: string | null
        }
        Relationships: []
      }
      public_signals: {
        Row: {
          alias: string | null
          author_id: string | null
          created_at: string | null
          format: string | null
          id: string | null
          reply_count: number | null
          text: string | null
        }
        Relationships: []
      }
      space_overview: {
        Row: {
          alias_a: string | null
          alias_b: string | null
          created_at: string | null
          id: string | null
          last_message: string | null
          last_message_at: string | null
          last_message_sender_id: string | null
          signal_id: string | null
          signal_text: string | null
          user_a: string | null
          user_b: string | null
        }
        Relationships: [
          {
            foreignKeyName: "private_spaces_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "public_signals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_spaces_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      claim_push_token: {
        Args: { p_platform?: string; p_token: string }
        Returns: undefined
      }
      delete_my_account: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      submit_report: {
        Args: { p_note?: string; p_reason: string; p_signal_id?: string; p_space_id?: string }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "resense">]

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
  resense: {
    Enums: {},
  },
} as const
