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
          horse_id: string
          id: string
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          horse_id: string
          id?: string
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          horse_id?: string
          id?: string
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
          farm_name: string | null
          full_name: string | null
          id: string
          phone: string | null
          preferred_language: string
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
          farm_name?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string
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
          farm_name?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string
          state?: string | null
          updated_at?: string
          user_id?: string
          zip?: string | null
        }
        Relationships: []
      }
      registrations: {
        Row: {
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
          foreign_registration_number: string | null
          foreign_registry_name: string | null
          horse_id: string | null
          horse_name: string | null
          id: string
          microchip_number: string | null
          name_choice_1: string | null
          name_choice_2: string | null
          name_choice_3: string | null
          sex: string | null
          sire_id: string | null
          sire_name: string | null
          stallion_owner_contact: string | null
          stallion_owner_name: string | null
          status: Database["public"]["Enums"]["registration_status"]
          submitted_at: string | null
          type: string | null
          updated_at: string
        }
        Insert: {
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
          foreign_registration_number?: string | null
          foreign_registry_name?: string | null
          horse_id?: string | null
          horse_name?: string | null
          id?: string
          microchip_number?: string | null
          name_choice_1?: string | null
          name_choice_2?: string | null
          name_choice_3?: string | null
          sex?: string | null
          sire_id?: string | null
          sire_name?: string | null
          stallion_owner_contact?: string | null
          stallion_owner_name?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          submitted_at?: string | null
          type?: string | null
          updated_at?: string
        }
        Update: {
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
          foreign_registration_number?: string | null
          foreign_registry_name?: string | null
          horse_id?: string | null
          horse_name?: string | null
          id?: string
          microchip_number?: string | null
          name_choice_1?: string | null
          name_choice_2?: string | null
          name_choice_3?: string | null
          sex?: string | null
          sire_id?: string | null
          sire_name?: string | null
          stallion_owner_contact?: string | null
          stallion_owner_name?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          submitted_at?: string | null
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
      transfers: {
        Row: {
          created_at: string
          from_owner_id: string | null
          from_owner_name: string | null
          horse_id: string
          id: string
          notes: string | null
          to_owner_id: string
          to_owner_name: string | null
          transfer_date: string
        }
        Insert: {
          created_at?: string
          from_owner_id?: string | null
          from_owner_name?: string | null
          horse_id: string
          id?: string
          notes?: string | null
          to_owner_id: string
          to_owner_name?: string | null
          transfer_date?: string
        }
        Update: {
          created_at?: string
          from_owner_id?: string | null
          from_owner_name?: string | null
          horse_id?: string
          id?: string
          notes?: string | null
          to_owner_id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      registration_status:
        | "draft"
        | "pending_signatures"
        | "pending_payment"
        | "submitted"
        | "in_review"
        | "approved"
        | "rejected"
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
      registration_status: [
        "draft",
        "pending_signatures",
        "pending_payment",
        "submitted",
        "in_review",
        "approved",
        "rejected",
      ],
    },
  },
} as const
