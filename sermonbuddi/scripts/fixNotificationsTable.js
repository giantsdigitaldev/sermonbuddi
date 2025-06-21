const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixNotificationsTable() {
  try {
    console.log('🔔 Setting up notifications table and RLS policies...');

    // First, let's check if the notifications table exists
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'notifications');

    if (tablesError) {
      console.log('⚠️ Error checking for notifications table:', tablesError.message);
    }

    console.log('📋 Notifications table exists:', tables && tables.length > 0);

    // Create notifications table if it doesn't exist
    if (!tables || tables.length === 0) {
      console.log('📋 Creating notifications table...');
      
      const { error: createError } = await supabase
        .from('notifications')
        .insert([
          {
            id: '00000000-0000-0000-0000-000000000000',
            user_id: '00000000-0000-0000-0000-000000000000',
            type: 'test',
            title: 'Test',
            message: 'Test',
            data: {},
            read: false,
            created_at: new Date().toISOString()
          }
        ]);

      if (createError) {
        console.log('⚠️ Error creating test notification (table may not exist):', createError.message);
      }

      // Delete the test notification
      await supabase
        .from('notifications')
        .delete()
        .eq('id', '00000000-0000-0000-0000-000000000000');
    }

    // Check current RLS status
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .eq('tablename', 'notifications');

    if (rlsError) {
      console.log('⚠️ Error checking RLS status:', rlsError.message);
    } else {
      console.log('🔒 RLS status for notifications:', rlsStatus);
    }

    // Try to insert a test notification to check permissions
    const { data: currentUser } = await supabase.auth.getUser();
    if (currentUser.user) {
      console.log('👤 Testing notification insertion with user:', currentUser.user.id);
      
      const { data: testNotification, error: insertError } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: currentUser.user.id,
            type: 'test',
            title: 'Test Notification',
            message: 'Testing notification insertion',
            data: { test: true },
            read: false
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.log('❌ Error inserting test notification:', insertError.message);
        console.log('🔧 This indicates RLS policies need to be fixed');
      } else {
        console.log('✅ Test notification inserted successfully:', testNotification.id);
        
        // Clean up test notification
        await supabase
          .from('notifications')
          .delete()
          .eq('id', testNotification.id);
        
        console.log('🧹 Test notification cleaned up');
      }
    }

    console.log('🎉 Notifications table check completed!');

  } catch (error) {
    console.error('❌ Error fixing notifications table:', error);
    process.exit(1);
  }
}

// Run the setup
fixNotificationsTable(); 