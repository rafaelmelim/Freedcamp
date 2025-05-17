export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type TaskPriority = 'low' | 'medium' | 'high';

export interface Database {
  public: {
    Tables: {
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
}