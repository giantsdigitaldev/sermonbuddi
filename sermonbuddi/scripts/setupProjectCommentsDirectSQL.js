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
    console.log('Creating project_comments table...');
    await supabase.sql`
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
    `;
    console.log('✅ Project comments table created');

    // Create indexes
    console.log('Creating indexes...');
    await supabase.sql`
      CREATE INDEX IF NOT EXISTS idx_project_comments_project_id ON public.project_comments(project_id);
    `;
    await supabase.sql`
      CREATE INDEX IF NOT EXISTS idx_project_comments_user_id ON public.project_comments(user_id);
    `;
    await supabase.sql`
      CREATE INDEX IF NOT EXISTS idx_project_comments_created_at ON public.project_comments(created_at DESC);
    `;
    await supabase.sql`
      CREATE INDEX IF NOT EXISTS idx_project_comments_parent ON public.project_comments(parent_comment_id);
    `;
    console.log('✅ Indexes created');

    // Create project comment likes table
    console.log('Creating project_comment_likes table...');
    await supabase.sql`
      CREATE TABLE IF NOT EXISTS public.project_comment_likes (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        comment_id UUID NOT NULL REFERENCES public.project_comments(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(comment_id, user_id)
      );
    `;
    console.log('✅ Project comment likes table created');

    // Create indexes for comment likes
    console.log('Creating comment likes indexes...');
    await supabase.sql`
      CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.project_comment_likes(comment_id);
    `;
    await supabase.sql`
      CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.project_comment_likes(user_id);
    `;
    console.log('✅ Comment likes indexes created');

    // Enable RLS
    console.log('Enabling RLS...');
    await supabase.sql`
      ALTER TABLE public.project_comments ENABLE ROW LEVEL SECURITY;
    `;
    await supabase.sql`
      ALTER TABLE public.project_comment_likes ENABLE ROW LEVEL SECURITY;
    `;
    console.log('✅ RLS enabled');

    // Create RLS policies for project comments
    console.log('Creating RLS policies for project comments...');
    await supabase.sql`
      CREATE POLICY IF NOT EXISTS "Users can view accessible project comments" ON public.project_comments
        FOR SELECT USING (
          project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
            UNION
            SELECT project_id FROM public.project_team_members 
            WHERE user_id = auth.uid() AND status = 'active'
          )
        );
    `;

    await supabase.sql`
      CREATE POLICY IF NOT EXISTS "Users can insert project comments" ON public.project_comments
        FOR INSERT WITH CHECK (
          project_id IN (
            SELECT id FROM public.projects WHERE user_id = auth.uid()
            UNION
            SELECT project_id FROM public.project_team_members 
            WHERE user_id = auth.uid() AND status = 'active'
          )
        );
    `;

    await supabase.sql`
      CREATE POLICY IF NOT EXISTS "Users can update own project comments" ON public.project_comments
        FOR UPDATE USING (user_id = auth.uid());
    `;

    await supabase.sql`
      CREATE POLICY IF NOT EXISTS "Users can delete own project comments" ON public.project_comments
        FOR DELETE USING (user_id = auth.uid());
    `;
    console.log('✅ Project comments RLS policies created');

    // Create RLS policies for comment likes
    console.log('Creating RLS policies for comment likes...');
    await supabase.sql`
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
    `;

    await supabase.sql`
      CREATE POLICY IF NOT EXISTS "Users can manage comment likes" ON public.project_comment_likes
        FOR ALL USING (user_id = auth.uid());
    `;
    console.log('✅ Comment likes RLS policies created');

    // Create triggers
    console.log('Creating triggers...');
    await supabase.sql`
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
    `;

    await supabase.sql`
      DROP TRIGGER IF EXISTS update_comment_likes_count_trigger ON public.project_comment_likes;
    `;
    await supabase.sql`
      CREATE TRIGGER update_comment_likes_count_trigger
        AFTER INSERT OR DELETE ON public.project_comment_likes
        FOR EACH ROW
        EXECUTE FUNCTION update_comment_likes_count();
    `;
    console.log('✅ Triggers created');

    console.log('🎉 Project comments setup completed successfully!');

  } catch (error) {
    console.error('❌ Error setting up project comments:', error);
    process.exit(1);
  }
}

// Run the setup
setupProjectComments(); 