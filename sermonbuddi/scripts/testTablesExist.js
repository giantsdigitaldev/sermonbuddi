const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testTablesExist() {
  console.log('🔍 Testing if tables exist...\n');

  try {
    // Test if we can query the project_comments table
    console.log('1. Testing project_comments table access...');
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

    // Test if we can query the project_comment_likes table
    console.log('\n2. Testing project_comment_likes table access...');
    const { data: likes, error: likesError } = await supabase
      .from('project_comment_likes')
      .select('*')
      .limit(1);

    if (likesError) {
      console.error('❌ Error accessing project_comment_likes:', likesError.message);
      return;
    }

    console.log('✅ project_comment_likes table is accessible');
    console.log('📊 Found', likes.length, 'likes');

    // Test inserting a comment
    console.log('\n3. Testing comment insertion...');
    
    // First, get a project ID
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .limit(1);

    if (projectsError || !projects || projects.length === 0) {
      console.error('❌ No projects found to test with');
      return;
    }

    const projectId = projects[0].id;
    console.log('📋 Using project ID:', projectId);

    // Try to insert a test comment
    const { data: insertData, error: insertError } = await supabase
      .from('project_comments')
      .insert({
        project_id: projectId,
        user_id: '00000000-0000-0000-0000-000000000000', // Test user ID
        content: 'Test comment from script'
      })
      .select();

    if (insertError) {
      console.error('❌ Error inserting comment:', insertError.message);
      console.error('Error code:', insertError.code);
      return;
    }

    console.log('✅ Comment inserted successfully!');
    console.log('📝 Inserted comment ID:', insertData[0].id);

    // Clean up the test comment
    const { error: deleteError } = await supabase
      .from('project_comments')
      .delete()
      .eq('id', insertData[0].id);

    if (deleteError) {
      console.error('⚠️ Warning: Could not delete test comment:', deleteError.message);
    } else {
      console.log('🧹 Test comment cleaned up');
    }

    console.log('\n🎉 All tests passed! Tables are working correctly.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testTablesExist(); 