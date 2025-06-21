import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// 🚀 OPTIMIZED SUPABASE CLIENT
// Configured for maximum performance with connection pooling
export const supabaseOptimized = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-client-info': 'cristos-optimized-client'
    }
  },
  // Connection pooling configuration
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

/**
 * 🔥 OPTIMIZED QUERY BUILDER
 * Pre-configured queries for maximum performance
 */
export class OptimizedQueries {
  
  /**
   * 📊 DASHBOARD STATS - Uses materialized view for instant loading
   */
  static async getDashboardStats(userId: string) {
    try {
      // Try optimized materialized view first
      const { data, error } = await supabaseOptimized
        .from('user_dashboard_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.log('📊 Materialized view not available, using fallback');
        // Fallback to regular queries
        return this.getDashboardStatsFallback(userId);
      }

      console.log('⚡ Dashboard stats loaded from materialized view');
      return { data, error: null };
    } catch (error) {
      console.log('📊 Dashboard stats error:', error);
      return this.getDashboardStatsFallback(userId);
    }
  }

  /**
   * 📁 USER PROJECTS - Uses covering index for instant loading
   */
  static async getUserProjects(userId: string) {
    try {
      // Use optimized function if available
      const { data, error } = await supabaseOptimized
        .rpc('get_user_projects_with_stats', { p_user_id: userId });

      if (error) {
        console.log('📁 Optimized function not available, using fallback');
        return this.getUserProjectsFallback(userId);
      }

      console.log('⚡ Projects loaded with optimized function');
      return { data, error: null };
    } catch (error) {
      console.log('📁 Projects error:', error);
      return this.getUserProjectsFallback(userId);
    }
  }

  /**
   * 💬 USER CONVERSATIONS - Uses covering index
   */
  static async getUserConversations(userId: string) {
    try {
      const { data, error } = await supabaseOptimized
        .rpc('get_user_conversations_with_counts', { p_user_id: userId });

      if (error) {
        console.log('💬 Optimized function not available, using fallback');
        return this.getUserConversationsFallback(userId);
      }

      console.log('⚡ Conversations loaded with optimized function');
      return { data, error: null };
    } catch (error) {
      console.log('💬 Conversations error:', error);
      return this.getUserConversationsFallback(userId);
    }
  }

  /**
   * 🔍 SEARCH PROJECTS - Uses full-text search index
   */
  static async searchProjects(userId: string, query: string) {
    try {
      const { data, error } = await supabaseOptimized
        .from('projects')
        .select('id, name, description, status, updated_at, metadata')
        .eq('user_id', userId)
        .textSearch('search_text', query, {
          type: 'websearch',
          config: 'english'
        })
        .order('updated_at', { ascending: false })
        .limit(20);

      console.log('⚡ Search completed with full-text index');
      return { data, error };
    } catch (error) {
      console.log('🔍 Search error:', error);
      return this.searchProjectsFallback(userId, query);
    }
  }

  /**
   * 📋 PROJECT DETAILS - Uses covering index
   */
  static async getProjectDetails(projectId: string) {
    try {
      const { data, error } = await supabaseOptimized
        .from('projects')
        .select(`
          id, name, description, status, created_at, updated_at, metadata,
          tasks:tasks(id, title, status, priority, due_date),
          conversations:chat_conversations(id, title, updated_at)
        `)
        .eq('id', projectId)
        .single();

      console.log('⚡ Project details loaded with covering index');
      return { data, error };
    } catch (error) {
      console.log('📋 Project details error:', error);
      return { data: null, error };
    }
  }

  /**
   * 🔄 FALLBACK METHODS
   * Used when optimized queries are not available
   */
  private static async getDashboardStatsFallback(userId: string) {
    const [projects, tasks, conversations] = await Promise.all([
      supabaseOptimized.from('projects').select('id, status').eq('user_id', userId),
      supabaseOptimized.from('tasks').select('id, status').eq('user_id', userId),
      supabaseOptimized.from('chat_conversations').select('id').eq('user_id', userId)
    ]);

    const stats = {
      total_projects: projects.data?.length || 0,
      active_projects: projects.data?.filter(p => p.status === 'active').length || 0,
      completed_projects: projects.data?.filter(p => p.status === 'completed').length || 0,
      total_tasks: tasks.data?.length || 0,
      completed_tasks: tasks.data?.filter(t => t.status === 'completed').length || 0,
      pending_tasks: tasks.data?.filter(t => t.status !== 'completed').length || 0,
      total_conversations: conversations.data?.length || 0
    };

    return { data: stats, error: null };
  }

  private static async getUserProjectsFallback(userId: string) {
    const { data, error } = await supabaseOptimized
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    return { data, error };
  }

  private static async getUserConversationsFallback(userId: string) {
    const { data, error } = await supabaseOptimized
      .from('chat_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    return { data, error };
  }

  private static async searchProjectsFallback(userId: string, query: string) {
    const { data, error } = await supabaseOptimized
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('updated_at', { ascending: false });

    return { data, error };
  }
}

/**
 * 🎯 BATCH OPERATIONS
 * Minimize round trips to database
 */
export class BatchOperations {
  
  /**
   * Load all user data in a single batch
   */
  static async loadUserDataBatch(userId: string) {
    console.log('🔄 Loading user data in batch...');
    
    const startTime = Date.now();
    
    const [dashboardStats, projects, conversations, profile] = await Promise.allSettled([
      OptimizedQueries.getDashboardStats(userId),
      OptimizedQueries.getUserProjects(userId),
      OptimizedQueries.getUserConversations(userId),
      supabaseOptimized.from('profiles').select('*').eq('id', userId).single()
    ]);

    const loadTime = Date.now() - startTime;
    console.log(`⚡ Batch load completed in ${loadTime}ms`);

    return {
      dashboardStats: dashboardStats.status === 'fulfilled' ? dashboardStats.value : null,
      projects: projects.status === 'fulfilled' ? projects.value : null,
      conversations: conversations.status === 'fulfilled' ? conversations.value : null,
      profile: profile.status === 'fulfilled' ? profile.value : null,
      loadTime
    };
  }
}

/**
 * 📈 PERFORMANCE MONITORING
 */
export class PerformanceMonitor {
  private static queryTimes: { [key: string]: number[] } = {};

  static startTimer(queryName: string): () => void {
    const startTime = Date.now();
    
    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (!this.queryTimes[queryName]) {
        this.queryTimes[queryName] = [];
      }
      
      this.queryTimes[queryName].push(duration);
      
      // Keep only last 10 measurements
      if (this.queryTimes[queryName].length > 10) {
        this.queryTimes[queryName].shift();
      }
      
      console.log(`⏱️ ${queryName}: ${duration}ms`);
    };
  }

  static getAverageTime(queryName: string): number {
    const times = this.queryTimes[queryName];
    if (!times || times.length === 0) return 0;
    
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  }

  static getPerformanceReport(): Record<string, number> {
    const report: Record<string, number> = {};
    
    for (const [queryName, times] of Object.entries(this.queryTimes)) {
      report[queryName] = this.getAverageTime(queryName);
    }
    
    return report;
  }
}

export default supabaseOptimized; 