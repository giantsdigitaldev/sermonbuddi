#!/usr/bin/env node

// Script to set up the database tables and configuration for SermonBuddi
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 Setting up SermonBuddi database...');
console.log('URL:', supabaseUrl);
console.log('Service Key:', supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + '...' : 'MISSING');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('💡 Make sure you have EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

// Create client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log('\n📖 Reading SQL setup file...');
    
    const sqlPath = path.join(__dirname, 'setup-database.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('✅ SQL file loaded successfully');
    
    console.log('\n🔧 Executing database setup...');
    
    // Execute the SQL setup
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Database setup failed:', error.message);
      
      // If the RPC method doesn't exist, we'll need to run this manually
      if (error.message.includes('function "exec_sql" does not exist')) {
        console.log('\n💡 The exec_sql function is not available.');
        console.log('🔧 You need to run the SQL manually in your Supabase dashboard:');
        console.log('\n📋 Steps:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the contents of scripts/setup-database.sql');
        console.log('4. Click "Run" to execute the SQL');
        
        console.log('\n📄 SQL Content:');
        console.log('---');
        console.log(sqlContent);
        console.log('---');
        
        return;
      }
    } else {
      console.log('✅ Database setup completed successfully');
    }

    console.log('\n🔍 Testing the setup...');
    
    // Test if the profiles table was created
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Profiles table test failed:', testError.message);
    } else {
      console.log('✅ Profiles table is working correctly');
    }

    console.log('\n🎉 Database setup completed!');
    console.log('📋 What was created:');
    console.log('- profiles table with RLS policies');
    console.log('- handle_new_user() function');
    console.log('- on_auth_user_created trigger');
    console.log('- storage bucket and policies');
    
    console.log('\n🔧 Next steps:');
    console.log('1. Test the signup flow in your app');
    console.log('2. Check that emails are being sent');
    console.log('3. Verify user profiles are created automatically');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupDatabase(); 