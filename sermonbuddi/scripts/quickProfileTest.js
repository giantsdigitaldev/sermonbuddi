const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function quickProfileTest() {
  try {
    // Sign in
    await supabase.auth.signInWithPassword({
      email: 'alex.smith@example.com',
      password: 'password123'
    });

    // Count profiles
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, username');

    console.log(`📊 Total profiles: ${profiles.length}`);
    
    // Test search for Raymond
    const { data: raymond } = await supabase
      .from('profiles')
      .select('*')
      .or('username.ilike.%raymond%,full_name.ilike.%raymond%');
    
    console.log(`🔍 Raymond search: ${raymond.length} results`);
    raymond.forEach(p => console.log(`   - ${p.full_name}`));

    await supabase.auth.signOut();
    
    if (profiles.length >= 20) {
      console.log('✅ SUCCESS: All profiles created!');
    } else {
      console.log('❌ MISSING: Run the SQL script in Supabase SQL Editor');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

quickProfileTest(); 