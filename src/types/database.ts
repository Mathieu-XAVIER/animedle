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
      admin_import_logs: {
        Row: {
          anime_slug: string
          created_at: string | null
          errors: Json | null
          id: string
          imported: number
          skipped: number
          status: string
        }
        Insert: {
          anime_slug: string
          created_at?: string | null
          errors?: Json | null
          id?: string
          imported?: number
          skipped?: number
          status?: string
        }
        Update: {
          anime_slug?: string
          created_at?: string | null
          errors?: Json | null
          id?: string
          imported?: number
          skipped?: number
          status?: string
        }
        Relationships: []
      }
      animes: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          short_title: string | null
          slug: string
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          short_title?: string | null
          slug: string
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          short_title?: string | null
          slug?: string
          title?: string
        }
        Relationships: []
      }
      character_aliases: {
        Row: {
          alias: string
          character_id: string
          id: string
          normalized_alias: string
        }
        Insert: {
          alias: string
          character_id: string
          id?: string
          normalized_alias: string
        }
        Update: {
          alias?: string
          character_id?: string
          id?: string
          normalized_alias?: string
        }
        Relationships: [
          {
            foreignKeyName: "character_aliases_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      character_images: {
        Row: {
          character_id: string
          created_at: string | null
          id: string
          image_type: string
          image_url: string
          is_active: boolean | null
        }
        Insert: {
          character_id: string
          created_at?: string | null
          id?: string
          image_type?: string
          image_url: string
          is_active?: boolean | null
        }
        Update: {
          character_id?: string
          created_at?: string | null
          id?: string
          image_type?: string
          image_url?: string
          is_active?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "character_images_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      characters: {
        Row: {
          anime_id: string
          created_at: string | null
          description_short: string | null
          difficulty: Database["public"]["Enums"]["difficulty_enum"] | null
          display_name: string
          faction: string | null
          gender: string | null
          id: string
          is_active: boolean | null
          name: string
          popularity_rank: number | null
          power_type: string | null
          quote_ready: boolean | null
          role_type: Database["public"]["Enums"]["role_type_enum"] | null
          silhouette_ready: boolean | null
          slug: string
          source_external_id: string | null
          weapon_type: string | null
          status: string | null
          species: string | null
          age_range: string | null
        }
        Insert: {
          anime_id: string
          created_at?: string | null
          description_short?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_enum"] | null
          display_name: string
          faction?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          popularity_rank?: number | null
          power_type?: string | null
          quote_ready?: boolean | null
          role_type?: Database["public"]["Enums"]["role_type_enum"] | null
          silhouette_ready?: boolean | null
          slug: string
          source_external_id?: string | null
          weapon_type?: string | null
          status?: string | null
          species?: string | null
          age_range?: string | null
        }
        Update: {
          anime_id?: string
          created_at?: string | null
          description_short?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_enum"] | null
          display_name?: string
          faction?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          popularity_rank?: number | null
          power_type?: string | null
          quote_ready?: boolean | null
          role_type?: Database["public"]["Enums"]["role_type_enum"] | null
          silhouette_ready?: boolean | null
          slug?: string
          source_external_id?: string | null
          weapon_type?: string | null
          status?: string | null
          species?: string | null
          age_range?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "characters_anime_id_fkey"
            columns: ["anime_id"]
            isOneToOne: false
            referencedRelation: "animes"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_challenges: {
        Row: {
          challenge_date: string
          character_id: string
          created_at: string | null
          game_mode: Database["public"]["Enums"]["game_mode_enum"]
          id: string
          quote_id: string | null
        }
        Insert: {
          challenge_date: string
          character_id: string
          created_at?: string | null
          game_mode: Database["public"]["Enums"]["game_mode_enum"]
          id?: string
          quote_id?: string | null
        }
        Update: {
          challenge_date?: string
          character_id?: string
          created_at?: string | null
          game_mode?: Database["public"]["Enums"]["game_mode_enum"]
          id?: string
          quote_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_challenges_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_challenges_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          attempts: number
          challenge_id: string | null
          game_mode: Database["public"]["Enums"]["game_mode_enum"]
          id: string
          is_won: boolean
          played_at: string | null
          session_id: string
        }
        Insert: {
          attempts?: number
          challenge_id?: string | null
          game_mode: Database["public"]["Enums"]["game_mode_enum"]
          id?: string
          is_won?: boolean
          played_at?: string | null
          session_id: string
        }
        Update: {
          attempts?: number
          challenge_id?: string | null
          game_mode?: Database["public"]["Enums"]["game_mode_enum"]
          id?: string
          is_won?: boolean
          played_at?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          character_id: string
          created_at: string | null
          difficulty: Database["public"]["Enums"]["difficulty_enum"] | null
          id: string
          is_active: boolean | null
          is_spoiler: boolean | null
          language: string
          quote_text: string
        }
        Insert: {
          character_id: string
          created_at?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_enum"] | null
          id?: string
          is_active?: boolean | null
          is_spoiler?: boolean | null
          language?: string
          quote_text: string
        }
        Update: {
          character_id?: string
          created_at?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_enum"] | null
          id?: string
          is_active?: boolean | null
          is_spoiler?: boolean | null
          language?: string
          quote_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_character_id_fkey"
            columns: ["character_id"]
            isOneToOne: false
            referencedRelation: "characters"
            referencedColumns: ["id"]
          },
        ]
      }
      staging_characters: {
        Row: {
          anime_slug: string
          external_id: number
          favorites: number | null
          id: string
          image_url: string | null
          imported_at: string | null
          name: string | null
          name_kanji: string | null
          raw_json: Json | null
          role_source: string | null
          validated_at: string | null
          validation_status:
            | Database["public"]["Enums"]["validation_status_enum"]
            | null
        }
        Insert: {
          anime_slug: string
          external_id: number
          favorites?: number | null
          id?: string
          image_url?: string | null
          imported_at?: string | null
          name?: string | null
          name_kanji?: string | null
          raw_json?: Json | null
          role_source?: string | null
          validated_at?: string | null
          validation_status?:
            | Database["public"]["Enums"]["validation_status_enum"]
            | null
        }
        Update: {
          anime_slug?: string
          external_id?: number
          favorites?: number | null
          id?: string
          image_url?: string | null
          imported_at?: string | null
          name?: string | null
          name_kanji?: string | null
          raw_json?: Json | null
          role_source?: string | null
          validated_at?: string | null
          validation_status?:
            | Database["public"]["Enums"]["validation_status_enum"]
            | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      difficulty_enum: "easy" | "medium" | "hard"
      game_mode_enum: "classique" | "citation" | "silhouette"
      role_type_enum: "main" | "supporting" | "antagonist" | "minor"
      validation_status_enum: "pending" | "approved" | "rejected"
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
      difficulty_enum: ["easy", "medium", "hard"],
      game_mode_enum: ["classique", "citation", "silhouette"],
      role_type_enum: ["main", "supporting", "antagonist", "minor"],
      validation_status_enum: ["pending", "approved", "rejected"],
    },
  },
} as const
