const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use service role key for testing
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

async function testDatabaseAccess() {
  console.log('🔍 Testing database access after RLS changes...\n');

  try {
    // 1. Test reading from project_comments
    console.log('1. Testing read access to project_comments...');
    const { data: comments, error: commentsError } = await supabase
      .from('project_comments')
      .select('*')
      .limit(5);

    if (commentsError) {
      console.error('❌ Cannot read from project_comments:', commentsError.message);
      console.error('Error code:', commentsError.code);
    } else {
      console.log('✅ Successfully read from project_comments');
      console.log('📊 Found', comments?.length || 0, 'comments');
    }

    // 2. Test reading from projects
    console.log('\n2. Testing read access to projects...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name')
      .limit(5);

    if (projectsError) {
      console.error('❌ Cannot read from projects:', projectsError.message);
      return;
    } else {
      console.log('✅ Successfully read from projects');
      console.log('📊 Found', projects?.length || 0, 'projects');
      if (projects && projects.length > 0) {
        projects.forEach((project, index) => {
          console.log(`  ${index + 1}. ${project.name} (ID: ${project.id})`);
        });
      }
    }

    // 3. Test reading from auth.users
    console.log('\n3. Testing read access to auth.users...');
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email')
      .limit(5);

    if (usersError) {
      console.error('❌ Cannot read from auth.users:', usersError.message);
    } else {
      console.log('✅ Successfully read from auth.users');
      console.log('📊 Found', users?.length || 0, 'users');
      if (users && users.length > 0) {
        users.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.email} (ID: ${user.id})`);
        });
      }
    }

    // 4. Test inserting a comment if we have data
    if (projects && projects.length > 0 && users && users.length > 0) {
      console.log('\n4. Testing comment insertion...');
      const project = projects[0];
      const user = users[0];
      
      const { data: insertData, error: insertError } = await supabase
        .from('project_comments')
        .insert({
          project_id: project.id,
          user_id: user.id,
          content: 'Test comment from service role after RLS disabled'
        })
        .select();

      if (insertError) {
        console.error('❌ Cannot insert comment:', insertError.message);
        console.error('Error code:', insertError.code);
      } else {
        console.log('✅ Successfully inserted comment');
        console.log('📝 Comment ID:', insertData[0].id);
        console.log('👤 User ID:', insertData[0].user_id);
        console.log('📄 Content:', insertData[0].content);
        
        // Clean up
        await supabase
          .from('project_comments')
          .delete()
          .eq('id', insertData[0].id);
        console.log('🧹 Test comment cleaned up');
      }
    } else {
      console.log('\n4. Skipping comment insertion test - no projects or users found');
    }

    // 5. Test with anon key (simulate web app)
    console.log('\n5. Testing with anon key (simulating web app)...');
    const anonSupabase = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: anonComments, error: anonError } = await anonSupabase
      .from('project_comments')
      .select('*')
      .limit(1);

    if (anonError) {
      console.error('❌ Anon key cannot access project_comments:', anonError.message);
      console.error('Error code:', anonError.code);
    } else {
      console.log('✅ Anon key can access project_comments');
      console.log('📊 Found', anonComments?.length || 0, 'comments');
    }

    console.log('\n🎯 Database access test completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testDatabaseAccess(); 