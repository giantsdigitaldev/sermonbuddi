const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Use service role for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupProjectsAndTasks() {
  try {
    console.log('🚀 Setting up projects and tasks tables with RLS policies...');

    // Step 1: Create projects table
    const createProjectsTable = `
      CREATE TABLE IF NOT EXISTS public.projects (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'on_hold')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'::jsonb
      );
    `;

    // Step 2: Create tasks table
    const createTasksTable = `
      CREATE TABLE IF NOT EXISTS public.tasks (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'blocked')),
        priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
        due_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'::jsonb
      );
    `;

    // Execute table creation
    console.log('⏳ Creating projects table...');
    await supabase.rpc('exec_sql', { sql: createProjectsTable });
    console.log('✅ Projects table created');

    console.log('⏳ Creating tasks table...');
    await supabase.rpc('exec_sql', { sql: createTasksTable });
    console.log('✅ Tasks table created');

    // Step 3: Enable RLS on all tables
    const enableRLS = `
      ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
    `;

    await supabase.rpc('exec_sql', { sql: enableRLS });
    console.log('✅ RLS enabled on all tables');

    // Step 4: Drop existing policies
    const dropPolicies = `
      DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
      DROP POLICY IF EXISTS "Users can create projects" ON public.projects;
      DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
      DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
      
      DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
      DROP POLICY IF EXISTS "Users can create tasks" ON public.tasks;
      DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
      DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
    `;

    await supabase.rpc('exec_sql', { sql: dropPolicies });
    console.log('✅ Existing policies dropped');

    // Step 5: Create comprehensive RLS policies
    const createPolicies = `
      CREATE POLICY "Users can view their own projects" ON public.projects
        FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can create projects" ON public.projects
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Users can update their own projects" ON public.projects
        FOR UPDATE USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can delete their own projects" ON public.projects
        FOR DELETE USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can view their own tasks" ON public.tasks
        FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can create tasks" ON public.tasks
        FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      CREATE POLICY "Users can update their own tasks" ON public.tasks
        FOR UPDATE USING (auth.uid() = user_id);
      
      CREATE POLICY "Users can delete their own tasks" ON public.tasks
        FOR DELETE USING (auth.uid() = user_id);
    `;

    await supabase.rpc('exec_sql', { sql: createPolicies });
    console.log('✅ RLS policies created');

    console.log('\n🎉 Projects and tasks setup completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Setup failed:', error);
    return false;
  }
}

