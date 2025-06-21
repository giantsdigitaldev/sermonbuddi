const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create a web-compatible storage adapter with detailed logging
const createWebStorageAdapter = () => {
  return {
    getItem: async (key) => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const item = window.localStorage.getItem(key);
          console.log('🔍 Storage getItem:', key, item ? `found (${item.length} chars)` : 'not found');
          return item;
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
          console.log('💾 Storage setItem:', key, `saved (${value.length} chars)`);
        }
      } catch (error) {
        console.error('localStorage setItem error:', error);
      }
    },
    removeItem: async (key) => {
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

async function debugStorage() {
  console.log('🔍 Debugging storage and session issues...\n');

  try {
    // 1. Check if we're in a web environment
    if (typeof window === 'undefined') {
      console.log('❌ This script needs to run in a web environment');
      console.log('💡 Run this in your browser console instead');
      return;
    }

    // 2. Check all localStorage keys
    console.log('1. All localStorage keys:');
    const allKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      allKeys.push(key);
      console.log('🔑', key);
    }

    if (allKeys.length === 0) {
      console.log('❌ No keys found in localStorage');
    }

    // 3. Check for Supabase-related keys
    console.log('\n2. Supabase-related keys:');
    const supabaseKeys = allKeys.filter(key => 
      key.includes('supabase') || key.includes('auth') || key.includes('sb-')
    );
    
    if (supabaseKeys.length === 0) {
      console.log('❌ No Supabase keys found');
    } else {
      supabaseKeys.forEach(key => {
        const value = localStorage.getItem(key);
        console.log('🔑', key, ':', value?.substring(0, 100) + '...');
      });
    }

    // 4. Check specific storage key
    console.log('\n3. Checking specific storage key:');
    const sessionKey = 'sb-auth-token';
    const storedSession = localStorage.getItem(sessionKey);
    
    if (storedSession) {
      console.log('✅ Found stored session');
      try {
        const parsedSession = JSON.parse(storedSession);
        console.log('📋 Session structure:', Object.keys(parsedSession));
        if (parsedSession.access_token) {
          console.log('🔑 Access token exists (length:', parsedSession.access_token.length + ')');
        }
        if (parsedSession.expires_at) {
          const expiresAt = new Date(parsedSession.expires_at * 1000);
          console.log('🕒 Session expires at:', expiresAt);
          console.log('⏰ Current time:', new Date());
          console.log('⏳ Expired:', expiresAt < new Date() ? 'Yes' : 'No');
        }
      } catch (e) {
        console.log('⚠️ Could not parse stored session:', e.message);
      }
    } else {
      console.log('❌ No session found in localStorage');
    }

    // 5. Test Supabase session
    console.log('\n4. Testing Supabase session:');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error getting session:', error);
    } else if (session) {
      console.log('✅ Supabase session found:', session.user?.email);
      console.log('🕒 Session expires at:', new Date(session.expires_at * 1000));
    } else {
      console.log('❌ No Supabase session found');
    }

    // 6. Test manual sign in
    console.log('\n5. Testing manual sign in...');
    console.log('💡 To test sign in, run this in browser console:');
    console.log('supabase.auth.signInWithPassword({ email: "your-email", password: "your-password" })');

    console.log('\n🎯 Storage debugging completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Export for browser use
if (typeof window !== 'undefined') {
  window.debugStorage = debugStorage;
  window.supabase = supabase;
  console.log('✅ debugStorage function available in browser console');
  console.log('💡 Run: debugStorage() to debug storage issues');
}

// Run if in Node.js environment
if (typeof window === 'undefined') {
  debugStorage();
} 