export interface Database {
  public: {
    Tables: {
      income: {
        Row: {
          id: string
          user_id: string
          amount: number
          description: string
          is_recurring: boolean
          recurring_day: number | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          description: string
          is_recurring: boolean
          recurring_day?: number | null
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          description?: string
          is_recurring?: boolean
          recurring_day?: number | null
          date?: string
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          amount: number
          description: string
          category: string
          is_recurring: boolean
          recurring_day: number | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          description: string
          category: string
          is_recurring: boolean
          recurring_day?: number | null
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          description?: string
          category?: string
          is_recurring?: boolean
          recurring_day?: number | null
          date?: string
        }
      }
      products: {
        Row: {
          id: string
          user_id: string
          name: string
          weight: string | null
          brand: string | null
          supermarket: string | null
          last_price: number | null
          last_purchase_date: string | null
          inventory_level: 'full' | 'medium' | 'low' | 'none' | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          weight?: string | null
          brand?: string | null
          supermarket?: string | null
          last_price?: number | null
          last_purchase_date?: string | null
          inventory_level?: 'full' | 'medium' | 'low' | 'none' | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          weight?: string | null
          brand?: string | null
          supermarket?: string | null
          last_price?: number | null
          last_purchase_date?: string | null
          inventory_level?: 'full' | 'medium' | 'low' | 'none' | null
        }
      }
      cart_items: {
        Row: {
          id: string
          cart_id: string
          product_id: string | null
          product_name: string
          weight: string | null
          brand: string | null
          price: number
          supermarket: string
          created_at: string
        }
        Insert: {
          id?: string
          cart_id: string
          product_name: string
          weight?: string | null
          brand?: string | null
          price: number
          supermarket: string
          product_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cart_id?: string
          product_id?: string | null
          product_name?: string
          weight?: string | null
          brand?: string | null
          price?: number
          supermarket?: string
        }
      }
      carts: {
        Row: {
          id: string
          user_id: string
          total_amount: number
          supermarket: string
          date: string
          is_completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_amount: number
          supermarket: string
          date: string
          is_completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          total_amount?: number
          supermarket?: string
          date?: string
          is_completed?: boolean
        }
      }
      todos: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          priority: 'low' | 'mid' | 'high'
          is_recurring: boolean
          recurrence_type: 'daily' | 'weekly' | 'monthly' | 'custom_days' | null
          recurrence_value: number | null
          recurrence_day_of_month: number | null
          due_date: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          last_occurrence_date: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          priority: 'low' | 'mid' | 'high'
          is_recurring?: boolean
          recurrence_type?: 'daily' | 'weekly' | 'monthly' | 'custom_days' | null
          recurrence_value?: number | null
          recurrence_day_of_month?: number | null
          due_date?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          last_occurrence_date?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          priority?: 'low' | 'mid' | 'high'
          is_recurring?: boolean
          recurrence_type?: 'daily' | 'weekly' | 'monthly' | 'custom_days' | null
          recurrence_value?: number | null
          recurrence_day_of_month?: number | null
          due_date?: string | null
          completed?: boolean
          completed_at?: string | null
          last_occurrence_date?: string | null
        }
      }
      airbnb_income: {
        Row: {
          id: string
          user_id: string
          amount: number
          description: string
          is_recurring: boolean
          recurring_day: number | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          description: string
          is_recurring?: boolean
          recurring_day?: number | null
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          description?: string
          is_recurring?: boolean
          recurring_day?: number | null
          date?: string
        }
      }
      airbnb_expenses: {
        Row: {
          id: string
          user_id: string
          amount: number
          description: string
          category: string
          is_recurring: boolean
          recurring_day: number | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          description: string
          category: string
          is_recurring?: boolean
          recurring_day?: number | null
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          description?: string
          category?: string
          is_recurring?: boolean
          recurring_day?: number | null
          date?: string
        }
      }
      airbnb_products: {
        Row: {
          id: string
          user_id: string
          name: string
          weight: string | null
          brand: string | null
          supplier: string | null
          last_price: number | null
          last_purchase_date: string | null
          inventory_level: 'full' | 'medium' | 'low' | 'none' | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          weight?: string | null
          brand?: string | null
          supplier?: string | null
          last_price?: number | null
          last_purchase_date?: string | null
          inventory_level?: 'full' | 'medium' | 'low' | 'none' | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          weight?: string | null
          brand?: string | null
          supplier?: string | null
          last_price?: number | null
          last_purchase_date?: string | null
          inventory_level?: 'full' | 'medium' | 'low' | 'none' | null
        }
      }
      airbnb_carts: {
        Row: {
          id: string
          user_id: string
          total_amount: number
          supplier: string
          date: string
          is_completed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_amount: number
          supplier: string
          date: string
          is_completed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          total_amount?: number
          supplier?: string
          date?: string
          is_completed?: boolean
        }
      }
      airbnb_cart_items: {
        Row: {
          id: string
          cart_id: string
          product_id: string | null
          product_name: string
          weight: string | null
          brand: string | null
          price: number
          supplier: string
          created_at: string
        }
        Insert: {
          id?: string
          cart_id: string
          product_id?: string | null
          product_name: string
          weight?: string | null
          brand?: string | null
          price: number
          supplier: string
          created_at?: string
        }
        Update: {
          id?: string
          cart_id?: string
          product_id?: string | null
          product_name?: string
          weight?: string | null
          brand?: string | null
          price?: number
          supplier?: string
        }
      }
      wedding_categories: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
        }
      }
      wedding_expenses: {
        Row: {
          id: string
          user_id: string
          amount: number
          description: string
          category_id: string | null
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          description: string
          category_id?: string | null
          date: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          description?: string
          category_id?: string | null
          date?: string
          created_at?: string
        }
      }
      wedding_budgets: {
        Row: {
          id: string
          user_id: string
          name: string
          initial_balance: number
          start_date: string | null
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          initial_balance?: number
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          initial_balance?: number
          start_date?: string | null
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      wedding_budget_items: {
        Row: {
          id: string
          budget_id: string
          description: string
          amount: number
          type: 'income' | 'expense'
          category_id: string | null
          is_real: boolean
          date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          budget_id: string
          description: string
          amount: number
          type: 'income' | 'expense'
          category_id?: string | null
          is_real?: boolean
          date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          budget_id?: string
          description?: string
          amount?: number
          type?: 'income' | 'expense'
          category_id?: string | null
          is_real?: boolean
          date?: string | null
          created_at?: string
        }
      }
      wedding_quotes: {
        Row: {
          id: string
          user_id: string
          person_name: string
          contact_info: string | null
          category_id: string | null
          concept: string
          price: number
          details: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          person_name: string
          contact_info?: string | null
          category_id?: string | null
          concept: string
          price: number
          details?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          person_name?: string
          contact_info?: string | null
          category_id?: string | null
          concept?: string
          price?: number
          details?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      wedding_folders: {
        Row: {
          id: string
          user_id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      wedding_notes: {
        Row: {
          id: string
          user_id: string
          folder_id: string
          title: string
          content: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          folder_id: string
          title: string
          content?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          folder_id?: string
          title?: string
          content?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

