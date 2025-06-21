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

async function setupTaskSubtablesAndComments() {
  try {
    console.log('📋 Setting up task subtasks and comments tables...');

    // Create subtasks table
    const createSubtasksTable = `
      CREATE TABLE IF NOT EXISTS public.task_subtasks (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        order_index INTEGER DEFAULT 0,
        created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for subtasks
      CREATE INDEX IF NOT EXISTS idx_subtasks_task_id ON public.task_subtasks(task_id);
      CREATE INDEX IF NOT EXISTS idx_subtasks_order ON public.task_subtasks(task_id, order_index);
    `;

    // Create task comments table
    const createCommentsTable = `
      CREATE TABLE IF NOT EXISTS public.task_comments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for comments
      CREATE INDEX IF NOT EXISTS idx_comments_task_id ON public.task_comments(task_id);
      CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.task_comments(user_id);
      CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.task_comments(created_at DESC);
    `;

    // Execute table creation
    await supabase.rpc('exec_sql', { sql: createSubtasksTable });
    console.log('✅ Task subtasks table created successfully');

    await supabase.rpc('exec_sql', { sql: createCommentsTable });
    console.log('✅ Task comments table created successfully');

    // Enable RLS
    const enableRLS = `
      ALTER TABLE public.task_subtasks ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
    `;

    await supabase.rpc('exec_sql', { sql: enableRLS });
    console.log('✅ RLS enabled on subtasks and comments tables');

    // Create RLS policies for subtasks
    const createSubtasksPolicies = `
      -- Users can view subtasks for tasks they have access to
      CREATE POLICY IF NOT EXISTS "Users can view accessible subtasks" ON public.task_subtasks
        FOR SELECT USING (
          task_id IN (
            SELECT id FROM public.tasks WHERE 
              user_id = auth.uid() OR 
              created_by = auth.uid() OR 
              auth.uid() = ANY(assigned_to) OR
              project_id IN (
                SELECT id FROM public.projects WHERE user_id = auth.uid()
                UNION
                SELECT project_id FROM public.project_team_members 
                WHERE user_id = auth.uid() AND status = 'active'
              )
          )
        );

      -- Users can insert subtasks for tasks they have access to
      CREATE POLICY IF NOT EXISTS "Users can insert subtasks" ON public.task_subtasks
        FOR INSERT WITH CHECK (
          task_id IN (
            SELECT id FROM public.tasks WHERE 
              user_id = auth.uid() OR 
              created_by = auth.uid() OR 
              auth.uid() = ANY(assigned_to) OR
              project_id IN (
                SELECT id FROM public.projects WHERE user_id = auth.uid()
                UNION
                SELECT project_id FROM public.project_team_members 
                WHERE user_id = auth.uid() AND status = 'active'
              )
          )
        );

      -- Users can update subtasks for tasks they have access to
      CREATE POLICY IF NOT EXISTS "Users can update subtasks" ON public.task_subtasks
        FOR UPDATE USING (
          task_id IN (
            SELECT id FROM public.tasks WHERE 
              user_id = auth.uid() OR 
              created_by = auth.uid() OR 
              auth.uid() = ANY(assigned_to) OR
              project_id IN (
                SELECT id FROM public.projects WHERE user_id = auth.uid()
                UNION
                SELECT project_id FROM public.project_team_members 
                WHERE user_id = auth.uid() AND status = 'active'
              )
          )
        );

      -- Users can delete subtasks they created
      CREATE POLICY IF NOT EXISTS "Users can delete own subtasks" ON public.task_subtasks
        FOR DELETE USING (created_by = auth.uid());
    `;

    // Create RLS policies for comments
    const createCommentsPolicies = `
      -- Users can view comments for tasks they have access to
      CREATE POLICY IF NOT EXISTS "Users can view accessible comments" ON public.task_comments
        FOR SELECT USING (
          task_id IN (
            SELECT id FROM public.tasks WHERE 
              user_id = auth.uid() OR 
              created_by = auth.uid() OR 
              auth.uid() = ANY(assigned_to) OR
              project_id IN (
                SELECT id FROM public.projects WHERE user_id = auth.uid()
                UNION
                SELECT project_id FROM public.project_team_members 
                WHERE user_id = auth.uid() AND status = 'active'
              )
          )
        );

      -- Users can insert comments for tasks they have access to
      CREATE POLICY IF NOT EXISTS "Users can insert comments" ON public.task_comments
        FOR INSERT WITH CHECK (
          task_id IN (
            SELECT id FROM public.tasks WHERE 
              user_id = auth.uid() OR 
              created_by = auth.uid() OR 
              auth.uid() = ANY(assigned_to) OR
              project_id IN (
                SELECT id FROM public.projects WHERE user_id = auth.uid()
                UNION
                SELECT project_id FROM public.project_team_members 
                WHERE user_id = auth.uid() AND status = 'active'
              )
          )
        );

      -- Users can update their own comments
      CREATE POLICY IF NOT EXISTS "Users can update own comments" ON public.task_comments
        FOR UPDATE USING (user_id = auth.uid());

      -- Users can delete their own comments
      CREATE POLICY IF NOT EXISTS "Users can delete own comments" ON public.task_comments
        FOR DELETE USING (user_id = auth.uid());
    `;

    await supabase.rpc('exec_sql', { sql: createSubtasksPolicies });
    console.log('✅ RLS policies created for subtasks');

    await supabase.rpc('exec_sql', { sql: createCommentsPolicies });
    console.log('✅ RLS policies created for comments');

    // Create updated_at triggers
    const createTriggers = `
      DROP TRIGGER IF EXISTS update_subtasks_updated_at ON public.task_subtasks;
      CREATE TRIGGER update_subtasks_updated_at
        BEFORE UPDATE ON public.task_subtasks
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_comments_updated_at ON public.task_comments;
      CREATE TRIGGER update_comments_updated_at
        BEFORE UPDATE ON public.task_comments
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;

    await supabase.rpc('exec_sql', { sql: createTriggers });
    console.log('✅ Updated_at triggers created');

    console.log('🎉 Task subtasks and comments tables setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up subtasks and comments tables:', error);
    process.exit(1);
  }
}

// Run the setup
setupTaskSubtablesAndComments(); 