import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          avatar_url: string | null;
          department: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          avatar_url?: string | null;
          department?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          avatar_url?: string | null;
          department?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      calls: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          start_time: string | null;
          end_time: string | null;
          duration: number;
          status: 'scheduled' | 'active' | 'completed' | 'cancelled';
          meeting_id: string | null;
          platform: 'zoom' | 'meet' | 'teams' | 'other' | null;
          participants: any;
          performance_data: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          start_time?: string | null;
          end_time?: string | null;
          duration?: number;
          status?: 'scheduled' | 'active' | 'completed' | 'cancelled';
          meeting_id?: string | null;
          platform?: 'zoom' | 'meet' | 'teams' | 'other' | null;
          participants?: any;
          performance_data?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          start_time?: string | null;
          end_time?: string | null;
          duration?: number;
          status?: 'scheduled' | 'active' | 'completed' | 'cancelled';
          meeting_id?: string | null;
          platform?: 'zoom' | 'meet' | 'teams' | 'other' | null;
          participants?: any;
          performance_data?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'pdf' | 'url' | 'text' | 'doc' | 'docx';
          url: string | null;
          content: string | null;
          processed: boolean;
          tags: string[];
          file_size: number | null;
          mime_type: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: 'pdf' | 'url' | 'text' | 'doc' | 'docx';
          url?: string | null;
          content?: string | null;
          processed?: boolean;
          tags?: string[];
          file_size?: number | null;
          mime_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: 'pdf' | 'url' | 'text' | 'doc' | 'docx';
          url?: string | null;
          content?: string | null;
          processed?: boolean;
          tags?: string[];
          file_size?: number | null;
          mime_type?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      transcripts: {
        Row: {
          id: string;
          call_id: string;
          speaker: string;
          text: string;
          confidence: number;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          call_id: string;
          speaker: string;
          text: string;
          confidence?: number;
          timestamp?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          call_id?: string;
          speaker?: string;
          text?: string;
          confidence?: number;
          timestamp?: string;
          created_at?: string;
        };
      };
      ai_suggestions: {
        Row: {
          id: string;
          call_id: string;
          user_id: string;
          type: 'objection_handling' | 'closing' | 'question' | 'pricing' | 'feature_highlight' | 'rapport_building';
          text: string;
          confidence: number;
          context: string | null;
          reasoning: string | null;
          used: boolean;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          call_id: string;
          user_id: string;
          type: 'objection_handling' | 'closing' | 'question' | 'pricing' | 'feature_highlight' | 'rapport_building';
          text: string;
          confidence?: number;
          context?: string | null;
          reasoning?: string | null;
          used?: boolean;
          used_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          call_id?: string;
          user_id?: string;
          type?: 'objection_handling' | 'closing' | 'question' | 'pricing' | 'feature_highlight' | 'rapport_building';
          text?: string;
          confidence?: number;
          context?: string | null;
          reasoning?: string | null;
          used?: boolean;
          used_at?: string | null;
          created_at?: string;
        };
      };
    };
  };
}