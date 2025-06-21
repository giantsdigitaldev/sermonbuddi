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

async function setupProjectComments() {
  try {
    console.log('💬 Setting up project comments table...');

    // Create project comments table
    const createCommentsTable = `
      CREATE TABLE IF NOT EXISTS public.project_comments (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        parent_comment_id UUID REFERENCES public.project_comments(id) ON DELETE CASCADE,
        likes_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for project comments
      CREATE INDEX IF NOT EXISTS idx_project_comments_project_id ON public.project_comments(project_id);
      CREATE INDEX IF NOT EXISTS idx_project_comments_user_id ON public.project_comments(user_id);
      CREATE INDEX IF NOT EXISTS idx_project_comments_created_at ON public.project_comments(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_project_comments_parent ON public.project_comments(parent_comment_id);
    `;

    // Create project comment likes table for tracking likes
    const createCommentLikesTable = `
      CREATE TABLE IF NOT EXISTS public.project_comment_likes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        comment_id UUID NOT NULL REFERENCES public.project_comments(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(comment_id, user_id)
      );

      -- Create indexes for comment likes
      CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.project_comment_likes(comment_id);
      CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.project_comment_likes(user_id);
    `;

    // Execute table creation
    await supabase.rpc('exec_sql', { sql: createCommentsTable });
    console.log('✅ Project comments table created successfully');

    await supabase.rpc('exec_sql', { sql: createCommentLikesTable });
    console.log('✅ Project comment likes table created successfully');

    // Enable RLS
    const enableRLS = `
      ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.project_comment_likes ENABLE ROW LEVEL SECURITY;
    `;

    await supabase.rpc('exec_sql', { sql: enableRLS });
    console.log('✅ RLS enabled on project comments tables');

    // Create RLS policies for project comments
    const createCommentsPolicies = `
      -- Users can view comments for projects they have access to
      CREATE POLICY IF NOT EXISTS "Users can view accessible project comments" ON public.project_comments
        FOR SELECT USING (
          project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
            UNION
            SELECT project_id FROM public.project_team_members 
            WHERE user_id = auth.uid() AND status = 'active'
          )
        );

      -- Users can insert comments for projects they have access to
      CREATE POLICY IF NOT EXISTS "Users can insert project comments" ON public.project_comments
        FOR INSERT WITH CHECK (
          project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
            UNION
            SELECT project_id FROM public.project_team_members 
            WHERE user_id = auth.uid() AND status = 'active'
          )
        );

      -- Users can update their own comments
      CREATE POLICY IF NOT EXISTS "Users can update own project comments" ON public.project_comments
        FOR UPDATE USING (user_id = auth.uid());

      -- Users can delete their own comments
      CREATE POLICY IF NOT EXISTS "Users can delete own project comments" ON public.project_comments
        FOR DELETE USING (user_id = auth.uid());
    `;

    // Create RLS policies for comment likes
    const createLikesPolicies = `
      -- Users can view likes for comments they can see
      CREATE POLICY IF NOT EXISTS "Users can view comment likes" ON public.project_comment_likes
        FOR SELECT USING (
          comment_id IN (
            SELECT id FROM public.project_comments WHERE 
              project_id IN (
                SELECT id FROM public.projects WHERE user_id = auth.uid()
                UNION
                SELECT project_id FROM public.project_team_members 
                WHERE user_id = auth.uid() AND status = 'active'
              )
          )
        );

      -- Users can like/unlike comments
      CREATE POLICY IF NOT EXISTS "Users can manage comment likes" ON public.project_comment_likes
        FOR ALL USING (user_id = auth.uid());
    `;

    await supabase.rpc('exec_sql', { sql: createCommentsPolicies });
    console.log('✅ RLS policies created for project comments');

    await supabase.rpc('exec_sql', { sql: createLikesPolicies });
    console.log('✅ RLS policies created for comment likes');

    // Create updated_at triggers and functions
    const createTriggers = `
      -- Create trigger function for updating likes count
      CREATE OR REPLACE FUNCTION update_comment_likes_count()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          UPDATE public.project_comments 
          SET likes_count = likes_count + 1 
          WHERE id = NEW.comment_id;
          RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
          UPDATE public.project_comments 
          SET likes_count = GREATEST(likes_count - 1, 0) 
          WHERE id = OLD.comment_id;
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;

      -- Create triggers
      DROP TRIGGER IF EXISTS update_project_comments_updated_at ON public.project_comments;
      CREATE TRIGGER update_project_comments_updated_at
        BEFORE UPDATE ON public.project_comments
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

      DROP TRIGGER IF EXISTS update_comment_likes_count_trigger ON public.project_comment_likes;
      CREATE TRIGGER update_comment_likes_count_trigger
        AFTER INSERT OR DELETE ON public.project_comment_likes
        FOR EACH ROW
        EXECUTE FUNCTION update_comment_likes_count();
    `;

    await supabase.rpc('exec_sql', { sql: createTriggers });
    console.log('✅ Triggers created for project comments');

    console.log('🎉 Project comments setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up project comments:', error);
    process.exit(1);
  }
}

// Run the setup
setupProjectComments(); 