const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function debugAuth() {
  console.log('🔍 Debugging Authentication State...\n');

  try {
    // 1. Check current session
    console.log('1. Checking current session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error getting session:', sessionError);
      return;
    }

    if (session) {
      console.log('✅ User is authenticated');
      console.log('👤 User ID:', session.user.id);
      console.log('📧 Email:', session.user.email);
      console.log('🔑 Token preview:', session.access_token.substring(0, 20) + '...');
    } else {
      console.log('❌ No active session found');
      console.log('👉 User needs to log in');
      return;
    }

    // 2. Test authenticated request to project_comments
    console.log('\n2. Testing authenticated request to project_comments...');
    
    const { data: comments, error: commentsError } = await supabase
      .from('project_comments')
      .select('*')
      .limit(1);

    if (commentsError) {
      console.error('❌ Error accessing project_comments:', commentsError);
      console.log('🔍 Error details:', {
        code: commentsError.code,
        message: commentsError.message,
        details: commentsError.details
      });
    } else {
      console.log('✅ Successfully accessed project_comments table');
      console.log('📊 Comments found:', comments?.length || 0);
    }

    // 3. Test insert with current user
    console.log('\n3. Testing insert with current user...');
    
    const testComment = {
      project_id: '00000000-0000-0000-0000-000000000001', // Mock project ID
      content: 'Test comment from debug script',
      user_id: session.user.id
    };

    const { data: newComment, error: insertError } = await supabase
      .from('project_comments')
      .insert(testComment)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting test comment:', insertError);
      console.log('🔍 Insert error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details
      });
    } else {
      console.log('✅ Successfully inserted test comment');
      console.log('📝 Comment ID:', newComment.id);
      
      // Clean up test comment
      await supabase
        .from('project_comments')
        .delete()
        .eq('id', newComment.id);
      console.log('🗑️ Cleaned up test comment');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the debug
debugAuth(); 