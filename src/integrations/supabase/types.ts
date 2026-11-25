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
    PostgrestVersion: "17.1"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      meter_secrets: {
        Row: {
          device_key: string
          meter_id: string
        }
        Insert: {
          device_key: string
          meter_id: string
        }
        Update: {
          device_key?: string
          meter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meter_secrets_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: true
            referencedRelation: "meters"
            referencedColumns: ["meter_id"]
          },
        ]
      }
      meters: {
        Row: {
          billing_type: string
          consumer_name: string | null
          context_mode: string
          last_current_a: number
          last_power_w: number
          last_seen_at: string | null
          meter_id: string
          nominal_grid_v: number
          pending_queue_count: number
          per_unit_rate: number
          postpaid_due: number
          postpaid_units: number
          prepaid_balance: number
          reed_tamper_state: number
          relay_state: number
          scale_factor: number
          sync_status: string
          tamper_status: string
          updated_at: string
        }
        Insert: {
          billing_type?: string
          consumer_name?: string | null
          context_mode?: string
          last_current_a?: number
          last_power_w?: number
          last_seen_at?: string | null
          meter_id: string
          nominal_grid_v?: number
          pending_queue_count?: number
          per_unit_rate?: number
          postpaid_due?: number
          postpaid_units?: number
          prepaid_balance?: number
          reed_tamper_state?: number
          relay_state?: number
          scale_factor?: number
          sync_status?: string
          tamper_status?: string
          updated_at?: string
        }
        Update: {
          billing_type?: string
          consumer_name?: string | null
          context_mode?: string
          last_current_a?: number
          last_power_w?: number
          last_seen_at?: string | null
          meter_id?: string
          nominal_grid_v?: number
          pending_queue_count?: number
          per_unit_rate?: number
          postpaid_due?: number
          postpaid_units?: number
          prepaid_balance?: number
          reed_tamper_state?: number
          relay_state?: number
          scale_factor?: number
          sync_status?: string
          tamper_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          agent_id: string | null
          created_at: string
          display_name: string | null
          id: string
          meter_id: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          meter_id?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          meter_id?: string | null
        }
        Relationships: []
      }
      sync_batches: {
        Row: {
          batch_id: string
          events_deduplicated: number
          events_inserted: number
          events_received: number
          meter_id: string | null
          queued_remaining_on_device: number
          source: string
          synced_at: string
        }
        Insert: {
          batch_id: string
          events_deduplicated: number
          events_inserted: number
          events_received: number
          meter_id?: string | null
          queued_remaining_on_device?: number
          source?: string
          synced_at?: string
        }
        Update: {
          batch_id?: string
          events_deduplicated?: number
          events_inserted?: number
          events_received?: number
          meter_id?: string | null
          queued_remaining_on_device?: number
          source?: string
          synced_at?: string
        }
        Relationships: []
      }
      tamper_events: {
        Row: {
          anomaly_score: number | null
          detected_at: string
          event_id: string
          id: number
          meter_id: string
          reed_state: number
          relay_action: string
          resolved: boolean
          scaled_current_a: number | null
          synced_at: string
          tamper_type: string
        }
        Insert: {
          anomaly_score?: number | null
          detected_at: string
          event_id: string
          id?: number
          meter_id: string
          reed_state?: number
          relay_action?: string
          resolved?: boolean
          scaled_current_a?: number | null
          synced_at?: string
          tamper_type: string
        }
        Update: {
          anomaly_score?: number | null
          detected_at?: string
          event_id?: string
          id?: number
          meter_id?: string
          reed_state?: number
          relay_action?: string
          resolved?: boolean
          scaled_current_a?: number | null
          synced_at?: string
          tamper_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "tamper_events_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "meters"
            referencedColumns: ["meter_id"]
          },
        ]
      }
      telemetry_logs: {
        Row: {
          anomaly_score: number | null
          event_id: string
          hour_cos: number | null
          hour_sin: number | null
          id: number
          ingested_at: string
          is_synthetic: boolean
          meter_id: string
          predicted_next_power_w: number | null
          raw_bus_v: number | null
          raw_current_ma: number | null
          raw_power_mw: number | null
          recorded_at: string
          reed_tamper_state: number
          relay_state: number
          rolling_delta_a: number | null
          rolling_mean_a: number | null
          scaled_current_a: number
          scaled_power_w: number
        }
        Insert: {
          anomaly_score?: number | null
          event_id: string
          hour_cos?: number | null
          hour_sin?: number | null
          id?: number
          ingested_at?: string
          is_synthetic?: boolean
          meter_id: string
          predicted_next_power_w?: number | null
          raw_bus_v?: number | null
          raw_current_ma?: number | null
          raw_power_mw?: number | null
          recorded_at: string
          reed_tamper_state?: number
          relay_state?: number
          rolling_delta_a?: number | null
          rolling_mean_a?: number | null
          scaled_current_a: number
          scaled_power_w: number
        }
        Update: {
          anomaly_score?: number | null
          event_id?: string
          hour_cos?: number | null
          hour_sin?: number | null
          id?: number
          ingested_at?: string
          is_synthetic?: boolean
          meter_id?: string
          predicted_next_power_w?: number | null
          raw_bus_v?: number | null
          raw_current_ma?: number | null
          raw_power_mw?: number | null
          recorded_at?: string
          reed_tamper_state?: number
          relay_state?: number
          rolling_delta_a?: number | null
          rolling_mean_a?: number | null
          scaled_current_a?: number
          scaled_power_w?: number
        }
        Relationships: [
          {
            foreignKeyName: "telemetry_logs_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "meters"
            referencedColumns: ["meter_id"]
          },
        ]
      }
      transactions: {
        Row: {
          agent_id: string | null
          amount: number
          balance_after: number | null
          billing_type: string
          card_uid: string | null
          collection_mode: string
          event_id: string
          id: number
          meter_id: string
          occurred_at: string
          synced_at: string
          tx_type: string
          units_delta: number
        }
        Insert: {
          agent_id?: string | null
          amount: number
          balance_after?: number | null
          billing_type: string
          card_uid?: string | null
          collection_mode?: string
          event_id: string
          id?: number
          meter_id: string
          occurred_at: string
          synced_at?: string
          tx_type: string
          units_delta?: number
        }
        Update: {
          agent_id?: string | null
          amount?: number
          balance_after?: number | null
          billing_type?: string
          card_uid?: string | null
          collection_mode?: string
          event_id?: string
          id?: number
          meter_id?: string
          occurred_at?: string
          synced_at?: string
          tx_type?: string
          units_delta?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_card_uid_fkey"
            columns: ["card_uid"]
            isOneToOne: false
            referencedRelation: "users_cards"
            referencedColumns: ["card_uid"]
          },
          {
            foreignKeyName: "transactions_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "meters"
            referencedColumns: ["meter_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users_cards: {
        Row: {
          card_balance: number
          card_uid: string
          consumer_id: string
          consumer_name: string | null
          context_mode: string
          created_at: string
          is_active: boolean
          meter_id: string | null
          ration_profile_ref: string | null
        }
        Insert: {
          card_balance?: number
          card_uid: string
          consumer_id: string
          consumer_name?: string | null
          context_mode?: string
          created_at?: string
          is_active?: boolean
          meter_id?: string | null
          ration_profile_ref?: string | null
        }
        Update: {
          card_balance?: number
          card_uid?: string
          consumer_id?: string
          consumer_name?: string | null
          context_mode?: string
          created_at?: string
          is_active?: boolean
          meter_id?: string | null
          ration_profile_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_cards_meter_id_fkey"
            columns: ["meter_id"]
            isOneToOne: false
            referencedRelation: "meters"
            referencedColumns: ["meter_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _process_events: {
        Args: {
          _actor_mode: string
          _agent_id: string
          _batch_id: string
          _events: Json
          _queued_remaining: number
          _source: string
        }
        Returns: Json
      }
      become_worker: { Args: { _code: string }; Returns: undefined }
      can_see_meter: { Args: { _meter: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      link_meter: { Args: { _meter: string }; Returns: undefined }
      my_meter_id: { Args: never; Returns: string }
      submit_events: {
        Args: { _batch_id: string; _events: Json }
        Returns: Json
      }
    }
    Enums: {
      app_role: "worker" | "resident"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["worker", "resident"],
    },
  },
} as const
