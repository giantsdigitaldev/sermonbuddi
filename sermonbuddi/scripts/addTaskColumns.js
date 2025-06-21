const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTaskColumns() {
  try {
    console.log('📋 Adding missing columns to tasks table...');

    // Add assigned_to column
    try {
      const { error: assignedToError } = await supabase.rpc('sql', {
        query: 'ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_to UUID[] DEFAULT \'{}\';'
      });
      
      if (assignedToError) {
        console.log('⚠️ assigned_to column error (may already exist):', assignedToError.message);
      } else {
        console.log('✅ assigned_to column added');
      }
    } catch (error) {
      console.log('⚠️ assigned_to column error:', error.message);
    }

    // Add created_by column
    try {
      const { error: createdByError } = await supabase.rpc('sql', {
        query: 'ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;'
      });
      
      if (createdByError) {
        console.log('⚠️ created_by column error (may already exist):', createdByError.message);
      } else {
        console.log('✅ created_by column added');
      }
    } catch (error) {
      console.log('⚠️ created_by column error:', error.message);
    }

    // Add metadata column
    try {
      const { error: metadataError } = await supabase.rpc('sql', {
        query: 'ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT \'{}\'::jsonb;'
      });
      
      if (metadataError) {
        console.log('⚠️ metadata column error (may already exist):', metadataError.message);
      } else {
        console.log('✅ metadata column added');
      }
    } catch (error) {
      console.log('⚠️ metadata column error:', error.message);
    }

    // Check current table structure
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'tasks')
      .eq('table_schema', 'public');

    if (columnsError) {
      console.error('❌ Error checking table structure:', columnsError);
    } else {
      console.log('📋 Current tasks table structure:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    console.log('🎉 Task columns setup completed!');

  } catch (error) {
    console.error('❌ Error adding task columns:', error);
    process.exit(1);
  }
}

// Run the setup
addTaskColumns(); 