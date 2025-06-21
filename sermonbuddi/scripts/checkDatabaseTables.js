/**
 * Check existing database tables
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use service role key for testing
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

async function checkDatabaseTables() {
  console.log('🔍 Checking database tables and data...\n');

  try {
    // 1. Check auth.users table
    console.log('1. Checking auth.users table...');
    const { data: authUsers, error: authUsersError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .limit(5);

    if (authUsersError) {
      console.error('❌ Error accessing auth.users:', authUsersError.message);
    } else {
      console.log('✅ auth.users table accessible');
      console.log('📊 Found', authUsers?.length || 0, 'users');
      if (authUsers && authUsers.length > 0) {
        authUsers.forEach((user, index) => {
          console.log(`  ${index + 1}. ${user.email} (ID: ${user.id})`);
        });
      }
    }

    // 2. Check profiles table
    console.log('\n2. Checking profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (profilesError) {
      console.error('❌ Error accessing profiles:', profilesError.message);
    } else {
      console.log('✅ profiles table accessible');
      console.log('📊 Found', profiles?.length || 0, 'profiles');
      if (profiles && profiles.length > 0) {
        profiles.forEach((profile, index) => {
          console.log(`  ${index + 1}. ${profile.full_name || 'No name'} (ID: ${profile.id})`);
        });
      }
    }

    // 3. Check projects table
    console.log('\n3. Checking projects table...');
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(5);

    if (projectsError) {
      console.error('❌ Error accessing projects:', projectsError.message);
    } else {
      console.log('✅ projects table accessible');
      console.log('📊 Found', projects?.length || 0, 'projects');
      if (projects && projects.length > 0) {
        projects.forEach((project, index) => {
          console.log(`  ${index + 1}. ${project.name} (ID: ${project.id}, User: ${project.user_id})`);
        });
      }
    }

    // 4. Check project_comments table
    console.log('\n4. Checking project_comments table...');
    const { data: comments, error: commentsError } = await supabase
      .from('project_comments')
      .select('*')
      .limit(5);

    if (commentsError) {
      console.error('❌ Error accessing project_comments:', commentsError.message);
    } else {
      console.log('✅ project_comments table accessible');
      console.log('📊 Found', comments?.length || 0, 'comments');
      if (comments && comments.length > 0) {
        comments.forEach((comment, index) => {
          console.log(`  ${index + 1}. ${comment.content.substring(0, 50)}... (User: ${comment.user_id})`);
        });
      }
    }

    // 5. List all tables in public schema
    console.log('\n5. Listing all tables in public schema...');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_tables');

    if (tablesError) {
      console.log('⚠️ Could not get table list via RPC, trying alternative method...');
      // Try to access common tables
      const commonTables = ['profiles', 'projects', 'tasks', 'project_comments', 'team_members', 'team_invitations'];
      console.log('📋 Common tables to check:', commonTables);
    } else {
      console.log('✅ Tables in public schema:', tables);
    }

    console.log('\n🎯 Database check completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkDatabaseTables(); 