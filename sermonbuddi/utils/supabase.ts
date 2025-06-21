import { Database } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

// Supabase configuration with better error handling
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Check if environment variables are set
const hasValidConfig = !!(supabaseUrl && supabaseAnonKey);

if (!hasValidConfig) {
  console.error('❌ Missing Supabase environment variables:');
  console.error('   EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.error('   EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'SET' : 'MISSING');
  console.error('');
  console.error('💡 Please create a .env file in the sermonbuddi directory with:');
  console.error('   EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url');
  console.error('   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  console.error('');
  console.error('🔗 Get these values from your Supabase project dashboard');
  
  // For development, we can continue with placeholder values
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  Using placeholder values for development. App may not function properly.');
  }
}

// Use placeholder values if environment variables are missing (for development only)
const finalSupabaseUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalSupabaseAnonKey = supabaseAnonKey || 'placeholder_key';

console.log('Supabase configuration:', {
  url: finalSupabaseUrl,
  key: finalSupabaseAnonKey.substring(0, 20) + '...',
  platform: Platform.OS,
  hasValidConfig
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
          }
        } catch (error) {
          console.error('localStorage setItem error:', error);
        }
      },
      removeItem: async (key: string) => {
        try {
          if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(key);
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

// Only enable auth features if we have valid configuration
const authConfig = hasValidConfig ? {
  storage,
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: Platform.OS === 'web',
  flowType: (Platform.OS === 'web' ? 'implicit' : 'pkce') as 'implicit' | 'pkce',
  ...(Platform.OS === 'web' && {
    storageKey: 'sb-auth-token',
    debug: process.env.NODE_ENV === 'development',
  }),
} : {
  // Disable auth features when using placeholder values
  storage,
  autoRefreshToken: false,
  persistSession: false,
  detectSessionInUrl: false,
  debug: false,
};

export const supabase = createClient<Database>(finalSupabaseUrl, finalSupabaseAnonKey, {
  auth: authConfig,
  global: {
    headers: {
      'X-Client-Info': `supabase-js-web`,
    },
  },
});

// Only set up auth state change listener if we have valid configuration
if (hasValidConfig) {
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('🔐 Auth state changed:', event, session ? `User: ${session.user?.email}` : 'No user');
    
    if (event === 'INITIAL_SESSION') {
      if (session) {
        console.log('✅ Session recovered on startup:', session.user?.email);
      } else {
        console.log('❌ No session found on startup');
      }
    } else if (event === 'SIGNED_IN') {
      console.log('✅ User signed in:', session?.user?.email);
    } else if (event === 'SIGNED_OUT') {
      console.log('👋 User signed out');
    }
  });
} else {
  console.log('⚠️  Auth state change listener disabled - using placeholder configuration');
}

// Make supabase client globally available for web debugging
if (Platform.OS === 'web' && typeof window !== 'undefined') {
  (window as any).supabase = supabase;
  console.log('✅ Supabase client attached to window for web debugging');
  
  // Add configuration status helper
  (window as any).checkSupabaseConfig = () => {
    console.log('🔍 Supabase configuration status:', {
      hasValidConfig,
      url: finalSupabaseUrl,
      key: finalSupabaseAnonKey.substring(0, 20) + '...',
      authEnabled: hasValidConfig
    });
    return { hasValidConfig, url: finalSupabaseUrl };
  };

  // Add connection test helper
  (window as any).testSupabaseConnection = async () => {
    console.log('🔍 Testing Supabase connection...');
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) {
        console.error('❌ Supabase connection test failed:', error);
        return { success: false, error: error.message };
      } else {
        console.log('✅ Supabase connection test successful');
        return { success: true, data };
      }
    } catch (error) {
      console.error('❌ Supabase connection test exception:', error);
      return { success: false, error: 'Connection failed' };
    }
  };

  // Add session debugging helper (only if auth is enabled)
  if (hasValidConfig) {
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
  }
}

// Export types for convenience
export type { Database } from '@/types/database';
