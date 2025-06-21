import { supabase } from './supabase';

export interface Project {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'archived' | 'on_hold' | 'deleted';
  created_at: string;
  updated_at: string;
  metadata?: any;
}

export interface Task {
  id: string;
  user_id?: string;
  project_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  assigned_to?: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
  metadata?: any;
}

export interface TaskSubtask {
  id: string;
  task_id: string;
  title: string;
  completed: boolean;
  order_index: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  description?: string;
  notes?: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface ProjectComment {
  id: string;
  project_id: string;
  user_id: string;
  content: string;
  parent_comment_id?: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    full_name?: string;
    avatar_url?: string;
  };
  replies?: ProjectComment[];
  is_liked?: boolean;
}

export class ProjectService {
  // Flag to track if database is available
  private static databaseAvailable: boolean | null = null;
  
  // Store created mock projects in memory for the session
  private static sessionMockProjects: Project[] = [];

  // Check if database is available and has proper permissions
  private static async checkDatabaseAvailability(): Promise<boolean> {
    if (this.databaseAvailable !== null) {
      return this.databaseAvailable;
    }

    try {
      // Try a simple query to check if database is accessible
      const { error } = await supabase
        .from('projects')
        .select('id')
        .limit(1);

      if (error) {
        console.log('Database not available:', error.message);
        this.databaseAvailable = false;
        return false;
      }

      this.databaseAvailable = true;
      return true;
    } catch (error) {
      console.log('Database connection failed:', error);
      this.databaseAvailable = false;
      return false;
    }
  }

  // Helper to check if ID is a valid UUID format
  private static isValidUUID(id: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  }

  // Helper to check if ID is a mock ID
  private static isMockId(id: string): boolean {
    return id.startsWith('mock-');
  }

