import { CachedDataService, cacheService } from './cacheService';
import { Project, ProjectService } from './projectService';
import { supabase } from './supabase';

export class CachedProjectService {
  
  /**
   * Get user projects with instant loading
   */
  static async getProjects(userId: string, forceRefresh = false): Promise<Project[]> {
    return cacheService.get(
      `user_projects:${userId}`,
      async () => {
        // Use the optimized database function
        const { data, error } = await supabase.rpc('get_user_projects_with_stats', { 
          p_user_id: userId 
        });

        if (error) {
          console.log('Database error, returning mock data:', error);
          return ProjectService.getMockProjects();
        }

        // Ensure we return a valid Project array
        return data ? (data as Project[]) : ProjectService.getMockProjects();
      },
      { forceRefresh }
    );
  }

  /**
   * Get project details with caching
   */
  static async getProject(projectId: string, forceRefresh = false): Promise<Project | null> {
    return cacheService.get(
      `project_details:${projectId}`,
      async () => {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .single();

        if (error) {
          console.log('Database error:', error);
          // Fallback to ProjectService method
          return ProjectService.getProject(projectId);
        }

        return data as Project;
      },
      { forceRefresh }
    );
  }

  /**
   * Create project with smart cache invalidation
   */
  static async createProject(
    project: Omit<Project, 'id' | 'created_at' | 'updated_at'>, 
    userId: string
  ): Promise<Project> {
    try {
      // Create in database
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          ...project,
          user_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Smart cache invalidation and refresh
      await CachedDataService.invalidateAfterMutation('create', 'project', data.id, userId);
      
      return data as Project;
    } catch (error) {
      console.log('Database error creating project:', error);
      // Fallback to original service
      return ProjectService.createProject(project);
    }
  }

  /**
   * Update project with cache invalidation
   */
  static async updateProject(
    projectId: string, 
    updates: Partial<Project>, 
    userId: string
  ): Promise<Project | null> {
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

      if (error) throw error;

      // Smart cache invalidation
      await CachedDataService.invalidateAfterMutation('update', 'project', projectId, userId);
      
      return data as Project;
    } catch (error) {
      console.log('Error updating project:', error);
      return ProjectService.updateProject(projectId, updates);
    }
  }

  /**
   * Get dashboard stats with instant loading
   */
  static async getDashboardStats(userId: string, forceRefresh = false) {
    return cacheService.get(
      `dashboard_stats:${userId}`,
      async () => {
        // Query the materialized view for instant results
        const { data, error } = await supabase
          .from('user_dashboard_stats')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) {
          console.log('Dashboard stats error:', error);
          // Return mock stats
          return {
            user_id: userId,
            total_projects: 0,
            active_projects: 0,
            completed_projects: 0,
            total_tasks: 0,
            completed_tasks: 0,
            pending_tasks: 0,
            overdue_tasks: 0,
            total_conversations: 0,
            total_messages: 0
          };
        }

        return data;
      },
      { forceRefresh, ttl: 15 * 60 * 1000 } // 15 minutes TTL
    );
  }

  /**
   * Search projects with caching
   */
  static async searchProjects(userId: string, query: string): Promise<Project[]> {
    return cacheService.get(
      `search_projects:${userId}:${query}`,
      async () => {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', userId)
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .order('updated_at', { ascending: false });

        if (error) {
          console.log('Search error:', error);
          return ProjectService.searchProjects(query);
        }

        return data ? (data as Project[]) : [];
      },
      { ttl: 2 * 60 * 1000 } // 2 minutes TTL for search
    );
  }

  /**
   * Get recent user data
   */
  static async getRecentData(userId: string, days = 30) {
    return cacheService.get(
      `recent_data:${userId}:${days}`,
      async () => {
        const { data, error } = await supabase.rpc('get_recent_user_data', {
          p_user_id: userId,
          p_days: days
        });

        if (error) {
          console.log('Recent data error:', error);
          return {
            recent_projects: 0,
            recent_tasks: 0,
            recent_messages: 0,
            overdue_tasks: 0
          };
        }

        return data?.[0] || {
          recent_projects: 0,
          recent_tasks: 0,
          recent_messages: 0,
          overdue_tasks: 0
        };
      },
      { ttl: 10 * 60 * 1000 } // 10 minutes TTL
    );
  }

  /**
   * Warm cache for user
   */
  static async warmCache(userId: string): Promise<void> {
    await Promise.allSettled([
      this.getProjects(userId),
      this.getDashboardStats(userId),
      this.getRecentData(userId)
    ]);
  }

  /**
   * Background refresh for user data
   */
  static async backgroundRefresh(userId: string): Promise<void> {
    // Refresh data in background without blocking UI
    Promise.allSettled([
      this.getProjects(userId, true),
      this.getDashboardStats(userId, true),
      this.getRecentData(userId, true)
    ]).then(() => {
      console.log('🔄 Background refresh completed for projects');
    });
  }
} 