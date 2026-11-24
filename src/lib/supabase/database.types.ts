// Generado automáticamente desde el esquema real del proyecto Supabase (appcomercialnegocio).
// No editar a mano: regenerar con `supabase gen types typescript` cuando cambie el esquema.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      base_batches: {
        Row: {
          branch_id: string
          created_at: string
          created_by: string | null
          flavor_id: string | null
          id: string
          is_packed: boolean
          juice_type: string
          organization_id: string
          raw_cost: number
        }
        Insert: {
          branch_id: string
          created_at?: string
          created_by?: string | null
          flavor_id?: string | null
          id?: string
          is_packed?: boolean
          juice_type: string
          organization_id: string
          raw_cost?: number
        }
        Update: {
          branch_id?: string
          created_at?: string
          created_by?: string | null
          flavor_id?: string | null
          id?: string
          is_packed?: boolean
          juice_type?: string
          organization_id?: string
          raw_cost?: number
        }
        Relationships: [
          { foreignKeyName: "base_batches_branch_id_fkey"; columns: ["branch_id"]; isOneToOne: false; referencedRelation: "branches"; referencedColumns: ["id"] },
          { foreignKeyName: "base_batches_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "organization_members"; referencedColumns: ["id"] },
          { foreignKeyName: "base_batches_flavor_id_fkey"; columns: ["flavor_id"]; isOneToOne: false; referencedRelation: "flavors"; referencedColumns: ["id"] },
          { foreignKeyName: "base_batches_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
        ]
      }
      batch_materials: {
        Row: {
          batch_id: string
          cost: number
          id: string
          inventory_item_id: string | null
          name: string
          qty: number
        }
        Insert: {
          batch_id: string
          cost?: number
          id?: string
          inventory_item_id?: string | null
          name: string
          qty: number
        }
        Update: {
          batch_id?: string
          cost?: number
          id?: string
          inventory_item_id?: string | null
          name?: string
          qty?: number
        }
        Relationships: [
          { foreignKeyName: "batch_materials_batch_id_fkey"; columns: ["batch_id"]; isOneToOne: false; referencedRelation: "base_batches"; referencedColumns: ["id"] },
          { foreignKeyName: "batch_materials_inventory_item_id_fkey"; columns: ["inventory_item_id"]; isOneToOne: false; referencedRelation: "inventory_items"; referencedColumns: ["id"] },
        ]
      }
      branches: {
        Row: {
          active: boolean
          address: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          address?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          address?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "branches_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
        ]
      }
      clients: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          id_number: string | null
          id_type: string
          name: string
          organization_id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          id_number?: string | null
          id_type?: string
          name: string
          organization_id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          id_number?: string | null
          id_type?: string
          name?: string
          organization_id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "clients_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
        ]
      }
      finished_lots: {
        Row: {
          waste_reason: string | null
          batch_id: string
          branch_id: string
          current_qty: number
          flavor: string
          id: string
          initial_qty: number
          organization_id: string
          packed_at: string
          product_id: string | null
          product_name: string
          size_oz: number
          unit_cost: number
          waste_cost: number
          waste_qty: number
        }
        Insert: {
          waste_reason?: string | null
          batch_id: string
          branch_id: string
          current_qty: number
          flavor: string
          id?: string
          initial_qty: number
          organization_id: string
          packed_at?: string
          product_id?: string | null
          product_name: string
          size_oz: number
          unit_cost?: number
          waste_cost?: number
          waste_qty?: number
        }
        Update: {
          waste_reason?: string | null
          batch_id?: string
          branch_id?: string
          current_qty?: number
          flavor?: string
          id?: string
          initial_qty?: number
          organization_id?: string
          packed_at?: string
          product_id?: string | null
          product_name?: string
          size_oz?: number
          unit_cost?: number
          waste_cost?: number
          waste_qty?: number
        }
        Relationships: [
          { foreignKeyName: "finished_lots_batch_id_fkey"; columns: ["batch_id"]; isOneToOne: false; referencedRelation: "base_batches"; referencedColumns: ["id"] },
          { foreignKeyName: "finished_lots_branch_id_fkey"; columns: ["branch_id"]; isOneToOne: false; referencedRelation: "branches"; referencedColumns: ["id"] },
          { foreignKeyName: "finished_lots_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
          { foreignKeyName: "finished_lots_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
        ]
      }
      flavors: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          { foreignKeyName: "flavors_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
        ]
      }
      inventory_items: {
        Row: {
          branch_id: string
          category: string
          cost: number
          created_at: string
          id: string
          name: string
          organization_id: string
          size_oz: number | null
          stock: number
          updated_at: string
        }
        Insert: {
          branch_id: string
          category: string
          cost?: number
          created_at?: string
          id?: string
          name: string
          organization_id: string
          size_oz?: number | null
          stock?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string
          category?: string
          cost?: number
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          size_oz?: number | null
          stock?: number
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "inventory_items_branch_id_fkey"; columns: ["branch_id"]; isOneToOne: false; referencedRelation: "branches"; referencedColumns: ["id"] },
          { foreignKeyName: "inventory_items_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
        ]
      }
      organization_members: {
        Row: {
          active: boolean
          branch_id: string | null
          created_at: string
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          active?: boolean
          branch_id?: string | null
          created_at?: string
          id?: string
          organization_id: string
          role: string
          user_id: string
        }
        Update: {
          active?: boolean
          branch_id?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          { foreignKeyName: "organization_members_branch_id_fkey"; columns: ["branch_id"]; isOneToOne: false; referencedRelation: "branches"; referencedColumns: ["id"] },
          { foreignKeyName: "organization_members_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
        ]
      }
      organizations: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      payroll_bills: {
        Row: {
          amount: number
          concept: string
          created_at: string
          employee_name: string
          id: string
          member_id: string
          organization_id: string
          paid_amount: number
          status: string
        }
        Insert: {
          amount: number
          concept?: string
          created_at?: string
          employee_name: string
          id?: string
          member_id: string
          organization_id: string
          paid_amount?: number
          status: string
        }
        Update: {
          amount?: number
          concept?: string
          created_at?: string
          employee_name?: string
          id?: string
          member_id?: string
          organization_id?: string
          paid_amount?: number
          status?: string
        }
        Relationships: [
          { foreignKeyName: "payroll_bills_member_id_fkey"; columns: ["member_id"]; isOneToOne: false; referencedRelation: "organization_members"; referencedColumns: ["id"] },
          { foreignKeyName: "payroll_bills_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
        ]
      }
      payroll_payments: {
        Row: {
          amount: number
          bill_id: string
          cash_amount: number | null
          id: string
          method: string
          paid_at: string
          paid_by: string | null
          transfer_amount: number | null
        }
        Insert: {
          amount: number
          bill_id: string
          cash_amount?: number | null
          id?: string
          method: string
          paid_at?: string
          paid_by?: string | null
          transfer_amount?: number | null
        }
        Update: {
          amount?: number
          bill_id?: string
          cash_amount?: number | null
          id?: string
          method?: string
          paid_at?: string
          paid_by?: string | null
          transfer_amount?: number | null
        }
        Relationships: [
          { foreignKeyName: "payroll_payments_bill_id_fkey"; columns: ["bill_id"]; isOneToOne: false; referencedRelation: "payroll_bills"; referencedColumns: ["id"] },
          { foreignKeyName: "payroll_payments_paid_by_fkey"; columns: ["paid_by"]; isOneToOne: false; referencedRelation: "organization_members"; referencedColumns: ["id"] },
        ]
      }
      products: {
        Row: {
          active: boolean
          category: string
          created_at: string
          id: string
          name: string
          organization_id: string
          price: number
          size_oz: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string
          created_at?: string
          id?: string
          name: string
          organization_id: string
          price: number
          size_oz?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          price?: number
          size_oz?: number | null
          updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "products_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ticket_items: {
        Row: {
          finished_lot_id: string | null
          id: string
          name: string
          price: number
          product_id: string | null
          qty: number
          ticket_id: string
        }
        Insert: {
          finished_lot_id?: string | null
          id?: string
          name: string
          price: number
          product_id?: string | null
          qty: number
          ticket_id: string
        }
        Update: {
          finished_lot_id?: string | null
          id?: string
          name?: string
          price?: number
          product_id?: string | null
          qty?: number
          ticket_id?: string
        }
        Relationships: [
          { foreignKeyName: "ticket_items_finished_lot_id_fkey"; columns: ["finished_lot_id"]; isOneToOne: false; referencedRelation: "finished_lots"; referencedColumns: ["id"] },
          { foreignKeyName: "ticket_items_product_id_fkey"; columns: ["product_id"]; isOneToOne: false; referencedRelation: "products"; referencedColumns: ["id"] },
          { foreignKeyName: "ticket_items_ticket_id_fkey"; columns: ["ticket_id"]; isOneToOne: false; referencedRelation: "tickets"; referencedColumns: ["id"] },
        ]
      }
      ticket_payments: {
        Row: {
          amount: number
          cash_amount: number | null
          id: string
          method: string
          paid_at: string
          received_by: string | null
          ticket_id: string
          transfer_amount: number | null
        }
        Insert: {
          amount: number
          cash_amount?: number | null
          id?: string
          method: string
          paid_at?: string
          received_by?: string | null
          ticket_id: string
          transfer_amount?: number | null
        }
        Update: {
          amount?: number
          cash_amount?: number | null
          id?: string
          method?: string
          paid_at?: string
          received_by?: string | null
          ticket_id?: string
          transfer_amount?: number | null
        }
        Relationships: [
          { foreignKeyName: "ticket_payments_received_by_fkey"; columns: ["received_by"]; isOneToOne: false; referencedRelation: "organization_members"; referencedColumns: ["id"] },
          { foreignKeyName: "ticket_payments_ticket_id_fkey"; columns: ["ticket_id"]; isOneToOne: false; referencedRelation: "tickets"; referencedColumns: ["id"] },
        ]
      }
      tickets: {
        Row: {
          branch_id: string
          cash_amount: number | null
          client_id: string | null
          client_name: string
          created_at: string
          created_by: string | null
          id: string
          organization_id: string
          paid_amount: number
          payment_method: string | null
          sale_date: string
          status: string
          total: number
          transfer_amount: number | null
        }
        Insert: {
          branch_id: string
          cash_amount?: number | null
          client_id?: string | null
          client_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id: string
          paid_amount?: number
          payment_method?: string | null
          sale_date?: string
          status: string
          total: number
          transfer_amount?: number | null
        }
        Update: {
          branch_id?: string
          cash_amount?: number | null
          client_id?: string | null
          client_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          organization_id?: string
          paid_amount?: number
          payment_method?: string | null
          sale_date?: string
          status?: string
          total?: number
          transfer_amount?: number | null
        }
        Relationships: [
          { foreignKeyName: "tickets_branch_id_fkey"; columns: ["branch_id"]; isOneToOne: false; referencedRelation: "branches"; referencedColumns: ["id"] },
          { foreignKeyName: "tickets_client_id_fkey"; columns: ["client_id"]; isOneToOne: false; referencedRelation: "clients"; referencedColumns: ["id"] },
          { foreignKeyName: "tickets_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "organization_members"; referencedColumns: ["id"] },
          { foreignKeyName: "tickets_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
        ]
      }
      transaction_categories: {
        Row: {
          id: string
          label: string
          organization_id: string | null
          type: string
          value: string
        }
        Insert: {
          id?: string
          label: string
          organization_id?: string | null
          type: string
          value: string
        }
        Update: {
          id?: string
          label?: string
          organization_id?: string | null
          type?: string
          value?: string
        }
        Relationships: [
          { foreignKeyName: "transaction_categories_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
        ]
      }
      transactions: {
        Row: {
          amount: number
          branch_id: string
          category_id: string | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          occurred_at: string
          organization_id: string
          reference_id: string | null
          reference_type: string | null
          type: string
        }
        Insert: {
          amount: number
          branch_id: string
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          occurred_at?: string
          organization_id: string
          reference_id?: string | null
          reference_type?: string | null
          type: string
        }
        Update: {
          amount?: number
          branch_id?: string
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          occurred_at?: string
          organization_id?: string
          reference_id?: string | null
          reference_type?: string | null
          type?: string
        }
        Relationships: [
          { foreignKeyName: "transactions_branch_id_fkey"; columns: ["branch_id"]; isOneToOne: false; referencedRelation: "branches"; referencedColumns: ["id"] },
          { foreignKeyName: "transactions_category_id_fkey"; columns: ["category_id"]; isOneToOne: false; referencedRelation: "transaction_categories"; referencedColumns: ["id"] },
          { foreignKeyName: "transactions_created_by_fkey"; columns: ["created_by"]; isOneToOne: false; referencedRelation: "organization_members"; referencedColumns: ["id"] },
          { foreignKeyName: "transactions_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
        ]
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

// Atajos cómodos para el resto de la app
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
