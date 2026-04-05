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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      blog_posts: {
        Row: {
          author: string | null
          category: string | null
          content: string | null
          cover_image: string | null
          created_at: string | null
          excerpt: string | null
          id: string
          published: boolean | null
          published_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          category?: string | null
          content?: string | null
          cover_image?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          published?: boolean | null
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string | null
          cover_image?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string
          published?: boolean | null
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      media_files: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          mime_type: string | null
          storage_url: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          mime_type?: string | null
          storage_url: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          mime_type?: string | null
          storage_url?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      page_sections: {
        Row: {
          content_type: string
          created_at: string
          id: string
          is_default: boolean
          label: string
          media_url: string | null
          media_urls: string[] | null
          metadata: Json | null
          page_id: string
          section_id: string
          sort_order: number
          subtitle: string | null
          text_value: string | null
          updated_at: string
        }
        Insert: {
          content_type: string
          created_at?: string
          id?: string
          is_default?: boolean
          label: string
          media_url?: string | null
          media_urls?: string[] | null
          metadata?: Json | null
          page_id: string
          section_id: string
          sort_order?: number
          subtitle?: string | null
          text_value?: string | null
          updated_at?: string
        }
        Update: {
          content_type?: string
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          media_url?: string | null
          media_urls?: string[] | null
          metadata?: Json | null
          page_id?: string
          section_id?: string
          sort_order?: number
          subtitle?: string | null
          text_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wedding_blog_posts: {
        Row: {
          author: string | null
          content: Json | null
          couple_name: string
          couple_names: string | null
          cover_image: string | null
          created_at: string
          date_text: string | null
          excerpt: string | null
          gallery_images: string[] | null
          id: string
          location: string | null
          photographer: string | null
          published: boolean | null
          read_time: string | null
          slug: string
          sort_order: number | null
          story_content: string | null
          subtitle: string | null
          tags: string[] | null
          title: string
          updated_at: string
          wedding_date: string | null
        }
        Insert: {
          author?: string | null
          content?: Json | null
          couple_name: string
          couple_names?: string | null
          cover_image?: string | null
          created_at?: string
          date_text?: string | null
          excerpt?: string | null
          gallery_images?: string[] | null
          id?: string
          location?: string | null
          photographer?: string | null
          published?: boolean | null
          read_time?: string | null
          slug: string
          sort_order?: number | null
          story_content?: string | null
          subtitle?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          wedding_date?: string | null
        }
        Update: {
          author?: string | null
          content?: Json | null
          couple_name?: string
          couple_names?: string | null
          cover_image?: string | null
          created_at?: string
          date_text?: string | null
          excerpt?: string | null
          gallery_images?: string[] | null
          id?: string
          location?: string | null
          photographer?: string | null
          published?: boolean | null
          read_time?: string | null
          slug?: string
          sort_order?: number | null
          story_content?: string | null
          subtitle?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          wedding_date?: string | null
        }
        Relationships: []
      }
      wedding_posts: {
        Row: {
          category: string | null
          content: string | null
          cover_path: string | null
          cover_url: string | null
          created_at: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          page_id: string
          published_at: string | null
          slug: string
          status: string | null
          subtitle: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          cover_path?: string | null
          cover_url?: string | null
          created_at?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          page_id: string
          published_at?: string | null
          slug: string
          status?: string | null
          subtitle?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          cover_path?: string | null
          cover_url?: string | null
          created_at?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          page_id?: string
          published_at?: string | null
          slug?: string
          status?: string | null
          subtitle?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      wedding_projects: {
        Row: {
          behind_the_scenes: string | null
          category: string
          couple_name: string
          cover_image: string | null
          created_at: string
          date_text: string | null
          description: string
          duration: string | null
          gallery_images: string[] | null
          has_blog: boolean | null
          id: string
          images: string[] | null
          location: string
          project_type: string
          slug: string
          sort_order: number | null
          tagline: string | null
          thumbnail: string | null
          updated_at: string
          video_url: string | null
          vimeo_url: string | null
        }
        Insert: {
          behind_the_scenes?: string | null
          category?: string
          couple_name: string
          cover_image?: string | null
          created_at?: string
          date_text?: string | null
          description?: string
          duration?: string | null
          gallery_images?: string[] | null
          has_blog?: boolean | null
          id?: string
          images?: string[] | null
          location: string
          project_type?: string
          slug: string
          sort_order?: number | null
          tagline?: string | null
          thumbnail?: string | null
          updated_at?: string
          video_url?: string | null
          vimeo_url?: string | null
        }
        Update: {
          behind_the_scenes?: string | null
          category?: string
          couple_name?: string
          cover_image?: string | null
          created_at?: string
          date_text?: string | null
          description?: string
          duration?: string | null
          gallery_images?: string[] | null
          has_blog?: boolean | null
          id?: string
          images?: string[] | null
          location?: string
          project_type?: string
          slug?: string
          sort_order?: number | null
          tagline?: string | null
          thumbnail?: string | null
          updated_at?: string
          video_url?: string | null
          vimeo_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    },
  },
} as const
