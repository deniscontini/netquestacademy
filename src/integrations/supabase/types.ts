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
      achievements: {
        Row: {
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          owner_id: string
          requirement_type: string
          requirement_value: number
          xp_reward: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          owner_id: string
          requirement_type: string
          requirement_value?: number
          xp_reward?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          owner_id?: string
          requirement_type?: string
          requirement_value?: number
          xp_reward?: number
        }
        Relationships: []
      }
      admin_students: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          student_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          student_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          student_id?: string
        }
        Relationships: []
      }
      certificate_templates: {
        Row: {
          accent_color: string | null
          background_color: string | null
          course_id: string | null
          created_at: string
          font_family: string | null
          footer_text: string | null
          id: string
          is_default: boolean
          logo_url: string | null
          owner_id: string
          primary_color: string | null
          signature_name: string | null
          signature_title: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          course_id?: string | null
          created_at?: string
          font_family?: string | null
          footer_text?: string | null
          id?: string
          is_default?: boolean
          logo_url?: string | null
          owner_id: string
          primary_color?: string | null
          signature_name?: string | null
          signature_title?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          course_id?: string | null
          created_at?: string
          font_family?: string | null
          footer_text?: string | null
          id?: string
          is_default?: boolean
          logo_url?: string | null
          owner_id?: string
          primary_color?: string | null
          signature_name?: string | null
          signature_title?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificate_templates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_code: string
          completion_date: string
          course_id: string
          course_title: string
          created_at: string
          id: string
          issued_at: string
          issued_by: string
          pdf_url: string | null
          student_name: string
          template_id: string | null
          user_id: string
        }
        Insert: {
          certificate_code?: string
          completion_date?: string
          course_id: string
          course_title: string
          created_at?: string
          id?: string
          issued_at?: string
          issued_by: string
          pdf_url?: string | null
          student_name: string
          template_id?: string | null
          user_id: string
        }
        Update: {
          certificate_code?: string
          completion_date?: string
          course_id?: string
          course_title?: string
          created_at?: string
          id?: string
          issued_at?: string
          issued_by?: string
          pdf_url?: string | null
          student_name?: string
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          bibliography: string | null
          created_at: string
          curriculum: string | null
          description: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          icon: string
          id: string
          is_active: boolean
          order_index: number
          owner_id: string
          pdf_url: string | null
          syllabus: string | null
          title: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          bibliography?: string | null
          created_at?: string
          curriculum?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          icon?: string
          id?: string
          is_active?: boolean
          order_index?: number
          owner_id: string
          pdf_url?: string | null
          syllabus?: string | null
          title: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          bibliography?: string | null
          created_at?: string
          curriculum?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          icon?: string
          id?: string
          is_active?: boolean
          order_index?: number
          owner_id?: string
          pdf_url?: string | null
          syllabus?: string | null
          title?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: []
      }
      labs: {
        Row: {
          created_at: string
          description: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          expected_commands: Json
          hints: Json | null
          id: string
          instructions: string
          is_active: boolean
          module_id: string
          order_index: number
          owner_id: string
          title: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          expected_commands?: Json
          hints?: Json | null
          id?: string
          instructions: string
          is_active?: boolean
          module_id: string
          order_index?: number
          owner_id: string
          title: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          expected_commands?: Json
          hints?: Json | null
          id?: string
          instructions?: string
          is_active?: boolean
          module_id?: string
          order_index?: number
          owner_id?: string
          title?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "labs_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          is_active: boolean
          module_id: string
          order_index: number
          owner_id: string
          title: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          content?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          module_id: string
          order_index?: number
          owner_id: string
          title: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          content?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_active?: boolean
          module_id?: string
          order_index?: number
          owner_id?: string
          title?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      master_admins: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          master_id: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          master_id: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          master_id?: string
        }
        Relationships: []
      }
      modules: {
        Row: {
          course_id: string | null
          created_at: string
          description: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"]
          icon: string
          id: string
          is_active: boolean
          order_index: number
          owner_id: string
          prerequisite_module_id: string | null
          title: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          icon?: string
          id?: string
          is_active?: boolean
          order_index?: number
          owner_id: string
          prerequisite_module_id?: string | null
          title: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          course_id?: string | null
          created_at?: string
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"]
          icon?: string
          id?: string
          is_active?: boolean
          order_index?: number
          owner_id?: string
          prerequisite_module_id?: string | null
          title?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modules_prerequisite_module_id_fkey"
            columns: ["prerequisite_module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_orders: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          pagseguro_checkout_id: string | null
          pagseguro_subscription_id: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          id?: string
          pagseguro_checkout_id?: string | null
          pagseguro_subscription_id?: string | null
          plan: Database["public"]["Enums"]["subscription_plan"]
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          pagseguro_checkout_id?: string | null
          pagseguro_subscription_id?: string | null
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          last_activity_at: string | null
          level: number
          streak_days: number
          updated_at: string
          user_id: string
          username: string | null
          xp: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          last_activity_at?: string | null
          level?: number
          streak_days?: number
          updated_at?: string
          user_id: string
          username?: string | null
          xp?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          last_activity_at?: string | null
          level?: number
          streak_days?: number
          updated_at?: string
          user_id?: string
          username?: string | null
          xp?: number
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          created_at: string
          explanation: string | null
          id: string
          lesson_id: string
          options: Json
          order_index: number
          owner_id: string
          question: string
          updated_at: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          explanation?: string | null
          id?: string
          lesson_id: string
          options?: Json
          order_index?: number
          owner_id: string
          question: string
          updated_at?: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          explanation?: string | null
          id?: string
          lesson_id?: string
          options?: Json
          order_index?: number
          owner_id?: string
          question?: string
          updated_at?: string
          xp_reward?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_course_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          course_id: string
          created_at: string
          expires_at: string | null
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          course_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          course_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lab_progress: {
        Row: {
          attempts: number
          best_time_seconds: number | null
          commands_used: Json | null
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          lab_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          best_time_seconds?: number | null
          commands_used?: Json | null
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          lab_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          best_time_seconds?: number | null
          commands_used?: Json | null
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          lab_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lab_progress_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lab_progress_lab_id_fkey"
            columns: ["lab_id"]
            isOneToOne: false
            referencedRelation: "labs_public"
            referencedColumns: ["id"]
          },
        ]
      }
      user_lesson_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_module_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string
          created_at: string
          expires_at: string | null
          id: string
          module_id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          created_at?: string
          expires_at?: string | null
          id?: string
          module_id: string
          notes?: string | null
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          module_id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_assignments_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_module_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          is_unlocked: boolean
          module_id: string
          progress_percentage: number
          started_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          is_unlocked?: boolean
          module_id: string
          progress_percentage?: number
          started_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          is_unlocked?: boolean
          module_id?: string
          progress_percentage?: number
          started_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_progress: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          lesson_id: string
          score: number
          total_questions: number
          user_id: string
          xp_earned: number
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          lesson_id: string
          score?: number
          total_questions?: number
          user_id: string
          xp_earned?: number
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          lesson_id?: string
          score?: number
          total_questions?: number
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          plan: Database["public"]["Enums"]["subscription_plan"]
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          plan?: Database["public"]["Enums"]["subscription_plan"]
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      xp_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          source_id: string | null
          source_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          source_id?: string | null
          source_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          source_id?: string | null
          source_type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      labs_public: {
        Row: {
          created_at: string | null
          description: string | null
          difficulty: Database["public"]["Enums"]["difficulty_level"] | null
          hints: Json | null
          id: string | null
          instructions: string | null
          is_active: boolean | null
          module_id: string | null
          order_index: number | null
          owner_id: string | null
          title: string | null
          updated_at: string | null
          xp_reward: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          hints?: Json | null
          id?: string | null
          instructions?: string | null
          is_active?: boolean | null
          module_id?: string | null
          order_index?: number | null
          owner_id?: string | null
          title?: string | null
          updated_at?: string | null
          xp_reward?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          difficulty?: Database["public"]["Enums"]["difficulty_level"] | null
          hints?: Json | null
          id?: string | null
          instructions?: string | null
          is_active?: boolean | null
          module_id?: string | null
          order_index?: number | null
          owner_id?: string | null
          title?: string | null
          updated_at?: string | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "labs_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_public: {
        Row: {
          avatar_url: string | null
          id: string | null
          level: number | null
          user_id: string | null
          username: string | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          id?: string | null
          level?: number | null
          user_id?: string | null
          username?: string | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          id?: string | null
          level?: number | null
          user_id?: string | null
          username?: string | null
          xp?: number | null
        }
        Relationships: []
      }
      quiz_questions_public: {
        Row: {
          created_at: string | null
          id: string | null
          lesson_id: string | null
          options: Json | null
          order_index: number | null
          owner_id: string | null
          question: string | null
          updated_at: string | null
          xp_reward: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          lesson_id?: string | null
          options?: never
          order_index?: number | null
          owner_id?: string | null
          question?: string | null
          updated_at?: string | null
          xp_reward?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          lesson_id?: string | null
          options?: never
          order_index?: number | null
          owner_id?: string | null
          question?: string | null
          updated_at?: string | null
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      award_achievement: {
        Args: { p_achievement_id: string; p_user_id: string }
        Returns: boolean
      }
      calculate_level: { Args: { xp_amount: number }; Returns: number }
      can_access_module: {
        Args: { p_module_id: string; p_user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_of_student: {
        Args: { _admin_id: string; _student_id: string }
        Returns: boolean
      }
      is_master_of_admin: {
        Args: { _admin_id: string; _master_id: string }
        Returns: boolean
      }
      is_student_of_owner: {
        Args: { _owner_id: string; _student_id: string }
        Returns: boolean
      }
      sanitize_quiz_options: { Args: { options: Json }; Returns: Json }
      verify_quiz_answer: {
        Args: { p_question_id: string; p_selected_option_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user" | "master"
      difficulty_level: "iniciante" | "intermediario" | "avancado"
      subscription_plan: "gratuito" | "pro" | "enterprise" | "basico"
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
      app_role: ["admin", "user", "master"],
      difficulty_level: ["iniciante", "intermediario", "avancado"],
      subscription_plan: ["gratuito", "pro", "enterprise", "basico"],
    },
  },
} as const