async function addMockData() {
  try {
    console.log('\n📝 Adding mock data with RLS bypass...');

    // Use a known user ID that exists in your system
    // First let's get all existing users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    let userId;
    if (users && users.users && users.users.length > 0) {
      userId = users.users[0].id;
      console.log(`✅ Using existing user ID: ${userId}`);
    } else {
      // Create a test user
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: 'test@example.com',
        password: 'password123',
        email_confirm: true
      });
      
      if (userError) {
        console.error('❌ Error creating test user:', userError);
        userId = '550e8400-e29b-41d4-a716-446655440000'; // fallback
      } else {
        userId = userData.user.id;
        console.log(`✅ Created test user with ID: ${userId}`);
      }
    }

    // Temporarily disable RLS for data insertion
    console.log('⏳ Temporarily disabling RLS for data insertion...');
    await supabase.rpc('exec_sql', { 
      sql: `
        ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
        ALTER TABLE public.tasks DISABLE ROW LEVEL SECURITY;
      ` 
    });

    // Mock projects data with rich metadata
    const mockProjects = [
      {
        id: '90274700-630c-45f3-98c4-16a965747195',
        user_id: userId,
        name: 'Website Redesign',
        description: 'Complete website redesign with modern UI/UX principles',
        status: 'active',
        metadata: {
          category: 'web development',
          priority: 'high',
          team_size: 5,
          budget: 15000,
          color: '#6366f1',
          cover_image: 'cover1.png',
          start_date: '2024-01-15',
          end_date: '2024-04-15',
          progress: 45,
          total_tasks: 12,
          completed_tasks: 5,
          days_left: 45
        }
      },
      {
        user_id: userId,
        name: 'Mobile App Development',
        description: 'Native mobile app for iOS and Android platforms',
        status: 'active',
        metadata: {
          category: 'mobile development',
          priority: 'high',
          team_size: 8,
          budget: 25000,
          color: '#10b981',
          cover_image: 'cover2.png',
          start_date: '2024-02-01',
          end_date: '2024-06-01',
          progress: 30,
          total_tasks: 20,
          completed_tasks: 6,
          days_left: 75
        }
      },
      {
        user_id: userId,
        name: 'Data Analytics Dashboard',
        description: 'Business intelligence dashboard with real-time analytics',
        status: 'on_hold',
        metadata: {
          category: 'data science',
          priority: 'medium',
          team_size: 3,
          budget: 8000,
          color: '#f59e0b',
          cover_image: 'cover3.png',
          start_date: '2024-03-01',
          end_date: '2024-05-01',
          progress: 15,
          total_tasks: 8,
          completed_tasks: 1,
          days_left: 20
        }
      }
    ];

    // Insert projects
    for (const project of mockProjects) {
      const { data, error } = await supabase
        .from('projects')
        .upsert(project, { onConflict: 'id' });
      
      if (error) {
        console.error(`❌ Error inserting project ${project.name}:`, error);
      } else {
        console.log(`✅ Project "${project.name}" added successfully`);
      }
    }

    // Get the inserted project IDs for tasks
    const { data: insertedProjects } = await supabase
      .from('projects')
      .select('id, name')
      .eq('user_id', userId);

    if (insertedProjects && insertedProjects.length > 0) {
      const websiteProjectId = insertedProjects.find(p => p.name === 'Website Redesign')?.id || insertedProjects[0].id;
      const mobileProjectId = insertedProjects.find(p => p.name === 'Mobile App Development')?.id || insertedProjects[0].id;

      // Mock tasks data
      const mockTasks = [
        // Website Redesign tasks
        {
          user_id: userId,
          project_id: websiteProjectId,
          title: 'Design System Creation',
          description: 'Create a comprehensive design system with components and guidelines',
          status: 'completed',
          priority: 'high',
          due_date: '2024-02-01T10:00:00Z',
          metadata: {
            category: 'design',
            estimated_hours: 40,
            actual_hours: 45,
            tags: ['design', 'system', 'components']
          }
        },
        {
          user_id: userId,
          project_id: websiteProjectId,
          title: 'Homepage Wireframes',
          description: 'Create detailed wireframes for the new homepage layout',
          status: 'completed',
          priority: 'high',
          due_date: '2024-02-15T10:00:00Z',
          metadata: {
            category: 'design',
            estimated_hours: 16,
            actual_hours: 18,
            tags: ['wireframes', 'homepage', 'ux']
          }
        },
        {
          user_id: userId,
          project_id: websiteProjectId,
          title: 'Frontend Development Setup',
          description: 'Set up React development environment and project structure',
          status: 'in_progress',
          priority: 'high',
          due_date: '2024-03-01T10:00:00Z',
          metadata: {
            category: 'development',
            estimated_hours: 24,
            actual_hours: 12,
            tags: ['react', 'setup', 'frontend']
          }
        },
        {
          user_id: userId,
          project_id: websiteProjectId,
          title: 'Component Library Implementation',
          description: 'Implement reusable UI components based on design system',
          status: 'todo',
          priority: 'medium',
          due_date: '2024-03-15T10:00:00Z',
          metadata: {
            category: 'development',
            estimated_hours: 32,
            tags: ['components', 'ui', 'library']
          }
        },
        // Mobile App tasks
        {
          user_id: userId,
          project_id: mobileProjectId,
          title: 'User Authentication Flow',
          description: 'Implement secure user authentication and authorization',
          status: 'completed',
          priority: 'urgent',
          due_date: '2024-02-20T10:00:00Z',
          metadata: {
            category: 'security',
            estimated_hours: 20,
            actual_hours: 22,
            tags: ['auth', 'security', 'user']
          }
        },
        {
          user_id: userId,
          project_id: mobileProjectId,
          title: 'API Integration',
          description: 'Integrate with backend APIs for data synchronization',
          status: 'in_progress',
          priority: 'high',
          due_date: '2024-03-10T10:00:00Z',
          metadata: {
            category: 'integration',
            estimated_hours: 28,
            actual_hours: 15,
            tags: ['api', 'backend', 'sync']
          }
        }
      ];

      // Insert tasks
      for (const task of mockTasks) {
        const { error } = await supabase
          .from('tasks')
          .insert(task);
        
        if (error) {
          console.error(`❌ Error inserting task "${task.title}":`, error);
        } else {
          console.log(`✅ Task "${task.title}" added successfully`);
        }
      }
    }

    // Re-enable RLS
    console.log('⏳ Re-enabling RLS...');
    await supabase.rpc('exec_sql', { 
      sql: `
        ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
        ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
      ` 
    });

    console.log('\n✅ Mock data added successfully with RLS re-enabled!');
    return true;

  } catch (error) {
    console.error('❌ Error adding mock data:', error);
    return false;
  }
}

if (require.main === module) {
  (async () => {
    const setupSuccess = await setupProjectsAndTasks();
    if (setupSuccess) {
      await addMockData();
    }
    process.exit(setupSuccess ? 0 : 1);
  })();
}

module.exports = { setupProjectsAndTasks, addMockData }; 