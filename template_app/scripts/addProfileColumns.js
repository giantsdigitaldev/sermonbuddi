const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addProfileColumns() {
  try {
    console.log('🔧 Adding first_name and last_name columns to profiles table...');

    // First, let's check the current structure
    console.log('📋 Checking current profiles table structure...');
    const { data: currentProfiles, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking profiles table:', checkError.message);
      return;
    }

    console.log('✅ Profiles table exists');
    if (currentProfiles && currentProfiles.length > 0) {
      console.log('Current columns:', Object.keys(currentProfiles[0]));
    }

    // Add the columns using SQL
    console.log('➕ Adding first_name and last_name columns...');
    
    const addColumnsSQL = `
      ALTER TABLE public.profiles 
      ADD COLUMN IF NOT EXISTS first_name TEXT,
      ADD COLUMN IF NOT EXISTS last_name TEXT;
    `;

    const { error: alterError } = await supabase.rpc('exec_sql', { 
      sql: addColumnsSQL 
    });

    if (alterError) {
      console.error('❌ Error adding columns:', alterError.message);
      
      // Try alternative approach: Use direct SQL commands
      console.log('🔄 Trying alternative approach...');
      
      // Try adding columns one by one
      const { error: firstNameError } = await supabase.rpc('exec_sql', { 
        sql: 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_name TEXT;'
      });
      
      const { error: lastNameError } = await supabase.rpc('exec_sql', { 
        sql: 'ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_name TEXT;'
      });

      if (firstNameError || lastNameError) {
        console.error('❌ Alternative approach failed');
        console.error('first_name error:', firstNameError?.message);
        console.error('last_name error:', lastNameError?.message);
        return;
      }
    }

    console.log('✅ Columns added successfully');

    // Verify the columns were added
    console.log('🔍 Verifying columns were added...');
    const { data: verifyProfiles, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);

    if (verifyError) {
      console.error('❌ Error verifying columns:', verifyError.message);
    } else if (verifyProfiles && verifyProfiles.length > 0) {
      const columns = Object.keys(verifyProfiles[0]);
      console.log('✅ Updated columns:', columns);
      
      if (columns.includes('first_name') && columns.includes('last_name')) {
        console.log('🎉 Success! first_name and last_name columns are now available');
      } else {
        console.log('⚠️ Columns may not have been added properly');
      }
    } else {
      console.log('ℹ️ No profiles exist yet, but columns should be available');
    }

  } catch (error) {
    console.error('❌ Error adding profile columns:', error);
  }
}

// Run if called directly
if (require.main === module) {
  addProfileColumns();
}

module.exports = { addProfileColumns }; 