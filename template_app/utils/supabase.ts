import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

// Supabase configuration
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log('Supabase configuration:', {
  url: supabaseUrl,
  key: supabaseAnonKey.substring(0, 20) + '...',
  platform: Platform.OS
});

// Create proper storage adapter for different platforms
const createStorageAdapter = () => {
  if (Platform.OS === 'web') {
    // Web-specific storage adapter using localStorage with better error handling
    return {
      getItem: async (key: string) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            const item = window.localStorage.getItem(key);
            console.log('🔍 Storage getItem:', key, item ? 'found' : 'not found');
            return item;
          }
          return null;
        } catch (error) {
          console.error('localStorage getItem error:', error);
          return null;
        }
      },
      setItem: async (key: string, value: string) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(key, value);
            console.log('💾 Storage setItem:', key, 'saved');
          }
        } catch (error) {
          console.error('localStorage setItem error:', error);
        }
      },
      removeItem: async (key: string) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(key);
            console.log('🗑️ Storage removeItem:', key, 'removed');
          }
        } catch (error) {
          console.error('localStorage removeItem error:', error);
        }
      },
    };
  } else {
    // Mobile storage adapter using AsyncStorage
    try {
      return {
        getItem: async (key: string) => {
          try {
            return await AsyncStorage.getItem(key);
          } catch (error) {
            console.error('AsyncStorage getItem error:', error);
            return null;
          }
        },
        setItem: async (key: string, value: string) => {
          try {
            await AsyncStorage.setItem(key, value);
          } catch (error) {
            console.error('AsyncStorage setItem error:', error);
          }
        },
        removeItem: async (key: string) => {
          try {
            await AsyncStorage.removeItem(key);
          } catch (error) {
            console.error('AsyncStorage removeItem error:', error);
          }
        },
      };
    } catch (error) {
      console.warn('AsyncStorage not available, using memory storage');
      // Fallback to memory storage if AsyncStorage is not available
      const memoryStorage: { [key: string]: string } = {};
      return {
        getItem: async (key: string) => memoryStorage[key] || null,
        setItem: async (key: string, value: string) => {
          memoryStorage[key] = value;
        },
        removeItem: async (key: string) => {
          delete memoryStorage[key];
        },
      };
    }
  }
};

// Create Supabase client with improved auth configuration
const storage = createStorageAdapter();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
    // Improved session configuration
    flowType: Platform.OS === 'web' ? 'implicit' : 'pkce',
    // Web-specific configuration
    ...(Platform.OS === 'web' && {
      storageKey: 'sb-auth-token',
      // Ensure proper session handling on web
      debug: process.env.NODE_ENV === 'development',
    }),
  },
  // Global configuration
  global: {
    headers: {
      'X-Client-Info': `supabase-js-web`,
    },
  },
});

// Enhanced auth state debugging and session recovery
let isSessionRecovered = false;
let sessionRecoveryAttempts = 0;
const MAX_RECOVERY_ATTEMPTS = 3;

// Improved session recovery function
const attemptSessionRecovery = async () => {
  if (sessionRecoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
    console.log('❌ Max session recovery attempts reached');
    return;
  }

  sessionRecoveryAttempts++;
  console.log(`🔄 Session recovery attempt ${sessionRecoveryAttempts}/${MAX_RECOVERY_ATTEMPTS}`);

  try {
    // Check multiple possible storage keys
    const possibleKeys = [
      'sb-auth-token',
      'supabase.auth.token',
      'supabase.auth.refreshToken',
      'sb-' + supabaseUrl.replace(/[^a-zA-Z0-9]/g, '') + '-auth-token'
    ];

    let storedSession = null;
    let foundKey = null;

    for (const key of possibleKeys) {
      const item = await storage.getItem(key);
      if (item) {
        console.log('🔍 Found session in key:', key);
        storedSession = item;
        foundKey = key;
        break;
      }
    }

    if (!storedSession) {
      console.log('❌ No stored session found in any key');
      return;
    }

    console.log('🔄 Attempting to recover session from storage...');
    
    // Force session refresh
    const { data, error } = await supabase.auth.refreshSession();
    if (data.session) {
      console.log('✅ Session recovered successfully:', data.session.user?.email);
      isSessionRecovered = true;
    } else if (error) {
      console.log('❌ Session recovery failed:', error.message);
      // Clear invalid session from all possible keys
      for (const key of possibleKeys) {
        await storage.removeItem(key);
      }
    }
  } catch (error) {
    console.log('❌ Session recovery error:', error);
  }
};

supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('🔐 Auth state changed:', event, session ? `User: ${session.user?.email}` : 'No user');
  
  if (event === 'INITIAL_SESSION') {
    if (session) {
      console.log('✅ Session recovered on startup:', session.user?.email);
      isSessionRecovered = true;
    } else {
      console.log('❌ No session found on startup');
      // Try to recover session from storage
      if (!isSessionRecovered && Platform.OS === 'web') {
        // Delay recovery attempt to avoid conflicts
        setTimeout(attemptSessionRecovery, 1000);
      }
      isSessionRecovered = true;
    }
  } else if (event === 'SIGNED_IN') {
    console.log('✅ User signed in successfully:', session?.user?.email);
    // Reset recovery attempts on successful sign in
    sessionRecoveryAttempts = 0;
  } else if (event === 'SIGNED_OUT') {
    console.log('👋 User signed out');
    // Reset recovery attempts on sign out
    sessionRecoveryAttempts = 0;
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('🔄 Token refreshed successfully');
  }
});

// Make supabase client globally available for web debugging
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  (window as any).supabase = supabase;
  console.log('✅ Supabase client attached to window for web debugging');
  
  // Add session recovery helper
  (window as any).recoverSession = async () => {
    console.log('🔄 Manual session recovery initiated...');
    const { data, error } = await supabase.auth.getSession();
    if (data.session) {
      console.log('✅ Session recovered:', data.session.user?.email);
    } else {
      console.log('❌ No session to recover');
      // Try recovery from storage
      await attemptSessionRecovery();
    }
    return data.session;
  };

  // Add session debugging helper
  (window as any).debugSession = () => {
    console.log('🔍 Session debugging...');
    const allKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) allKeys.push(key);
    }
    
    console.log('All localStorage keys:', allKeys);
    
    const supabaseKeys = allKeys.filter(key => 
      key.includes('supabase') || key.includes('auth') || key.includes('sb-')
    );
    console.log('Supabase-related keys:', supabaseKeys);
    
    supabaseKeys.forEach(key => {
      const value = localStorage.getItem(key);
      console.log('🔑', key, ':', value?.substring(0, 100) + '...');
    });
  };

  // Add manual sign in helper
  (window as any).testSignIn = async (email: string, password: string) => {
    console.log('🔐 Testing manual sign in...');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('❌ Sign in failed:', error.message);
    } else {
      console.log('✅ Sign in successful:', data.user?.email);
    }
    return { data, error };
  };
}

// Database types (add more as needed)
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          updated_at: string | null;
          username: string | null;
          full_name: string | null;
          avatar_url: string | null;
          website: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          updated_at?: string | null;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          website?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          updated_at?: string | null;
          username?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          website?: string | null;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          status: 'active' | 'completed' | 'archived';
          created_at: string;
          updated_at: string;
          metadata: any;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          status?: 'active' | 'completed' | 'archived';
          created_at?: string;
          updated_at?: string;
          metadata?: any;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          status?: 'active' | 'completed' | 'archived';
          updated_at?: string;
          metadata?: any;
        };
      };
      project_comments: {
        Row: {
          id: string;
          project_id: string;
          user_id: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          user_id?: string;
          content?: string;
          updated_at?: string;
        };
      };
      project_comment_likes: {
        Row: {
          id: string;
          comment_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          comment_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          comment_id?: string;
          user_id?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          title: string;
          description: string | null;
          status: 'todo' | 'in_progress' | 'completed';
          priority: 'low' | 'medium' | 'high';
          due_date: string | null;
          created_at: string;
          updated_at: string;
          metadata: any;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          title: string;
          description?: string | null;
          status?: 'todo' | 'in_progress' | 'completed';
          priority?: 'low' | 'medium' | 'high';
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
          metadata?: any;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          title?: string;
          description?: string | null;
          status?: 'todo' | 'in_progress' | 'completed';
          priority?: 'low' | 'medium' | 'high';
          due_date?: string | null;
          updated_at?: string;
          metadata?: any;
        };
      };
      chat_conversations: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          title?: string | null;
          updated_at?: string;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          user_id: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          metadata: any;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          conversation_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          metadata?: any;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          conversation_id?: string;
          role?: 'user' | 'assistant' | 'system';
          content?: string;
          metadata?: any;
        };
      };
      user_storage: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          file_name: string;
          file_path: string;
          file_size: number | null;
          mime_type: string | null;
          created_at: string;
          metadata: any;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          file_name: string;
          file_path: string;
          file_size?: number | null;
          mime_type?: string | null;
          created_at?: string;
          metadata?: any;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          file_name?: string;
          file_path?: string;
          file_size?: number | null;
          mime_type?: string | null;
          metadata?: any;
        };
      };
    };
  };
}; 