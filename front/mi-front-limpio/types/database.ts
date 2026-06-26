// ─────────────────────────────────────────────────────────────────────────────
// FamilyHub — Supabase Database Types
// Generated manually from migrations 001–006.
// Keep in sync with supabase/migrations/*.sql
// ─────────────────────────────────────────────────────────────────────────────

type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          nombre: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
          notification_prefs: Json;
        };
        Insert: {
          id?: string;
          email: string;
          nombre: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          notification_prefs?: Json;
        };
        Update: {
          id?: string;
          email?: string;
          nombre?: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
          notification_prefs?: Json;
        };
        Relationships: [];
      };

      households: {
        Row: {
          id: string;
          nombre: string;
          tipo: 'nucleo' | 'con_abuelos' | 'separados' | 'otro' | null;
          foto_url: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          tipo?: 'nucleo' | 'con_abuelos' | 'separados' | 'otro' | null;
          foto_url?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          tipo?: 'nucleo' | 'con_abuelos' | 'separados' | 'otro' | null;
          foto_url?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'households_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      household_members: {
        Row: {
          id: string;
          user_id: string;
          household_id: string;
          rol: 'coordinador' | 'adulto' | 'adolescente' | 'adulto_mayor' | null;
          joined_at: string;
          invited_by: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          household_id: string;
          rol?: 'coordinador' | 'adulto' | 'adolescente' | 'adulto_mayor' | null;
          joined_at?: string;
          invited_by?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          household_id?: string;
          rol?: 'coordinador' | 'adulto' | 'adolescente' | 'adulto_mayor' | null;
          joined_at?: string;
          invited_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'household_members_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'household_members_household_id_fkey';
            columns: ['household_id'];
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'household_members_invited_by_fkey';
            columns: ['invited_by'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      invitations: {
        Row: {
          id: string;
          household_id: string;
          token: string;
          rol_asignado: 'coordinador' | 'adulto' | 'adolescente' | 'adulto_mayor' | null;
          created_by: string | null;
          expires_at: string;
          used_at: string | null;
          used_by: string | null;
        };
        Insert: {
          id?: string;
          household_id: string;
          token?: string;
          rol_asignado?: 'coordinador' | 'adulto' | 'adolescente' | 'adulto_mayor' | null;
          created_by?: string | null;
          expires_at?: string;
          used_at?: string | null;
          used_by?: string | null;
        };
        Update: {
          id?: string;
          household_id?: string;
          token?: string;
          rol_asignado?: 'coordinador' | 'adulto' | 'adolescente' | 'adulto_mayor' | null;
          created_by?: string | null;
          expires_at?: string;
          used_at?: string | null;
          used_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'invitations_household_id_fkey';
            columns: ['household_id'];
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invitations_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invitations_used_by_fkey';
            columns: ['used_by'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      schedules: {
        Row: {
          id: string;
          household_id: string;
          user_id: string;
          title: string;
          start_time: string;
          end_time: string | null;
          recurrence: 'daily' | 'weekly' | 'monthly' | 'none';
          recurrence_days: number[] | null;
          recurrence_day: number | null;
          color: string;
          category: 'trabajo' | 'escuela' | 'deporte' | 'salud' | 'familia' | 'personal' | 'otro';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id: string;
          title: string;
          start_time: string;
          end_time?: string | null;
          recurrence?: 'daily' | 'weekly' | 'monthly' | 'none';
          recurrence_days?: number[] | null;
          recurrence_day?: number | null;
          color?: string;
          category?: 'trabajo' | 'escuela' | 'deporte' | 'salud' | 'familia' | 'personal' | 'otro';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          user_id?: string;
          title?: string;
          start_time?: string;
          end_time?: string | null;
          recurrence?: 'daily' | 'weekly' | 'monthly' | 'none';
          recurrence_days?: number[] | null;
          recurrence_day?: number | null;
          color?: string;
          category?: 'trabajo' | 'escuela' | 'deporte' | 'salud' | 'familia' | 'personal' | 'otro';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'schedules_household_id_fkey';
            columns: ['household_id'];
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'schedules_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      tasks: {
        Row: {
          id: string;
          household_id: string;
          created_by: string;
          assigned_to: string | null;
          title: string;
          description: string | null;
          priority: 'alta' | 'media' | 'baja';
          status: 'pendiente' | 'en_progreso' | 'completada';
          due_date: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          created_by: string;
          assigned_to?: string | null;
          title: string;
          description?: string | null;
          priority?: 'alta' | 'media' | 'baja';
          status?: 'pendiente' | 'en_progreso' | 'completada';
          due_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          created_by?: string;
          assigned_to?: string | null;
          title?: string;
          description?: string | null;
          priority?: 'alta' | 'media' | 'baja';
          status?: 'pendiente' | 'en_progreso' | 'completada';
          due_date?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tasks_household_id_fkey';
            columns: ['household_id'];
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tasks_assigned_to_fkey';
            columns: ['assigned_to'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      events: {
        Row: {
          id: string;
          household_id: string;
          created_by: string;
          assigned_to: string | null;
          title: string;
          description: string | null;
          start_at: string;
          end_at: string | null;
          location: string | null;
          category: 'trabajo' | 'escuela' | 'familia' | 'personal' | 'salud' | 'deporte' | 'otro';
          color: string;
          all_day: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          created_by: string;
          assigned_to?: string | null;
          title: string;
          description?: string | null;
          start_at: string;
          end_at?: string | null;
          location?: string | null;
          category?: 'trabajo' | 'escuela' | 'familia' | 'personal' | 'salud' | 'deporte' | 'otro';
          color?: string;
          all_day?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          created_by?: string;
          assigned_to?: string | null;
          title?: string;
          description?: string | null;
          start_at?: string;
          end_at?: string | null;
          location?: string | null;
          category?: 'trabajo' | 'escuela' | 'familia' | 'personal' | 'salud' | 'deporte' | 'otro';
          color?: string;
          all_day?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'events_household_id_fkey';
            columns: ['household_id'];
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'events_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'events_assigned_to_fkey';
            columns: ['assigned_to'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      products: {
        Row: {
          id: string;
          household_id: string;
          name: string;
          category: string | null;
          description: string | null;
          current_stock: number;
          unit: string | null;
          expiry_date: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          name: string;
          category?: string | null;
          description?: string | null;
          current_stock?: number;
          unit?: string | null;
          expiry_date?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          name?: string;
          category?: string | null;
          description?: string | null;
          current_stock?: number;
          unit?: string | null;
          expiry_date?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'products_household_id_fkey';
            columns: ['household_id'];
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'products_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      inventory_items: {
        Row: {
          id: string;
          household_id: string;
          product_id: string;
          quantity: number;
          expiry_date: string | null;
          purchase_date: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          product_id: string;
          quantity: number;
          expiry_date?: string | null;
          purchase_date?: string | null;
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          product_id?: string;
          quantity?: number;
          expiry_date?: string | null;
          purchase_date?: string | null;
          notes?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inventory_items_household_id_fkey';
            columns: ['household_id'];
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventory_items_product_id_fkey';
            columns: ['product_id'];
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventory_items_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      inventory_templates: {
        Row: {
          id: string;
          household_id: string;
          product_id: string;
          ideal_quantity: number;
          priority: 'high' | 'medium' | 'low';
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          product_id: string;
          ideal_quantity: number;
          priority?: 'high' | 'medium' | 'low';
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          product_id?: string;
          ideal_quantity?: number;
          priority?: 'high' | 'medium' | 'low';
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inventory_templates_household_id_fkey';
            columns: ['household_id'];
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventory_templates_product_id_fkey';
            columns: ['product_id'];
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventory_templates_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      stock_movements: {
        Row: {
          id: string;
          household_id: string;
          product_id: string;
          inventory_item_id: string | null;
          type: 'add' | 'remove' | 'expired' | 'adjustment';
          quantity: number;
          reason: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          product_id: string;
          inventory_item_id?: string | null;
          type: 'add' | 'remove' | 'expired' | 'adjustment';
          quantity: number;
          reason?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          product_id?: string;
          inventory_item_id?: string | null;
          type?: 'add' | 'remove' | 'expired' | 'adjustment';
          quantity?: number;
          reason?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'stock_movements_household_id_fkey';
            columns: ['household_id'];
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stock_movements_product_id_fkey';
            columns: ['product_id'];
            referencedRelation: 'products';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stock_movements_inventory_item_id_fkey';
            columns: ['inventory_item_id'];
            referencedRelation: 'inventory_items';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'stock_movements_created_by_fkey';
            columns: ['created_by'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };

      inventory_settings: {
        Row: {
          id: string;
          household_id: string;
          user_id: string | null;
          key: string;
          value: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          household_id: string;
          user_id?: string | null;
          key: string;
          value: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          household_id?: string;
          user_id?: string | null;
          key?: string;
          value?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inventory_settings_household_id_fkey';
            columns: ['household_id'];
            referencedRelation: 'households';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventory_settings_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };

    Views: Record<string, never>;

    Functions: {
      ensure_public_user: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      join_household_by_token: {
        Args: { p_token: string };
        Returns: {
          household_id: string | null;
          rol: string | null;
          error: string | null;
        };
      };
      create_household_rpc: {
        Args: { p_nombre: string; p_tipo?: string | null };
        Returns: {
          household_id: string | null;
          household: {
            id: string;
            nombre: string;
            tipo: string | null;
            foto_url: string | null;
            created_by: string | null;
            created_at: string;
          } | null;
          error: string | null;
        };
      };
      effective_uid: {
        Args: Record<string, never>;
        Returns: string | null;
      };
      debug_jwt: {
        Args: Record<string, never>;
        Returns: {
          auth_uid: string | null;
          auth_role: string | null;
          jwt_claim_sub: string | null;
          jwt_claim_role: string | null;
          jwt_claims_full: string | null;
          jwt_sub_from_json: string | null;
          effective_uid: string | null;
        };
      };
      debug_request_settings: {
        Args: Record<string, never>;
        Returns: Record<string, string>;
      };
      is_household_member: {
        Args: { p_household_id: string };
        Returns: boolean;
      };
      is_household_coordinator: {
        Args: { p_household_id: string };
        Returns: boolean;
      };
      shares_household_with: {
        Args: { p_user_id: string };
        Returns: boolean;
      };
    };

    Enums: Record<string, never>;

    CompositeTypes: Record<string, never>;
  };
};
