const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.log('EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function directSchemaFix() {
  try {
    console.log('🔧 Direct schema fix for tasks table...');
    console.log('🔗 Supabase URL:', supabaseUrl);

    // First, let's check if we can connect and see the current schema
    console.log('\n📋 Step 1: Checking current tasks table structure...');
    
    const { data: currentSchema, error: schemaError } = await supabase
      .rpc('sql', {
        query: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_name = 'tasks' 
          AND table_schema = 'public'
          ORDER BY ordinal_position;
        `
      });

    if (schemaError) {
      console.log('⚠️ Schema check error:', schemaError.message);
      // Try alternative approach
      const { data: tables } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')
        .eq('tablename', 'tasks');
      
      console.log('📋 Tasks table exists:', tables && tables.length > 0);
    } else {
      console.log('✅ Current schema:', currentSchema);
    }

    // Try to add columns using direct SQL
    console.log('\n📋 Step 2: Adding missing columns...');
    
    const alterCommands = [
      `ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_to UUID[];`,
      `ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);`,
      `ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;`
    ];

    for (const command of alterCommands) {
      try {
        console.log('🔧 Executing:', command);
        const { error } = await supabase.rpc('sql', { query: command });
        if (error) {
          console.log('⚠️ Command error:', error.message);
        } else {
          console.log('✅ Command executed successfully');
        }
      } catch (err) {
        console.log('⚠️ Command exception:', err.message);
      }
    }

    // Try using a different approach - direct INSERT to test
    console.log('\n📋 Step 3: Testing task insertion...');
    
    const { data: user } = await supabase.auth.getUser();
    if (user.user) {
      console.log('👤 Current user:', user.user.id);
      
      // Try inserting a test task with minimal data
      const testTask = {
        title: 'Test Task Schema Fix',
        description: 'Testing if schema is fixed',
        project_id: 'b1d402d6-8050-43e2-af2d-305598d13f39',
        status: 'todo',
        priority: 'medium',
        user_id: user.user.id
      };

      const { data: insertResult, error: insertError } = await supabase
        .from('tasks')
        .insert([testTask])
        .select()
        .single();

      if (insertError) {
        console.log('❌ Test insertion failed:', insertError.message);
        console.log('🔍 Error details:', insertError);
        
        // Try with extended data
        const extendedTask = {
          ...testTask,
          assigned_to: [user.user.id],
          created_by: user.user.id,
          metadata: { test: true }
        };

        console.log('\n🔧 Trying with extended data...');
        const { data: extendedResult, error: extendedError } = await supabase
          .from('tasks')
          .insert([extendedTask])
          .select()
          .single();

        if (extendedError) {
          console.log('❌ Extended insertion failed:', extendedError.message);
        } else {
          console.log('✅ Extended insertion successful:', extendedResult.id);
          // Clean up test task
          await supabase.from('tasks').delete().eq('id', extendedResult.id);
          console.log('🧹 Test task cleaned up');
        }
      } else {
        console.log('✅ Basic insertion successful:', insertResult.id);
        // Clean up test task
        await supabase.from('tasks').delete().eq('id', insertResult.id);
        console.log('🧹 Test task cleaned up');
      }
    }

    // Final schema check
    console.log('\n📋 Step 4: Final schema verification...');
    try {
      const { data: finalSchema, error: finalError } = await supabase
        .rpc('sql', {
          query: `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'tasks' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
          `
        });

      if (finalError) {
        console.log('⚠️ Final schema check error:', finalError.message);
      } else {
        console.log('✅ Final schema:');
        finalSchema.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
      }
    } catch (err) {
      console.log('⚠️ Final schema check exception:', err.message);
    }

    console.log('\n🎉 Schema fix attempt completed!');
    console.log('\n📝 Next steps:');
    console.log('1. If errors persist, manually run SQL in Supabase dashboard');
    console.log('2. Go to Supabase Dashboard > SQL Editor');
    console.log('3. Run the commands from TASK_TABLE_FIX_GUIDE.md');

  } catch (error) {
    console.error('❌ Critical error in schema fix:', error);
  }
}

// Run the fix
directSchemaFix(); 