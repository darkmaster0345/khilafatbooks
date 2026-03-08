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
      book_pledges: {
        Row: {
          created_at: string
          id: string
          request_id: string
          user_email: string | null
          user_id: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          request_id: string
          user_email?: string | null
          user_id: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          request_id?: string
          user_email?: string | null
          user_id?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "book_pledges_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "book_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      book_requests: {
        Row: {
          author: string | null
          created_at: string
          description: string | null
          estimated_price: number | null
          fulfilled_at: string | null
          id: string
          image_url: string | null
          pledge_fee: number
          pledge_goal: number
          product_id: string | null
          status: string
          suggested_by: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          created_at?: string
          description?: string | null
          estimated_price?: number | null
          fulfilled_at?: string | null
          id?: string
          image_url?: string | null
          pledge_fee?: number
          pledge_goal?: number
          product_id?: string | null
          status?: string
          suggested_by?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          created_at?: string
          description?: string | null
          estimated_price?: number | null
          fulfilled_at?: string | null
          id?: string
          image_url?: string | null
          pledge_fee?: number
          pledge_goal?: number
          product_id?: string | null
          status?: string
          suggested_by?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "book_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_activity: {
        Row: {
          created_at: string
          event_type: string
          id: string
          product_id: string | null
          product_name: string
          quantity: number
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type?: string
          id?: string
          product_id?: string | null
          product_name: string
          quantity?: number
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cart_activity_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_verses: {
        Row: {
          created_at: string
          id: string
          reference: string
          verse_arabic: string
          verse_english: string
          verse_urdu: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          reference: string
          verse_arabic: string
          verse_english: string
          verse_urdu?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          reference?: string
          verse_arabic?: string
          verse_english?: string
          verse_urdu?: string | null
        }
        Relationships: []
      }
      discounts: {
        Row: {
          code: string
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_amount: number | null
          starts_at: string | null
          type: string
          updated_at: string
          used_count: number | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          type?: string
          updated_at?: string
          used_count?: number | null
          value?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          type?: string
          updated_at?: string
          used_count?: number | null
          value?: number
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          delivery_address: string | null
          delivery_city: string | null
          id: string
          items: Json
          payment_screenshot_url: string | null
          shipped_at: string | null
          shipping: number
          shipping_status: string | null
          status: string
          subtotal: number
          total: number
          tracking_number: string | null
          transaction_id: string | null
          updated_at: string
          user_id: string
          zakat_amount: number
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          delivery_address?: string | null
          delivery_city?: string | null
          id?: string
          items: Json
          payment_screenshot_url?: string | null
          shipped_at?: string | null
          shipping?: number
          shipping_status?: string | null
          status?: string
          subtotal: number
          total: number
          tracking_number?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id: string
          zakat_amount?: number
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          delivery_address?: string | null
          delivery_city?: string | null
          id?: string
          items?: Json
          payment_screenshot_url?: string | null
          shipped_at?: string | null
          shipping?: number
          shipping_status?: string | null
          status?: string
          subtotal?: number
          total?: number
          tracking_number?: string | null
          transaction_id?: string | null
          updated_at?: string
          user_id?: string
          zakat_amount?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          bundle_discount: number | null
          category: string
          created_at: string
          description: string
          digital_file_url: string | null
          ethical_source: string | null
          id: string
          image_url: string | null
          in_stock: boolean
          is_halal: boolean
          is_new: boolean
          name: string
          name_ar: string | null
          original_price: number | null
          price: number
          rating: number
          reviews: number
          series: string | null
          series_order: number | null
          type: string
          updated_at: string
        }
        Insert: {
          bundle_discount?: number | null
          category?: string
          created_at?: string
          description?: string
          digital_file_url?: string | null
          ethical_source?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          is_halal?: boolean
          is_new?: boolean
          name: string
          name_ar?: string | null
          original_price?: number | null
          price?: number
          rating?: number
          reviews?: number
          series?: string | null
          series_order?: number | null
          type?: string
          updated_at?: string
        }
        Update: {
          bundle_discount?: number | null
          category?: string
          created_at?: string
          description?: string
          digital_file_url?: string | null
          ethical_source?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          is_halal?: boolean
          is_new?: boolean
          name?: string
          name_ar?: string | null
          original_price?: number | null
          price?: number
          rating?: number
          reviews?: number
          series?: string | null
          series_order?: number | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          privacy_mode: boolean
          privacy_paid: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          privacy_mode?: boolean
          privacy_paid?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          privacy_mode?: boolean
          privacy_paid?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_approved: boolean
          product_id: string
          rating: number
          reviewer_name: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          product_id: string
          rating: number
          reviewer_name: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          product_id?: string
          rating?: number
          reviewer_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_library: {
        Row: {
          added_at: string
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          product_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["reading_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          added_at?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          product_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["reading_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          added_at?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["reading_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_library_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_private_orders: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      reading_status: "want_to_read" | "reading" | "completed"
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
      app_role: ["admin", "user"],
      reading_status: ["want_to_read", "reading", "completed"],
    },
  },
} as const
