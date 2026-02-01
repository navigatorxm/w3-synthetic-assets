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
      admin_logs: {
        Row: {
          action: string
          admin_address: string
          amount: string | null
          created_at: string
          details: Json | null
          id: string
          target_address: string | null
          token_symbol: string | null
          tx_hash: string | null
        }
        Insert: {
          action: string
          admin_address: string
          amount?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_address?: string | null
          token_symbol?: string | null
          tx_hash?: string | null
        }
        Update: {
          action?: string
          admin_address?: string
          amount?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          target_address?: string | null
          token_symbol?: string | null
          tx_hash?: string | null
        }
        Relationships: []
      }
      daily_analytics: {
        Row: {
          active_holders: number
          burn_count: number
          chain_id: number
          created_at: string
          date: string
          id: string
          mint_count: number
          new_holders: number
          token_symbol: string
          transaction_count: number
          transfer_count: number
          volume: string
        }
        Insert: {
          active_holders?: number
          burn_count?: number
          chain_id?: number
          created_at?: string
          date: string
          id?: string
          mint_count?: number
          new_holders?: number
          token_symbol: string
          transaction_count?: number
          transfer_count?: number
          volume?: string
        }
        Update: {
          active_holders?: number
          burn_count?: number
          chain_id?: number
          created_at?: string
          date?: string
          id?: string
          mint_count?: number
          new_holders?: number
          token_symbol?: string
          transaction_count?: number
          transfer_count?: number
          volume?: string
        }
        Relationships: []
      }
      sync_state: {
        Row: {
          chain_id: number
          created_at: string
          id: string
          is_syncing: boolean
          last_block_number: number
          last_sync_at: string
          updated_at: string
        }
        Insert: {
          chain_id: number
          created_at?: string
          id?: string
          is_syncing?: boolean
          last_block_number?: number
          last_sync_at?: string
          updated_at?: string
        }
        Update: {
          chain_id?: number
          created_at?: string
          id?: string
          is_syncing?: boolean
          last_block_number?: number
          last_sync_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      token_holders: {
        Row: {
          balance: string
          created_at: string
          expiry_timestamp: number | null
          id: string
          is_expired: boolean
          last_activity_at: string | null
          token_symbol: string
          updated_at: string
          wallet_address: string
        }
        Insert: {
          balance?: string
          created_at?: string
          expiry_timestamp?: number | null
          id?: string
          is_expired?: boolean
          last_activity_at?: string | null
          token_symbol: string
          updated_at?: string
          wallet_address: string
        }
        Update: {
          balance?: string
          created_at?: string
          expiry_timestamp?: number | null
          id?: string
          is_expired?: boolean
          last_activity_at?: string | null
          token_symbol?: string
          updated_at?: string
          wallet_address?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: string
          block_number: number
          chain_id: number
          created_at: string
          expiry_timestamp: number | null
          from_address: string
          gas_price: string | null
          gas_used: string | null
          id: string
          indexed_at: string
          status: string
          to_address: string
          token_symbol: string
          tx_hash: string
          tx_type: string
        }
        Insert: {
          amount: string
          block_number: number
          chain_id?: number
          created_at?: string
          expiry_timestamp?: number | null
          from_address: string
          gas_price?: string | null
          gas_used?: string | null
          id?: string
          indexed_at?: string
          status?: string
          to_address: string
          token_symbol: string
          tx_hash: string
          tx_type: string
        }
        Update: {
          amount?: string
          block_number?: number
          chain_id?: number
          created_at?: string
          expiry_timestamp?: number | null
          from_address?: string
          gas_price?: string | null
          gas_used?: string | null
          id?: string
          indexed_at?: string
          status?: string
          to_address?: string
          token_symbol?: string
          tx_hash?: string
          tx_type?: string
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
