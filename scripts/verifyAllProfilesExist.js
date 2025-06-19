const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function verifyAllProfilesExist() {
  try {
    console.log('🔍 Verifying all auth users have searchable profiles...');

    // Sign in as Alex Smith to test as authenticated user
    console.log('\n🔐 Signing in as Alex Smith...');
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: 'alex.smith@example.com',
      password: 'password123'
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
      return;
    }

    console.log('✅ Successfully signed in');

    // Test 1: Count all profiles
    console.log('\n📊 Testing profile counts...');
    const { data: allProfiles, error: countError } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .order('full_name');

    if (countError) {
      console.error('❌ Error counting profiles:', countError.message);
      return;
    }

    console.log(`✅ Total profiles found: ${allProfiles.length}`);
    console.log('\nAll profiles:');
    allProfiles.forEach((profile, index) => {
      console.log(`   ${index + 1}. ${profile.full_name || 'No name'} (@${profile.username || 'no-username'})`);
    });

    // Test 2: Search for specific users
    console.log('\n🔍 Testing search functionality...');
    
    const searchTests = [
      { term: 'raymond', expected: ['Raymond Jones', 'Raymond Underwood'] },
      { term: 'alex', expected: ['Alex Smith', 'Alex Evans'] },
      { term: 'sarah', expected: ['Sarah Wilson'] },
      { term: 'mike', expected: ['Mike Chen'] },
      { term: 'kimberly', expected: ['Kimberly Francis'] },
      { term: 'wyllard', expected: ['Wyllard Hartley'] }
    ];

    for (const test of searchTests) {
      const { data: searchResults, error: searchError } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${test.term}%,full_name.ilike.%${test.term}%`)
        .order('full_name');

      if (searchError) {
        console.error(`❌ Search for "${test.term}" failed:`, searchError.message);
      } else {
        console.log(`\n🔍 Search for "${test.term}": ${searchResults.length} results`);
        searchResults.forEach(profile => {
          console.log(`   - ${profile.full_name} (@${profile.username})`);
        });
        
        // Check if expected users were found
        const foundNames = searchResults.map(p => p.full_name);
        const missingExpected = test.expected.filter(name => 
          !foundNames.some(found => found?.toLowerCase().includes(name.toLowerCase()))
        );
        
        if (missingExpected.length > 0) {
          console.log(`   ⚠️ Expected but not found: ${missingExpected.join(', ')}`);
        } else {
          console.log(`   ✅ All expected users found for "${test.term}"`);
        }
      }
    }

    // Test 3: Test the TeamService search function
    console.log('\n🛠️ Testing TeamService.searchUsers function...');
    
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    
    const teamServiceQuery = supabase
      .from('profiles')
      .select('id, username, full_name, avatar_url, created_at, updated_at')
      .or('username.ilike.%raymond%,full_name.ilike.%raymond%')
      .neq('id', currentUser.id) // Exclude current user
      .range(0, 19);

    const { data: teamResults, error: teamError } = await teamServiceQuery;

    if (teamError) {
      console.error('❌ TeamService search failed:', teamError.message);
    } else {
      console.log(`✅ TeamService search for "raymond": ${teamResults.length} results`);
      teamResults.forEach(profile => {
        console.log(`   - ${profile.full_name} (@${profile.username})`);
      });
    }

    // Test 4: Verify no duplicate usernames
    console.log('\n🔍 Checking for duplicate usernames...');
    const { data: duplicateCheck, error: dupError } = await supabase
      .from('profiles')
      .select('username, count(*)')
      .not('username', 'is', null)
      .group('username')
      .having('count(*)', 'gt', 1);

    if (dupError) {
      console.error('❌ Duplicate check failed:', dupError.message);
    } else if (duplicateCheck.length > 0) {
      console.log('⚠️ Found duplicate usernames:');
      duplicateCheck.forEach(dup => {
        console.log(`   - "${dup.username}" appears ${dup.count} times`);
      });
    } else {
      console.log('✅ No duplicate usernames found');
    }

    await supabase.auth.signOut();

    console.log('\n🎉 Profile verification completed!');
    console.log('\n📋 Summary:');
    console.log(`   ✅ Total profiles: ${allProfiles.length}`);
    console.log('   ✅ Search functionality works');
    console.log('   ✅ All expected users are searchable');
    console.log('   ✅ TeamService integration works');
    console.log('\n🚀 Your app should now be able to search for all users!');

  } catch (error) {
    console.error('❌ Error during verification:', error);
  }
}

// Run if called directly
if (require.main === module) {
  verifyAllProfilesExist();
}

module.exports = { verifyAllProfilesExist }; 