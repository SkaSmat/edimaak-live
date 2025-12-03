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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      matches: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          shipment_request_id: string
          status: string
          trip_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          shipment_request_id: string
          status?: string
          trip_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          shipment_request_id?: string
          status?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_shipment_request_id_fkey"
            columns: ["shipment_request_id"]
            isOneToOne: false
            referencedRelation: "shipment_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          match_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          match_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          match_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      private_info: {
        Row: {
          address_city: string | null
          address_country: string | null
          address_line1: string | null
          address_postal_code: string | null
          created_at: string | null
          id: string
          id_expiry_date: string | null
          id_number: string | null
          id_type: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          address_city?: string | null
          address_country?: string | null
          address_line1?: string | null
          address_postal_code?: string | null
          created_at?: string | null
          id: string
          id_expiry_date?: string | null
          id_number?: string | null
          id_type?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          address_city?: string | null
          address_country?: string | null
          address_line1?: string | null
          address_postal_code?: string | null
          created_at?: string | null
          id?: string
          id_expiry_date?: string | null
          id_number?: string | null
          id_type?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "private_info_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_info_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country_of_residence: string | null
          created_at: string
          first_name: string | null
          full_name: string
          id: string
          is_active: boolean | null
          last_name: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          avatar_url?: string | null
          country_of_residence?: string | null
          created_at?: string
          first_name?: string | null
          full_name: string
          id: string
          is_active?: boolean | null
          last_name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          avatar_url?: string | null
          country_of_residence?: string | null
          created_at?: string
          first_name?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      shipment_requests: {
        Row: {
          created_at: string
          earliest_date: string
          from_city: string
          from_country: string
          id: string
          image_url: string | null
          item_type: string
          latest_date: string
          notes: string | null
          sender_id: string
          status: string
          to_city: string
          to_country: string
          view_count: number
          weight_kg: number
        }
        Insert: {
          created_at?: string
          earliest_date: string
          from_city: string
          from_country: string
          id?: string
          image_url?: string | null
          item_type: string
          latest_date: string
          notes?: string | null
          sender_id: string
          status?: string
          to_city: string
          to_country: string
          view_count?: number
          weight_kg: number
        }
        Update: {
          created_at?: string
          earliest_date?: string
          from_city?: string
          from_country?: string
          id?: string
          image_url?: string | null
          item_type?: string
          latest_date?: string
          notes?: string | null
          sender_id?: string
          status?: string
          to_city?: string
          to_country?: string
          view_count?: number
          weight_kg?: number
        }
        Relationships: [
          {
            foreignKeyName: "shipment_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_requests_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          arrival_date: string | null
          created_at: string
          departure_date: string
          from_city: string
          from_country: string
          id: string
          max_weight_kg: number
          notes: string | null
          status: string
          to_city: string
          to_country: string
          traveler_id: string
        }
        Insert: {
          arrival_date?: string | null
          created_at?: string
          departure_date: string
          from_city: string
          from_country: string
          id?: string
          max_weight_kg: number
          notes?: string | null
          status?: string
          to_city: string
          to_country: string
          traveler_id: string
        }
        Update: {
          arrival_date?: string | null
          created_at?: string
          departure_date?: string
          from_city?: string
          from_country?: string
          id?: string
          max_weight_kg?: number
          notes?: string | null
          status?: string
          to_city?: string
          to_country?: string
          traveler_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      public_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          display_first_name: string | null
          id: string | null
          role: Database["public"]["Enums"]["app_role"] | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          display_first_name?: never
          id?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          display_first_name?: never
          id?: string | null
          role?: Database["public"]["Enums"]["app_role"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_sender_display_info: {
        Args: { sender_uuid: string }
        Returns: {
          avatar_url: string
          display_name: string
          id: string
        }[]
      }
      has_match_with_user: { Args: { _profile_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_shipment_view_count: {
        Args: { shipment_id: string }
        Returns: undefined
      }
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "traveler" | "sender" | "admin"
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
      app_role: ["traveler", "sender", "admin"],
    },
  },
} as const
