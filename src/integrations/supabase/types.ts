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
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      fee_schedule: {
        Row: {
          active: boolean
          amount: number
          code: string
          created_at: string
          currency: string
          description: string
          id: string
        }
        Insert: {
          active?: boolean
          amount: number
          code: string
          created_at?: string
          currency?: string
          description: string
          id?: string
        }
        Update: {
          active?: boolean
          amount?: number
          code?: string
          created_at?: string
          currency?: string
          description?: string
          id?: string
        }
        Relationships: []
      }
      foreign_documents: {
        Row: {
          created_at: string
          document_type: string | null
          horse_id: string
          id: string
          name: string
          url: string
        }
        Insert: {
          created_at?: string
          document_type?: string | null
          horse_id: string
          id?: string
          name: string
          url: string
        }
        Update: {
          created_at?: string
          document_type?: string | null
          horse_id?: string
          id?: string
          name?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "foreign_documents_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "horses"
            referencedColumns: ["id"]
          },
        ]
      }
      horse_photos: {
        Row: {
          caption: string | null
          created_at: string
          horse_id: string | null
          id: string
          photo_type: string | null
          registration_id: string | null
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          horse_id?: string | null
          id?: string
          photo_type?: string | null
          registration_id?: string | null
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          horse_id?: string | null
          id?: string
          photo_type?: string | null
          registration_id?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "horse_photos_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "horses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "horse_photos_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      horses: {
        Row: {
          birth_country: string | null
          breed: string | null
          breed_type: string | null
          certificate_url: string | null
          color: string | null
          created_at: string
          current_owner_id: string
          dam_id: string | null
          dam_name: string | null
          date_of_birth: string | null
          dna_status: string | null
          fts: unknown
          id: string
          markings_description: string | null
          markings_image_url: string | null
          microchip_number: string | null
          name: string
          registration_number: string | null
          sex: string | null
          sire_id: string | null
          sire_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          birth_country?: string | null
          breed?: string | null
          breed_type?: string | null
          certificate_url?: string | null
          color?: string | null
          created_at?: string
          current_owner_id: string
          dam_id?: string | null
          dam_name?: string | null
          date_of_birth?: string | null
          dna_status?: string | null
          fts?: unknown
          id?: string
          markings_description?: string | null
          markings_image_url?: string | null
          microchip_number?: string | null
          name: string
          registration_number?: string | null
          sex?: string | null
          sire_id?: string | null
          sire_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          birth_country?: string | null
          breed?: string | null
          breed_type?: string | null
          certificate_url?: string | null
          color?: string | null
          created_at?: string
          current_owner_id?: string
          dam_id?: string | null
          dam_name?: string | null
          date_of_birth?: string | null
          dna_status?: string | null
          fts?: unknown
          id?: string
          markings_description?: string | null
          markings_image_url?: string | null
          microchip_number?: string | null
          name?: string
          registration_number?: string | null
          sex?: string | null
          sire_id?: string | null
          sire_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          created_at: string
          email: string | null
          farm_name: string | null
          full_name: string | null
          ialha_member_id: string | null
          id: string
          membership_expires: string | null
          membership_type: string | null
          phone: string | null
          preferred_language: string
          role: string | null
          state: string | null
          updated_at: string
          user_id: string
          zip: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          farm_name?: string | null
          full_name?: string | null
          ialha_member_id?: string | null
          id?: string
          membership_expires?: string | null
          membership_type?: string | null
          phone?: string | null
          preferred_language?: string
          role?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          zip?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          farm_name?: string | null
          full_name?: string | null
          ialha_member_id?: string | null
          id?: string
          membership_expires?: string | null
          membership_type?: string | null
          phone?: string | null
          preferred_language?: string
          role?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          zip?: string | null
        }
        Relationships: []
      }
      registrations: {
        Row: {
          add_ons: Json
          ai_screening_notes: string | null
          ai_screening_result: Json | null
          ai_screening_score: number | null
          applicant_id: string
          birth_country: string | null
          birth_date: string | null
          breeder_contact: string | null
          breeder_name: string | null
          color: string | null
          created_at: string
          dam_id: string | null
          dam_name: string | null
          dna_case_number: string | null
          fee_breakdown: Json
          fee_total: number | null
          foreign_registration_number: string | null
          foreign_registry_name: string | null
          horse_id: string | null
          horse_name: string | null
          id: string
          markings_description: string | null
          microchip_number: string | null
          name_choice_1: string | null
          name_choice_2: string | null
          name_choice_3: string | null
          no_markings: boolean
          payment_status: string
          reviewer_notes: string | null
          sex: string | null
          sire_id: string | null
          sire_name: string | null
          stallion_owner_contact: string | null
          stallion_owner_name: string | null
          status: Database["public"]["Enums"]["registration_status"]
          submitted_at: string | null
          terms_accepted: boolean
          type: string | null
          updated_at: string
        }
        Insert: {
          add_ons?: Json
          ai_screening_notes?: string | null
          ai_screening_result?: Json | null
          ai_screening_score?: number | null
          applicant_id: string
          birth_country?: string | null
          birth_date?: string | null
          breeder_contact?: string | null
          breeder_name?: string | null
          color?: string | null
          created_at?: string
          dam_id?: string | null
          dam_name?: string | null
          dna_case_number?: string | null
          fee_breakdown?: Json
          fee_total?: number | null
          foreign_registration_number?: string | null
          foreign_registry_name?: string | null
          horse_id?: string | null
          horse_name?: string | null
          id?: string
          markings_description?: string | null
          microchip_number?: string | null
          name_choice_1?: string | null
          name_choice_2?: string | null
          name_choice_3?: string | null
          no_markings?: boolean
          payment_status?: string
          reviewer_notes?: string | null
          sex?: string | null
          sire_id?: string | null
          sire_name?: string | null
          stallion_owner_contact?: string | null
          stallion_owner_name?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          submitted_at?: string | null
          terms_accepted?: boolean
          type?: string | null
          updated_at?: string
        }
        Update: {
          add_ons?: Json
          ai_screening_notes?: string | null
          ai_screening_result?: Json | null
          ai_screening_score?: number | null
          applicant_id?: string
          birth_country?: string | null
          birth_date?: string | null
          breeder_contact?: string | null
          breeder_name?: string | null
          color?: string | null
          created_at?: string
          dam_id?: string | null
          dam_name?: string | null
          dna_case_number?: string | null
          fee_breakdown?: Json
          fee_total?: number | null
          foreign_registration_number?: string | null
          foreign_registry_name?: string | null
          horse_id?: string | null
          horse_name?: string | null
          id?: string
          markings_description?: string | null
          microchip_number?: string | null
          name_choice_1?: string | null
          name_choice_2?: string | null
          name_choice_3?: string | null
          no_markings?: boolean
          payment_status?: string
          reviewer_notes?: string | null
          sex?: string | null
          sire_id?: string | null
          sire_name?: string | null
          stallion_owner_contact?: string | null
          stallion_owner_name?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          submitted_at?: string | null
          terms_accepted?: boolean
          type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "horses"
            referencedColumns: ["id"]
          },
        ]
      }
      signatures: {
        Row: {
          created_at: string
          id: string
          registration_id: string
          role: string
          signed_at: string | null
          signer_email: string | null
          signer_name: string
          signer_user_id: string | null
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          registration_id: string
          role: string
          signed_at?: string | null
          signer_email?: string | null
          signer_name: string
          signer_user_id?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          registration_id?: string
          role?: string
          signed_at?: string | null
          signer_email?: string | null
          signer_name?: string
          signer_user_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "signatures_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      transfers: {
        Row: {
          buyer_address: string | null
          buyer_email: string | null
          buyer_phone: string | null
          created_at: string
          fee_amount: number | null
          fee_breakdown: Json
          from_owner_id: string | null
          from_owner_name: string | null
          horse_id: string
          id: string
          is_gelded_at_transfer: boolean
          notes: string | null
          payment_status: string
          sale_date: string | null
          status: string
          to_owner_id: string | null
          to_owner_name: string | null
          transfer_date: string
        }
        Insert: {
          buyer_address?: string | null
          buyer_email?: string | null
          buyer_phone?: string | null
          created_at?: string
          fee_amount?: number | null
          fee_breakdown?: Json
          from_owner_id?: string | null
          from_owner_name?: string | null
          horse_id: string
          id?: string
          is_gelded_at_transfer?: boolean
          notes?: string | null
          payment_status?: string
          sale_date?: string | null
          status?: string
          to_owner_id?: string | null
          to_owner_name?: string | null
          transfer_date?: string
        }
        Update: {
          buyer_address?: string | null
          buyer_email?: string | null
          buyer_phone?: string | null
          created_at?: string
          fee_amount?: number | null
          fee_breakdown?: Json
          from_owner_id?: string | null
          from_owner_name?: string | null
          horse_id?: string
          id?: string
          is_gelded_at_transfer?: boolean
          notes?: string | null
          payment_status?: string
          sale_date?: string | null
          status?: string
          to_owner_id?: string | null
          to_owner_name?: string | null
          transfer_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_horse_id_fkey"
            columns: ["horse_id"]
            isOneToOne: false
            referencedRelation: "horses"
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
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "member" | "staff" | "registrar" | "admin" | "board"
      registration_status:
        | "draft"
        | "pending_signatures"
        | "pending_payment"
        | "submitted"
        | "in_review"
        | "approved"
        | "rejected"
        | "needs_info"
        | "pending_board"
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
      app_role: ["member", "staff", "registrar", "admin", "board"],
      registration_status: [
        "draft",
        "pending_signatures",
        "pending_payment",
        "submitted",
        "in_review",
        "approved",
        "rejected",
        "needs_info",
        "pending_board",
      ],
    },
  },
} as const
