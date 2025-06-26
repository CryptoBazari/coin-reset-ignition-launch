export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      assumptions: {
        Row: {
          basket: Database["public"]["Enums"]["basket_type"]
          discount_rate: number
          hurdle_rate: number
          id: string
          target_allocation: number
        }
        Insert: {
          basket: Database["public"]["Enums"]["basket_type"]
          discount_rate: number
          hurdle_rate: number
          id?: string
          target_allocation: number
        }
        Update: {
          basket?: Database["public"]["Enums"]["basket_type"]
          discount_rate?: number
          hurdle_rate?: number
          id?: string
          target_allocation?: number
        }
        Relationships: []
      }
      benchmarks: {
        Row: {
          benchmark_id: string
          cagr_36m: number
          current_value: number
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          benchmark_id: string
          cagr_36m: number
          current_value: number
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          benchmark_id?: string
          cagr_36m?: number
          current_value?: number
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      coins: {
        Row: {
          active_supply: number | null
          aviv_ratio: number | null
          basket: Database["public"]["Enums"]["basket_type"]
          cagr_36m: number | null
          coin_id: string
          created_at: string | null
          current_price: number
          fundamentals_score: number | null
          id: string
          market_cap: number | null
          name: string
          price_history: Json | null
          staking_yield: number | null
          updated_at: string | null
          vaulted_supply: number | null
          volatility: number | null
        }
        Insert: {
          active_supply?: number | null
          aviv_ratio?: number | null
          basket: Database["public"]["Enums"]["basket_type"]
          cagr_36m?: number | null
          coin_id: string
          created_at?: string | null
          current_price: number
          fundamentals_score?: number | null
          id?: string
          market_cap?: number | null
          name: string
          price_history?: Json | null
          staking_yield?: number | null
          updated_at?: string | null
          vaulted_supply?: number | null
          volatility?: number | null
        }
        Update: {
          active_supply?: number | null
          aviv_ratio?: number | null
          basket?: Database["public"]["Enums"]["basket_type"]
          cagr_36m?: number | null
          coin_id?: string
          created_at?: string | null
          current_price?: number
          fundamentals_score?: number | null
          id?: string
          market_cap?: number | null
          name?: string
          price_history?: Json | null
          staking_yield?: number | null
          updated_at?: string | null
          vaulted_supply?: number | null
          volatility?: number | null
        }
        Relationships: []
      }
      investment_analyses: {
        Row: {
          cagr: number | null
          coin_id: string
          conditions: string | null
          created_at: string | null
          expected_price: number | null
          id: string
          investment_amount: number
          investment_horizon: number | null
          irr: number | null
          npv: number | null
          recommendation: Database["public"]["Enums"]["recommendation_type"]
          risk_factor: number | null
          risks: string | null
          roi: number | null
          total_portfolio: number
        }
        Insert: {
          cagr?: number | null
          coin_id: string
          conditions?: string | null
          created_at?: string | null
          expected_price?: number | null
          id?: string
          investment_amount: number
          investment_horizon?: number | null
          irr?: number | null
          npv?: number | null
          recommendation: Database["public"]["Enums"]["recommendation_type"]
          risk_factor?: number | null
          risks?: string | null
          roi?: number | null
          total_portfolio: number
        }
        Update: {
          cagr?: number | null
          coin_id?: string
          conditions?: string | null
          created_at?: string | null
          expected_price?: number | null
          id?: string
          investment_amount?: number
          investment_horizon?: number | null
          irr?: number | null
          npv?: number | null
          recommendation?: Database["public"]["Enums"]["recommendation_type"]
          risk_factor?: number | null
          risks?: string | null
          roi?: number | null
          total_portfolio?: number
        }
        Relationships: [
          {
            foreignKeyName: "investment_analyses_coin_id_fkey"
            columns: ["coin_id"]
            isOneToOne: false
            referencedRelation: "coins"
            referencedColumns: ["coin_id"]
          },
        ]
      }
      market_sentiment: {
        Row: {
          coin_id: string
          id: string
          sentiment_score: number | null
          sentiment_type: Database["public"]["Enums"]["sentiment_type"]
          timestamp: string | null
        }
        Insert: {
          coin_id: string
          id?: string
          sentiment_score?: number | null
          sentiment_type: Database["public"]["Enums"]["sentiment_type"]
          timestamp?: string | null
        }
        Update: {
          coin_id?: string
          id?: string
          sentiment_score?: number | null
          sentiment_type?: Database["public"]["Enums"]["sentiment_type"]
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_sentiment_coin_id_fkey"
            columns: ["coin_id"]
            isOneToOne: false
            referencedRelation: "coins"
            referencedColumns: ["coin_id"]
          },
        ]
      }
      user_portfolios: {
        Row: {
          allocations: Json
          created_at: string | null
          holdings: Json
          id: string
          portfolio_id: string
          total_value: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          allocations?: Json
          created_at?: string | null
          holdings?: Json
          id?: string
          portfolio_id: string
          total_value: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          allocations?: Json
          created_at?: string | null
          holdings?: Json
          id?: string
          portfolio_id?: string
          total_value?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      virtual_assets: {
        Row: {
          average_price: number
          category: string
          coin_id: string
          cost_basis: number
          created_at: string
          id: string
          portfolio_id: string
          realized_profit: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          average_price?: number
          category: string
          coin_id: string
          cost_basis?: number
          created_at?: string
          id?: string
          portfolio_id: string
          realized_profit?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          average_price?: number
          category?: string
          coin_id?: string
          cost_basis?: number
          created_at?: string
          id?: string
          portfolio_id?: string
          realized_profit?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "virtual_assets_coin_id_fkey"
            columns: ["coin_id"]
            isOneToOne: false
            referencedRelation: "virtual_coins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_assets_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "virtual_portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      virtual_coins: {
        Row: {
          created_at: string
          id: string
          name: string
          symbol: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          symbol: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      virtual_portfolios: {
        Row: {
          all_time_profit: number
          created_at: string
          id: string
          name: string
          total_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          all_time_profit?: number
          created_at?: string
          id?: string
          name: string
          total_value?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          all_time_profit?: number
          created_at?: string
          id?: string
          name?: string
          total_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      virtual_transactions: {
        Row: {
          amount: number
          asset_id: string | null
          category: string
          coin_id: string
          created_at: string
          fee: number
          id: string
          note: string | null
          portfolio_id: string
          price: number
          transaction_date: string
          transaction_type: string
          value: number
        }
        Insert: {
          amount: number
          asset_id?: string | null
          category: string
          coin_id: string
          created_at?: string
          fee?: number
          id?: string
          note?: string | null
          portfolio_id: string
          price: number
          transaction_date?: string
          transaction_type: string
          value: number
        }
        Update: {
          amount?: number
          asset_id?: string | null
          category?: string
          coin_id?: string
          created_at?: string
          fee?: number
          id?: string
          note?: string | null
          portfolio_id?: string
          price?: number
          transaction_date?: string
          transaction_type?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "virtual_transactions_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "virtual_assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_transactions_coin_id_fkey"
            columns: ["coin_id"]
            isOneToOne: false
            referencedRelation: "virtual_coins"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_transactions_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "virtual_portfolios"
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
      basket_type: "Bitcoin" | "Blue Chip" | "Small-Cap"
      recommendation_type: "Buy" | "Buy Less" | "Do Not Buy"
      sentiment_type: "Bearish" | "Neutral" | "Bullish"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      basket_type: ["Bitcoin", "Blue Chip", "Small-Cap"],
      recommendation_type: ["Buy", "Buy Less", "Do Not Buy"],
      sentiment_type: ["Bearish", "Neutral", "Bullish"],
    },
  },
} as const
