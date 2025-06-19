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

async function fixTasksTableSchema() {
  try {
    console.log('📋 Checking and fixing tasks table schema...');

    // First, check if the table exists and what columns it has
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'tasks')
      .eq('table_schema', 'public');

    if (tableError) {
      console.error('❌ Error checking table schema:', tableError);
      return;
    }

    console.log('📊 Current tasks table columns:', tableInfo?.map(col => col.column_name));

    // Check which columns are missing
    const requiredColumns = [
      'id', 'user_id', 'project_id', 'title', 'description', 
      'status', 'priority', 'due_date', 'assigned_to', 'created_by', 
      'metadata', 'created_at', 'updated_at'
    ];

    const existingColumns = tableInfo?.map(col => col.column_name) || [];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    console.log('❓ Missing columns:', missingColumns);

    // Add missing columns one by one
    for (const column of missingColumns) {
      let columnDef = '';
      
      switch (column) {
        case 'assigned_to':
          columnDef = 'assigned_to UUID[] DEFAULT \'{}\'';
          break;
        case 'created_by':
          columnDef = 'created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL';
          break;
        case 'metadata':
          columnDef = 'metadata JSONB DEFAULT \'{}\'::jsonb';
          break;
        case 'due_date':
          columnDef = 'due_date DATE';
          break;
        default:
          continue; // Skip columns that should already exist from base table
      }

      if (columnDef) {
        console.log(`➕ Adding column: ${column}`);
        const { error } = await supabase.rpc('sql', {
          query: `ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS ${columnDef};`
        });

        if (error) {
          console.log(`⚠️ Column ${column} might already exist or there's a permission issue:`, error.message);
        } else {
          console.log(`✅ Column ${column} added successfully`);
        }
      }
    }

    // Try creating indexes
    console.log('📊 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);',
      'CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);',
      'CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks USING GIN(assigned_to);',
      'CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);',
      'CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);',
      'CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);',
      'CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);'
    ];

    for (const indexQuery of indexes) {
      const { error } = await supabase.rpc('sql', { query: indexQuery });
      if (error && !error.message.includes('already exists')) {
        console.log('⚠️ Index creation warning:', error.message);
      }
    }

    console.log('✅ Indexes creation completed');

    // Test the table by inserting a sample record
    console.log('🧪 Testing table with sample data...');
    
    const { data: currentUser } = await supabase.auth.getUser();
    const testUserId = currentUser.user?.id || '00000000-0000-0000-0000-000000000000';

    const { data: testInsert, error: insertError } = await supabase
      .from('tasks')
      .insert({
        title: 'Test Task',
        description: 'Test task to verify schema',
        project_id: '90274700-630c-45f3-98c4-16a965747195', // Using mock project ID
        status: 'todo',
        priority: 'medium',
        assigned_to: [testUserId],
        created_by: testUserId,
        metadata: { test: true }
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Test insert failed:', insertError);
      
      // Try to identify the specific issue
      if (insertError.message.includes('assigned_to')) {
        console.log('🔧 The assigned_to column might not exist. Trying direct SQL...');
        
        // Try direct SQL approach
        const { error: sqlError } = await supabase.rpc('sql', {
          query: `
            DO $$ 
            BEGIN
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                            WHERE table_name = 'tasks' AND column_name = 'assigned_to') THEN
                ALTER TABLE public.tasks ADD COLUMN assigned_to UUID[] DEFAULT '{}';
              END IF;
              
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                            WHERE table_name = 'tasks' AND column_name = 'created_by') THEN
                ALTER TABLE public.tasks ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
              END IF;
              
              IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                            WHERE table_name = 'tasks' AND column_name = 'metadata') THEN
                ALTER TABLE public.tasks ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
              END IF;
            END $$;
          `
        });

        if (sqlError) {
          console.error('❌ Direct SQL also failed:', sqlError);
        } else {
          console.log('✅ Direct SQL execution succeeded');
        }
      }
    } else {
      console.log('✅ Test insert successful:', testInsert.id);
      
      // Clean up test record
      await supabase.from('tasks').delete().eq('id', testInsert.id);
      console.log('🧹 Test record cleaned up');
    }

    console.log('🎉 Tasks table schema fix completed!');

  } catch (error) {
    console.error('❌ Error fixing tasks table schema:', error);
    process.exit(1);
  }
}

// Run the fix
fixTasksTableSchema(); 