import images from '../constants/images';
import { supabase } from './supabase';

export interface Project {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'archived' | 'on_hold';
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
  created_at: string;
  updated_at: string;
  metadata?: any;
}

export class ProjectService {
  // Flag to track if database is available
  private static databaseAvailable: boolean | null = null;

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
    const mockProject1: Project = {
      id: 'mock-project-1',
      user_id: 'mock-user',
      name: 'AI-Powered Customer Support System',
      description: 'Comprehensive AI chatbot system with natural language processing, sentiment analysis, and automated ticket routing for enhanced customer experience.',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        image: images.projectImage,
        logo: images.logo5,
        members: [
          images.user1,
          images.user2,
          images.user3,
          images.user4,
          images.user5
        ],
        end_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        category_id: '1',
        owner: 'Sarah Johnson',
        edc_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        fud_date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
        team_members: ['Sarah Johnson', 'Mike Chen', 'Emily Rodriguez', 'David Kim', 'Lisa Wang'],
        budget: 125000,
        tools_needed: ['OpenAI API', 'Dialogflow', 'AWS Lambda', 'MongoDB', 'React Native', 'Node.js'],
        dependencies: ['API Integration', 'Database Setup', 'UI/UX Design', 'Testing Framework'],
        risks: ['API Rate Limits', 'Data Privacy Compliance', 'Integration Complexity', 'User Adoption'],
        success_criteria: ['95% Customer Satisfaction', 'Response Time < 2s', '24/7 Availability', 'Multi-language Support'],
        priority: 'high',
        progress: 68,
        total_tasks: 25,
        completed_tasks: 17,
        days_left: 45
      }
    };

    const mockProject2: Project = {
      id: 'mock-project-2',
      user_id: 'mock-user',
      name: 'Mobile E-commerce Platform',
      description: 'Cross-platform mobile application for online shopping with advanced features like AR try-on, personalized recommendations, and seamless payment integration.',
      status: 'completed',
      created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        image: images.projectImage,
        logo: images.logo4,
        members: [
          images.user2,
          images.user3,
          images.user6
        ],
        end_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        category_id: '2',
        owner: 'Alex Thompson',
        edc_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        fud_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        team_members: ['Alex Thompson', 'Maria Garcia', 'James Wilson'],
        budget: 85000,
        tools_needed: ['React Native', 'Firebase', 'Stripe API', 'AR Kit', 'Redux'],
        dependencies: ['Payment Gateway', 'AR Framework', 'Backend API'],
        risks: ['Payment Security', 'AR Performance', 'Cross-platform Compatibility'],
        success_criteria: ['App Store Rating > 4.5', 'Conversion Rate > 3%', 'Load Time < 3s'],
        priority: 'medium',
        progress: 100,
        total_tasks: 32,
        completed_tasks: 32,
        days_left: 0
      }
    };

    const mockProject3: Project = {
      id: 'mock-project-3',
      user_id: 'mock-user',
      name: 'Data Analytics Dashboard',
      description: 'Real-time business intelligence dashboard with interactive charts, KPI tracking, and automated reporting for executive decision making.',
      status: 'archived',
      created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        image: images.projectImage,
        logo: images.logo3,
        members: [
          images.user1,
          images.user4,
          images.user5,
          images.user6
        ],
        end_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        category_id: '3',
        owner: 'Robert Chen',
        edc_date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        fud_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        team_members: ['Robert Chen', 'Jennifer Lee', 'Michael Brown', 'Anna Davis'],
        budget: 95000,
        tools_needed: ['D3.js', 'Python', 'PostgreSQL', 'Docker', 'Tableau'],
        dependencies: ['Data Pipeline', 'ETL Process', 'Security Audit'],
        risks: ['Data Quality', 'Performance Issues', 'User Training'],
        success_criteria: ['Real-time Updates', 'Sub-second Query Response', 'Mobile Responsive'],
        priority: 'low',
        progress: 85,
        total_tasks: 20,
        completed_tasks: 17,
        days_left: 0
      }
    };

    return [mockProject1, mockProject2, mockProject3];
  }

  // Mock tasks method
  static getMockTasks(projectId: string): Task[] {
    if (projectId === 'mock-project-1') {
      return [
        {
          id: 'task-1-1',
          user_id: 'mock-user',
          project_id: 'mock-project-1',
          title: 'Design AI Conversation Flow',
          description: 'Create comprehensive conversation flow diagrams for customer support scenarios including greeting, problem identification, solution provision, and escalation paths.',
          status: 'completed',
          priority: 'high',
          due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            participants: ['Sarah Johnson', 'Mike Chen'],
            comments: 8,
            attachments: 3,
            section: 'Planning'
          }
        },
        {
          id: 'task-1-2',
          user_id: 'mock-user',
          project_id: 'mock-project-1',
          title: 'Implement Natural Language Processing',
          description: 'Integrate OpenAI GPT-4 API for natural language understanding and response generation with context awareness and sentiment analysis.',
          status: 'in_progress',
          priority: 'high',
          due_date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            participants: ['Emily Rodriguez', 'David Kim'],
            comments: 15,
            attachments: 7,
            section: 'Development'
          }
        },
        {
          id: 'task-1-3',
          user_id: 'mock-user',
          project_id: 'mock-project-1',
          title: 'Setup Database Schema',
          description: 'Design and implement MongoDB collections for storing conversation history, user preferences, and knowledge base articles.',
          status: 'completed',
          priority: 'medium',
          due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            participants: ['Lisa Wang'],
            comments: 5,
            attachments: 2,
            section: 'Backend'
          }
        },
        {
          id: 'task-1-4',
          user_id: 'mock-user',
          project_id: 'mock-project-1',
          title: 'Create Admin Dashboard',
          description: 'Build comprehensive admin interface for monitoring conversations, managing knowledge base, and analyzing customer satisfaction metrics.',
          status: 'todo',
          priority: 'medium',
          due_date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            participants: ['Sarah Johnson', 'Mike Chen'],
            comments: 3,
            attachments: 1,
            section: 'Frontend'
          }
        },
        {
          id: 'task-1-5',
          user_id: 'mock-user',
          project_id: 'mock-project-1',
          title: 'Implement Multi-language Support',
          description: 'Add support for Spanish, French, German, and Chinese languages with automatic language detection and translation capabilities.',
          status: 'todo',
          priority: 'low',
          due_date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            participants: ['Emily Rodriguez'],
            comments: 2,
            attachments: 0,
            section: 'Features'
          }
        }
      ];
    } else if (projectId === 'mock-project-2') {
      return [
        {
          id: 'task-2-1',
          user_id: 'mock-user',
          project_id: 'mock-project-2',
          title: 'Design Mobile UI/UX',
          description: 'Create intuitive and modern mobile interface designs for iOS and Android platforms with focus on user experience and accessibility.',
          status: 'completed',
          priority: 'high',
          due_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            participants: ['Alex Thompson', 'Maria Garcia'],
            comments: 12,
            attachments: 15,
            section: 'Design'
          }
        },
        {
          id: 'task-2-2',
          user_id: 'mock-user',
          project_id: 'mock-project-2',
          title: 'Implement AR Try-On Feature',
          description: 'Develop augmented reality functionality for virtual product try-on using ARKit and ARCore technologies.',
          status: 'completed',
          priority: 'high',
          due_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            participants: ['James Wilson'],
            comments: 25,
            attachments: 8,
            section: 'Development'
          }
        },
        {
          id: 'task-2-3',
          user_id: 'mock-user',
          project_id: 'mock-project-2',
          title: 'Payment Integration',
          description: 'Integrate Stripe payment gateway with support for multiple payment methods including credit cards, PayPal, and Apple Pay.',
          status: 'completed',
          priority: 'high',
          due_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            participants: ['Alex Thompson', 'Maria Garcia'],
            comments: 18,
            attachments: 4,
            section: 'Backend'
          }
        }
      ];
    } else if (projectId === 'mock-project-3') {
      return [
        {
          id: 'task-3-1',
          user_id: 'mock-user',
          project_id: 'mock-project-3',
          title: 'Data Pipeline Architecture',
          description: 'Design and implement ETL pipeline for processing large volumes of business data from multiple sources including CRM, ERP, and external APIs.',
          status: 'completed',
          priority: 'high',
          due_date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            participants: ['Robert Chen', 'Jennifer Lee'],
            comments: 22,
            attachments: 6,
            section: 'Architecture'
          }
        },
        {
          id: 'task-3-2',
          user_id: 'mock-user',
          project_id: 'mock-project-3',
          title: 'Interactive Dashboard Development',
          description: 'Build responsive dashboard with D3.js charts, real-time data updates, and customizable KPI widgets for executive reporting.',
          status: 'completed',
          priority: 'high',
          due_date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            participants: ['Michael Brown', 'Anna Davis'],
            comments: 35,
            attachments: 12,
            section: 'Frontend'
          }
        },
        {
          id: 'task-3-3',
          user_id: 'mock-user',
          project_id: 'mock-project-3',
          title: 'Performance Optimization',
          description: 'Optimize database queries and implement caching strategies to achieve sub-second response times for complex analytical queries.',
          status: 'in_progress',
          priority: 'medium',
          due_date: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            participants: ['Robert Chen'],
            comments: 8,
            attachments: 3,
            section: 'Optimization'
          }
        }
      ];
    }
    
    return [];
  }

  // Get all projects for a user with optimized performance
  static async getProjects(userId?: string): Promise<Project[]> {
    if (!userId) {
      return this.getMockProjects();
    }

    try {
      // Use the optimized function with stats
      const { data, error } = await supabase.rpc('get_user_projects_with_stats', { 
        p_user_id: userId 
      });

      if (error) {
        console.log('Database error, returning mock data:', error);
        return this.getMockProjects();
      }

      return data || this.getMockProjects();
    } catch (error) {
      console.log('Database error, returning mock data:', error);
      return this.getMockProjects();
    }
  }

  // Get a specific project by ID
  static async getProject(projectId: string): Promise<Project | null> {
    // If it's a mock ID, return mock data directly
    if (this.isMockId(projectId)) {
      const mockProjects = this.getMockProjects();
      return mockProjects.find(p => p.id === projectId) || null;
    }

    // Always return mock data for now since database permissions aren't set up
    const mockProjects = this.getMockProjects();
    return mockProjects.find(p => p.id === projectId) || null;

    // Commented out database logic until permissions are fixed
    /*
    const dbAvailable = await this.checkDatabaseAvailability();
    if (!dbAvailable) {
      const mockProjects = this.getMockProjects();
      return mockProjects.find(p => p.id === projectId) || null;
    }

    // Don't try database query for invalid UUIDs
    if (!this.isValidUUID(projectId)) {
      const mockProjects = this.getMockProjects();
      return mockProjects.find(p => p.id === projectId) || null;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        console.log('Database error, returning mock project:', error);
        const mockProjects = this.getMockProjects();
        return mockProjects.find(p => p.id === projectId) || null;
      }

      return data;
    } catch (error) {
      console.log('Database error, returning mock project:', error);
      const mockProjects = this.getMockProjects();
      return mockProjects.find(p => p.id === projectId) || null;
    }
    */
  }

  // Create a new project
  static async createProject(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    // Always create mock project for now
    const mockProject: Project = {
      ...project,
      id: `mock-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    return mockProject;

    // Commented out database logic until permissions are fixed
    /*
    const dbAvailable = await this.checkDatabaseAvailability();
    if (!dbAvailable) {
      const mockProject: Project = {
        ...project,
        id: `mock-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return mockProject;
    }

    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          ...project,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.log('Database error creating project:', error);
        const mockProject: Project = {
          ...project,
          id: `mock-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        return mockProject;
      }

      return data;
    } catch (error) {
      console.log('Database error creating project:', error);
      const mockProject: Project = {
        ...project,
        id: `mock-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return mockProject;
    }
    */
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

    // Always return mock data for now
    const mockProjects = this.getMockProjects();
    const mockProject = mockProjects.find(p => p.id === projectId);
    if (mockProject) {
      return { ...mockProject, ...updates, updated_at: new Date().toISOString() };
    }
    return null;

    // Commented out database logic until permissions are fixed
    /*
    const dbAvailable = await this.checkDatabaseAvailability();
    if (!dbAvailable || !this.isValidUUID(projectId)) {
      const mockProjects = this.getMockProjects();
      const mockProject = mockProjects.find(p => p.id === projectId);
      if (mockProject) {
        return { ...mockProject, ...updates, updated_at: new Date().toISOString() };
      }
      return null;
    }

    try {
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
        console.log('Error updating project:', error);
        const mockProjects = this.getMockProjects();
        const mockProject = mockProjects.find(p => p.id === projectId);
        if (mockProject) {
          return { ...mockProject, ...updates, updated_at: new Date().toISOString() };
        }
        return null;
      }

      return data;
    } catch (error) {
      console.log('Error updating project:', error);
      const mockProjects = this.getMockProjects();
      const mockProject = mockProjects.find(p => p.id === projectId);
      if (mockProject) {
        return { ...mockProject, ...updates, updated_at: new Date().toISOString() };
      }
      return null;
    }
    */
  }

  // Delete a project
  static async deleteProject(projectId: string): Promise<boolean> {
    // For mock projects, always return true
    if (this.isMockId(projectId)) {
      return true;
    }

    // Always return true for now
    return true;

    // Commented out database logic until permissions are fixed
    /*
    const dbAvailable = await this.checkDatabaseAvailability();
    if (!dbAvailable || !this.isValidUUID(projectId)) {
      return false;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        console.log('Error deleting project:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.log('Error deleting project:', error);
      return false;
    }
    */
  }

  // Get tasks for a project
  static async getProjectTasks(projectId: string): Promise<Task[]> {
    // Always return mock tasks for now
    return this.getMockTasks(projectId);

    // Commented out database logic until permissions are fixed
    /*
    const dbAvailable = await this.checkDatabaseAvailability();
    if (!dbAvailable || !this.isValidUUID(projectId)) {
      return this.getMockTasks(projectId);
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Database error, returning mock tasks:', error);
        return this.getMockTasks(projectId);
      }

      return data || this.getMockTasks(projectId);
    } catch (error) {
      console.log('Database error, returning mock tasks:', error);
      return this.getMockTasks(projectId);
    }
    */
  }

  // Utility methods
  static calculateProjectProgress(tasks: Task[]): { completed: number; total: number; percentage: number } {
    const total = tasks.length;
    const completed = tasks.filter(task => task.status === 'completed').length;
    const percentage = total > 0 ? completed / total : 0;
    
    return { completed, total, percentage };
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
        const mockTasks = this.getMockTasks('mock-project-1');
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
} 