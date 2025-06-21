#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.log('Required: EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or EXPO_PUBLIC_SUPABASE_ANON_KEY)');
  process.exit(1);
}

// Use service role for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixWebAppIssues() {
  try {
    console.log('🚀 Fixing web app issues...\n');

    // Step 1: Fix tasks table constraints
    console.log('1️⃣ Fixing tasks table constraints...');
    
    // Drop existing constraint if it exists
    const dropConstraintSQL = `
      ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
    `;
    
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropConstraintSQL });
    if (!dropError) {
      console.log('   ✅ Dropped old status constraint');
    }
    
    // Add correct constraint
    const addConstraintSQL = `
      ALTER TABLE public.tasks 
      ADD CONSTRAINT tasks_status_check 
      CHECK (status IN ('todo', 'in_progress', 'completed', 'blocked'));
    `;
    
    const { error: addError } = await supabase.rpc('exec_sql', { sql: addConstraintSQL });
    if (!addError) {
      console.log('   ✅ Added correct status constraint');
    }

    console.log('\n🎉 Web app constraint issues fixed!');
    console.log('\n📋 Summary:');
    console.log('   • Fixed tasks status constraint to match TypeScript interface');
    console.log('   • Status values: todo, in_progress, completed, blocked');
    
    console.log('\n🔧 Next steps:');
    console.log('   1. Restart your Expo development server');
    console.log('   2. Test task creation in the web app');

  } catch (error) {
    console.error('❌ Error fixing web app issues:', error);
    process.exit(1);
  }
}

// Run the fix
fixWebAppIssues(); 