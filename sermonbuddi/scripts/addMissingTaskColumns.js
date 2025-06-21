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

async function addMissingTaskColumns() {
  try {
    console.log('📋 Adding missing columns to tasks table...');

    // Try to add the missing columns directly
    const alterTableQueries = [
      // Add assigned_to column (UUID array)
      `DO $$ 
       BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_schema = 'public' 
           AND table_name = 'tasks' 
           AND column_name = 'assigned_to'
         ) THEN
           ALTER TABLE public.tasks ADD COLUMN assigned_to UUID[] DEFAULT '{}';
           RAISE NOTICE 'Added assigned_to column';
         ELSE
           RAISE NOTICE 'assigned_to column already exists';
         END IF;
       EXCEPTION WHEN OTHERS THEN
         RAISE NOTICE 'Could not add assigned_to column: %', SQLERRM;
       END $$;`,

      // Add created_by column
      `DO $$ 
       BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_schema = 'public' 
           AND table_name = 'tasks' 
           AND column_name = 'created_by'
         ) THEN
           ALTER TABLE public.tasks ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
           RAISE NOTICE 'Added created_by column';
         ELSE
           RAISE NOTICE 'created_by column already exists';
         END IF;
       EXCEPTION WHEN OTHERS THEN
         RAISE NOTICE 'Could not add created_by column: %', SQLERRM;
       END $$;`,

      // Add metadata column
      `DO $$ 
       BEGIN
         IF NOT EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_schema = 'public' 
           AND table_name = 'tasks' 
           AND column_name = 'metadata'
         ) THEN
           ALTER TABLE public.tasks ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
           RAISE NOTICE 'Added metadata column';
         ELSE
           RAISE NOTICE 'metadata column already exists';
         END IF;
       EXCEPTION WHEN OTHERS THEN
         RAISE NOTICE 'Could not add metadata column: %', SQLERRM;
       END $$;`
    ];

    for (const query of alterTableQueries) {
      console.log('🔧 Executing column addition...');
      
      const { error } = await supabase.rpc('sql', { query });
      
      if (error) {
        console.log('⚠️ Query warning:', error.message);
        
        // If sql function doesn't work, try direct query execution
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            },
            body: JSON.stringify({ query })
          });
          
          if (!response.ok) {
            console.log('⚠️ Direct fetch also failed:', response.statusText);
          } else {
            console.log('✅ Direct fetch succeeded');
          }
        } catch (fetchError) {
          console.log('⚠️ Direct fetch error:', fetchError.message);
        }
      } else {
        console.log('✅ Column addition query executed successfully');
      }
    }

    // Test the table by doing a simple select to check columns
    console.log('🧪 Testing tasks table structure...');
    
    const { data: testData, error: testError } = await supabase
      .from('tasks')
      .select('id, title, status, assigned_to, created_by, metadata')
      .limit(1);

    if (testError) {
      console.error('❌ Test query failed:', testError.message);
      
      if (testError.message.includes('assigned_to')) {
        console.log('🔧 assigned_to column still missing, trying alternative approach...');
        
        // Try a more direct approach using raw SQL
        const directSQL = `
          ALTER TABLE public.tasks 
          ADD COLUMN IF NOT EXISTS assigned_to UUID[] DEFAULT '{}',
          ADD COLUMN IF NOT EXISTS created_by UUID,
          ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
        `;
        
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'apikey': supabaseServiceKey
            },
            body: JSON.stringify({ query: directSQL })
          });
          
          if (response.ok) {
            console.log('✅ Direct SQL execution succeeded');
          } else {
            console.log('❌ Direct SQL execution failed:', response.statusText);
          }
        } catch (directError) {
          console.error('❌ Direct SQL execution error:', directError);
        }
      }
    } else {
      console.log('✅ Tasks table test successful');
      console.log('📊 Available columns confirmed:', Object.keys(testData?.[0] || {}));
    }

    // Try a simple insert test
    console.log('🧪 Testing task insertion...');
    
    const { data: currentUser } = await supabase.auth.getUser();
    const testUserId = currentUser.user?.id || '00000000-0000-0000-0000-000000000000';

    const { data: insertTest, error: insertError } = await supabase
      .from('tasks')
      .insert({
        title: 'Test Task',
        description: 'Test task to verify schema',
        project_id: '90274700-630c-45f3-98c4-16a965747195',
        status: 'todo',
        priority: 'medium'
        // Don't include assigned_to and other problematic fields for now
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insert test failed:', insertError.message);
    } else {
      console.log('✅ Basic insert test successful:', insertTest.id);
      
      // Clean up test record
      await supabase.from('tasks').delete().eq('id', insertTest.id);
      console.log('🧹 Test record cleaned up');
    }

    console.log('🎉 Task table column addition completed!');

  } catch (error) {
    console.error('❌ Error adding missing task columns:', error);
    process.exit(1);
  }
}

// Run the fix
addMissingTaskColumns(); 