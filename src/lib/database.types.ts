export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskStatus = 'concluida' | 'em_andamento' | 'nao_iniciada';

export interface Database {
  public: {
    Tables: {
      system_settings: {
        Row: {
          id: string
          site_name: string
          site_description: string | null
          primary_color: string
          form_position: string
          header_style: string
          footer_style: string
          system_font_color: string
          default_header_description: string | null
          form_layout: string
          logo_url: string | null
          favicon_url: string | null
          footer_text: string | null
          layout_type: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          site_name?: string
          site_description?: string | null
          primary_color?: string
          form_position?: string
          header_style?: string
          footer_style?: string
          system_font_color?: string
          default_header_description?: string | null
          form_layout?: string
          logo_url?: string | null
          favicon_url?: string | null
          footer_text?: string | null
          layout_type?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          site_name?: string
          site_description?: string | null
          primary_color?: string
          form_position?: string
          header_style?: string
          footer_style?: string
          system_font_color?: string
          default_header_description?: string | null
          form_layout?: string
          logo_url?: string | null
          favicon_url?: string | null
          footer_text?: string | null
          layout_type?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      email_settings: {
        Row: {
          id: string
          smtp_host: string
          smtp_port: number
          smtp_ssl: boolean
          smtp_username: string
          smtp_password: string
          sender_email: string
          sender_name: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          smtp_host: string
          smtp_port: number
          smtp_ssl?: boolean
          smtp_username: string
          smtp_password: string
          sender_email: string
          sender_name: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          smtp_host?: string
          smtp_port?: number
          smtp_ssl?: boolean
          smtp_username?: string
          smtp_password?: string
          sender_email?: string
          sender_name?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      email_templates: {
        Row: {
          id: string
          type: string
          subject: string
          body: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          type: string
          subject: string
          body: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          type?: string
          subject?: string
          body?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          name: string
          email: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      projects: {
        Row: {
          id: number
          title: string
          position: number
          owner_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          title: string
          position?: number
          owner_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          title?: string
          position?: number
          owner_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      roles: {
        Row: {
          id: number
          name: string
          description: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          created_at?: string | null
        }
      }
      tasks: {
        Row: {
          id: number
          project_id: number | null
          title: string
          description: string | null
          due_date: string | null
          position: number
          assignee_id: string | null
          created_at: string | null
          updated_at: string | null
          completed: boolean
          priority: TaskPriority
          archived: boolean
          status: TaskStatus
          value: number | null
          actual_hours: number | null
        }
        Insert: {
          id?: number
          project_id?: number | null
          title: string
          description?: string | null
          due_date?: string | null
          position?: number
          assignee_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          completed?: boolean
          priority?: TaskPriority
          archived?: boolean
          status?: TaskStatus
          value?: number | null
          actual_hours?: number | null
        }
        Update: {
          id?: number
          project_id?: number | null
          title?: string
          description?: string | null
          due_date?: string | null
          position?: number
          assignee_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          completed?: boolean
          priority?: TaskPriority
          archived?: boolean
          status?: TaskStatus
          value?: number | null
          actual_hours?: number | null
        }
      }
      labels: {
        Row: {
          id: number
          name: string
          color: string
          owner_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: number
          name: string
          color: string
          owner_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: number
          name?: string
          color?: string
          owner_id?: string | null
          created_at?: string | null
        }
      }
      task_labels: {
        Row: {
          id: number
          task_id: number
          label_id: number
          created_at: string | null
        }
        Insert: {
          id?: number
          task_id: number
          label_id: number
          created_at?: string | null
        }
        Update: {
          id?: number
          task_id?: number
          label_id?: number
          created_at?: string | null
        }
      }
      comments: {
        Row: {
          id: number
          task_id: number
          author_id: string
          content: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          task_id: number
          author_id: string
          content: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          task_id?: number
          author_id?: string
          content?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      user_roles: {
        Row: {
          id: number
          profile_id: string | null
          role_id: number | null
          created_at: string | null
        }
        Insert: {
          id?: number
          profile_id?: string | null
          role_id?: number | null
          created_at?: string | null
        }
        Update: {
          id?: number
          profile_id?: string | null
          role_id?: number | null
          created_at?: string | null
        }
      }
      time_entries: {
        Row: {
          id: number
          task_id: number
          start_time: string
          end_time: string
          duration: number
          created_at: string | null
        }
        Insert: {
          id?: number
          task_id: number
          start_time: string
          end_time: string
          duration: number
          created_at?: string | null
        }
        Update: {
          id?: number
          task_id?: number
          start_time?: string
          end_time?: string
          duration?: number
          created_at?: string | null
        }
      }
    }
  }
      import_export_settings: {
        Row: {
          id: string
          field_name: string
          entity_type: string
          enabled: boolean
          label: string
          description: string | null
          owner_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          field_name: string
          entity_type: string
          enabled?: boolean
          label: string
          description?: string | null
          owner_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          field_name?: string
          entity_type?: string
          enabled?: boolean
          label?: string
          description?: string | null
          owner_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
}