const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Test with anon key (simulating web app)
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testCommentFunctionality() {
  console.log('🧪 Testing comment functionality after RLS fix...\n');

  try {
    // 1. Test reading projects
    console.log('1. Testing project read access...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name')
      .limit(1);

    if (projectsError) {
      console.error('❌ Cannot read projects:', projectsError.message);
      return;
    }
    console.log('✅ Can read projects');
    console.log('📊 Found', projects?.length || 0, 'projects');

    if (!projects || projects.length === 0) {
      console.log('⚠️ No projects found - cannot test commenting');
      return;
    }

    const project = projects[0];
    console.log('🎯 Using project:', project.name, '(ID:', project.id + ')');

    // 2. Test reading comments
    console.log('\n2. Testing comment read access...');
    const { data: comments, error: commentsError } = await supabase
      .from('project_comments')
      .select('*')
      .eq('project_id', project.id)
      .limit(5);

    if (commentsError) {
      console.error('❌ Cannot read comments:', commentsError.message);
      return;
    }
    console.log('✅ Can read comments');
    console.log('📊 Found', comments?.length || 0, 'comments for this project');

    // 3. Test inserting a comment (this should work even without auth)
    console.log('\n3. Testing comment insertion...');
    const testComment = {
      project_id: project.id,
      user_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      content: 'Test comment from Node.js script - ' + new Date().toISOString()
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
      console.log('📄 Content:', insertData[0].content);
      console.log('⏰ Created at:', insertData[0].created_at);

      // Clean up test comment
      await supabase
        .from('project_comments')
        .delete()
        .eq('id', insertData[0].id);
      console.log('🧹 Test comment cleaned up');
    }

    // 4. Test with service role key
    console.log('\n4. Testing with service role key...');
    const serviceSupabase = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL,
      process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: serviceComments, error: serviceError } = await serviceSupabase
      .from('project_comments')
      .select('*')
      .limit(1);

    if (serviceError) {
      console.error('❌ Service role cannot access comments:', serviceError.message);
    } else {
      console.log('✅ Service role can access comments');
      console.log('📊 Found', serviceComments?.length || 0, 'comments');
    }

    console.log('\n🎯 Comment functionality test completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testCommentFunctionality(); 