const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🔧 Using Supabase URL:', supabaseUrl);
console.log('🔧 Using Service Key:', supabaseServiceKey ? 'PROVIDED' : 'MISSING');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixNotificationRLSDirectly() {
  try {
    console.log('🔔 Fixing notification RLS policies directly...');

    // First, test if notifications table exists by trying to query it
    console.log('📋 Testing notifications table access...');
    
    const { data: testQuery, error: testError } = await supabase
      .from('notifications')
      .select('id')
      .limit(1);

    if (testError) {
      if (testError.message.includes('relation "public.notifications" does not exist')) {
        console.error('❌ Notifications table does not exist!');
        console.log('🔧 Please run the setupNotifications.js script first to create the table');
        process.exit(1);
      } else {
        console.log('⚠️ Table access test warning:', testError.message);
      }
    } else {
      console.log('✅ Notifications table exists and is accessible');
    }

    // Create a function to enable RLS and create policies using a stored function
    console.log('🔧 Creating stored function for RLS policy setup...');
    
    // First, we'll create a temporary function to handle the RLS setup
    const createSetupFunction = `
      CREATE OR REPLACE FUNCTION setup_notification_rls()
      RETURNS TEXT AS $$
      BEGIN
        -- Enable RLS on notifications table
        ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies
        DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
        DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
        DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
        DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
        DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
        DROP POLICY IF EXISTS "Team members can send notifications" ON public.notifications;
        DROP POLICY IF EXISTS "Allow notification sending" ON public.notifications;
        
        -- Create new policies
        CREATE POLICY "Users can view own notifications" ON public.notifications
          FOR SELECT USING (auth.uid() = user_id);
          
        CREATE POLICY "Allow notification sending" ON public.notifications
          FOR INSERT WITH CHECK (
            auth.role() = 'authenticated' AND
            auth.uid() IS NOT NULL
          );
          
        CREATE POLICY "Users can update own notifications" ON public.notifications
          FOR UPDATE USING (auth.uid() = user_id)
          WITH CHECK (auth.uid() = user_id);
          
        CREATE POLICY "Users can delete own notifications" ON public.notifications
          FOR DELETE USING (auth.uid() = user_id);
        
        RETURN 'RLS policies created successfully';
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    // Execute the function creation
    const { data: functionResult, error: functionError } = await supabase.rpc('query', {
      query: createSetupFunction
    });

    if (functionError) {
      console.log('⚠️ Function creation error (trying alternative method):', functionError.message);
      
      // Alternative approach: Try to use a simpler method
      console.log('🔄 Trying direct policy creation...');
      
      // Test current permissions by attempting to insert a notification
      console.log('🧪 Testing current notification permissions...');
      
      const testUserId = '11111111-1111-1111-1111-111111111111';
      const { data: testNotification, error: insertError } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: testUserId,
            type: 'rls_test',
            title: 'RLS Permission Test',
            message: 'Testing if notifications can be inserted',
            data: { test: true },
            read: false
          }
        ])
        .select()
        .single();

      if (insertError) {
        console.log('❌ Notification insertion test failed:', insertError.message);
        
        if (insertError.message.includes('permission denied')) {
          console.log('');
          console.log('🔧 MANUAL FIX REQUIRED:');
          console.log('The RLS policies need to be updated manually in the Supabase dashboard.');
          console.log('');
          console.log('Please follow these steps:');
          console.log('1. Go to your Supabase dashboard');
          console.log('2. Navigate to Database > Tables > notifications');
          console.log('3. Click on "RLS disabled" to enable RLS');
          console.log('4. Add these policies:');
          console.log('');
          console.log('POLICY 1: "Users can view own notifications"');
          console.log('  - Target roles: authenticated');
          console.log('  - Using expression: auth.uid() = user_id');
          console.log('  - Command: SELECT');
          console.log('');
          console.log('POLICY 2: "Allow notification sending"');
          console.log('  - Target roles: authenticated');
          console.log('  - With check expression: auth.role() = \'authenticated\' AND auth.uid() IS NOT NULL');
          console.log('  - Command: INSERT');
          console.log('');
          console.log('POLICY 3: "Users can update own notifications"');
          console.log('  - Target roles: authenticated');
          console.log('  - Using expression: auth.uid() = user_id');
          console.log('  - With check expression: auth.uid() = user_id');
          console.log('  - Command: UPDATE');
          console.log('');
          console.log('POLICY 4: "Users can delete own notifications"');
          console.log('  - Target roles: authenticated');
          console.log('  - Using expression: auth.uid() = user_id');
          console.log('  - Command: DELETE');
          console.log('');
          
        }
      } else {
        console.log('✅ Notification insertion test succeeded:', testNotification.id);
        
        // Clean up test notification
        await supabase
          .from('notifications')
          .delete()
          .eq('id', testNotification.id);
        
        console.log('🧹 Test notification cleaned up');
        console.log('✅ Notification system is working correctly!');
      }
      
    } else {
      // Execute the setup function
      console.log('🔧 Executing RLS setup function...');
      const { data: setupResult, error: setupError } = await supabase.rpc('setup_notification_rls');
      
      if (setupError) {
        console.error('❌ RLS setup error:', setupError);
      } else {
        console.log('✅ RLS setup result:', setupResult);
      }
      
      // Clean up the temporary function
      await supabase.rpc('query', {
        query: 'DROP FUNCTION IF EXISTS setup_notification_rls();'
      });
    }

    console.log('');
    console.log('🎉 Notification RLS fix process completed!');
    console.log('');
    console.log('🔄 Please try creating a task again to test if notifications work.');

  } catch (error) {
    console.error('❌ Error fixing notification RLS policies:', error);
    
    console.log('');
    console.log('🔧 ALTERNATIVE SOLUTION:');
    console.log('If the automatic fix failed, please manually update the RLS policies in Supabase:');
    console.log('');
    console.log('1. Go to Supabase Dashboard > Database > Tables > notifications');
    console.log('2. Enable RLS if not already enabled');
    console.log('3. Add this INSERT policy:');
    console.log('   Name: "Allow notification sending"');
    console.log('   Command: INSERT');
    console.log('   Target roles: authenticated');
    console.log('   WITH CHECK: auth.role() = \'authenticated\' AND auth.uid() IS NOT NULL');
    console.log('');
    process.exit(1);
  }
}

// Run the fix
fixNotificationRLSDirectly(); 