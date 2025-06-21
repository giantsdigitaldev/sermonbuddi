const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create a web-compatible storage adapter
const createWebStorageAdapter = () => {
  return {
    getItem: async (key) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
        return null;
      } catch (error) {
        console.error('localStorage getItem error:', error);
        return null;
      }
    },
    setItem: async (key, value) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch (error) {
        console.error('localStorage setItem error:', error);
      }
    },
    removeItem: async (key) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch (error) {
        console.error('localStorage removeItem error:', error);
      }
    },
  };
};

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: createWebStorageAdapter(),
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'implicit',
      storageKey: 'sb-auth-token',
    },
  }
);

async function testWebSession() {
  console.log('🔍 Testing web session persistence...\n');

  try {
    // 1. Check if we're in a web environment
    if (typeof window === 'undefined') {
      console.log('❌ This script needs to run in a web environment');
      console.log('💡 Run this in your browser console instead');
      return;
    }

    // 2. Check localStorage for session data
    console.log('1. Checking localStorage for session data...');
    const sessionKey = 'sb-auth-token';
    const storedSession = localStorage.getItem(sessionKey);
    
    if (storedSession) {
      console.log('✅ Found stored session in localStorage');
      console.log('📄 Session data length:', storedSession.length);
      try {
        const parsedSession = JSON.parse(storedSession);
        console.log('📋 Session structure:', Object.keys(parsedSession));
        if (parsedSession.access_token) {
          console.log('🔑 Access token exists');
        }
      } catch (e) {
        console.log('⚠️ Could not parse stored session');
      }
    } else {
      console.log('❌ No session found in localStorage');
    }

    // 3. Check current Supabase session
    console.log('\n2. Checking current Supabase session...');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error getting session:', error);
      return;
    }

    if (session) {
      console.log('✅ Supabase session found:', session.user?.email);
      console.log('🕒 Session expires at:', new Date(session.expires_at * 1000));
      console.log('🔑 Access token length:', session.access_token?.length || 0);
    } else {
      console.log('❌ No Supabase session found');
    }

    // 4. List all localStorage keys
    console.log('\n3. All localStorage keys:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('supabase') || key && key.includes('auth')) {
        console.log('🔑', key, ':', localStorage.getItem(key)?.substring(0, 50) + '...');
      }
    }

    // 5. Test session recovery
    console.log('\n4. Testing session recovery...');
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    
    if (refreshError) {
      console.log('❌ Session refresh failed:', refreshError.message);
    } else if (refreshData.session) {
      console.log('✅ Session refreshed successfully:', refreshData.session.user?.email);
    } else {
      console.log('❌ No session to refresh');
    }

    console.log('\n🎯 Session persistence test completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Export for browser use
if (typeof window !== 'undefined') {
  window.testWebSession = testWebSession;
  console.log('✅ testWebSession function available in browser console');
  console.log('💡 Run: testWebSession() to test session persistence');
}

// Run if in Node.js environment
if (typeof window === 'undefined') {
  testWebSession();
} 