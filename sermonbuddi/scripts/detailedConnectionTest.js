const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 DETAILED CONNECTION DIAGNOSTIC');
console.log('=====================================');

// Show environment variables
console.log('📋 Environment Variables:');
console.log(`   SUPABASE_URL: ${process.env.EXPO_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING'}`);
console.log(`   SUPABASE_ANON_KEY: ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'}`);
console.log(`   SERVICE_ROLE_KEY: ${process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING'}`);

// Test with anon key (like the app)
const supabaseAnon = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// Test with service role key (like SQL scripts)
const supabaseService = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

async function testConnection() {
  console.log('\n🧪 Testing Connections...\n');
  
  // Test 1: Service Role Connection (like SQL scripts)
  try {
    console.log('🔧 SERVICE ROLE TEST:');
    const { data: serviceProfiles, error: serviceError } = await supabaseService
      .from('profiles')
      .select('id, full_name, username')
      .limit(5);
    
    if (serviceError) {
      console.log(`   ❌ Error: ${serviceError.message}`);
    } else {
      console.log(`   ✅ Success: Found ${serviceProfiles.length} profiles`);
      serviceProfiles.forEach(p => console.log(`      - ${p.full_name || p.username}`));
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }

  // Test 2: Anonymous Connection (unauthenticated app state)
  try {
    console.log('\n🔓 ANONYMOUS TEST (Unauthenticated):');
    const { data: anonProfiles, error: anonError } = await supabaseAnon
      .from('profiles')
      .select('id, full_name, username')
      .limit(5);
    
    if (anonError) {
      console.log(`   ❌ Error: ${anonError.message}`);
    } else {
      console.log(`   ✅ Success: Found ${anonProfiles.length} profiles`);
      anonProfiles.forEach(p => console.log(`      - ${p.full_name || p.username}`));
    }
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }

  // Test 3: Authenticated Connection (like authenticated app)
  try {
    console.log('\n🔐 AUTHENTICATED TEST:');
    
    // Sign in as a test user
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email: 'alex.smith@example.com',
      password: 'password123'
    });
    
    if (authError) {
      console.log(`   ❌ Auth Error: ${authError.message}`);
      return;
    }
    
    console.log(`   ✅ Signed in as: ${authData.user.email}`);
    
    // Now test profile access
    const { data: authProfiles, error: profileError } = await supabaseAnon
      .from('profiles')
      .select('id, full_name, username')
      .limit(5);
    
    if (profileError) {
      console.log(`   ❌ Profile Error: ${profileError.message}`);
    } else {
      console.log(`   ✅ Success: Found ${authProfiles.length} profiles`);
      authProfiles.forEach(p => console.log(`      - ${p.full_name || p.username}`));
    }
    
    // Test Raymond search specifically
    const { data: raymondResults, error: raymondError } = await supabaseAnon
      .from('profiles')
      .select('*')
      .or('username.ilike.%raymond%,full_name.ilike.%raymond%');
    
    if (raymondError) {
      console.log(`   ❌ Raymond Search Error: ${raymondError.message}`);
    } else {
      console.log(`   🔍 Raymond Search: Found ${raymondResults.length} results`);
      raymondResults.forEach(p => console.log(`      - ${p.full_name} (${p.username})`));
    }
    
    // Check current user's profile
    const { data: currentProfile, error: currentError } = await supabaseAnon
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (currentError) {
      console.log(`   ❌ Current User Profile Error: ${currentError.message}`);
    } else {
      console.log(`   👤 Current User Profile: ${currentProfile.full_name} (${currentProfile.username})`);
    }
    
    await supabaseAnon.auth.signOut();
    
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }

  // Test 4: RLS Policy Check
  try {
    console.log('\n🛡️ RLS POLICY TEST:');
    
    // Check if we can see RLS policies (service role only)
    const { data: policies, error: policyError } = await supabaseService
      .rpc('get_table_policies', { table_name: 'profiles' })
      .catch(() => ({ data: null, error: { message: 'RPC not available' } }));
    
    if (policyError) {
      console.log(`   ⚠️ Cannot check policies: ${policyError.message}`);
    } else {
      console.log(`   ✅ Policies accessible`);
    }
    
  } catch (error) {
    console.log(`   ❌ Exception: ${error.message}`);
  }

  console.log('\n📊 SUMMARY:');
  console.log('=============');
  console.log('If SERVICE ROLE shows 22 profiles but AUTHENTICATED shows 1,');
  console.log('then RLS policies are blocking profile visibility.');
  console.log('');
  console.log('If AUTHENTICATED shows 0 profiles, then RLS is blocking everything.');
  console.log('');
  console.log('The app uses AUTHENTICATED connection, so it will see what');
  console.log('the AUTHENTICATED test shows, not what SERVICE ROLE shows.');
}

testConnection(); 