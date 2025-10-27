export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  graphql_public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  public: {
    Tables: {
      ai_generations: {
        Row: {
          assumptions: string | null;
          created_at: string;
          error_message: string | null;
          generated_calories: number | null;
          generated_carbs: number | null;
          generated_fats: number | null;
          generated_protein: number | null;
          generation_duration: number | null;
          id: string;
          meal_id: string | null;
          model_used: string | null;
          prompt: string;
          status: Database["public"]["Enums"]["ai_generation_status"];
          user_id: string;
        };
        Insert: {
          assumptions?: string | null;
          created_at?: string;
          error_message?: string | null;
          generated_calories?: number | null;
          generated_carbs?: number | null;
          generated_fats?: number | null;
          generated_protein?: number | null;
          generation_duration?: number | null;
          id?: string;
          meal_id?: string | null;
          model_used?: string | null;
          prompt: string;
          status?: Database["public"]["Enums"]["ai_generation_status"];
          user_id: string;
        };
        Update: {
          assumptions?: string | null;
          created_at?: string;
          error_message?: string | null;
          generated_calories?: number | null;
          generated_carbs?: number | null;
          generated_fats?: number | null;
          generated_protein?: number | null;
          generation_duration?: number | null;
          id?: string;
          meal_id?: string | null;
          model_used?: string | null;
          prompt?: string;
          status?: Database["public"]["Enums"]["ai_generation_status"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_generations_meal_id_fkey";
            columns: ["meal_id"];
            isOneToOne: false;
            referencedRelation: "meals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_generations_meal_id_fkey";
            columns: ["meal_id"];
            isOneToOne: false;
            referencedRelation: "meals_with_latest_ai";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_generations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      calorie_goals: {
        Row: {
          created_at: string;
          daily_goal: number;
          effective_from: string;
          id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          daily_goal: number;
          effective_from: string;
          id?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          daily_goal?: number;
          effective_from?: string;
          id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "calorie_goals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      error_logs: {
        Row: {
          context: Json | null;
          created_at: string;
          error_details: Json | null;
          error_message: string;
          error_type: string;
          id: string;
          user_id: string | null;
        };
        Insert: {
          context?: Json | null;
          created_at?: string;
          error_details?: Json | null;
          error_message: string;
          error_type: string;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          context?: Json | null;
          created_at?: string;
          error_details?: Json | null;
          error_message?: string;
          error_type?: string;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "error_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      meals: {
        Row: {
          calories: number;
          carbs: number | null;
          category: Database["public"]["Enums"]["meal_category"] | null;
          created_at: string;
          description: string;
          fats: number | null;
          id: string;
          input_method: Database["public"]["Enums"]["input_method_type"];
          meal_timestamp: string;
          protein: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          calories: number;
          carbs?: number | null;
          category?: Database["public"]["Enums"]["meal_category"] | null;
          created_at?: string;
          description: string;
          fats?: number | null;
          id?: string;
          input_method: Database["public"]["Enums"]["input_method_type"];
          meal_timestamp: string;
          protein?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          calories?: number;
          carbs?: number | null;
          category?: Database["public"]["Enums"]["meal_category"] | null;
          created_at?: string;
          description?: string;
          fats?: number | null;
          id?: string;
          input_method?: Database["public"]["Enums"]["input_method_type"];
          meal_timestamp?: string;
          protein?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "meals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      daily_progress: {
        Row: {
          calorie_goal: number | null;
          date: string | null;
          percentage: number | null;
          total_calories: number | null;
          total_carbs: number | null;
          total_fats: number | null;
          total_protein: number | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "meals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      meals_with_latest_ai: {
        Row: {
          ai_assumptions: string | null;
          ai_generation_duration: number | null;
          ai_generation_id: string | null;
          ai_model_used: string | null;
          ai_prompt: string | null;
          calories: number | null;
          carbs: number | null;
          category: Database["public"]["Enums"]["meal_category"] | null;
          created_at: string | null;
          description: string | null;
          fats: number | null;
          id: string | null;
          input_method: Database["public"]["Enums"]["input_method_type"] | null;
          meal_timestamp: string | null;
          protein: number | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "meals_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      get_current_calorie_goal: {
        Args: { target_date?: string; user_uuid: string };
        Returns: number;
      };
      get_latest_ai_generation: {
        Args: { meal_uuid: string };
        Returns: {
          assumptions: string;
          created_at: string;
          generated_calories: number;
          generated_carbs: number;
          generated_fats: number;
          generated_protein: number;
          generation_duration: number;
          id: string;
          model_used: string;
          prompt: string;
          status: Database["public"]["Enums"]["ai_generation_status"];
        }[];
      };
    };
    Enums: {
      ai_generation_status: "pending" | "completed" | "failed";
      input_method_type: "ai" | "manual" | "ai-edited";
      meal_category: "breakfast" | "lunch" | "dinner" | "snack" | "other";
    };
    CompositeTypes: Record<never, never>;
  };
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      ai_generation_status: ["pending", "completed", "failed"],
      input_method_type: ["ai", "manual", "ai-edited"],
      meal_category: ["breakfast", "lunch", "dinner", "snack", "other"],
    },
  },
} as const;
