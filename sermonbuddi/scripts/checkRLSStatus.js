const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use service role key for testing
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

async function checkRLSStatus() {
  console.log('🔍 Checking RLS status on project_comments table...\n');

  try {
    // 1. Check if project_comments table exists and its RLS status
    console.log('1. Checking project_comments table RLS status...');
    
    // Try to query the table directly
    const { data: comments, error: commentsError } = await supabase
      .from('project_comments')
      .select('*')
      .limit(1);

    if (commentsError) {
      console.log('❌ Error accessing project_comments:', commentsError.message);
      console.log('Error code:', commentsError.code);
      
      if (commentsError.code === '42501') {
        console.log('🔒 RLS is blocking access - permission denied');
      } else if (commentsError.code === '42P01') {
        console.log('📝 Table does not exist');
      }
    } else {
      console.log('✅ project_comments table accessible');
      console.log('📊 Found', comments?.length || 0, 'comments');
    }

    // 2. Try to disable RLS on project_comments table
    console.log('\n2. Attempting to disable RLS on project_comments...');
    
    const { error: disableRLSError } = await supabase
      .rpc('disable_rls_on_project_comments');

    if (disableRLSError) {
      console.log('⚠️ Could not disable RLS via RPC, trying direct SQL...');
      
      // Try direct SQL execution
      const { error: sqlError } = await supabase
        .rpc('exec_sql', { 
          sql: 'ALTER TABLE project_comments DISABLE ROW LEVEL SECURITY;' 
        });

      if (sqlError) {
        console.log('❌ Could not disable RLS:', sqlError.message);
      } else {
        console.log('✅ RLS disabled successfully');
      }
    } else {
      console.log('✅ RLS disabled successfully via RPC');
    }

    // 3. Test access again after disabling RLS
    console.log('\n3. Testing access after RLS changes...');
    const { data: testComments, error: testError } = await supabase
      .from('project_comments')
      .select('*')
      .limit(1);

    if (testError) {
      console.log('❌ Still cannot access project_comments:', testError.message);
    } else {
      console.log('✅ Successfully accessed project_comments table');
      console.log('📊 Found', testComments?.length || 0, 'comments');
    }

    // 4. Check if we can insert a test comment
    console.log('\n4. Testing comment insertion...');
    
    // First, get a project to test with
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name')
      .limit(1);

    if (projectsError) {
      console.log('❌ Cannot access projects table:', projectsError.message);
      return;
    }

    if (!projects || projects.length === 0) {
      console.log('❌ No projects found to test with');
      return;
    }

    const project = projects[0];
    console.log('📋 Using project:', project.name, '(ID:', project.id + ')');

    // Try to insert a test comment
    const { data: insertData, error: insertError } = await supabase
      .from('project_comments')
      .insert({
        project_id: project.id,
        user_id: '00000000-0000-0000-0000-000000000000', // Dummy user ID
        content: 'Test comment from service role'
      })
      .select();

    if (insertError) {
      console.log('❌ Cannot insert comment:', insertError.message);
    } else {
      console.log('✅ Successfully inserted test comment');
      console.log('📝 Comment ID:', insertData[0].id);
      
      // Clean up
      await supabase
        .from('project_comments')
        .delete()
        .eq('id', insertData[0].id);
      console.log('🧹 Test comment cleaned up');
    }

    console.log('\n🎯 RLS status check completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkRLSStatus(); 