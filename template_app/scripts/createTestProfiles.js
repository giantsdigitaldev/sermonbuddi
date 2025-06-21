const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createTestProfiles() {
  try {
    console.log('🧪 Creating test profiles...');

    // Generate mock UUIDs for test profiles (using existing table structure)
    const testProfiles = [
      {
        id: '11111111-1111-1111-1111-111111111111',
        username: 'alex_smith',
        full_name: 'Alex Smith',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        username: 'raymond_jones',
        full_name: 'Raymond Jones',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '33333333-3333-3333-3333-333333333333',
        username: 'sarah_wilson',
        full_name: 'Sarah Wilson',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: '44444444-4444-4444-4444-444444444444',
        username: 'mike_chen',
        full_name: 'Mike Chen',
        avatar_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // Try to insert test profiles using upsert to avoid conflicts
    for (const profile of testProfiles) {
      console.log(`Creating profile: ${profile.full_name}`);
      
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profile, { onConflict: 'id' })
        .select();

      if (error) {
        console.error(`❌ Error creating profile ${profile.full_name}:`, error.message);
      } else {
        console.log(`✅ Profile ${profile.full_name} created successfully`);
      }
    }

    // Test the search functionality
    console.log('\n🔍 Testing search functionality...');
    
    const { data: searchResults, error: searchError } = await supabase
      .from('profiles')
      .select('*')
      .or('username.ilike.%alex%,full_name.ilike.%alex%')
      .limit(10);

    if (searchError) {
      console.error('❌ Search test failed:', searchError.message);
    } else {
      console.log(`✅ Search test passed. Found ${searchResults.length} profiles matching "alex"`);
      searchResults.forEach(profile => {
        console.log(`   - ${profile.full_name || profile.username}`);
      });
    }

    // Test viewing all profiles
    console.log('\n👥 Testing profile visibility...');
    const { data: allProfiles, error: allProfilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(10);

    if (allProfilesError) {
      console.error('❌ Profile visibility test failed:', allProfilesError.message);
    } else {
      console.log(`✅ Profile visibility test passed. Found ${allProfiles.length} total profiles`);
      allProfiles.forEach(profile => {
        console.log(`   - ${profile.full_name || profile.username}`);
      });
    }

    console.log('\n🎉 Test profiles created successfully!');
    console.log('\n📋 Test profiles you can now search for:');
    console.log('   - Alex Smith (alex_smith)');
    console.log('   - Raymond Jones (raymond_jones)');
    console.log('   - Sarah Wilson (sarah_wilson)');
    console.log('   - Mike Chen (mike_chen)');
    console.log('\n💡 These are mock profiles for testing search functionality');

  } catch (error) {
    console.error('❌ Error creating test profiles:', error);
  }
}

// Run if called directly
if (require.main === module) {
  createTestProfiles();
}

module.exports = { createTestProfiles }; 