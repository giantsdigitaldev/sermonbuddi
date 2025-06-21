const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

async function testProjectCommentsSetup() {
  console.log('🔍 Testing Project Comments Setup...\n');

  try {
    // 1. Test if project_comments table exists by trying to query it
    console.log('1. Testing project_comments table...');
    
    const { data: comments, error: commentsError } = await supabase
      .from('project_comments')
      .select('*')
      .limit(1);

    if (commentsError) {
      if (commentsError.message.includes('does not exist') || commentsError.code === '42P01') {
        console.error('❌ project_comments table does not exist');
        console.log('👉 You need to run the SQL script in Supabase dashboard first!');
        console.log('📁 Copy content from: scripts/supabase_project_comments_simple.sql');
        return false;
      } else if (commentsError.message.includes('permission denied')) {
        console.error('❌ Permission denied for project_comments table');
        console.log('👉 RLS policies might not be set up correctly');
        return false;
      } else {
        console.error('❌ Error accessing project_comments:', commentsError);
        return false;
      }
    }

    console.log('✅ project_comments table exists and is accessible');

    // 2. Test if project_comment_likes table exists
    console.log('\n2. Testing project_comment_likes table...');
    
    const { data: likes, error: likesError } = await supabase
      .from('project_comment_likes')
      .select('*')
      .limit(1);

    if (likesError) {
      if (likesError.message.includes('does not exist') || likesError.code === '42P01') {
        console.error('❌ project_comment_likes table does not exist');
        return false;
      } else {
        console.error('❌ Error accessing project_comment_likes:', likesError);
        return false;
      }
    }

    console.log('✅ project_comment_likes table exists and is accessible');

    // 3. Check if we have any projects to work with
    console.log('\n3. Checking projects...');
    
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name')
      .limit(5);

    if (projectsError) {
      console.error('❌ Error accessing projects:', projectsError);
      return false;
    } else {
      console.log(`📊 Found ${projects?.length || 0} projects`);
      if (projects && projects.length > 0) {
        console.log('📋 Sample projects:');
        projects.forEach(project => {
          console.log(`   - ${project.name} (${project.id})`);
        });
      } else {
        console.log('⚠️ No projects found - you will need at least one project to test comments');
      }
    }

    console.log('\n✅ Project Comments setup is working!');
    console.log('👉 You can now try creating comments in the app');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run the test
testProjectCommentsSetup().then(success => {
  if (!success) {
    console.log('\n🔧 SETUP INSTRUCTIONS:');
    console.log('1. Go to your Supabase project dashboard');
    console.log('2. Click "SQL Editor" in the left sidebar');
    console.log('3. Click "New Query"');
    console.log('4. Copy the entire content from scripts/supabase_project_comments_simple.sql');
    console.log('5. Paste it into the SQL editor');
    console.log('6. Click "RUN" to execute the script');
    console.log('7. Run this test again: node scripts/testProjectCommentsSetup.js');
  }
}); 