  // Mock data method
  static getMockProjects(): Project[] {
    return [
      {
        id: 'first-real-project-id',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'First real project',
        description: 'Lorem Ipsum is simply dummy text ke a type specimen',
        status: 'active',
        created_at: '2024-01-01T08:00:00Z',
        updated_at: '2024-01-08T12:00:00Z',
        metadata: {
          category: 'landscaping',
          categories: ['lawn care', 'mowing'], // Categories as shown in the image
          priority: 'medium',
          team_size: 3,
          budget: 5000,
          color: '#22c55e',
          cover_image: 'cover1.png',
          start_date: '2024-01-01',
          end_date: '2024-02-15',
          progress: 25,
          total_tasks: 8,
          completed_tasks: 2,
          days_left: 8,
          team_members: [
            { id: '1', name: 'John Smith', role: 'Landscaper', avatar: 'user1.jpeg' },
            { id: '2', name: 'Mary Johnson', role: 'Garden Designer', avatar: 'user2.jpeg' },
            { id: '3', name: 'Mike Wilson', role: 'Equipment Operator', avatar: 'user3.jpeg' }
          ],
          tags: ['landscaping', 'maintenance', 'outdoor'],
          client: 'Green Spaces LLC',
          estimated_hours: 120,
          actual_hours: 30,
          milestones: [
            { name: 'Site Assessment', completed: true, date: '2024-01-05' },
            { name: 'Lawn Preparation', completed: false, date: '2024-01-20' },
            { name: 'Mowing Schedule', completed: false, date: '2024-02-01' },
            { name: 'Final Inspection', completed: false, date: '2024-02-15' }
          ]
        }
      },
      {
        id: '90274700-630c-45f3-98c4-16a965747195',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Website Redesign',
        description: 'Complete website redesign with modern UI/UX principles and responsive design',
        status: 'active',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-20T15:30:00Z',
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
      },
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Mobile App Development',
        description: 'Native mobile app for iOS and Android platforms with real-time features',
        status: 'active',
        created_at: '2024-02-01T09:00:00Z',
        updated_at: '2024-02-05T14:20:00Z',
        metadata: {
          category: 'mobile development',
          priority: 'high',
          team_size: 8,
          budget: 25000,
          color: '#10b981',
          cover_image: 'cover2.png',
          start_date: '2024-02-01',
          end_date: '2024-06-01',
          progress: 35,
          total_tasks: 20,
          completed_tasks: 7,
          days_left: 75,
          team_members: [
            { id: '6', name: 'Alex Kim', role: 'iOS Developer', avatar: 'user6.jpeg' },
            { id: '7', name: 'Rachel Green', role: 'Android Developer', avatar: 'user7.jpeg' },
            { id: '8', name: 'Thomas Brown', role: 'Backend Developer', avatar: 'user8.jpeg' },
            { id: '9', name: 'Maya Patel', role: 'UI/UX Designer', avatar: 'user9.jpeg' },
            { id: '10', name: 'Chris Wilson', role: 'DevOps Engineer', avatar: 'user10.jpeg' }
          ],
          tags: ['react-native', 'nodejs', 'mongodb', 'realtime'],
          client: 'FinanceFlow Inc',
          estimated_hours: 720,
          actual_hours: 252,
          milestones: [
            { name: 'Authentication', completed: true, date: '2024-02-20' },
            { name: 'Core Features', completed: false, date: '2024-04-01' },
            { name: 'Real-time Sync', completed: false, date: '2024-05-01' },
            { name: 'App Store Release', completed: false, date: '2024-06-01' }
          ]
        }
      },
      {
        id: '789e0123-e45f-67g8-h901-234567890abc',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'Data Analytics Dashboard',
        description: 'Business intelligence dashboard with real-time analytics and reporting',
        status: 'on_hold',
        created_at: '2024-03-01T11:00:00Z',
        updated_at: '2024-03-05T16:45:00Z',
        metadata: {
          category: 'data science',
          priority: 'medium',
          team_size: 4,
          budget: 18000,
          color: '#f59e0b',
          cover_image: 'cover3.png',
          start_date: '2024-03-01',
          end_date: '2024-06-01',
          progress: 25,
          total_tasks: 15,
          completed_tasks: 4,
          days_left: 60,
          team_members: [
            { id: '11', name: 'Dr. Jennifer Liu', role: 'Data Scientist', avatar: 'user11.jpeg' },
            { id: '12', name: 'Marcus Johnson', role: 'Full Stack Developer', avatar: 'user1.jpeg' },
            { id: '13', name: 'Anna Kowalski', role: 'Data Engineer', avatar: 'user2.jpeg' },
            { id: '14', name: 'James Rodriguez', role: 'Business Analyst', avatar: 'user3.jpeg' }
          ],
          tags: ['python', 'tableau', 'sql', 'machine-learning'],
          client: 'DataDriven Corp',
          estimated_hours: 600,
          actual_hours: 150,
          milestones: [
            { name: 'Data Pipeline', completed: true, date: '2024-03-15' },
            { name: 'Dashboard Design', completed: false, date: '2024-04-15' },
            { name: 'ML Models', completed: false, date: '2024-05-15' },
            { name: 'Production Deploy', completed: false, date: '2024-06-01' }
          ]
        }
      },
      {
        id: 'abc12345-def6-789g-hij0-123456789klm',
        user_id: '550e8400-e29b-41d4-a716-446655440000',
        name: 'E-commerce Platform',
        description: 'Full-featured e-commerce platform with payment integration and inventory management',
        status: 'completed',
        created_at: '2023-12-01T08:00:00Z',
        updated_at: '2024-01-15T17:30:00Z',
        metadata: {
          category: 'web development',
          priority: 'high',
          team_size: 6,
          budget: 35000,
          color: '#8b5cf6',
          cover_image: 'cover4.png',
          start_date: '2023-12-01',
          end_date: '2024-01-15',
          progress: 100,
          total_tasks: 25,
          completed_tasks: 25,
          days_left: 0,
          team_members: [
            { id: '15', name: 'Sophie Martinez', role: 'Full Stack Developer', avatar: 'user4.jpeg' },
            { id: '16', name: 'Ryan O\'Connor', role: 'DevOps Engineer', avatar: 'user5.jpeg' },
            { id: '17', name: 'Priya Sharma', role: 'Frontend Developer', avatar: 'user6.jpeg' },
            { id: '18', name: 'Daniel Kim', role: 'Backend Developer', avatar: 'user7.jpeg' }
          ],
          tags: ['nextjs', 'stripe', 'postgresql', 'docker'],
          client: 'ShopSmart Ltd',
          estimated_hours: 960,
          actual_hours: 1020,
          milestones: [
            { name: 'Product Catalog', completed: true, date: '2023-12-15' },
            { name: 'Payment System', completed: true, date: '2023-12-30' },
            { name: 'Admin Dashboard', completed: true, date: '2024-01-10' },
            { name: 'Go Live', completed: true, date: '2024-01-15' }
          ]
        }
      }
    ];
  }

  // Mock tasks method
  static getMockTasks(projectId: string): Task[] {
    const allTasks: { [key: string]: Task[] } = {
      '90274700-630c-45f3-98c4-16a965747195': [
        {
          id: 'task-1-website',
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          project_id: '90274700-630c-45f3-98c4-16a965747195',
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
          id: 'task-2-website',
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          project_id: '90274700-630c-45f3-98c4-16a965747195',
          title: 'Homepage Wireframes',
          description: 'Create detailed wireframes for homepage layout including responsive breakpoints',
          status: 'completed',
          priority: 'high',
          due_date: '2024-02-15T10:00:00Z',
          created_at: '2024-01-20T10:00:00Z',
          updated_at: '2024-02-14T14:20:00Z',
          metadata: {
            category: 'design',
            estimated_hours: 16,
            actual_hours: 18,
            tags: ['wireframes', 'homepage', 'responsive'],
            assigned_to: 'Sarah Johnson',
            completion_notes: 'Wireframes approved by client with minor revisions'
          }
        },
        {
          id: 'task-3-website',
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          project_id: '90274700-630c-45f3-98c4-16a965747195',
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
          id: 'task-4-website',
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          project_id: '90274700-630c-45f3-98c4-16a965747195',
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
        },
        {
          id: 'task-5-website',
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          project_id: '90274700-630c-45f3-98c4-16a965747195',
          title: 'Responsive Design Implementation',
          description: 'Implement responsive design for mobile and tablet devices',
          status: 'todo',
          priority: 'medium',
          due_date: '2024-03-20T10:00:00Z',
          created_at: '2024-02-20T13:00:00Z',
          updated_at: '2024-02-20T13:00:00Z',
          metadata: {
            category: 'development',
            estimated_hours: 24,
            actual_hours: 0,
            tags: ['responsive', 'css', 'mobile'],
            assigned_to: 'Mike Chen',
            dependencies: ['React Component Development']
          }
        },
        {
          id: 'task-6-website',
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          project_id: '90274700-630c-45f3-98c4-16a965747195',
          title: 'Performance Optimization',
          description: 'Optimize website performance including image compression and code splitting',
          status: 'todo',
          priority: 'medium',
          due_date: '2024-04-01T10:00:00Z',
          created_at: '2024-02-20T14:00:00Z',
          updated_at: '2024-02-20T14:00:00Z',
          metadata: {
            category: 'optimization',
            estimated_hours: 20,
            actual_hours: 0,
            tags: ['performance', 'optimization', 'lighthouse'],
            assigned_to: 'Mike Chen'
          }
        }
      ],
      '123e4567-e89b-12d3-a456-426614174000': [
        {
          id: 'task-1-mobile',
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          project_id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'User Authentication System',
          description: 'implement secure user authentication with biometric support and OAuth integration',
          status: 'completed',
          priority: 'urgent',
          due_date: '2024-02-20T10:00:00Z',
          created_at: '2024-02-01T09:00:00Z',
          updated_at: '2024-02-19T17:30:00Z',
          metadata: {
            category: 'security',
            estimated_hours: 32,
            actual_hours: 35,
            tags: ['authentication', 'security', 'biometric'],
            assigned_to: 'Alex Kim',
            completion_notes: 'Authentication system with Face ID and Google/Apple sign-in'
          }
        },
        {
          id: 'task-2-mobile',
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          project_id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Real-time Chat Feature',
          description: 'Implement real-time messaging with push notifications and message encryption',
          status: 'in_progress',
          priority: 'high',
          due_date: '2024-03-10T10:00:00Z',
          created_at: '2024-02-20T10:00:00Z',
          updated_at: '2024-02-25T11:15:00Z',
          metadata: {
            category: 'features',
            estimated_hours: 48,
            actual_hours: 28,
            tags: ['realtime', 'chat', 'notifications'],
            assigned_to: 'Thomas Brown',
            progress_notes: 'Chat functionality 60% complete, working on encryption'
          }
        },
        {
          id: 'task-3-mobile',
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          project_id: '123e4567-e89b-12d3-a456-426614174000',
          title: 'Payment Gateway Integration',
          description: 'Integrate Stripe and Apple Pay for secure payment processing',
          status: 'todo',
          priority: 'high',
          due_date: '2024-03-25T10:00:00Z',
          created_at: '2024-02-25T12:00:00Z',
          updated_at: '2024-02-25T12:00:00Z',
          metadata: {
            category: 'payments',
            estimated_hours: 40,
            actual_hours: 0,
            tags: ['payments', 'stripe', 'apple-pay'],
            assigned_to: 'Rachel Green',
            dependencies: ['User Authentication System']
          }
        }
      ],
      '789e0123-e45f-67g8-h901-234567890abc': [
        {
          id: 'task-1-analytics',
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          project_id: '789e0123-e45f-67g8-h901-234567890abc',
          title: 'Data Pipeline Architecture',
          description: 'Design and implement ETL pipeline for real-time data processing',
          status: 'completed',
          priority: 'high',
          due_date: '2024-03-15T10:00:00Z',
          created_at: '2024-03-01T11:00:00Z',
          updated_at: '2024-03-14T16:45:00Z',
          metadata: {
            category: 'data-engineering',
            estimated_hours: 45,
            actual_hours: 48,
            tags: ['pipeline', 'etl', 'data-processing'],
            assigned_to: 'Anna Kowalski',
            completion_notes: 'Pipeline processing 1M+ records per hour with 99.9% uptime'
          }
        },
        {
          id: 'task-2-analytics',
          user_id: '550e8400-e29b-41d4-a716-446655440000',
          project_id: '789e0123-e45f-67g8-h901-234567890abc',
          title: 'Machine Learning Models',
          description: 'Develop predictive models for business forecasting and trend analysis',
          status: 'in_progress',
          priority: 'medium',
          due_date: '2024-04-15T10:00:00Z',
          created_at: '2024-03-15T13:00:00Z',
          updated_at: '2024-03-20T10:30:00Z',
          metadata: {
            category: 'machine-learning',
            estimated_hours: 60,
            actual_hours: 25,
            tags: ['ml', 'forecasting', 'analytics'],
            assigned_to: 'Dr. Jennifer Liu',
            progress_notes: 'Model accuracy at 85%, working on feature engineering'
          }
        }
      ]
    };

    return allTasks[projectId] || [];
  }

  // Get all projects for a user with optimized performance
  static async getProjects(userId?: string, includeMockFallback: boolean = false): Promise<Project[]> {
    console.log('📁 Loading projects for user:', userId);
    
    try {
      // Fix UUID issue: don't query by user_id if it's undefined/null
      let query = supabase
        .from('projects')
        .select('*');

      // Only add user_id filter if userId is provided and valid
      if (userId && userId !== 'undefined' && this.isValidUUID(userId)) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.order('updated_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching projects:', error);
        if (includeMockFallback) {
          console.log('🔄 Falling back to mock projects');
          return this.getMockProjects();
        }
        return [];
      }

      if (!data || data.length === 0) {
        console.log('📭 No projects found in database for user:', userId);
        if (includeMockFallback) {
          console.log('🔄 Falling back to mock projects');
          return this.getMockProjects();
        }
        return [];
      }

      // Filter out soft-deleted projects (archived projects with is_deleted flag)
      const activeProjects = data.filter(project => {
        if (project.status === 'archived' && project.metadata?.is_deleted) {
          return false; // Exclude soft-deleted projects
        }
        return true; // Include all other projects
      });

      console.log('✅ Projects fetched successfully from database:', activeProjects.length);
      return activeProjects || [];
    } catch (error) {
      console.error('❌ Error fetching projects:', error);
      if (includeMockFallback) {
        console.log('🔄 Falling back to mock projects');
        return this.getMockProjects();
      }
      return [];
    }
  }

  // Get a specific project by ID
  static async getProject(projectId: string): Promise<Project | null> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        console.error('❌ Database error fetching project:', error);
        // Fallback to mock data
        console.log('🔄 Falling back to mock data for project:', projectId);
        const mockProjects = this.getMockProjects();
        const mockProject = mockProjects.find(p => p.id === projectId);
        if (mockProject) {
          console.log('✅ Project found in mock data:', mockProject.id);
          return mockProject;
        }
        return null;
      }

      if (!data) {
        console.error('❌ Project not found in database:', projectId);
        // Fallback to mock data
        console.log('🔄 Falling back to mock data for project:', projectId);
        const mockProjects = this.getMockProjects();
        const mockProject = mockProjects.find(p => p.id === projectId);
        if (mockProject) {
          console.log('✅ Project found in mock data:', mockProject.id);
          return mockProject;
        }
        return null;
      }

      console.log('✅ Project fetched successfully from database:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Error fetching project:', error);
      // Fallback to mock data
      console.log('🔄 Falling back to mock data for project:', projectId);
      const mockProjects = this.getMockProjects();
      const mockProject = mockProjects.find(p => p.id === projectId);
      if (mockProject) {
        console.log('✅ Project found in mock data:', mockProject.id);
        return mockProject;
      }
      return null;
    }
  }

  // Create a new project
  static async createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    try {
      const projectData = {
        user_id: project.user_id,
        name: project.name,
        description: project.description || '',
        status: project.status || 'active',
        metadata: project.metadata || {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('🔄 Creating project in database with data:', projectData);

      const { data, error } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .single();

      if (error) {
        console.error('❌ Database error creating project:', error);
        throw new Error(`Failed to create project: ${error.message}`);
      }

      if (!data) {
        console.error('❌ No data returned from project creation');
        throw new Error('Failed to create project: No data returned');
      }

      console.log('✅ Project created successfully in database:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Error creating project:', error);
      throw error;
    }
  }

  // Update a project
  static async updateProject(projectId: string, updates: Partial<Project>): Promise<Project | null> {
    // If it's a mock ID, return mock updated project
    if (this.isMockId(projectId)) {
      const mockProjects = this.getMockProjects();
      const mockProject = mockProjects.find(p => p.id === projectId);
      if (mockProject) {
        return { ...mockProject, ...updates, updated_at: new Date().toISOString() };
      }
      return null;
    }

    // Check if it's a valid UUID
    if (!this.isValidUUID(projectId)) {
      console.error('❌ Invalid project ID format:', projectId);
      return null;
    }

    try {
      console.log('🔄 Updating project in database:', projectId);
      
      const { data, error } = await supabase
        .from('projects')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating project:', error);
        return null;
      }

      if (!data) {
        console.error('❌ No data returned from project update');
        return null;
      }

      console.log('✅ Project updated successfully in database:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Error updating project:', error);
      return null;
    }
  }

  // Delete a project
  static async deleteProject(projectId: string): Promise<boolean> {
    console.log('🗑️ Attempting to delete project:', projectId);
    
    // For mock projects, always return true
    if (this.isMockId(projectId)) {
      console.log('✅ Mock project deleted:', projectId);
      return true;
    }

    // Check if it's a valid UUID
    if (!this.isValidUUID(projectId)) {
      console.error('❌ Invalid project ID format:', projectId);
      return false;
    }

    try {
      console.log('💾 Attempting database deletion for project:', projectId);
      
      // Get current user to verify permissions
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ No authenticated user found:', userError);
        return false;
      }
      console.log('👤 Authenticated user:', user.id);
      
      // First verify the project exists and belongs to the user
      const { data: project, error: fetchError } = await supabase
        .from('projects')
        .select('id, name, user_id, status, metadata')
        .eq('id', projectId)
        .single();
      
      if (fetchError) {
        console.error('❌ Error fetching project:', fetchError);
        return false;
      }
      
      if (!project) {
        console.error('❌ Project not found:', projectId);
        return false;
      }
      
      if (project.user_id !== user.id) {
        console.error('❌ User does not own this project:', project.user_id, 'vs', user.id);
        return false;
      }
      
      console.log('✅ Project ownership verified, proceeding with soft deletion');
      
      // Implement soft delete by updating status to 'archived' with deleted flag
      // This avoids RLS deletion permission issues
      console.log('🗑️ Performing soft delete (updating status to archived with deleted flag)...');
      const { error: updateError } = await supabase
        .from('projects')
        .update({ 
          status: 'archived',
          updated_at: new Date().toISOString(),
          metadata: {
            ...(project.metadata || {}),
            deleted_at: new Date().toISOString(),
            deleted_by: user.id,
            is_deleted: true // Flag to distinguish from regular archives
          }
        })
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('❌ Error soft-deleting project:', updateError);
        return false;
      }

      console.log('✅ Project soft-deleted successfully (status updated to archived with deleted flag)');
      
      // Also soft delete related tasks
      console.log('🗑️ Soft-deleting related tasks...');
      const { error: tasksError } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed', // Use completed status for tasks as it's more appropriate
          updated_at: new Date().toISOString(),
          metadata: {
            deleted_at: new Date().toISOString(),
            deleted_by: user.id,
            is_deleted: true
          }
        })
        .eq('project_id', projectId);

      if (tasksError) {
        console.error('⚠️ Warning: Error soft-deleting tasks (continuing):', tasksError);
        // Continue even if task update fails
      } else {
        console.log('✅ Related tasks soft-deleted successfully');
      }

      return true;
      
    } catch (error) {
      console.error('❌ Unexpected error deleting project:', error);
      return false;
    }
  }

  // Get tasks for a project
  static async getProjectTasks(projectId: string): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching project tasks:', error);
        // Fallback to mock data
        console.log('🔄 Falling back to mock tasks for project:', projectId);
        return this.getMockTasks(projectId);
      }

      if (!data || data.length === 0) {
        console.log('❌ No tasks found in database for project:', projectId);
        // Fallback to mock data
        console.log('🔄 Falling back to mock tasks for project:', projectId);
        return this.getMockTasks(projectId);
      }

      console.log('✅ Tasks fetched successfully from database:', data.length);
      return data || [];
    } catch (error) {
      console.error('❌ Error fetching project tasks:', error);
      // Fallback to mock data
      console.log('🔄 Falling back to mock tasks for project:', projectId);
      return this.getMockTasks(projectId);
    }
  }

  // Utility methods
  static calculateProjectProgress(tasks: Task[]): { completed: number; total: number; percentage: number } {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'completed').length;
    const percentage = total > 0 ? completed / total : 0;
    
    return { completed, total, percentage };
  }

  // Enhanced progress calculation that considers subtask completion
  static async calculateProjectProgressWithSubtasks(projectId: string): Promise<{ completed: number; total: number; percentage: number }> {
    try {
      const tasks = await this.getProjectTasks(projectId);
      let totalTasksCompleted = 0;
      const totalTasks = tasks.length;
      
      for (const task of tasks) {
        const subtasks = await this.getTaskSubtasks(task.id);
        
        if (subtasks.length > 0) {
          // Task has subtasks - determine completion based on subtask status
          const allSubtasksCompleted = subtasks.every(subtask => subtask.completed);
          const hasIncompleteSubtasks = subtasks.some(subtask => !subtask.completed);
          
          if (allSubtasksCompleted && task.status !== 'completed') {
            // Auto-mark task as completed if all subtasks are done
            await this.updateTask(task.id, { status: 'completed' });
            totalTasksCompleted++;
          } else if (hasIncompleteSubtasks && task.status === 'completed') {
            // Auto-mark task as incomplete if any subtask is incomplete
            await this.updateTask(task.id, { status: 'in_progress' });
            // Don't count as completed
          } else if (task.status === 'completed') {
            // Task is completed and all subtasks are completed
            totalTasksCompleted++;
          }
        } else {
          // Task has no subtasks - use direct status
          if (task.status === 'completed') {
            totalTasksCompleted++;
          }
        }
      }
      
      const percentage = totalTasks > 0 ? totalTasksCompleted / totalTasks : 0;
      return { completed: totalTasksCompleted, total: totalTasks, percentage };
    } catch (error) {
      console.error('Error calculating progress with subtasks:', error);
      // Fallback to basic calculation
      return this.calculateProjectProgress(await this.getProjectTasks(projectId));
    }
  }

  static calculateDaysLeft(endDate: string): number {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  static async updateProjectProgress(projectId: string): Promise<void> {
    try {
      const tasks = await this.getProjectTasks(projectId);
      const progress = this.calculateProjectProgress(tasks);
      
      const project = await this.getProject(projectId);
      if (!project) return;

      const updatedMetadata = {
        ...project.metadata,
        total_tasks: progress.total,
        completed_tasks: progress.completed,
        progress: progress.percentage
      };

      await this.updateProject(projectId, {
        metadata: updatedMetadata
      });
    } catch (error) {
      console.error('Error updating project progress:', error);
    }
  }

  // Search projects by query
  static async searchProjects(query: string): Promise<Project[]> {
    // Search in mock data only for now
    const mockProjects = this.getMockProjects();
    return mockProjects.filter(project => 
      project.name.toLowerCase().includes(query.toLowerCase()) ||
      (project.description && project.description.toLowerCase().includes(query.toLowerCase()))
    );

    // Commented out database logic until permissions are fixed
    /*
    const dbAvailable = await this.checkDatabaseAvailability();
    if (!dbAvailable) {
      const mockProjects = this.getMockProjects();
      return mockProjects.filter(project => 
        project.name.toLowerCase().includes(query.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(query.toLowerCase()))
      );
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching projects:', error);
      return [];
    }
    */
  }

  // Comprehensive search across projects, tasks, and subtasks
  static async searchAllContent(query: string, userId?: string): Promise<{
    projects: Project[];
    tasks: Task[];
    subtasks: TaskSubtask[];
    matchCounts: {
      projects: number;
      tasks: number;
      subtasks: number;
      total: number;
    };
  }> {
    if (!query.trim()) {
      return {
        projects: [],
        tasks: [],
        subtasks: [],
        matchCounts: { projects: 0, tasks: 0, subtasks: 0, total: 0 }
      };
    }

    const searchTerm = query.toLowerCase().trim();
    
    try {
      // Get all projects for the user
      const allProjects = await this.getProjects(userId, true);
      
      // Search projects by name and description
      const matchingProjects = allProjects.filter(project => 
        project.name.toLowerCase().includes(searchTerm) ||
        (project.description && project.description.toLowerCase().includes(searchTerm)) ||
        (project.metadata && JSON.stringify(project.metadata).toLowerCase().includes(searchTerm))
      );

      // Get all tasks for matching projects and search them
      const allTasks: Task[] = [];
      const allSubtasks: TaskSubtask[] = [];
      
      for (const project of allProjects) {
        const projectTasks = this.getMockTasks(project.id);
        allTasks.push(...projectTasks);
        
        // Get subtasks for each task (mock data for now)
        for (const task of projectTasks) {
          const subtasks = this.getMockSubtasks(task.id);
          allSubtasks.push(...subtasks);
        }
      }

      // Search tasks by title and description
      const matchingTasks = allTasks.filter(task =>
        task.title.toLowerCase().includes(searchTerm) ||
        (task.description && task.description.toLowerCase().includes(searchTerm)) ||
        (task.metadata && JSON.stringify(task.metadata).toLowerCase().includes(searchTerm))
      );

      // Search subtasks by title, description, and notes
      const matchingSubtasks = allSubtasks.filter(subtask =>
        subtask.title.toLowerCase().includes(searchTerm) ||
        (subtask.description && subtask.description.toLowerCase().includes(searchTerm)) ||
        (subtask.notes && subtask.notes.toLowerCase().includes(searchTerm))
      );

      // Also include projects that have matching tasks or subtasks
      const projectsWithMatchingContent = new Set<string>();
      
      matchingTasks.forEach(task => {
        projectsWithMatchingContent.add(task.project_id);
      });
      
      matchingSubtasks.forEach(subtask => {
        const task = allTasks.find(t => t.id === subtask.task_id);
        if (task) {
          projectsWithMatchingContent.add(task.project_id);
        }
      });

      // Add projects that have matching content but weren't already matched
      const additionalProjects = allProjects.filter(project =>
        projectsWithMatchingContent.has(project.id) && 
        !matchingProjects.some(mp => mp.id === project.id)
      );

      const finalProjects = [...matchingProjects, ...additionalProjects];

      return {
        projects: finalProjects,
        tasks: matchingTasks,
        subtasks: matchingSubtasks,
        matchCounts: {
          projects: finalProjects.length,
          tasks: matchingTasks.length,
          subtasks: matchingSubtasks.length,
          total: finalProjects.length + matchingTasks.length + matchingSubtasks.length
        }
      };

    } catch (error) {
      console.error('Error in comprehensive search:', error);
      return {
        projects: [],
        tasks: [],
        subtasks: [],
        matchCounts: { projects: 0, tasks: 0, subtasks: 0, total: 0 }
      };
    }
  }

  // Helper method to get mock subtasks for a task
  private static getMockSubtasks(taskId: string): TaskSubtask[] {
    // Mock subtasks data
    const mockSubtasks: TaskSubtask[] = [
      {
        id: `subtask-${taskId}-1`,
        task_id: taskId,
        title: 'Research user requirements',
        description: 'Gather and analyze user requirements for the feature',
        completed: true,
        order_index: 1,
        created_by: '550e8400-e29b-41d4-a716-446655440000',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-16T10:00:00Z',
        notes: 'Completed user interviews and surveys'
      },
      {
        id: `subtask-${taskId}-2`,
        task_id: taskId,
        title: 'Create wireframes',
        description: 'Design initial wireframes and mockups',
        completed: false,
        order_index: 2,
        created_by: '550e8400-e29b-41d4-a716-446655440000',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        notes: 'Using Figma for design work'
      },
      {
        id: `subtask-${taskId}-3`,
        task_id: taskId,
        title: 'Implement frontend components',
        description: 'Build React components for the new feature',
        completed: false,
        order_index: 3,
        created_by: '550e8400-e29b-41d4-a716-446655440000',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        notes: 'Focus on responsive design and accessibility'
      }
    ];

    return mockSubtasks;
  }

  // Get projects by status
  static async getProjectsByStatus(status: string): Promise<Project[]> {
    // Filter mock data only for now
    const mockProjects = this.getMockProjects();
    return mockProjects.filter(project => project.status === status);

    // Commented out database logic until permissions are fixed
    /*
    const dbAvailable = await this.checkDatabaseAvailability();
    if (!dbAvailable) {
      const mockProjects = this.getMockProjects();
      return mockProjects.filter(project => project.status === status);
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', status)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching projects by status:', error);
      return [];
    }
    */
  }

  // Get projects by category
  static async getProjectsByCategory(categoryId: string): Promise<Project[]> {
    // Filter mock data only for now
    const mockProjects = this.getMockProjects();
    return mockProjects.filter(project => 
      project.metadata && project.metadata.category_id === categoryId
    );

    // Commented out database logic until permissions are fixed
    /*
    const dbAvailable = await this.checkDatabaseAvailability();
    if (!dbAvailable) {
      const mockProjects = this.getMockProjects();
      return mockProjects.filter(project => 
        project.metadata && project.metadata.category_id === categoryId
      );
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .contains('metadata', { category_id: categoryId })
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching projects by category:', error);
      return [];
    }
    */
  }

  // Update a task
  static async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    try {
      const isAvailable = await this.checkDatabaseAvailability();
      
      if (!isAvailable) {
        console.log('Database not available, returning mock task update');
        // Return a mock updated task
        const mockTasks = this.getMockTasks('550e8400-e29b-41d4-a716-446655440000');
        const task = mockTasks.find(t => t.id === taskId);
        if (task) {
          return { ...task, ...updates, updated_at: new Date().toISOString() };
        }
        return null;
      }

      const { data, error } = await supabase
        .from('tasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId)
        .select()
        .single();

      if (error) {
        console.error('Error updating task:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Task update error:', error);
      return null;
    }
  }

  // Create a new task
  static async createTask(task: Omit<Task, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
    try {
      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        console.log('User not authenticated, creating mock task');
        const mockTask: Task = {
          id: `task-${Date.now()}`,
          ...task,
          user_id: task.user_id || '550e8400-e29b-41d4-a716-446655440000',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        console.log('📝 Created mock task:', mockTask.id);
        return mockTask;
      }

      const isAvailable = await this.checkDatabaseAvailability();
      
      if (!isAvailable) {
        console.log('Database not available, creating mock task');
        const mockTask: Task = {
          id: `task-${Date.now()}`,
          ...task,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        console.log('📝 Created mock task:', mockTask.id);
        return mockTask;
      }

      // Create task data with only the columns that exist in the database
      const taskData = {
        title: task.title,
        description: task.description,
        project_id: task.project_id,
        status: task.status,
        priority: task.priority,
        due_date: task.due_date,
        user_id: user.id, // Always use authenticated user's ID
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Store the extra fields that may not exist in the database
      const extraFields = {
        assigned_to: task.assigned_to || [],
        created_by: task.created_by || user.id,
        metadata: task.metadata || {}
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        // Fallback to mock task creation
        const mockTask: Task = {
          id: `task-${Date.now()}`,
          ...taskData,
          ...extraFields
        };
        console.log('📝 Created mock task (fallback):', mockTask.id);
        return mockTask;
      }

      // Combine the database result with the extra fields
      const fullTask: Task = {
        ...data,
        ...extraFields
      };

      console.log('✅ Task created in database:', fullTask.id);
      return fullTask;
    } catch (error) {
      console.error('Task creation error:', error);
      // Fallback to mock task creation
      const mockTask: Task = {
        id: `task-${Date.now()}`,
        ...task,
        user_id: task.user_id || '550e8400-e29b-41d4-a716-446655440000',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      console.log('📝 Created mock task (error fallback):', mockTask.id);
      return mockTask;
    }
  }

  // Delete a task
  static async deleteTask(taskId: string): Promise<boolean> {
    try {
      const isAvailable = await this.checkDatabaseAvailability();
      
      if (!isAvailable) {
        console.log('Database not available, returning mock task deletion');
        return true; // Mock successful deletion
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) {
        console.error('Error deleting task:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Task deletion error:', error);
      return false;
    }
  }

  /**
   * 🚀 OPTIMIZED: Get user projects with stats using materialized views
   * TEMPORARILY DISABLED: RLS policies need to be set up for the optimized functions
   */
  static async getUserProjectsOptimized(userId: string) {
    console.log('📁 Optimized function temporarily disabled, using fallback');
    return this.getProjects(userId);
  }

  /**
   * 🚀 OPTIMIZED: Get dashboard stats using materialized views
   * TEMPORARILY DISABLED: RLS policies need to be set up for the optimized functions
   */
  static async getDashboardStatsOptimized(userId: string) {
    console.log('📊 Dashboard stats optimized function temporarily disabled, using fallback');
    
    // Return mock data or basic stats for now
    const projects = await this.getProjects(userId);
    const activePro = projects.filter(p => p.status === 'active').length;
    const completedPro = projects.filter(p => p.status === 'completed').length;
    
    return {
      total_projects: projects.length,
      active_projects: activePro,
      completed_projects: completedPro,
      total_tasks: 0, // We'd need to calculate this from actual tasks
      completed_tasks: 0,
      pending_tasks: 0
    };
  }

  // Enhanced project retrieval with team access control
  static async getProjectsWithTeamAccess(userId?: string): Promise<{
    ownedProjects: Project[];
    memberProjects: Project[];
    allProjects: Project[];
  }> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      const targetUserId = userId || currentUser.user?.id;
      
      if (!targetUserId) {
        return { ownedProjects: [], memberProjects: [], allProjects: [] };
      }

      const isDatabaseAvailable = await this.checkDatabaseAvailability();
      if (!isDatabaseAvailable) {
        const mockProjects = this.getMockProjects();
        return { 
          ownedProjects: mockProjects, 
          memberProjects: [], 
          allProjects: mockProjects 
        };
      }

      // Get owned projects
      const { data: ownedProjects, error: ownedError } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', targetUserId)
        .order('updated_at', { ascending: false });

      if (ownedError) {
        console.error('Error fetching owned projects:', ownedError);
      }

      // Get projects where user is a team member
      const { data: teamProjects, error: teamError } = await supabase
        .from('project_team_members')
        .select(`
          role,
          permissions,
          joined_at,
          project:projects(*)
        `)
        .eq('user_id', targetUserId)
        .eq('status', 'active')
        .order('joined_at', { ascending: false });

      if (teamError) {
        console.error('Error fetching team projects:', teamError);
      }

      const memberProjects = (teamProjects || []).map((member: any) => ({
        ...member.project,
        team_role: member.role,
        team_permissions: member.permissions,
        joined_at: member.joined_at
      }));

      const allProjects = [...(ownedProjects || []), ...memberProjects];

      return {
        ownedProjects: ownedProjects || [],
        memberProjects,
        allProjects
      };
    } catch (error) {
      console.error('Error fetching projects with team access:', error);
      const mockProjects = this.getMockProjects();
      return { 
        ownedProjects: mockProjects, 
        memberProjects: [], 
        allProjects: mockProjects 
      };
    }
  }

  // Check if user has access to specific project
  static async checkProjectAccess(
    projectId: string, 
    userId?: string,
    requiredPermission?: string
  ): Promise<{
    hasAccess: boolean;
    role?: string;
    permissions?: any;
    isOwner: boolean;
  }> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      const targetUserId = userId || currentUser.user?.id;
      
      if (!targetUserId) {
        return { hasAccess: false, isOwner: false };
      }

      const isDatabaseAvailable = await this.checkDatabaseAvailability();
      if (!isDatabaseAvailable) {
        // For mock data, assume user has access
        return { hasAccess: true, isOwner: true, role: 'owner' };
      }

      // Check if user is project owner
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .single();

      if (projectError) {
        console.error('Error checking project ownership:', projectError);
      }

      if (project?.user_id === targetUserId) {
        return { 
          hasAccess: true, 
          isOwner: true,
          role: 'owner',
          permissions: {
            read: true,
            write: true,
            delete: true,
            invite: true,
            manage_members: true,
            access_chat: true
          }
        };
      }

      // Check team membership
      const { data: member, error: memberError } = await supabase
        .from('project_team_members')
        .select('role, permissions, status')
        .eq('project_id', projectId)
        .eq('user_id', targetUserId)
        .eq('status', 'active')
        .single();

      if (memberError) {
        console.error('Error checking team membership:', memberError);
        return { hasAccess: false, isOwner: false };
      }

      if (!member) {
        return { hasAccess: false, isOwner: false };
      }

      const hasRequiredPermission = !requiredPermission || 
        member.permissions?.[requiredPermission] === true;

      return {
        hasAccess: hasRequiredPermission,
        isOwner: false,
        role: member.role,
        permissions: member.permissions
      };
    } catch (error) {
      console.error('Error checking project access:', error);
      return { hasAccess: false, isOwner: false };
    }
  }

  // Get project with team members
  static async getProjectWithTeam(projectId: string): Promise<{
    project: Project | null;
    teamMembers: any[];
    userAccess: any;
  }> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      const userId = currentUser.user?.id;

      if (!userId) {
        return { project: null, teamMembers: [], userAccess: { hasAccess: false, isOwner: false } };
      }

      // Check user access first
      const userAccess = await this.checkProjectAccess(projectId, userId);
      if (!userAccess.hasAccess) {
        return { project: null, teamMembers: [], userAccess };
      }

      // Get project details
      const project = await this.getProject(projectId);
      if (!project) {
        return { project: null, teamMembers: [], userAccess };
      }

      // Get team members (using TeamService)
      const { TeamService } = await import('./teamService');
      const teamMembers = await TeamService.getProjectTeamMembers(projectId);

      return { project, teamMembers, userAccess };
    } catch (error) {
      console.error('Error getting project with team:', error);
      return { project: null, teamMembers: [], userAccess: { hasAccess: false, isOwner: false } };
    }
  }

  // Get project chat conversations (with team access control)
  static async getProjectChatConversations(projectId: string): Promise<any[]> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      const userId = currentUser.user?.id;

      if (!userId) return [];

      // Check if user has chat access
      const userAccess = await this.checkProjectAccess(projectId, userId, 'access_chat');
      if (!userAccess.hasAccess) {
        console.log('User does not have chat access to this project');
        return [];
      }

      const isDatabaseAvailable = await this.checkDatabaseAvailability();
      if (!isDatabaseAvailable) {
        return [];
      }

      // Get chat conversations for the project
      const { data: conversations, error } = await supabase
        .from('chat_conversations')
        .select(`
          id,
          title,
          created_at,
          updated_at,
          user_id,
          project_id
        `)
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Error fetching project conversations:', error);
        return [];
      }

      return conversations || [];
    } catch (error) {
      console.error('Error getting project chat conversations:', error);
      return [];
    }
  }

  // Share project with team members
  static async shareProjectWithTeam(
    projectId: string, 
    conversationId: string,
    shareMessage?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      const userId = currentUser.user?.id;

      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if user has permission to share
      const userAccess = await this.checkProjectAccess(projectId, userId, 'write');
      if (!userAccess.hasAccess) {
        return { success: false, error: 'You do not have permission to share this project' };
      }

      // Get team members
      const { TeamService } = await import('./teamService');
      const teamMembers = await TeamService.getProjectTeamMembers(projectId);

      // Create notifications for team members
      for (const member of teamMembers) {
        if (member.user_id && member.user_id !== userId && member.permissions?.access_chat) {
          await TeamService.sendInAppNotification(member.user_id, {
            type: 'project_shared',
            title: 'Project Update Shared',
            message: shareMessage || 'A new project update has been shared with the team',
            data: {
              project_id: projectId,
              conversation_id: conversationId,
              shared_by: userId
            }
          });
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Error sharing project with team:', error);
      return { success: false, error: 'Failed to share project with team' };
    }
  }

  // Get user's project dashboard with team data
  static async getUserProjectDashboard(userId?: string): Promise<{
    ownedProjects: number;
    memberProjects: number;
    totalTasks: number;
    completedTasks: number;
    pendingInvitations: number;
    recentActivity: any[];
  }> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      const targetUserId = userId || currentUser.user?.id;
      
      if (!targetUserId) {
        return {
          ownedProjects: 0,
          memberProjects: 0,
          totalTasks: 0,
          completedTasks: 0,
          pendingInvitations: 0,
          recentActivity: []
        };
      }

      const isDatabaseAvailable = await this.checkDatabaseAvailability();
      if (!isDatabaseAvailable) {
        return {
          ownedProjects: 3,
          memberProjects: 0,
          totalTasks: 45,
          completedTasks: 32,
          pendingInvitations: 0,
          recentActivity: []
        };
      }

      // Get project counts
      const projectData = await this.getProjectsWithTeamAccess(targetUserId);
      
      // Get task counts across all accessible projects
      const allProjectIds = projectData.allProjects.map(p => p.id);
      let totalTasks = 0;
      let completedTasks = 0;

      if (allProjectIds.length > 0) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('status')
          .in('project_id', allProjectIds);

        totalTasks = tasks?.length || 0;
        completedTasks = tasks?.filter(t => t.status === 'completed').length || 0;
      }

      // Get pending invitations
      const { TeamService } = await import('./teamService');
      const invitations = await TeamService.getUserInvitations();
      const pendingInvitations = invitations.filter(i => i && typeof i === 'object' && 'status' in i && i.status === 'pending').length;

      return {
        ownedProjects: projectData.ownedProjects.length,
        memberProjects: projectData.memberProjects.length,
        totalTasks,
        completedTasks,
        pendingInvitations,
        recentActivity: [] // TODO: Implement recent activity tracking
      };
    } catch (error) {
      console.error('Error getting user project dashboard:', error);
      return {
        ownedProjects: 0,
        memberProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingInvitations: 0,
        recentActivity: []
      };
    }
  }

  // SUBTASK METHODS
  static async getTaskSubtasks(taskId: string): Promise<TaskSubtask[]> {
    try {
      const isDatabaseAvailable = await this.checkDatabaseAvailability();
      if (!isDatabaseAvailable) {
        return [];
      }

      const { data: subtasks, error } = await supabase
        .from('task_subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('order_index', { ascending: true });

      if (error) {
        console.error('Error fetching task subtasks:', error);
        return [];
      }

      return subtasks || [];
    } catch (error) {
      console.error('Error getting task subtasks:', error);
      return [];
    }
  }

  static async createSubtask(subtask: Omit<TaskSubtask, 'id' | 'created_at' | 'updated_at'>): Promise<TaskSubtask | null> {
    try {
      const isDatabaseAvailable = await this.checkDatabaseAvailability();
      if (!isDatabaseAvailable) {
        return null;
      }

      const { data: currentUser } = await supabase.auth.getUser();
      const userId = currentUser.user?.id;

      const { data: newSubtask, error } = await supabase
        .from('task_subtasks')
        .insert({
          ...subtask,
          created_by: userId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating subtask:', error);
        return null;
      }

      return newSubtask;
    } catch (error) {
      console.error('Error creating subtask:', error);
      return null;
    }
  }

  static async updateSubtask(subtaskId: string, updates: Partial<TaskSubtask>): Promise<TaskSubtask | null> {
    try {
      const dbAvailable = await this.checkDatabaseAvailability();
      if (!dbAvailable) {
        console.log('Database not available, using mock data');
        // For mock data, we'll simulate the update
        return {
          id: subtaskId,
          task_id: 'mock-task',
          title: 'Updated Subtask',
          completed: updates.completed || false,
          order_index: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...updates
        } as TaskSubtask;
      }

      const { data, error } = await supabase
        .from('task_subtasks')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', subtaskId)
        .select(`
          *
        `)
        .single();

      if (error) {
        console.error('Error updating subtask:', error);
        return null;
      }

      // If completion status changed, recalculate project progress
      if (updates.completed !== undefined && data) {
        const task = await this.getTaskById(data.task_id);
        if (task) {
          await this.recalculateProjectProgress(task.project_id);
        }
      }

      return data;
    } catch (error) {
      console.error('Error updating subtask:', error);
      return null;
    }
  }

  static async deleteSubtask(subtaskId: string): Promise<boolean> {
    try {
      const isDatabaseAvailable = await this.checkDatabaseAvailability();
      if (!isDatabaseAvailable) {
        return false;
      }

      const { error } = await supabase
        .from('task_subtasks')
        .delete()
        .eq('id', subtaskId);

      if (error) {
        console.error('Error deleting subtask:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting subtask:', error);
      return false;
    }
  }

  // COMMENT METHODS
  static async getTaskComments(taskId: string): Promise<TaskComment[]> {
    try {
      const isDatabaseAvailable = await this.checkDatabaseAvailability();
      if (!isDatabaseAvailable) {
        return [];
      }

      const { data: comments, error } = await supabase
        .from('task_comments')
        .select(`
          *,
          profiles!user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching task comments:', error);
        return [];
      }

      // Transform the data to match the expected format
      return (comments || []).map(comment => ({
        ...comment,
        user: comment.profiles ? {
          id: comment.profiles.id,
          full_name: comment.profiles.full_name,
          avatar_url: comment.profiles.avatar_url
        } : undefined
      }));
    } catch (error) {
      console.error('Error getting task comments:', error);
      return [];
    }
  }

  static async createComment(comment: Omit<TaskComment, 'id' | 'created_at' | 'updated_at' | 'user'>): Promise<TaskComment | null> {
    try {
      const isDatabaseAvailable = await this.checkDatabaseAvailability();
      if (!isDatabaseAvailable) {
        return null;
      }

      const { data: currentUser } = await supabase.auth.getUser();
      const userId = currentUser.user?.id;

      if (!userId) {
        console.error('User not authenticated');
        return null;
      }

      const { data: newComment, error } = await supabase
        .from('task_comments')
        .insert({
          ...comment,
          user_id: userId
        })
        .select(`
          *,
          profiles!user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Error creating comment:', error);
        return null;
      }

      // Transform the data to match the expected format
      return {
        ...newComment,
        user: newComment.profiles ? {
          id: newComment.profiles.id,
          full_name: newComment.profiles.full_name,
          avatar_url: newComment.profiles.avatar_url
        } : undefined
      };
    } catch (error) {
      console.error('Error creating comment:', error);
      return null;
    }
  }

  static async updateComment(commentId: string, content: string): Promise<TaskComment | null> {
    try {
      const isDatabaseAvailable = await this.checkDatabaseAvailability();
      if (!isDatabaseAvailable) {
        return null;
      }

      const { data: updatedComment, error } = await supabase
        .from('task_comments')
        .update({ content })
        .eq('id', commentId)
        .select(`
          *,
          profiles!user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Error updating comment:', error);
        return null;
      }

      // Transform the data to match the expected format
      return {
        ...updatedComment,
        user: updatedComment.profiles ? {
          id: updatedComment.profiles.id,
          full_name: updatedComment.profiles.full_name,
          avatar_url: updatedComment.profiles.avatar_url
        } : undefined
      };
    } catch (error) {
      console.error('Error updating comment:', error);
      return null;
    }
  }

  static async deleteComment(commentId: string): Promise<boolean> {
    try {
      const isDatabaseAvailable = await this.checkDatabaseAvailability();
      if (!isDatabaseAvailable) {
        return false;
      }

      const { error } = await supabase
        .from('task_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Error deleting comment:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  }

  // Get complete task details with subtasks and comments
  static async getTaskDetails(taskId: string): Promise<{
    task: Task | null;
    subtasks: TaskSubtask[];
    comments: TaskComment[];
  }> {
    try {
      const [task, subtasks, comments] = await Promise.all([
        this.getTaskById(taskId),
        this.getTaskSubtasks(taskId),
        this.getTaskComments(taskId)
      ]);

      return {
        task,
        subtasks,
        comments
      };
    } catch (error) {
      console.error('Error getting complete task details:', error);
      return {
        task: null,
        subtasks: [],
        comments: []
      };
    }
  }

  // Get single task by ID
  static async getTaskById(taskId: string): Promise<Task | null> {
    try {
      const isDatabaseAvailable = await this.checkDatabaseAvailability();
      if (!isDatabaseAvailable) {
        return null;
      }

      const { data: task, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single();

      if (error) {
        console.error('Error fetching task by ID:', error);
        return null;
      }

      return task;
    } catch (error) {
      console.error('Error getting task by ID:', error);
      return null;
    }
  }

  // Method to recalculate and update project progress
  static async recalculateProjectProgress(projectId: string): Promise<void> {
    try {
      const progressData = await this.calculateProjectProgressWithSubtasks(projectId);
      
      // Update project metadata with new progress
      const project = await this.getProject(projectId);
      if (project) {
        const updatedMetadata = {
          ...project.metadata,
          total_tasks: progressData.total,
          completed_tasks: progressData.completed,
          progress: progressData.percentage
        };

        await this.updateProject(projectId, {
          metadata: updatedMetadata
        });
      }
    } catch (error) {
      console.error('Error recalculating project progress:', error);
    }
  }

  // PROJECT COMMENT METHODS

  // Get project comments with user info and like status
  static async getProjectComments(projectId: string): Promise<ProjectComment[]> {
    try {
      const isDatabaseAvailable = await this.checkDatabaseAvailability();
      if (!isDatabaseAvailable) {
        return [];
      }

      const { data: currentUser } = await supabase.auth.getUser();
      const currentUserId = currentUser.user?.id;

      const { data: comments, error } = await supabase
        .from('project_comments')
        .select('*')
        .eq('project_id', projectId)
        .is('parent_comment_id', null)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching project comments:', error);
        return [];
      }

      // Get user info and check likes for each comment
      const commentsWithLikes = await Promise.all(
        (comments || []).map(async (comment) => {
          let isLiked = false;
          
          // Get user profile
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', comment.user_id)
            .single();
          
          if (currentUserId) {
            const { data: likeData } = await supabase
              .from('project_comment_likes')
              .select('id')
              .eq('comment_id', comment.id)
              .eq('user_id', currentUserId)
              .single();
            
            isLiked = !!likeData;
          }

          // Get replies for this comment
          const { data: replies } = await supabase
            .from('project_comments')
            .select('*')
            .eq('parent_comment_id', comment.id)
            .order('created_at', { ascending: true });

          // Get user profiles for replies
          const repliesWithUsers = await Promise.all(
            (replies || []).map(async (reply) => {
              const { data: replyUserProfile } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .eq('id', reply.user_id)
                .single();
              
              return {
                ...reply,
                user: replyUserProfile
              };
            })
          );

          return {
            ...comment,
            user: userProfile,
            is_liked: isLiked,
            replies: repliesWithUsers
          };
        })
      );

      return commentsWithLikes;
    } catch (error) {
      console.error('Error getting project comments:', error);
      return [];
    }
  }

  // Create a new project comment
  static async createProjectComment(comment: Omit<ProjectComment, 'id' | 'created_at' | 'updated_at' | 'user' | 'likes_count' | 'replies' | 'is_liked' | 'user_id'>): Promise<ProjectComment | null> {
    try {
      const isDatabaseAvailable = await this.checkDatabaseAvailability();
      if (!isDatabaseAvailable) {
        return null;
      }

      const { data: currentUser } = await supabase.auth.getUser();
      const userId = currentUser.user?.id;

      if (!userId) {
        console.error('User not authenticated');
        return null;
      }

      const { data: newComment, error } = await supabase
        .from('project_comments')
        .insert({
          ...comment,
          user_id: userId
        })
        .select('*')
        .single();

      if (error) {
        console.error('Error creating project comment:', error);
        return null;
      }

      // Get user profile for the new comment
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', newComment.user_id)
        .single();

      return {
        ...newComment,
        user: userProfile,
        is_liked: false,
        replies: []
      };
    } catch (error) {
      console.error('Error creating project comment:', error);
      return null;
    }
  }

  // Update project comment
  static async updateProjectComment(commentId: string, content: string): Promise<ProjectComment | null> {
    try {
      const isDatabaseAvailable = await this.checkDatabaseAvailability();
      if (!isDatabaseAvailable) {
        return null;
      }

      const { data: updatedComment, error } = await supabase
        .from('project_comments')
        .update({ content })
        .eq('id', commentId)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating project comment:', error);
        return null;
      }

      // Get user profile for the updated comment
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', updatedComment.user_id)
        .single();

      return {
        ...updatedComment,
        user: userProfile
      };
    } catch (error) {
      console.error('Error updating project comment:', error);
      return null;
    }
  }

  // Delete project comment
  static async deleteProjectComment(commentId: string): Promise<boolean> {
    try {
      const isDatabaseAvailable = await this.checkDatabaseAvailability();
      if (!isDatabaseAvailable) {
        return false;
      }

      const { error } = await supabase
        .from('project_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        console.error('Error deleting project comment:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting project comment:', error);
      return false;
    }
  }

  // Toggle like on project comment
  static async toggleProjectCommentLike(commentId: string): Promise<{ liked: boolean; likes_count: number } | null> {
    try {
      const isDatabaseAvailable = await this.checkDatabaseAvailability();
      if (!isDatabaseAvailable) {
        return null;
      }

      const { data: currentUser } = await supabase.auth.getUser();
      const userId = currentUser.user?.id;

      if (!userId) {
        console.error('User not authenticated');
        return null;
      }

      // Check if user already liked this comment
      const { data: existingLike } = await supabase
        .from('project_comment_likes')
        .select('id')
        .eq('comment_id', commentId)
        .eq('user_id', userId)
        .single();

      if (existingLike) {
        // Unlike the comment
        const { error } = await supabase
          .from('project_comment_likes')
          .delete()
          .eq('id', existingLike.id);

        if (error) {
          console.error('Error removing like:', error);
          return null;
        }
      } else {
        // Like the comment
        const { error } = await supabase
          .from('project_comment_likes')
          .insert({
            comment_id: commentId,
            user_id: userId
          });

        if (error) {
          console.error('Error adding like:', error);
          return null;
        }
      }

      // Get updated likes count
      const { data: comment } = await supabase
        .from('project_comments')
        .select('likes_count')
        .eq('id', commentId)
        .single();

      return {
        liked: !existingLike,
        likes_count: comment?.likes_count || 0
      };
    } catch (error) {
      console.error('Error toggling comment like:', error);
      return null;
    }
  }

  // Get project comment replies
  static async getProjectCommentReplies(commentId: string): Promise<ProjectComment[]> {
    try {
      const isDatabaseAvailable = await this.checkDatabaseAvailability();
      if (!isDatabaseAvailable) {
        return [];
      }

      const { data: replies, error } = await supabase
        .from('project_comments')
        .select('*')
        .eq('parent_comment_id', commentId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comment replies:', error);
        return [];
      }

      // Get user profiles for replies
      const repliesWithUsers = await Promise.all(
        (replies || []).map(async (reply) => {
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .eq('id', reply.user_id)
            .single();
          
          return {
            ...reply,
            user: userProfile
          };
        })
      );

      return repliesWithUsers;
    } catch (error) {
      console.error('Error getting comment replies:', error);
      return [];
    }
  }
}