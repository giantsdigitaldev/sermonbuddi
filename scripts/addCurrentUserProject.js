const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addProjectToCurrentUser() {
  try {
    console.log('🔐 Please log in to add the project to your account...');
    
    // You'll need to authenticate with the user credentials
    // For now, let's assume you have a user email and password
    const email = 'your-email@example.com'; // Replace with actual email
    const password = 'your-password'; // Replace with actual password
    
    // Sign in the user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      console.log('💡 Please update the email/password in the script or create an account first');
      return false;
    }
    
    console.log('✅ User authenticated:', authData.user.email);
    
    // Update the existing project to belong to this user
    const projectId = '90274700-630c-45f3-98c4-16a965747195';
    
    const { data: updateData, error: updateError } = await supabase
      .from('projects')
      .update({ 
        user_id: authData.user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .select();
    
    if (updateError) {
      console.error('❌ Error updating project:', updateError);
      
      // If update fails, try to insert the project
      console.log('🔄 Trying to insert project instead...');
      
      const projectData = {
        id: projectId,
        user_id: authData.user.id,
        name: 'Website Redesign',
        description: 'Complete website redesign with modern UI/UX principles and responsive design',
        status: 'active',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: new Date().toISOString(),
        metadata: {
          category: 'web development',
          priority: 'high',
          team_size: 5,
          budget: 15000,
          color: '#6366f1',
          cover_image: 'cover1.png',
          start_date: '2024-01-15',
          end_date: '2024-04-15',
          progress: 65,
          total_tasks: 12,
          completed_tasks: 8,
          days_left: 45,
          team_members: [
            { id: '1', name: 'Sarah Johnson', role: 'UI/UX Designer', avatar: 'user1.jpeg' },
            { id: '2', name: 'Mike Chen', role: 'Frontend Developer', avatar: 'user2.jpeg' },
            { id: '3', name: 'Emily Rodriguez', role: 'Backend Developer', avatar: 'user3.jpeg' },
            { id: '4', name: 'David Park', role: 'Project Manager', avatar: 'user4.jpeg' },
            { id: '5', name: 'Lisa Thompson', role: 'QA Engineer', avatar: 'user5.jpeg' }
          ],
          tags: ['react', 'typescript', 'figma', 'responsive'],
          client: 'TechCorp Solutions',
          estimated_hours: 480,
          actual_hours: 312,
          milestones: [
            { name: 'Design System', completed: true, date: '2024-02-01' },
            { name: 'Frontend Development', completed: false, date: '2024-03-15' },
            { name: 'Testing & QA', completed: false, date: '2024-04-01' },
            { name: 'Launch', completed: false, date: '2024-04-15' }
          ]
        }
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('projects')
        .insert(projectData)
        .select();
      
      if (insertError) {
        console.error('❌ Error inserting project:', insertError);
        return false;
      }
      
      console.log('✅ Project inserted successfully!');
    } else {
      console.log('✅ Project updated successfully!');
    }
    
    // Now add some tasks for this project
    const tasks = [
      {
        user_id: authData.user.id,
        project_id: projectId,
        title: 'Design System Creation',
        description: 'Create comprehensive design system with components, colors, typography, and usage guidelines',
        status: 'completed',
        priority: 'high',
        due_date: '2024-02-01T10:00:00Z',
        created_at: '2024-01-15T09:00:00Z',
        updated_at: '2024-02-01T16:30:00Z',
        metadata: {
          category: 'design',
          estimated_hours: 40,
          actual_hours: 45,
          tags: ['design-system', 'figma', 'components'],
          assigned_to: 'Sarah Johnson',
          completion_notes: 'Design system completed with 50+ components and comprehensive guidelines'
        }
      },
      {
        user_id: authData.user.id,
        project_id: projectId,
        title: 'React Component Development',
        description: 'Implement reusable React components based on design system specifications',
        status: 'in_progress',
        priority: 'high',
        due_date: '2024-03-01T10:00:00Z',
        created_at: '2024-02-15T11:00:00Z',
        updated_at: '2024-02-20T09:45:00Z',
        metadata: {
          category: 'development',
          estimated_hours: 60,
          actual_hours: 35,
          tags: ['react', 'components', 'typescript'],
          assigned_to: 'Mike Chen',
          progress_notes: '70% complete - working on complex interactive components'
        }
      },
      {
        user_id: authData.user.id,
        project_id: projectId,
        title: 'Backend API Integration',
        description: 'Integrate frontend components with backend REST APIs for dynamic content',
        status: 'todo',
        priority: 'high',
        due_date: '2024-03-15T10:00:00Z',
        created_at: '2024-02-20T12:00:00Z',
        updated_at: '2024-02-20T12:00:00Z',
        metadata: {
          category: 'development',
          estimated_hours: 32,
          actual_hours: 0,
          tags: ['api', 'integration', 'backend'],
          assigned_to: 'Emily Rodriguez',
          dependencies: ['React Component Development']
        }
      }
    ];
    
    // Insert tasks
    for (const task of tasks) {
      const { error: taskError } = await supabase
        .from('tasks')
        .insert(task);
      
      if (taskError) {
        console.log(`⚠️ Error inserting task "${task.title}":`, taskError.message);
      } else {
        console.log(`✅ Task "${task.title}" added successfully`);
      }
    }
    
    console.log('\n🎉 Project and tasks have been added to your account!');
    console.log('📱 You can now view the project dashboard with all the data.');
    
    return true;
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    return false;
  }
}

if (require.main === module) {
  addProjectToCurrentUser().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { addProjectToCurrentUser }; 