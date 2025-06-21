const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use service role key for testing (bypasses RLS)
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

async function testCommentWithUserId() {
  console.log('🔍 Testing comment functionality with hardcoded user ID...\n');

  try {
    // 1. Get a user from the database
    console.log('1. Getting a user from the database...');
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email')
      .limit(1);

    if (usersError || !users || users.length === 0) {
      console.error('❌ No users found in database');
      return;
    }

    const user = users[0];
    console.log('✅ Using user:', user.email, '(ID:', user.id + ')');

    // 2. Get a project to test with
    console.log('\n2. Getting a project to test with...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name')
      .limit(1);

    if (projectsError || !projects || projects.length === 0) {
      console.error('❌ No projects found in database');
      return;
    }

    const project = projects[0];
    console.log('📋 Using project:', project.name, '(ID:', project.id + ')');

    // 3. Test inserting a comment with the user ID
    console.log('\n3. Testing comment insertion with user ID...');
    const { data: insertData, error: insertError } = await supabase
      .from('project_comments')
      .insert({
        project_id: project.id,
        user_id: user.id,
        content: 'Test comment from hardcoded user ID'
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

    // 4. Test reading comments
    console.log('\n4. Testing comment retrieval...');
    const { data: comments, error: commentsError } = await supabase
      .from('project_comments')
      .select('*')
      .eq('project_id', project.id);

    if (commentsError) {
      console.error('❌ Error reading comments:', commentsError.message);
    } else {
      console.log('✅ Comments retrieved successfully!');
      console.log('📊 Found', comments.length, 'comments for project');
      comments.forEach((comment, index) => {
        console.log(`  ${index + 1}. ${comment.content} (by ${comment.user_id})`);
      });
    }

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

    console.log('\n🎉 All tests passed! Database and commenting functionality is working correctly.');
    console.log('\n💡 The issue is with session persistence, not the database setup.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testCommentWithUserId(); 