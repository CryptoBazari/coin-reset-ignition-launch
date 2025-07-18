export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_active: boolean
          permissions: string[] | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          permissions?: string[] | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          permissions?: string[] | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      assumptions: {
        Row: {
          basket: Database["public"]["Enums"]["basket_type"]
          discount_rate: number
          hurdle_rate: number
          id: string
          max_allocation: number | null
          min_allocation: number | null
          recommended_max: number | null
          recommended_min: number | null
          target_allocation: number
        }
        Insert: {
          basket: Database["public"]["Enums"]["basket_type"]
          discount_rate: number
          hurdle_rate: number
          id?: string
          max_allocation?: number | null
          min_allocation?: number | null
          recommended_max?: number | null
          recommended_min?: number | null
          target_allocation: number
        }
        Update: {
          basket?: Database["public"]["Enums"]["basket_type"]
          discount_rate?: number
          hurdle_rate?: number
          id?: string
          max_allocation?: number | null
          min_allocation?: number | null
          recommended_max?: number | null
          recommended_min?: number | null
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
          api_status: string | null
          aviv_ratio: number | null
          basket: Database["public"]["Enums"]["basket_type"]
          beta: number | null
          beta_confidence: string | null
          beta_data_source: string | null
          beta_last_calculated: string | null
          cagr_36m: number | null
          coin_id: string
          coingecko_id: string | null
          created_at: string | null
          current_price: number
          fundamentals_score: number | null
          glass_node_asset_name: string | null
          glass_node_data_quality: number | null
          glass_node_last_discovered: string | null
          glass_node_supported: boolean | null
          id: string
          last_glass_node_update: string | null
          logo_url: string | null
          market_cap: number | null
          name: string
          premium_metrics_available: boolean | null
          price_history: Json | null
          sharpe_ratio: number | null
          staking_yield: number | null
          standard_deviation: number | null
          updated_at: string | null
          vaulted_supply: number | null
          volatility: number | null
        }
        Insert: {
          active_supply?: number | null
          api_status?: string | null
          aviv_ratio?: number | null
          basket: Database["public"]["Enums"]["basket_type"]
          beta?: number | null
          beta_confidence?: string | null
          beta_data_source?: string | null
          beta_last_calculated?: string | null
          cagr_36m?: number | null
          coin_id: string
          coingecko_id?: string | null
          created_at?: string | null
          current_price: number
          fundamentals_score?: number | null
          glass_node_asset_name?: string | null
          glass_node_data_quality?: number | null
          glass_node_last_discovered?: string | null
          glass_node_supported?: boolean | null
          id?: string
          last_glass_node_update?: string | null
          logo_url?: string | null
          market_cap?: number | null
          name: string
          premium_metrics_available?: boolean | null
          price_history?: Json | null
          sharpe_ratio?: number | null
          staking_yield?: number | null
          standard_deviation?: number | null
          updated_at?: string | null
          vaulted_supply?: number | null
          volatility?: number | null
        }
        Update: {
          active_supply?: number | null
          api_status?: string | null
          aviv_ratio?: number | null
          basket?: Database["public"]["Enums"]["basket_type"]
          beta?: number | null
          beta_confidence?: string | null
          beta_data_source?: string | null
          beta_last_calculated?: string | null
          cagr_36m?: number | null
          coin_id?: string
          coingecko_id?: string | null
          created_at?: string | null
          current_price?: number
          fundamentals_score?: number | null
          glass_node_asset_name?: string | null
          glass_node_data_quality?: number | null
          glass_node_last_discovered?: string | null
          glass_node_supported?: boolean | null
          id?: string
          last_glass_node_update?: string | null
          logo_url?: string | null
          market_cap?: number | null
          name?: string
          premium_metrics_available?: boolean | null
          price_history?: Json | null
          sharpe_ratio?: number | null
          staking_yield?: number | null
          standard_deviation?: number | null
          updated_at?: string | null
          vaulted_supply?: number | null
          volatility?: number | null
        }
        Relationships: []
      }
      course_chapters: {
        Row: {
          chapter_number: number
          content: string
          course_id: string
          created_at: string
          estimated_reading_time: number | null
          id: string
          is_published: boolean
          title: string
          updated_at: string
        }
        Insert: {
          chapter_number: number
          content: string
          course_id: string
          created_at?: string
          estimated_reading_time?: number | null
          id?: string
          is_published?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          chapter_number?: number
          content?: string
          course_id?: string
          created_at?: string
          estimated_reading_time?: number | null
          id?: string
          is_published?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_chapters_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learning_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      crypto_listings: {
        Row: {
          circulating_supply: string | null
          created_at: string
          description: string | null
          discord_url: string | null
          ico_price: string | null
          id: string
          is_published: boolean
          listing_date: string | null
          listing_exchange: string | null
          logo_url: string | null
          name: string
          symbol: string
          telegram_url: string | null
          total_supply: string | null
          twitter_url: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          circulating_supply?: string | null
          created_at?: string
          description?: string | null
          discord_url?: string | null
          ico_price?: string | null
          id?: string
          is_published?: boolean
          listing_date?: string | null
          listing_exchange?: string | null
          logo_url?: string | null
          name: string
          symbol: string
          telegram_url?: string | null
          total_supply?: string | null
          twitter_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          circulating_supply?: string | null
          created_at?: string
          description?: string | null
          discord_url?: string | null
          ico_price?: string | null
          id?: string
          is_published?: boolean
          listing_date?: string | null
          listing_exchange?: string | null
          logo_url?: string | null
          name?: string
          symbol?: string
          telegram_url?: string | null
          total_supply?: string | null
          twitter_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      crypto_payments: {
        Row: {
          amount: number
          created_at: string
          expires_at: string | null
          id: string
          payment_address_id: string
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          transaction_hash: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_address_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          transaction_hash?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_address_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          transaction_hash?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crypto_payments_payment_address_id_fkey"
            columns: ["payment_address_id"]
            isOneToOne: false
            referencedRelation: "payment_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crypto_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      glass_node_discovery_logs: {
        Row: {
          api_status: string | null
          assets_discovered: number | null
          assets_updated: number | null
          discovery_duration_ms: number | null
          discovery_run_at: string
          error_message: string | null
          id: string
        }
        Insert: {
          api_status?: string | null
          assets_discovered?: number | null
          assets_updated?: number | null
          discovery_duration_ms?: number | null
          discovery_run_at?: string
          error_message?: string | null
          id?: string
        }
        Update: {
          api_status?: string | null
          assets_discovered?: number | null
          assets_updated?: number | null
          discovery_duration_ms?: number | null
          discovery_run_at?: string
          error_message?: string | null
          id?: string
        }
        Relationships: []
      }
      investment_analyses: {
        Row: {
          allocation_status: string | null
          beta: number | null
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
          portfolio_compliant: boolean | null
          price_cagr: number | null
          price_roi: number | null
          recommendation: Database["public"]["Enums"]["recommendation_type"]
          risk_adjusted_npv: number | null
          risk_factor: number | null
          risks: string | null
          roi: number | null
          sharpe_ratio: number | null
          staking_roi: number | null
          standard_deviation: number | null
          total_portfolio: number
          total_return_cagr: number | null
        }
        Insert: {
          allocation_status?: string | null
          beta?: number | null
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
          portfolio_compliant?: boolean | null
          price_cagr?: number | null
          price_roi?: number | null
          recommendation: Database["public"]["Enums"]["recommendation_type"]
          risk_adjusted_npv?: number | null
          risk_factor?: number | null
          risks?: string | null
          roi?: number | null
          sharpe_ratio?: number | null
          staking_roi?: number | null
          standard_deviation?: number | null
          total_portfolio: number
          total_return_cagr?: number | null
        }
        Update: {
          allocation_status?: string | null
          beta?: number | null
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
          portfolio_compliant?: boolean | null
          price_cagr?: number | null
          price_roi?: number | null
          recommendation?: Database["public"]["Enums"]["recommendation_type"]
          risk_adjusted_npv?: number | null
          risk_factor?: number | null
          risks?: string | null
          roi?: number | null
          sharpe_ratio?: number | null
          staking_roi?: number | null
          standard_deviation?: number | null
          total_portfolio?: number
          total_return_cagr?: number | null
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
      learning_courses: {
        Row: {
          author: string
          content: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          difficulty_level: string | null
          estimated_duration: number | null
          id: string
          is_published: boolean
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author: string
          content: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          estimated_duration?: number | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          estimated_duration?: number | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      news: {
        Row: {
          author: string
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author: string
          content: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_addresses: {
        Row: {
          address: string
          created_at: string
          id: string
          is_active: boolean
          network: Database["public"]["Enums"]["crypto_network"]
          token: Database["public"]["Enums"]["crypto_token"]
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          is_active?: boolean
          network: Database["public"]["Enums"]["crypto_network"]
          token: Database["public"]["Enums"]["crypto_token"]
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          is_active?: boolean
          network?: Database["public"]["Enums"]["crypto_network"]
          token?: Database["public"]["Enums"]["crypto_token"]
          updated_at?: string
        }
        Relationships: []
      }
      portfolio_allocations: {
        Row: {
          bitcoin_percentage: number
          bluechip_percentage: number
          calculated_at: string | null
          id: string
          is_compliant: boolean
          portfolio_id: string
          smallcap_percentage: number
          total_value: number
          user_id: string | null
          violations: string[] | null
        }
        Insert: {
          bitcoin_percentage?: number
          bluechip_percentage?: number
          calculated_at?: string | null
          id?: string
          is_compliant?: boolean
          portfolio_id: string
          smallcap_percentage?: number
          total_value?: number
          user_id?: string | null
          violations?: string[] | null
        }
        Update: {
          bitcoin_percentage?: number
          bluechip_percentage?: number
          calculated_at?: string | null
          id?: string
          is_compliant?: boolean
          portfolio_id?: string
          smallcap_percentage?: number
          total_value?: number
          user_id?: string | null
          violations?: string[] | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          duration_months: number
          id: string
          is_active: boolean
          name: string
          price_btc: number | null
          price_usdt: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_months: number
          id?: string
          is_active?: boolean
          name: string
          price_btc?: number | null
          price_usdt?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_months?: number
          id?: string
          is_active?: boolean
          name?: string
          price_btc?: number | null
          price_usdt?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_course_progress: {
        Row: {
          chapter_id: string | null
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          reading_progress: number
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          reading_progress?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          reading_progress?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_progress_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "course_chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "learning_courses"
            referencedColumns: ["id"]
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
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan_id: string
          starts_at: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan_id?: string
          starts_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
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
      activate_user_subscription: {
        Args: {
          target_user_id: string
          plan_id: string
          custom_duration_months?: number
        }
        Returns: Json
      }
      cancel_user_subscription: {
        Args: { target_user_id: string }
        Returns: Json
      }
      cleanup_expired_payments: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      cleanup_expired_subscriptions: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      extend_user_subscription: {
        Args: { target_user_id: string; additional_days: number }
        Returns: Json
      }
      get_subscription_time_remaining: {
        Args: { target_user_id?: string }
        Returns: Json
      }
      get_user_subscription_details: {
        Args: { target_user_id: string }
        Returns: Json
      }
      has_active_subscription: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      is_admin: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
    }
    Enums: {
      basket_type: "Bitcoin" | "Blue Chip" | "Small-Cap"
      crypto_network: "bitcoin" | "ethereum" | "arbitrum"
      crypto_token: "btc" | "usdt"
      payment_status: "pending" | "confirmed" | "failed" | "expired"
      recommendation_type: "Buy" | "Buy Less" | "Do Not Buy"
      sentiment_type: "Bearish" | "Neutral" | "Bullish"
      subscription_status: "active" | "expired" | "pending" | "cancelled"
      user_role: "admin" | "user"
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
      basket_type: ["Bitcoin", "Blue Chip", "Small-Cap"],
      crypto_network: ["bitcoin", "ethereum", "arbitrum"],
      crypto_token: ["btc", "usdt"],
      payment_status: ["pending", "confirmed", "failed", "expired"],
      recommendation_type: ["Buy", "Buy Less", "Do Not Buy"],
      sentiment_type: ["Bearish", "Neutral", "Bullish"],
      subscription_status: ["active", "expired", "pending", "cancelled"],
      user_role: ["admin", "user"],
    },
  },
} as const
