npm warn exec The following package was not found and will be installed: supabase@2.70.5
npm warn deprecated node-domexception@1.0.0: Use your platform's native DOMException instead
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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      access_grants: {
        Row: {
          created_at: string
          expires_at: string | null
          grantee_id: string
          grantor_id: string
          id: string
          metadata: Json | null
          permission: string
          reason: string | null
          resource_id: string
          resource_type: string
          revoked_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          grantee_id: string
          grantor_id: string
          id?: string
          metadata?: Json | null
          permission: string
          reason?: string | null
          resource_id: string
          resource_type: string
          revoked_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          grantee_id?: string
          grantor_id?: string
          id?: string
          metadata?: Json | null
          permission?: string
          reason?: string | null
          resource_id?: string
          resource_type?: string
          revoked_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      action_checklist: {
        Row: {
          client_id: string
          completed: boolean
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          practitioner_id: string
          priority: number
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          practitioner_id: string
          priority?: number
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          completed?: boolean
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          practitioner_id?: string
          priority?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      action_recommendations: {
        Row: {
          action_type: string
          client_id: string
          completed: boolean
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          frequency: string | null
          id: string
          practitioner_id: string
          session_id: string
          title: string
          updated_at: string
        }
        Insert: {
          action_type: string
          client_id: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          frequency?: string | null
          id?: string
          practitioner_id: string
          session_id: string
          title: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          client_id?: string
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          frequency?: string | null
          id?: string
          practitioner_id?: string
          session_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_recommendations_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_recommendations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      data_retention_policies: {
        Row: {
          auto_delete: boolean
          created_at: string
          description: string | null
          id: string
          retention_days: number
          table_name: string
          updated_at: string
        }
        Insert: {
          auto_delete?: boolean
          created_at?: string
          description?: string | null
          id?: string
          retention_days: number
          table_name: string
          updated_at?: string
        }
        Update: {
          auto_delete?: boolean
          created_at?: string
          description?: string | null
          id?: string
          retention_days?: number
          table_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      liability_waivers: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          session_id: string | null
          signed_at: string
          user_agent: string | null
          user_id: string
          waiver_text: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          session_id?: string | null
          signed_at?: string
          user_agent?: string | null
          user_id: string
          waiver_text: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          session_id?: string | null
          signed_at?: string
          user_agent?: string | null
          user_id?: string
          waiver_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "liability_waivers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      meditation_memories: {
        Row: {
          content: string
          created_at: string
          embedding: string | null
          id: string
          memory_type: string | null
          metadata: Json | null
          session_date: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          embedding?: string | null
          id?: string
          memory_type?: string | null
          metadata?: Json | null
          session_date?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          embedding?: string | null
          id?: string
          memory_type?: string | null
          metadata?: Json | null
          session_date?: string | null
          user_id?: string
        }
        Relationships: []
      }
      practitioner_assignments: {
        Row: {
          client_id: string
          created_at: string
          id: string
          practitioner_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          practitioner_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          practitioner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_assignments_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioner_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          practitioner_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          practitioner_id: string
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          practitioner_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_availability_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioner_banking: {
        Row: {
          account_holder_name: string
          account_number_encrypted: string
          account_type: string
          bank_name: string
          country: string
          created_at: string
          id: string
          practitioner_id: string
          routing_number_encrypted: string
          updated_at: string
          verified: boolean
          verified_at: string | null
        }
        Insert: {
          account_holder_name: string
          account_number_encrypted: string
          account_type: string
          bank_name: string
          country?: string
          created_at?: string
          id?: string
          practitioner_id: string
          routing_number_encrypted: string
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
        }
        Update: {
          account_holder_name?: string
          account_number_encrypted?: string
          account_type?: string
          bank_name?: string
          country?: string
          created_at?: string
          id?: string
          practitioner_id?: string
          routing_number_encrypted?: string
          updated_at?: string
          verified?: boolean
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_banking_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: true
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioner_contracts: {
        Row: {
          contract_text: string
          contract_version: string
          created_at: string
          expires_at: string | null
          id: string
          ip_address: string | null
          practitioner_id: string
          signed_at: string | null
          status: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          contract_text: string
          contract_version: string
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          practitioner_id: string
          signed_at?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          contract_text?: string
          contract_version?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          ip_address?: string | null
          practitioner_id?: string
          signed_at?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "practitioner_contracts_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      practitioners: {
        Row: {
          available: boolean
          avatar_url: string | null
          bio: string | null
          created_at: string
          half_hour_rate: number | null
          id: string
          name: string
          specialization: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          available?: boolean
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          half_hour_rate?: number | null
          id?: string
          name: string
          specialization?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          available?: boolean
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          half_hour_rate?: number | null
          id?: string
          name?: string
          specialization?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          inventory_count: number | null
          is_active: boolean
          metadata: Json | null
          name: string
          price_cad: number
          price_usd: number
          slug: string
          stripe_price_id_cad: string | null
          stripe_price_id_usd: string | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          inventory_count?: number | null
          is_active?: boolean
          metadata?: Json | null
          name: string
          price_cad: number
          price_usd: number
          slug: string
          stripe_price_id_cad?: string | null
          stripe_price_id_usd?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          inventory_count?: number | null
          is_active?: boolean
          metadata?: Json | null
          name?: string
          price_cad?: number
          price_usd?: number
          slug?: string
          stripe_price_id_cad?: string | null
          stripe_price_id_usd?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      session_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          session_id: string
          updated_at: string
          visibility: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          session_id: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          session_id?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_notes_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      session_packages: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_group: boolean | null
          name: string
          price_cad: number
          price_usd: number
          session_count: number
          session_type: string | null
          session_type_id: string | null
          stripe_price_id_cad: string | null
          stripe_price_id_usd: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_group?: boolean | null
          name: string
          price_cad: number
          price_usd: number
          session_count: number
          session_type?: string | null
          session_type_id?: string | null
          stripe_price_id_cad?: string | null
          stripe_price_id_usd?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_group?: boolean | null
          name?: string
          price_cad?: number
          price_usd?: number
          session_count?: number
          session_type?: string | null
          session_type_id?: string | null
          stripe_price_id_cad?: string | null
          stripe_price_id_usd?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_packages_session_type_id_fkey"
            columns: ["session_type_id"]
            isOneToOne: false
            referencedRelation: "session_types"
            referencedColumns: ["id"]
          },
        ]
      }
      session_payments: {
        Row: {
          client_id: string
          created_at: string
          currency: string
          id: string
          paid_out_at: string | null
          platform_share: number
          practitioner_id: string
          practitioner_share: number
          session_id: string
          status: string
          stripe_payment_intent_id: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          currency?: string
          id?: string
          paid_out_at?: string | null
          platform_share: number
          practitioner_id: string
          practitioner_share: number
          session_id: string
          status?: string
          stripe_payment_intent_id?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          currency?: string
          id?: string
          paid_out_at?: string | null
          platform_share?: number
          practitioner_id?: string
          practitioner_share?: number
          session_id?: string
          status?: string
          stripe_payment_intent_id?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_payments_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      session_recordings: {
        Row: {
          agora_resource_id: string | null
          agora_sid: string | null
          completed_at: string | null
          created_at: string
          duration_seconds: number | null
          file_size_bytes: number | null
          id: string
          recording_url: string | null
          session_id: string
          started_at: string | null
          status: string
          storage_path: string | null
          updated_at: string
        }
        Insert: {
          agora_resource_id?: string | null
          agora_sid?: string | null
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          recording_url?: string | null
          session_id: string
          started_at?: string | null
          status?: string
          storage_path?: string | null
          updated_at?: string
        }
        Update: {
          agora_resource_id?: string | null
          agora_sid?: string | null
          completed_at?: string | null
          created_at?: string
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          recording_url?: string | null
          session_id?: string
          started_at?: string | null
          status?: string
          storage_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_recordings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "session_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      session_schedules: {
        Row: {
          client_id: string
          correlated_session_id: string | null
          created_at: string
          current_participants: number | null
          duration_minutes: number
          host_room_url: string | null
          id: string
          location_coordinates: unknown
          max_participants: number | null
          notes: string | null
          physical_location: string | null
          practitioner_id: string
          room_name: string
          scheduled_at: string
          session_location: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          correlated_session_id?: string | null
          created_at?: string
          current_participants?: number | null
          duration_minutes?: number
          host_room_url?: string | null
          id?: string
          location_coordinates?: unknown
          max_participants?: number | null
          notes?: string | null
          physical_location?: string | null
          practitioner_id: string
          room_name: string
          scheduled_at: string
          session_location?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          correlated_session_id?: string | null
          created_at?: string
          current_participants?: number | null
          duration_minutes?: number
          host_room_url?: string | null
          id?: string
          location_coordinates?: unknown
          max_participants?: number | null
          notes?: string | null
          physical_location?: string | null
          practitioner_id?: string
          room_name?: string
          scheduled_at?: string
          session_location?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_schedules_correlated_session_id_fkey"
            columns: ["correlated_session_id"]
            isOneToOne: false
            referencedRelation: "session_schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_schedules_practitioner_id_fkey"
            columns: ["practitioner_id"]
            isOneToOne: false
            referencedRelation: "practitioners"
            referencedColumns: ["id"]
          },
        ]
      }
      session_types: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          is_active: boolean
          is_group: boolean
          name: string
          price_cad: number
          price_usd: number
          session_type: string
          stripe_price_id_cad: string | null
          stripe_price_id_usd: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes: number
          id?: string
          is_active?: boolean
          is_group?: boolean
          name: string
          price_cad: number
          price_usd: number
          session_type: string
          stripe_price_id_cad?: string | null
          stripe_price_id_usd?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          is_group?: boolean
          name?: string
          price_cad?: number
          price_usd?: number
          session_type?: string
          stripe_price_id_cad?: string | null
          stripe_price_id_usd?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      settings: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          consent_date: string
          consent_type: string
          consented: boolean
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          revoked_at: string | null
          revoked_ip_address: string | null
          updated_at: string
          user_agent: string | null
          user_id: string
          version: string | null
        }
        Insert: {
          consent_date?: string
          consent_type: string
          consented?: boolean
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          revoked_at?: string | null
          revoked_ip_address?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id: string
          version?: string | null
        }
        Update: {
          consent_date?: string
          consent_type?: string
          consented?: boolean
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          revoked_at?: string | null
          revoked_ip_address?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string
          version?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          country: string | null
          created_at: string
          currency: string | null
          detected_at: string | null
          id: string
          language: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          currency?: string | null
          detected_at?: string | null
          id?: string
          language?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          country?: string | null
          created_at?: string
          currency?: string | null
          detected_at?: string | null
          id?: string
          language?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
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
      user_session_credits: {
        Row: {
          created_at: string
          credits_remaining: number
          expires_at: string | null
          id: string
          metadata: Json | null
          order_id: string | null
          package_id: string | null
          purchased_at: string
          session_type_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_remaining?: number
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          package_id?: string | null
          purchased_at?: string
          session_type_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_remaining?: number
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string | null
          package_id?: string | null
          purchased_at?: string
          session_type_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_session_credits_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "session_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_session_credits_session_type_id_fkey"
            columns: ["session_type_id"]
            isOneToOne: false
            referencedRelation: "session_types"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_location: string
          display_order: number
          duration: string | null
          icon_color: string | null
          icon_name: string | null
          id: string
          is_active: boolean
          thumbnail_url: string | null
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          display_location?: string
          display_order?: number
          duration?: string | null
          icon_color?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          video_url: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_location?: string
          display_order?: number
          duration?: string | null
          icon_color?: string | null
          icon_name?: string | null
          id?: string
          is_active?: boolean
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_admin_role: { Args: { p_user_email: string }; Returns: Json }
      assign_admin_role_by_id: { Args: { p_user_id: string }; Returns: Json }
      can_access_session: {
        Args: { p_session_id: string; p_user_id: string }
        Returns: boolean
      }
      create_practitioner_from_email: {
        Args: {
          p_avatar_url?: string
          p_bio?: string
          p_email: string
          p_half_hour_rate?: number
          p_name: string
          p_specialization?: string
        }
        Returns: string
      }
      decrypt_banking_info: {
        Args: {
          p_encrypted_account_number: string
          p_encrypted_routing_number: string
          p_encryption_key: string
        }
        Returns: {
          account_number: string
          routing_number: string
        }[]
      }
      encrypt_banking_info: {
        Args: {
          p_account_number: string
          p_encryption_key: string
          p_routing_number: string
        }
        Returns: {
          encrypted_account_number: string
          encrypted_routing_number: string
        }[]
      }
      get_client_ip: { Args: never; Returns: string }
      get_current_user_id: { Args: never; Returns: string }
      get_expired_records: {
        Args: { p_table_name: string }
        Returns: {
          created_at: string
          record_id: string
        }[]
      }
      get_retention_policy: {
        Args: { p_table_name: string }
        Returns: {
          auto_delete: boolean
          retention_days: number
        }[]
      }
      get_user_credits: {
        Args: { p_user_id: string }
        Returns: {
          package_credits: number
          single_credits: number
          total_credits: number
        }[]
      }
      get_user_id_by_email: { Args: { email_input: string }; Returns: string }
      has_access: {
        Args: {
          p_permission: string
          p_resource_id: string
          p_resource_type: string
          p_user_id: string
        }
        Returns: boolean
      }
      has_consent: {
        Args: { p_consent_type: string; p_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_practitioner_of: {
        Args: { _client_id: string; _practitioner_id: string }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          p_action: string
          p_ip_address?: string
          p_metadata?: Json
          p_record_id?: string
          p_table_name: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: undefined
      }
      match_memories: {
        Args: {
          match_count?: number
          match_threshold?: number
          match_user_id: string
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          memory_type: string
          metadata: Json
          similarity: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "practitioner" | "user"
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
      app_role: ["admin", "practitioner", "user"],
    },
  },
} as const
npm notice
npm notice New major version of npm available! 10.8.2 -> 11.7.0
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.7.0
npm notice To update run: npm install -g npm@11.7.0
npm notice
