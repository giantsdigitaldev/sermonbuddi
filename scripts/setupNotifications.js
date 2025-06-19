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

async function setupNotifications() {
  try {
    console.log('🔔 Setting up notifications table...');

    // Create notifications table
    const createNotificationsTable = `
      CREATE TABLE IF NOT EXISTS public.notifications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data JSONB DEFAULT '{}'::jsonb,
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create index for better performance
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
    `;

    const { error: createTableError } = await supabase.rpc('exec_sql', { 
      sql: createNotificationsTable 
    });

    if (createTableError) {
      console.log('⚠️ Table creation error (may already exist):', createTableError.message);
    } else {
      console.log('✅ Notifications table created successfully');
    }

    // Enable RLS
    const enableRLS = `
      ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    `;

    await supabase.rpc('exec_sql', { sql: enableRLS });
    console.log('✅ RLS enabled on notifications table');

    // Drop existing policies
    const dropPolicies = `
      DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
      DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
      DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
      DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
    `;

    await supabase.rpc('exec_sql', { sql: dropPolicies });
    console.log('✅ Existing policies dropped');

    // Create RLS policies
    const createPolicies = `
      -- Users can only view their own notifications
      CREATE POLICY "Users can view own notifications" ON public.notifications
        FOR SELECT USING (auth.uid() = user_id);

      -- Allow authenticated users to insert notifications (for team invitations, etc.)
      CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');

      -- Users can only update their own notifications (mark as read)
      CREATE POLICY "Users can update own notifications" ON public.notifications
        FOR UPDATE USING (auth.uid() = user_id);

      -- Users can only delete their own notifications
      CREATE POLICY "Users can delete own notifications" ON public.notifications
        FOR DELETE USING (auth.uid() = user_id);
    `;

    await supabase.rpc('exec_sql', { sql: createPolicies });
    console.log('✅ RLS policies created for notifications');

    // Create updated_at trigger
    const createTrigger = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
      CREATE TRIGGER update_notifications_updated_at
        BEFORE UPDATE ON public.notifications
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;

    await supabase.rpc('exec_sql', { sql: createTrigger });
    console.log('✅ Updated_at trigger created for notifications');

    console.log('🎉 Notifications table setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up notifications:', error);
    process.exit(1);
  }
}

// Run the setup
setupNotifications(); 