const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role key (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function testWithServiceRole() {
  console.log('🧪 Testing with service role key (bypasses RLS)...');
  
  try {
    // Test basic access
    console.log('\n📊 Checking projects with service role...');
    const { data: projects, error: fetchError } = await supabaseAdmin
      .from('projects')
      .select('id, name, user_id')
      .limit(5);
    
    if (fetchError) {
      console.error('❌ Error fetching projects with service role:', fetchError);
      return;
    }
    
    console.log(`✅ Found ${projects?.length || 0} projects with service role`);
    console.log('Projects:', projects?.map(p => ({ id: p.id, name: p.name, user_id: p.user_id })));
    
    if (projects && projects.length > 0) {
      // Test deletion with service role
      const testProject = projects[projects.length - 1]; // Use last project for safety
      console.log(`\n🗑️ Testing deletion with service role on: ${testProject.name} (${testProject.id})`);
      
      // Delete related tasks first
      const { error: tasksError } = await supabaseAdmin
        .from('tasks')
        .delete()
        .eq('project_id', testProject.id);
      
      if (tasksError) {
        console.error('❌ Error deleting tasks:', tasksError);
      } else {
        console.log('✅ Tasks deleted with service role');
      }
      
      // Delete the project
      const { error: deleteError } = await supabaseAdmin
        .from('projects')
        .delete()
        .eq('id', testProject.id);
      
      if (deleteError) {
        console.error('❌ Error deleting project with service role:', deleteError);
      } else {
        console.log('✅ Project deleted successfully with service role!');
        
        // Verify deletion
        const { data: verifyProject, error: verifyError } = await supabaseAdmin
          .from('projects')
          .select('id')
          .eq('id', testProject.id)
          .single();
        
        if (verifyError && verifyError.code === 'PGRST116') {
          console.log('✅ Deletion verified - project no longer exists');
        } else if (verifyProject) {
          console.error('❌ Deletion failed - project still exists');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testWithServiceRole(); 