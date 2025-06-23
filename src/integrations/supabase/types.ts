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
      course_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          created_at: string | null
          id: string
          last_accessed: string | null
          progress_percentage: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          created_at?: string | null
          id?: string
          last_accessed?: string | null
          progress_percentage?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          created_at?: string | null
          id?: string
          last_accessed?: string | null
          progress_percentage?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["course_id"]
          },
        ]
      }
      courses: {
        Row: {
          author: string
          category: string
          chapter_order: number | null
          content: string
          course_id: string
          created_at: string | null
          date: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          estimated_duration: number | null
          group_id: string | null
          photos: string[] | null
          prerequisites: string[] | null
          published: boolean | null
          quiz: Json | null
          reading_time: number | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author: string
          category: string
          chapter_order?: number | null
          content: string
          course_id?: string
          created_at?: string | null
          date?: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          estimated_duration?: number | null
          group_id?: string | null
          photos?: string[] | null
          prerequisites?: string[] | null
          published?: boolean | null
          quiz?: Json | null
          reading_time?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string
          category?: string
          chapter_order?: number | null
          content?: string
          course_id?: string
          created_at?: string | null
          date?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          estimated_duration?: number | null
          group_id?: string | null
          photos?: string[] | null
          prerequisites?: string[] | null
          published?: boolean | null
          quiz?: Json | null
          reading_time?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      crypto_list: {
        Row: {
          category: string | null
          circulating_supply: number | null
          created_at: string | null
          crypto_id: string
          description: string | null
          exchanges: string[] | null
          ico_price: number | null
          logo: string | null
          name: string
          public_sale_allocation: number | null
          public_sale_cap: number | null
          raised_investment: number | null
          sale_date: string | null
          socials: Json | null
          symbol: string
          token: string | null
          total_supply: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          circulating_supply?: number | null
          created_at?: string | null
          crypto_id?: string
          description?: string | null
          exchanges?: string[] | null
          ico_price?: number | null
          logo?: string | null
          name: string
          public_sale_allocation?: number | null
          public_sale_cap?: number | null
          raised_investment?: number | null
          sale_date?: string | null
          socials?: Json | null
          symbol: string
          token?: string | null
          total_supply?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          circulating_supply?: number | null
          created_at?: string | null
          crypto_id?: string
          description?: string | null
          exchanges?: string[] | null
          ico_price?: number | null
          logo?: string | null
          name?: string
          public_sale_allocation?: number | null
          public_sale_cap?: number | null
          raised_investment?: number | null
          sale_date?: string | null
          socials?: Json | null
          symbol?: string
          token?: string | null
          total_supply?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      logs: {
        Row: {
          error: string | null
          function_name: string
          log_id: string
          message: string | null
          request_data: Json | null
          response_data: Json | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          error?: string | null
          function_name: string
          log_id?: string
          message?: string | null
          request_data?: Json | null
          response_data?: Json | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          error?: string | null
          function_name?: string
          log_id?: string
          message?: string | null
          request_data?: Json | null
          response_data?: Json | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      news: {
        Row: {
          author: string
          category: string
          content: string
          cover_photo: string | null
          created_at: string | null
          date: string | null
          news_id: string
          photos: string[] | null
          published: boolean | null
          reading_time: number | null
          title: string
          type: Database["public"]["Enums"]["news_type"] | null
          updated_at: string | null
        }
        Insert: {
          author: string
          category: string
          content: string
          cover_photo?: string | null
          created_at?: string | null
          date?: string | null
          news_id?: string
          photos?: string[] | null
          published?: boolean | null
          reading_time?: number | null
          title: string
          type?: Database["public"]["Enums"]["news_type"] | null
          updated_at?: string | null
        }
        Update: {
          author?: string
          category?: string
          content?: string
          cover_photo?: string | null
          created_at?: string | null
          date?: string | null
          news_id?: string
          photos?: string[] | null
          published?: boolean | null
          reading_time?: number | null
          title?: string
          type?: Database["public"]["Enums"]["news_type"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      portfolios: {
        Row: {
          all_time_profit: number | null
          coins: Json | null
          created_at: string | null
          id: string
          start_capital: number | null
          total_investment: number | null
          total_worth: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          all_time_profit?: number | null
          coins?: Json | null
          created_at?: string | null
          id?: string
          start_capital?: number | null
          total_investment?: number | null
          total_worth?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          all_time_profit?: number | null
          coins?: Json | null
          created_at?: string | null
          id?: string
          start_capital?: number | null
          total_investment?: number | null
          total_worth?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      quiz_results: {
        Row: {
          answers: Json
          completed_at: string | null
          course_id: string
          created_at: string | null
          id: string
          passed: boolean | null
          score: number
          user_id: string
        }
        Insert: {
          answers: Json
          completed_at?: string | null
          course_id: string
          created_at?: string | null
          id?: string
          passed?: boolean | null
          score: number
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string | null
          course_id?: string
          created_at?: string | null
          id?: string
          passed?: boolean | null
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_results_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["course_id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_usd: number
          coin_id: string
          created_at: string | null
          date: string | null
          note: string | null
          price: number
          quantity: number
          transaction_id: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount_usd: number
          coin_id: string
          created_at?: string | null
          date?: string | null
          note?: string | null
          price: number
          quantity: number
          transaction_id?: string
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount_usd?: number
          coin_id?: string
          created_at?: string | null
          date?: string | null
          note?: string | null
          price?: number
          quantity?: number
          transaction_id?: string
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          subscription_end: string | null
          subscription_start: string | null
          subscription_status:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          subscription_type:
            | Database["public"]["Enums"]["subscription_type"]
            | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          subscription_end?: string | null
          subscription_start?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          subscription_type?:
            | Database["public"]["Enums"]["subscription_type"]
            | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          subscription_end?: string | null
          subscription_start?: string | null
          subscription_status?:
            | Database["public"]["Enums"]["subscription_status"]
            | null
          subscription_type?:
            | Database["public"]["Enums"]["subscription_type"]
            | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
    }
    Enums: {
      difficulty_level: "beginner" | "intermediate" | "advanced"
      news_type: "article" | "analysis" | "breaking" | "opinion"
      subscription_status: "active" | "inactive" | "expired" | "cancelled"
      subscription_type: "free" | "basic" | "premium"
      transaction_type: "buy" | "sell"
      user_role: "user" | "admin"
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
      difficulty_level: ["beginner", "intermediate", "advanced"],
      news_type: ["article", "analysis", "breaking", "opinion"],
      subscription_status: ["active", "inactive", "expired", "cancelled"],
      subscription_type: ["free", "basic", "premium"],
      transaction_type: ["buy", "sell"],
      user_role: ["user", "admin"],
    },
  },
} as const
