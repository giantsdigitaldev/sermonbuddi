const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY // Use service role key for admin access
);

async function testProjectDeletion() {
  console.log('🧪 Testing project deletion functionality...');
  
  try {
    // First, let's check what projects exist
    console.log('\n📊 Checking existing projects...');
    const { data: projects, error: fetchError } = await supabase
      .from('projects')
      .select('id, name, user_id')
      .limit(10);
    
    if (fetchError) {
      console.error('❌ Error fetching projects:', fetchError);
      return;
    }
    
    console.log(`✅ Found ${projects?.length || 0} projects:`, projects);
    
    if (!projects || projects.length === 0) {
      console.log('ℹ️ No projects found to test deletion');
      return;
    }
    
    // Test deletion on the first project
    const testProject = projects[0];
    console.log(`\n🗑️ Testing deletion of project: ${testProject.name} (${testProject.id})`);
    
    // Check if there are any tasks for this project
    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id')
      .eq('project_id', testProject.id);
    
    if (tasksError) {
      console.error('❌ Error checking tasks:', tasksError);
    } else {
      console.log(`📋 Found ${tasks?.length || 0} tasks for this project`);
    }
    
    // Test the actual deletion process
    console.log('\n🗑️ Step 1: Deleting related tasks...');
    const { error: deleteTasksError } = await supabase
      .from('tasks')
      .delete()
      .eq('project_id', testProject.id);
    
    if (deleteTasksError) {
      console.error('❌ Error deleting tasks:', deleteTasksError);
    } else {
      console.log('✅ Tasks deleted successfully');
    }
    
    console.log('\n🗑️ Step 2: Deleting project...');
    const { error: deleteProjectError } = await supabase
      .from('projects')
      .delete()
      .eq('id', testProject.id);
    
    if (deleteProjectError) {
      console.error('❌ Error deleting project:', deleteProjectError);
      console.error('Error details:', deleteProjectError.message);
      console.error('Error hint:', deleteProjectError.hint);
      console.error('Error code:', deleteProjectError.code);
    } else {
      console.log('✅ Project deleted successfully');
    }
    
    // Verify deletion
    console.log('\n🔍 Verifying deletion...');
    const { data: verifyProject, error: verifyError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', testProject.id)
      .single();
    
    if (verifyError && verifyError.code === 'PGRST116') {
      console.log('✅ Deletion verified - project no longer exists');
    } else if (verifyProject) {
      console.error('❌ Deletion failed - project still exists');
    } else {
      console.error('❌ Error verifying deletion:', verifyError);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testProjectDeletion(); 