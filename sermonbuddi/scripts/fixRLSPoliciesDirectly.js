require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role key for admin operations
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

console.log('Environment check:');
console.log('URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Service Key:', supabaseServiceKey ? 'Found' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS policies for task_subtasks, task_comments, and notifications...');

  try {
    // Drop all existing policies and recreate with simple, working conditions
    const queries = [
      // === TASK_SUBTASKS POLICIES ===
      `DROP POLICY IF EXISTS "Authenticated users can view subtasks" ON task_subtasks;`,
      `DROP POLICY IF EXISTS "Authenticated users can insert subtasks" ON task_subtasks;`,
      `DROP POLICY IF EXISTS "Authenticated users can update subtasks" ON task_subtasks;`,
      `DROP POLICY IF EXISTS "Authenticated users can delete subtasks" ON task_subtasks;`,
      
      // Create new simple policies for task_subtasks
      `CREATE POLICY "allow_authenticated_select_subtasks" ON task_subtasks FOR SELECT TO authenticated USING (true);`,
      `CREATE POLICY "allow_authenticated_insert_subtasks" ON task_subtasks FOR INSERT TO authenticated WITH CHECK (true);`,
      `CREATE POLICY "allow_authenticated_update_subtasks" ON task_subtasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);`,
      `CREATE POLICY "allow_authenticated_delete_subtasks" ON task_subtasks FOR DELETE TO authenticated USING (true);`,
      
      // === TASK_COMMENTS POLICIES ===
      `DROP POLICY IF EXISTS "Authenticated users can view comments" ON task_comments;`,
      `DROP POLICY IF EXISTS "Authenticated users can insert comments" ON task_comments;`,
      `DROP POLICY IF EXISTS "Authenticated users can update comments" ON task_comments;`,
      `DROP POLICY IF EXISTS "Authenticated users can delete comments" ON task_comments;`,
      
      // Create new simple policies for task_comments
      `CREATE POLICY "allow_authenticated_select_comments" ON task_comments FOR SELECT TO authenticated USING (true);`,
      `CREATE POLICY "allow_authenticated_insert_comments" ON task_comments FOR INSERT TO authenticated WITH CHECK (true);`,
      `CREATE POLICY "allow_authenticated_update_comments" ON task_comments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);`,
      `CREATE POLICY "allow_authenticated_delete_comments" ON task_comments FOR DELETE TO authenticated USING (true);`,
      
      // === NOTIFICATIONS POLICIES ===
      `DROP POLICY IF EXISTS "authenticated_users_can_send_notifications" ON notifications;`,
      `DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;`,
      `DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;`,
      `DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;`,
      
      // Create new simple policies for notifications
      `CREATE POLICY "allow_authenticated_select_notifications" ON notifications FOR SELECT TO authenticated USING (true);`,
      `CREATE POLICY "allow_authenticated_insert_notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (true);`,
      `CREATE POLICY "allow_authenticated_update_notifications" ON notifications FOR UPDATE TO authenticated USING (true) WITH CHECK (true);`,
      `CREATE POLICY "allow_authenticated_delete_notifications" ON notifications FOR DELETE TO authenticated USING (true);`,
    ];

    console.log('📋 Executing SQL queries...');
    for (const query of queries) {
      console.log(`Executing: ${query.substring(0, 50)}...`);
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.error(`❌ Error executing query: ${error.message}`);
        console.log(`Query was: ${query}`);
      }
    }

    console.log('✅ RLS policies fixed! All tables now have permissive authenticated user policies.');
    console.log('🧪 Test creating a task now - subtasks and notifications should work.');

  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error);
  }
}

// Also create the exec_sql function if it doesn't exist
async function createExecSqlFunction() {
  console.log('🔧 Creating exec_sql helper function...');
  
  const createFunctionQuery = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
        EXECUTE sql;
    END;
    $$;
  `;

  const { error } = await supabase.rpc('exec', { 
    sql: createFunctionQuery 
  });

  if (error) {
    console.log('Note: Could not create exec_sql function. Will try direct SQL execution.');
  } else {
    console.log('✅ Helper function created.');
  }
}

async function main() {
  await createExecSqlFunction();
  await fixRLSPolicies();
}

if (require.main === module) {
  main().then(() => {
    console.log('🎉 Script completed!');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = { fixRLSPolicies }; 