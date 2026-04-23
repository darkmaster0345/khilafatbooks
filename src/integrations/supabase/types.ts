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
      abandoned_carts: {
        Row: {
          cart_items: Json
          cart_total: number
          created_at: string
          id: string
          last_activity_at: string
          recovered_at: string | null
          recovered_order_id: string | null
          recovery_code: string | null
          recovery_code_expires_at: string | null
          reminder_count: number
          reminder_sent_at: string | null
          status: string
          updated_at: string
          user_email: string
          user_id: string
          user_name: string | null
        }
        Insert: {
          cart_items?: Json
          cart_total?: number
          created_at?: string
          id?: string
          last_activity_at?: string
          recovered_at?: string | null
          recovered_order_id?: string | null
          recovery_code?: string | null
          recovery_code_expires_at?: string | null
          reminder_count?: number
          reminder_sent_at?: string | null
          status?: string
          updated_at?: string
          user_email: string
          user_id: string
          user_name?: string | null
        }
        Update: {
          cart_items?: Json
          cart_total?: number
          created_at?: string
          id?: string
          last_activity_at?: string
          recovered_at?: string | null
          recovered_order_id?: string | null
          recovery_code?: string | null
          recovery_code_expires_at?: string | null
          reminder_count?: number
          reminder_sent_at?: string | null
          status?: string
          updated_at?: string
          user_email?: string
          user_id?: string
          user_name?: string | null
        }
        Relationships: []
      }
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
      newsletter_campaigns: {
        Row: {
          body_html: string
          id: string
          recipient_count: number
          sent_at: string
          sent_by: string | null
          subject: string
        }
        Insert: {
          body_html: string
          id?: string
          recipient_count?: number
          sent_at?: string
          sent_by?: string | null
          subject: string
        }
        Update: {
          body_html?: string
          id?: string
          recipient_count?: number
          sent_at?: string
          sent_by?: string | null
          subject?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean
          name: string | null
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          name?: string | null
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          name?: string | null
          subscribed_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          product_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          product_id?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          product_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          delivery_address: string | null
          delivery_city: string | null
          gift_message: string | null
          gift_recipient_name: string | null
          gift_wrap: boolean
          gift_wrap_fee: number
          id: string
          is_gift: boolean
          items: Json
          payment_screenshot_url: string | null
          recovered_from_cart: string | null
          recovery_discount: number | null
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
          gift_message?: string | null
          gift_recipient_name?: string | null
          gift_wrap?: boolean
          gift_wrap_fee?: number
          id?: string
          is_gift?: boolean
          items: Json
          payment_screenshot_url?: string | null
          recovered_from_cart?: string | null
          recovery_discount?: number | null
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
          gift_message?: string | null
          gift_recipient_name?: string | null
          gift_wrap?: boolean
          gift_wrap_fee?: number
          id?: string
          is_gift?: boolean
          items?: Json
          payment_screenshot_url?: string | null
          recovered_from_cart?: string | null
          recovery_discount?: number | null
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
        Relationships: [
          {
            foreignKeyName: "orders_recovered_from_cart_fkey"
            columns: ["recovered_from_cart"]
            isOneToOne: false
            referencedRelation: "abandoned_carts"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          bundle_discount: number | null
          category: string
          condition_description: string | null
          created_at: string
          delivery_price: number | null
          description: string
          digital_file_url: string | null
          ethical_source: string | null
          id: string
          image_url: string | null
          in_stock: boolean
          is_halal: boolean
          is_hidden: boolean
          is_new: boolean
          is_used: boolean
          low_stock_threshold: number
          name: string
          name_ar: string | null
          original_price: number | null
          price: number
          rating: number
          reviews: number
          series: string | null
          series_order: number | null
          stock_quantity: number
          type: string
          updated_at: string
        }
        Insert: {
          bundle_discount?: number | null
          category?: string
          condition_description?: string | null
          created_at?: string
          delivery_price?: number | null
          description?: string
          digital_file_url?: string | null
          ethical_source?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          is_halal?: boolean
          is_hidden?: boolean
          is_new?: boolean
          is_used?: boolean
          low_stock_threshold?: number
          name: string
          name_ar?: string | null
          original_price?: number | null
          price?: number
          rating?: number
          reviews?: number
          series?: string | null
          series_order?: number | null
          stock_quantity?: number
          type?: string
          updated_at?: string
        }
        Update: {
          bundle_discount?: number | null
          category?: string
          condition_description?: string | null
          created_at?: string
          delivery_price?: number | null
          description?: string
          digital_file_url?: string | null
          ethical_source?: string | null
          id?: string
          image_url?: string | null
          in_stock?: boolean
          is_halal?: boolean
          is_hidden?: boolean
          is_new?: boolean
          is_used?: boolean
          low_stock_threshold?: number
          name?: string
          name_ar?: string | null
          original_price?: number | null
          price?: number
          rating?: number
          reviews?: number
          series?: string | null
          series_order?: number | null
          stock_quantity?: number
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
          loyalty_tier: string
          phone: string | null
          privacy_mode: boolean
          privacy_paid: boolean
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          loyalty_tier?: string
          phone?: string | null
          privacy_mode?: boolean
          privacy_paid?: boolean
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          loyalty_tier?: string
          phone?: string | null
          privacy_mode?: boolean
          privacy_paid?: boolean
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_audit_log: {
        Row: {
          created_at: string
          event_type: string
          failure_reason: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          referral_code: string | null
          success: boolean
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          referral_code?: string | null
          success?: boolean
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          failure_reason?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          referral_code?: string | null
          success?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          month_reset_at: string
          updated_at: string
          user_id: string
          uses_count: number
          uses_this_month: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          month_reset_at?: string
          updated_at?: string
          user_id: string
          uses_count?: number
          uses_this_month?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          month_reset_at?: string
          updated_at?: string
          user_id?: string
          uses_count?: number
          uses_this_month?: number
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          ip_match_flagged: boolean
          order_id: string | null
          referral_code_id: string
          referred_ip: string | null
          referred_reward_claimed: boolean
          referred_reward_type: string | null
          referred_user_id: string
          referrer_discount_code: string | null
          referrer_discount_expires_at: string | null
          referrer_id: string
          referrer_ip: string | null
          referrer_reward_claimed: boolean
          referrer_reward_type: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_match_flagged?: boolean
          order_id?: string | null
          referral_code_id: string
          referred_ip?: string | null
          referred_reward_claimed?: boolean
          referred_reward_type?: string | null
          referred_user_id: string
          referrer_discount_code?: string | null
          referrer_discount_expires_at?: string | null
          referrer_id: string
          referrer_ip?: string | null
          referrer_reward_claimed?: boolean
          referrer_reward_type?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_match_flagged?: boolean
          order_id?: string | null
          referral_code_id?: string
          referred_ip?: string | null
          referred_reward_claimed?: boolean
          referred_reward_type?: string | null
          referred_user_id?: string
          referrer_discount_code?: string | null
          referrer_discount_expires_at?: string | null
          referrer_id?: string
          referrer_ip?: string | null
          referrer_reward_claimed?: boolean
          referrer_reward_type?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referral_code_id_fkey"
            columns: ["referral_code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      review_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          review_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          review_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          review_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_images_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
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
          verified_purchase: boolean
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
          verified_purchase?: boolean
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
          verified_purchase?: boolean
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
      security_events: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          success: boolean | null
          user_email: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          success?: boolean | null
          user_email?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          success?: boolean | null
          user_email?: string | null
        }
        Relationships: []
      }
      stock_notifications: {
        Row: {
          created_at: string
          id: string
          notified_at: string | null
          product_id: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notified_at?: string | null
          product_id: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notified_at?: string | null
          product_id?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_notifications_product_id_fkey"
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
          notify_on_sale: boolean
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notify_on_sale?: boolean
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notify_on_sale?: boolean
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
      public_products: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_url: string | null
          in_stock: boolean | null
          is_halal: boolean | null
          is_new: boolean | null
          is_used: boolean | null
          name: string | null
          name_ar: string | null
          original_price: number | null
          price: number | null
          rating: number | null
          reviews: number | null
          series: string | null
          series_order: number | null
          type: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_generate_referral_code: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      cleanup_private_orders: { Args: never; Returns: number }
      create_verified_order:
        | {
            Args: {
              p_customer_email?: string
              p_customer_name: string
              p_customer_phone: string
              p_delivery_address?: string
              p_delivery_city?: string
              p_discount_code?: string
              p_items: Json
              p_payment_screenshot_url?: string
              p_recovery_discount?: number
              p_recovery_code?: string
              p_referral_discount?: number
              p_transaction_id?: string
              p_zakat_enabled?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              p_customer_email?: string
              p_customer_name: string
              p_customer_phone: string
              p_delivery_address?: string
              p_delivery_city?: string
              p_discount_code?: string
              p_gift_message?: string
              p_gift_recipient_name?: string
              p_gift_wrap?: boolean
              p_is_gift?: boolean
              p_items: Json
              p_payment_screenshot_url?: string
              p_recovery_discount?: number
              p_recovery_code?: string
              p_referral_discount?: number
              p_transaction_id?: string
              p_zakat_enabled?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              p_customer_email?: string
              p_customer_name: string
              p_customer_phone: string
              p_delivery_address?: string
              p_delivery_city?: string
              p_discount_code?: string
              p_gift_message?: string
              p_gift_recipient_name?: string
              p_gift_wrap?: boolean
              p_is_gift?: boolean
              p_items: Json
              p_payment_screenshot_url?: string
              p_recovery_discount?: number
              p_recovery_code?: string
              p_referral_code_id?: string
              p_referral_discount?: number
              p_referred_reward_type?: string
              p_transaction_id?: string
              p_zakat_enabled?: boolean
            }
            Returns: string
          }
      get_digital_download_url: {
        Args: { p_product_id: string }
        Returns: string
      }
      get_my_referrals: {
        Args: never
        Returns: {
          created_at: string
          id: string
          order_id: string
          referral_code_id: string
          referred_reward_claimed: boolean
          referred_reward_type: string
          referred_user_id: string
          referrer_discount_code: string
          referrer_discount_expires_at: string
          referrer_id: string
          referrer_reward_claimed: boolean
          referrer_reward_type: string
          status: string
        }[]
      }
      get_pledge_count: { Args: { p_request_id: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      validate_referral_code: {
        Args: { p_code: string; p_order_total: number; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
      loyalty_tier_type: "talib" | "muallim" | "alim"
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
      loyalty_tier_type: ["talib", "muallim", "alim"],
      reading_status: ["want_to_read", "reading", "completed"],
    },
  },
} as const
