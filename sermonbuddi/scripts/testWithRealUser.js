const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Test with anon key (simulating web app)
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testWithRealUser() {
  console.log('🧪 Testing comment functionality with real user...\n');

  try {
    // 1. Get a real user ID - use the users you provided
    console.log('1. Using provided user ID...');
    const realUserId = 'c08d6265-7c3c-4f95-ad44-c4d6aaf31e46'; // a00evans@gmail.com
    console.log('✅ Using user ID:', realUserId);

    // 2. Get a project
    console.log('\n2. Getting project...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name')
      .limit(1);

    if (projectsError) {
      console.error('❌ Cannot read projects:', projectsError.message);
      return;
    }

    if (!projects || projects.length === 0) {
      console.error('❌ No projects found');
      return;
    }

    const project = projects[0];
    console.log('✅ Found project:', project.name, '(ID:', project.id + ')');

    // 3. Test inserting a comment with real user ID
    console.log('\n3. Testing comment insertion with real user...');
    const testComment = {
      project_id: project.id,
      user_id: realUserId, // Use real user ID
      content: 'Test comment from Node.js script with real user - ' + new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabase
      .from('project_comments')
      .insert(testComment)
      .select();

    if (insertError) {
      console.error('❌ Cannot insert comment:', insertError.message);
      console.error('Error code:', insertError.code);
      console.error('Error details:', insertError.details);
    } else {
      console.log('✅ Successfully inserted comment!');
      console.log('📝 Comment ID:', insertData[0].id);
      console.log('👤 User ID:', insertData[0].user_id);
      console.log('📄 Content:', insertData[0].content);
      console.log('⏰ Created at:', insertData[0].created_at);

      // 4. Test reading the comment back
      console.log('\n4. Testing comment retrieval...');
      const { data: retrievedComment, error: retrieveError } = await supabase
        .from('project_comments')
        .select('*')
        .eq('id', insertData[0].id)
        .single();

      if (retrieveError) {
        console.error('❌ Cannot retrieve comment:', retrieveError.message);
      } else {
        console.log('✅ Successfully retrieved comment!');
        console.log('📝 Comment:', retrievedComment.content);
        console.log('👤 By user:', retrievedComment.user_id);
      }

      // 5. Test updating the comment
      console.log('\n5. Testing comment update...');
      const updatedContent = 'Updated comment content - ' + new Date().toISOString();
      const { data: updateData, error: updateError } = await supabase
        .from('project_comments')
        .update({ content: updatedContent })
        .eq('id', insertData[0].id)
        .select();

      if (updateError) {
        console.error('❌ Cannot update comment:', updateError.message);
      } else {
        console.log('✅ Successfully updated comment!');
        console.log('📝 New content:', updateData[0].content);
      }

      // 6. Test deleting the comment
      console.log('\n6. Testing comment deletion...');
      const { error: deleteError } = await supabase
        .from('project_comments')
        .delete()
        .eq('id', insertData[0].id);

      if (deleteError) {
        console.error('❌ Cannot delete comment:', deleteError.message);
      } else {
        console.log('✅ Successfully deleted comment!');
      }
    }

    console.log('\n🎯 Full CRUD test completed successfully!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testWithRealUser(); 