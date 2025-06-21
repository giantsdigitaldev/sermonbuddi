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

async function setupTasksTable() {
  try {
    console.log('📋 Setting up tasks table with missing columns...');

    // Create or update tasks table with all required columns
    const createTasksTable = `
      CREATE TABLE IF NOT EXISTS public.tasks (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        project_id UUID NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'blocked')),
        priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        due_date DATE,
        assigned_to UUID[] DEFAULT '{}',
        created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Add missing columns if they don't exist
      DO $$ 
      BEGIN
        -- Add assigned_to column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'tasks' AND column_name = 'assigned_to') THEN
          ALTER TABLE public.tasks ADD COLUMN assigned_to UUID[] DEFAULT '{}';
        END IF;

        -- Add created_by column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'tasks' AND column_name = 'created_by') THEN
          ALTER TABLE public.tasks ADD COLUMN created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        END IF;

        -- Add metadata column if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name = 'tasks' AND column_name = 'metadata') THEN
          ALTER TABLE public.tasks ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
        END IF;
      END $$;

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
      CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
      CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks USING GIN(assigned_to);
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
      CREATE INDEX IF NOT EXISTS idx_tasks_priority ON public.tasks(priority);
      CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date);
      CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);
    `;

    const { error: createTableError } = await supabase.rpc('exec_sql', { 
      sql: createTasksTable 
    });

    if (createTableError) {
      console.log('⚠️ Table creation/update error (may already exist):', createTableError.message);
    } else {
      console.log('✅ Tasks table created/updated successfully');
    }

    // Enable RLS
    const enableRLS = `
      ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
    `;

    await supabase.rpc('exec_sql', { sql: enableRLS });
    console.log('✅ RLS enabled on tasks table');

    // Drop existing policies
    const dropPolicies = `
      DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
      DROP POLICY IF EXISTS "Users can view assigned tasks" ON public.tasks;
      DROP POLICY IF EXISTS "Users can insert tasks" ON public.tasks;
      DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
      DROP POLICY IF EXISTS "Users can update assigned tasks" ON public.tasks;
      DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;
    `;

    await supabase.rpc('exec_sql', { sql: dropPolicies });
    console.log('✅ Existing policies dropped');

    // Create comprehensive RLS policies
    const createPolicies = `
      -- Users can view tasks they created
      CREATE POLICY "Users can view own tasks" ON public.tasks
        FOR SELECT USING (auth.uid() = user_id OR auth.uid() = created_by);

      -- Users can view tasks they are assigned to
      CREATE POLICY "Users can view assigned tasks" ON public.tasks
        FOR SELECT USING (auth.uid() = ANY(assigned_to));

      -- Users can view tasks in projects they have access to
      CREATE POLICY "Users can view project tasks" ON public.tasks
        FOR SELECT USING (
          project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
            UNION
            SELECT project_id FROM public.project_team_members 
            WHERE user_id = auth.uid() AND status = 'active'
          )
        );

      -- Authenticated users can insert tasks (for project members)
      CREATE POLICY "Authenticated users can insert tasks" ON public.tasks
        FOR INSERT WITH CHECK (auth.role() = 'authenticated');

      -- Users can update tasks they created
      CREATE POLICY "Users can update own tasks" ON public.tasks
        FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = created_by);

      -- Users can update tasks they are assigned to
      CREATE POLICY "Users can update assigned tasks" ON public.tasks
        FOR UPDATE USING (auth.uid() = ANY(assigned_to));

      -- Users can update tasks in projects they have access to
      CREATE POLICY "Users can update project tasks" ON public.tasks
        FOR UPDATE USING (
          project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
            UNION
            SELECT project_id FROM public.project_team_members 
            WHERE user_id = auth.uid() AND status = 'active'
          )
        );

      -- Users can delete tasks they created
      CREATE POLICY "Users can delete own tasks" ON public.tasks
        FOR DELETE USING (auth.uid() = user_id OR auth.uid() = created_by);
    `;

    await supabase.rpc('exec_sql', { sql: createPolicies });
    console.log('✅ RLS policies created for tasks');

    // Create updated_at trigger
    const createTrigger = `
      DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks;
      CREATE TRIGGER update_tasks_updated_at
        BEFORE UPDATE ON public.tasks
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;

    await supabase.rpc('exec_sql', { sql: createTrigger });
    console.log('✅ Updated_at trigger created for tasks');

    console.log('🎉 Tasks table setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up tasks table:', error);
    process.exit(1);
  }
}

// Run the setup
setupTasksTable(); 