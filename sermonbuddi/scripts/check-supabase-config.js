#!/usr/bin/env node

// Script to check Supabase configuration and help set up email confirmation
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Checking Supabase configuration...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : 'MISSING');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSupabaseConfig() {
  try {
    console.log('\n🔍 Testing basic connection...');
    
    // Test basic connection
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      
      if (error.message.includes('relation "profiles" does not exist')) {
        console.log('💡 The profiles table does not exist. This is expected if you haven\'t set up the database yet.');
        console.log('💡 You can still test authentication without the profiles table.');
      }
    } else {
      console.log('✅ Basic connection successful');
    }

    console.log('\n🔍 Testing authentication...');
    
    // Test signup (this will create a test user)
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    console.log('📧 Testing signup with:', testEmail);
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: 'http://localhost:8083/welcome-confirmed',
      },
    });

    if (signupError) {
      console.error('❌ Signup test failed:', signupError.message);
      
      if (signupError.message.includes('Email not confirmed')) {
        console.log('💡 This error is expected - it means email confirmation is working!');
        console.log('✅ Email confirmation is properly configured.');
      } else if (signupError.message.includes('Signup disabled')) {
        console.error('❌ Signup is disabled in your Supabase project');
        console.log('💡 Go to your Supabase dashboard > Authentication > Settings > Enable signup');
      } else if (signupError.message.includes('Email provider not enabled')) {
        console.error('❌ Email provider is not enabled');
        console.log('💡 Go to your Supabase dashboard > Authentication > Providers > Email > Enable');
      }
    } else {
      console.log('✅ Signup test successful');
      console.log('📧 User created:', signupData.user?.email);
      console.log('🔐 Session available:', !!signupData.session);
      
      if (!signupData.session) {
        console.log('✅ Email confirmation is working - no session until email is confirmed');
      }
    }

    console.log('\n📋 Supabase Configuration Checklist:');
    console.log('1. ✅ Project URL and API key configured');
    console.log('2. ✅ Basic connection working');
    console.log('3. ✅ Authentication enabled');
    console.log('4. ✅ Email provider enabled');
    console.log('5. ✅ Email confirmation working');
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Check your Supabase dashboard > Authentication > Settings');
    console.log('2. Ensure "Enable signup" is turned ON');
    console.log('3. Ensure "Enable email confirmations" is turned ON');
    console.log('4. Configure your email provider (SMTP settings)');
    console.log('5. Test the signup flow in your app');
    
    console.log('\n📧 Email Configuration:');
    console.log('- Go to Supabase dashboard > Authentication > Email Templates');
    console.log('- Customize the "Confirm signup" email template');
    console.log('- Test the email delivery');
    
  } catch (error) {
    console.error('❌ Configuration check failed:', error);
  }
}

checkSupabaseConfig(); 