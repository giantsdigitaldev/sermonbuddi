const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

async function diagnoseProfileIssue() {
  try {
    console.log('🔍 Diagnosing profile creation issue...');

    // Test with service role
    if (supabaseServiceKey) {
      console.log('\n🔧 Testing with service role key...');
      const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
      
      try {
        const { data: authUsers, error: authError } = await serviceClient.auth.admin.listUsers();
        if (authError) {
          console.error('❌ Service role auth access failed:', authError.message);
        } else {
          console.log(`✅ Service role can access auth: ${authUsers.users.length} users`);
        }

        const { data: profiles, error: profileError } = await serviceClient
          .from('profiles')
          .select('*')
          .limit(5);
        
        if (profileError) {
          console.error('❌ Service role profile access failed:', profileError.message);
        } else {
          console.log(`✅ Service role can access profiles: ${profiles.length} profiles`);
        }
      } catch (error) {
        console.error('❌ Service role test failed:', error.message);
      }
    }

    // Test with regular client
    console.log('\n🔐 Testing with regular authenticated user...');
    const regularClient = createClient(supabaseUrl, supabaseAnonKey);
    
    const { error: signInError } = await regularClient.auth.signInWithPassword({
      email: 'alex.smith@example.com',
      password: 'password123'
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
      return;
    }

    // Check current profiles
    const { data: currentProfiles, error: currentError } = await regularClient
      .from('profiles')
      .select('id, username, full_name, created_at')
      .order('created_at');

    if (currentError) {
      console.error('❌ Error accessing profiles:', currentError.message);
    } else {
      console.log(`\n📊 Current profiles in database: ${currentProfiles.length}`);
      currentProfiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.full_name || 'No name'} (@${profile.username || 'no-username'}) - Created: ${profile.created_at}`);
      });
    }

    // Test if we can create a profile manually
    console.log('\n🧪 Testing manual profile creation...');
    
    const testUserId = 'test-' + Date.now();
    const { error: insertError } = await regularClient
      .from('profiles')
      .insert({
        id: testUserId,
        username: 'test-user',
        full_name: 'Test User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('❌ Manual profile creation failed:', insertError.message);
      console.log('   This suggests RLS policies are blocking inserts');
    } else {
      console.log('✅ Manual profile creation succeeded');
      
      // Clean up test profile
      await regularClient.from('profiles').delete().eq('id', testUserId);
    }

    // Check RLS policies
    console.log('\n🛡️ Checking RLS policies...');
    console.log('   RLS policies might be preventing profile creation');
    console.log('   The SQL Editor should bypass RLS, but there might be other restrictions');

    await regularClient.auth.signOut();

    console.log('\n💡 Recommendations:');
    console.log('   1. Try the SIMPLE_PROFILE_CREATION.sql script (disables RLS temporarily)');
    console.log('   2. Check if you have permission to disable RLS in SQL Editor');
    console.log('   3. Verify the SQL script ran without errors in Supabase');
    console.log('   4. Check Supabase logs for any error messages');

  } catch (error) {
    console.error('❌ Diagnosis error:', error);
  }
}

// Run if called directly
if (require.main === module) {
  diagnoseProfileIssue();
}

module.exports = { diagnoseProfileIssue }; 