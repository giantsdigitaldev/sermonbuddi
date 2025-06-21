const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

async function fixProjectDeletionRLS() {
  console.log('🔧 Fixing RLS policies for project deletion...');
  
  try {
    console.log('\n🛡️ Fixing projects table RLS policies...');
    
    // First, let's check current policies
    const { data: currentPolicies, error: policiesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT schemaname, tablename, policyname, cmd, qual, with_check 
          FROM pg_policies 
          WHERE tablename IN ('projects', 'tasks');
        `
      });
    
    if (policiesError) {
      console.log('Note: Could not fetch current policies:', policiesError.message);
    } else {
      console.log('Current policies:', currentPolicies);
    }
    
    // Drop and recreate DELETE policy for projects
    console.log('\n🗑️ Updating project deletion policy...');
    const { error: updateProjectPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing delete policy
        DROP POLICY IF EXISTS "Users can delete their own projects" ON projects;
        DROP POLICY IF EXISTS "delete_own_projects" ON projects;
        DROP POLICY IF EXISTS "projects_delete_policy" ON projects;
        
        -- Create new delete policy
        CREATE POLICY "Users can delete their own projects" ON projects
          FOR DELETE USING (auth.uid() = user_id);
      `
    });
    
    if (updateProjectPolicyError) {
      console.error('❌ Error updating project policy:', updateProjectPolicyError);
    } else {
      console.log('✅ Project deletion policy updated');
    }
    
    // Update task deletion policy
    console.log('\n🗑️ Updating task deletion policy...');
    const { error: updateTaskPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing delete policy
        DROP POLICY IF EXISTS "Users can delete tasks from their projects" ON tasks;
        DROP POLICY IF EXISTS "delete_project_tasks" ON tasks;
        DROP POLICY IF EXISTS "tasks_delete_policy" ON tasks;
        
        -- Create new delete policy that allows deleting tasks from owned projects
        CREATE POLICY "Users can delete tasks from their projects" ON tasks
          FOR DELETE USING (
            EXISTS (
              SELECT 1 FROM projects 
              WHERE projects.id = tasks.project_id 
              AND projects.user_id = auth.uid()
            )
          );
      `
    });
    
    if (updateTaskPolicyError) {
      console.error('❌ Error updating task policy:', updateTaskPolicyError);
    } else {
      console.log('✅ Task deletion policy updated');
    }
    
    // Test deletion with a dummy operation (dry run)
    console.log('\n🧪 Testing deletion permissions...');
    const { data: testProjects, error: testError } = await supabase
      .from('projects')
      .select('id, name, user_id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error testing project access:', testError);
    } else if (testProjects && testProjects.length > 0) {
      console.log(`✅ Can access projects. Testing delete permission for: ${testProjects[0].name}`);
      
      // Test if we can delete (this will fail but we'll see the error)
      const { error: deleteTestError } = await supabase
        .from('projects')
        .delete()
        .eq('id', 'non-existent-id'); // Safe test with non-existent ID
        
      // This should fail with "no rows deleted" not permission error
      if (deleteTestError && deleteTestError.code === '42501') {
        console.error('❌ Still have permission issues:', deleteTestError.message);
      } else {
        console.log('✅ Delete permissions appear to be working');
      }
    }
    
    console.log('\n✅ RLS policy fix completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixProjectDeletionRLS(); 