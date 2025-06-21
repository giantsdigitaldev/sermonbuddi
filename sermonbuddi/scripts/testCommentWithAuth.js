const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testCommentWithAuth() {
  console.log('🔍 Testing comment functionality with authentication...\n');

  try {
    // 1. Check current session
    console.log('1. Checking current session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error getting session:', sessionError);
      return;
    }

    if (!session) {
      console.log('❌ No active session found');
      console.log('💡 You need to be logged in to test commenting');
      return;
    }

    console.log('✅ User is authenticated:', session.user.email);

    // 2. Test project_comments table access
    console.log('\n2. Testing project_comments table access...');
    const { data: comments, error: commentsError } = await supabase
      .from('project_comments')
      .select('*')
      .limit(1);

    if (commentsError) {
      console.error('❌ Error accessing project_comments:', commentsError.message);
      console.error('Error code:', commentsError.code);
      return;
    }

    console.log('✅ project_comments table is accessible');
    console.log('📊 Found', comments.length, 'comments');

    // 3. Get a project to test with
    console.log('\n3. Getting a project to test with...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name')
      .limit(1);

    if (projectsError || !projects || projects.length === 0) {
      console.error('❌ No projects found to test with');
      return;
    }

    const project = projects[0];
    console.log('📋 Using project:', project.name, '(ID:', project.id + ')');

    // 4. Test inserting a comment
    console.log('\n4. Testing comment insertion...');
    const { data: insertData, error: insertError } = await supabase
      .from('project_comments')
      .insert({
        project_id: project.id,
        user_id: session.user.id,
        content: 'Test comment from authenticated user'
      })
      .select();

    if (insertError) {
      console.error('❌ Error inserting comment:', insertError.message);
      console.error('Error code:', insertError.code);
      return;
    }

    console.log('✅ Comment inserted successfully!');
    console.log('📝 Comment ID:', insertData[0].id);
    console.log('👤 User ID:', insertData[0].user_id);
    console.log('📄 Content:', insertData[0].content);

    // 5. Clean up the test comment
    console.log('\n5. Cleaning up test comment...');
    const { error: deleteError } = await supabase
      .from('project_comments')
      .delete()
      .eq('id', insertData[0].id);

    if (deleteError) {
      console.error('⚠️ Warning: Could not delete test comment:', deleteError.message);
    } else {
      console.log('🧹 Test comment cleaned up');
    }

    console.log('\n🎉 All tests passed! Commenting functionality is working correctly.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testCommentWithAuth(); 