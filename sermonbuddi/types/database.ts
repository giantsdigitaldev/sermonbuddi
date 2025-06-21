export type SocialPlatform = 'twitter' | 'facebook' | 'instagram';
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'failed' | 'cancelled';
export type PostType = 'text' | 'image' | 'video' | 'carousel';
export type AITone = 'professional' | 'casual' | 'inspirational' | 'educational';

export interface Sermon {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  page_count?: number;
  extracted_text?: string;
  status: 'uploaded' | 'processing' | 'processed' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface SocialAccount {
  id: string;
  user_id: string;
  platform: SocialPlatform;
  account_name: string;
  account_id: string;
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  is_active: boolean;
  profile_image_url?: string;
  follower_count: number;
  created_at: string;
  updated_at: string;
}

export interface SocialPost {
  id: string;
  user_id: string;
  sermon_id: string;
  social_account_id: string;
  platform: SocialPlatform;
  content: string;
  post_type: PostType;
  media_urls?: string[];
  scheduled_at?: string;
  published_at?: string;
  status: PostStatus;
  platform_post_id?: string;
  ai_generated: boolean;
  engagement_score: number;
  created_at: string;
  updated_at: string;
}

export interface PostAnalytics {
  id: string;
  post_id: string;
  platform_post_id: string;
  platform: SocialPlatform;
  likes_count: number;
  shares_count: number;
  comments_count: number;
  views_count: number;
  clicks_count: number;
  reach_count: number;
  impressions_count: number;
  engagement_rate: number;
  collected_at: string;
  created_at: string;
  updated_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  platform_comment_id: string;
  platform: SocialPlatform;
  author_name: string;
  author_username?: string;
  author_profile_image?: string;
  content: string;
  is_reply: boolean;
  parent_comment_id?: string;
  likes_count: number;
  created_at: string;
  platform_created_at?: string;
  is_responded: boolean;
  response_content?: string;
  response_created_at?: string;
}

export interface AIGeneration {
  id: string;
  user_id: string;
  sermon_id: string;
  prompt: string;
  response: string;
  platform?: SocialPlatform;
  tokens_used?: number;
  cost?: number;
  status: 'pending' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  default_posting_time: string;
  timezone: string;
  auto_schedule: boolean;
  ai_tone: AITone;
  max_posts_per_day: number;
  notification_preferences: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface PostTemplate {
  id: string;
  user_id: string;
  name: string;
  content: string;
  platform?: SocialPlatform;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  total_sermons: number;
  total_posts: number;
  scheduled_posts: number;
  published_posts: number;
  total_engagement: number;
  total_reach: number;
}

// Database schema type for Supabase
export type Database = {
  public: {
    Tables: {
      sermons: {
        Row: Sermon;
        Insert: Omit<Sermon, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Sermon, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      social_accounts: {
        Row: SocialAccount;
        Insert: Omit<SocialAccount, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<SocialAccount, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      social_posts: {
        Row: SocialPost;
        Insert: Omit<SocialPost, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<SocialPost, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      post_analytics: {
        Row: PostAnalytics;
        Insert: Omit<PostAnalytics, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<PostAnalytics, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      post_comments: {
        Row: PostComment;
        Insert: Omit<PostComment, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<PostComment, 'id'>>;
      };
      ai_generations: {
        Row: AIGeneration;
        Insert: Omit<AIGeneration, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<AIGeneration, 'id'>>;
      };
      user_preferences: {
        Row: UserPreferences;
        Insert: Omit<UserPreferences, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<UserPreferences, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      post_templates: {
        Row: PostTemplate;
        Insert: Omit<PostTemplate, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<PostTemplate, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
    };
    Functions: {
      get_user_dashboard_stats: {
        Args: { user_uuid: string };
        Returns: DashboardStats;
      };
    };
  };
}; 