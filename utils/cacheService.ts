import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  version: string;
}

interface CacheConfig {
  maxMemoryItems: number;
  defaultTTL: number;
  persistToStorage: boolean;
  compressionEnabled: boolean;
}

class CacheService {
  private memoryCache = new Map<string, CacheItem<any>>();
  private cacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    evictions: 0
  };

  private config: CacheConfig = {
    maxMemoryItems: 1000,
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    persistToStorage: true,
    compressionEnabled: true
  };

  // Cache TTL configurations for different data types
  private cacheTTLs = {
    user_profile: 30 * 60 * 1000,      // 30 minutes
    user_projects: 5 * 60 * 1000,       // 5 minutes
    project_details: 10 * 60 * 1000,    // 10 minutes
    project_tasks: 2 * 60 * 1000,       // 2 minutes
    chat_conversations: 10 * 60 * 1000, // 10 minutes
    chat_messages: 30 * 60 * 1000,      // 30 minutes
    dashboard_stats: 15 * 60 * 1000,    // 15 minutes
    search_results: 2 * 60 * 1000,      // 2 minutes
    user_files: 10 * 60 * 1000,         // 10 minutes
  };

  private currentVersion = '1.0.0';

  /**
   * Get data from cache with fallback to async loader
   */
  async get<T>(
    key: string, 
    loader?: () => Promise<T>,
    options?: { ttl?: number; forceRefresh?: boolean }
  ): Promise<T | null> {
    const cacheKey = this.generateCacheKey(key);
    
    // Force refresh bypasses cache
    if (options?.forceRefresh) {
      if (loader) {
        const data = await loader();
        await this.set(key, data, options.ttl);
        return data;
      }
      return null;
    }

    // Try memory cache first
    const memoryItem = this.memoryCache.get(cacheKey);
    if (memoryItem && this.isValid(memoryItem)) {
      this.cacheStats.hits++;
      return memoryItem.data;
    }

    // Try persistent storage
    if (this.config.persistToStorage) {
      const persistedItem = await this.getFromStorage<T>(cacheKey);
      if (persistedItem && this.isValid(persistedItem)) {
        // Restore to memory cache
        this.memoryCache.set(cacheKey, persistedItem);
        this.cacheStats.hits++;
        return persistedItem.data;
      }
    }

    // Cache miss - use loader if provided
    this.cacheStats.misses++;
    if (loader) {
      try {
        const data = await loader();
        await this.set(key, data, options?.ttl);
        return data;
      } catch (error) {
        console.error('Cache loader failed:', error);
        return null;
      }
    }

    return null;
  }

  /**
   * Set data in cache
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const cacheKey = this.generateCacheKey(key);
    const effectiveTTL = ttl || this.getTTL(key);
    
    const cacheItem: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: effectiveTTL,
      version: this.currentVersion
    };

    // Set in memory cache
    this.memoryCache.set(cacheKey, cacheItem);
    this.cacheStats.sets++;

    // Persist to storage if enabled
    if (this.config.persistToStorage) {
      await this.setToStorage(cacheKey, cacheItem);
    }

    // Cleanup if memory cache is too large
    if (this.memoryCache.size > this.config.maxMemoryItems) {
      this.evictOldest();
    }
  }

  /**
   * Invalidate cache entries
   */
  async invalidate(pattern: string): Promise<void> {
    const keys = Array.from(this.memoryCache.keys()).filter(key => 
      key.includes(pattern)
    );

    for (const key of keys) {
      this.memoryCache.delete(key);
      if (this.config.persistToStorage) {
        await this.removeFromStorage(key);
      }
    }
  }

  /**
   * Warm cache with frequently accessed data
   */
  async warmCache(userId: string): Promise<void> {
    console.log('🔥 Warming cache for user:', userId);

    const warmupTasks = [
      // Warm user profile
      this.get(`user_profile:${userId}`, async () => {
        // This would call your supabase query
        return null; // Implement actual loader
      }),

      // Warm recent projects
      this.get(`user_projects:${userId}`, async () => {
        return null; // Implement actual loader
      }),

      // Warm dashboard stats
      this.get(`dashboard_stats:${userId}`, async () => {
        return null; // Implement actual loader
      }),

      // Warm recent conversations
      this.get(`chat_conversations:${userId}`, async () => {
        return null; // Implement actual loader
      }),
    ];

    try {
      await Promise.allSettled(warmupTasks);
      console.log('✅ Cache warmed successfully');
    } catch (error) {
      console.warn('⚠️ Cache warming failed:', error);
    }
  }

  /**
   * Smart cache invalidation based on data relationships
   */
  async invalidateRelated(entityType: string, entityId: string): Promise<void> {
    const invalidationMap: Record<string, string[]> = {
      project: [
        `project_details:${entityId}`,
        `project_tasks:${entityId}`,
        'user_projects:',
        'dashboard_stats:',
        'project_activity:'
      ],
      task: [
        'project_tasks:',
        'user_tasks:',
        'dashboard_stats:',
        'project_activity:'
      ],
      conversation: [
        'chat_conversations:',
        'dashboard_stats:'
      ],
      message: [
        `chat_messages:${entityId}`,
        'chat_conversations:',
        'dashboard_stats:'
      ]
    };

    const patterns = invalidationMap[entityType] || [];
    for (const pattern of patterns) {
      await this.invalidate(pattern);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const hitRate = this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100;
    
    return {
      ...this.cacheStats,
      hitRate: isNaN(hitRate) ? 0 : hitRate,
      memorySize: this.memoryCache.size,
      memoryLimit: this.config.maxMemoryItems
    };
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    this.memoryCache.clear();
    
    if (this.config.persistToStorage) {
      try {
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(key => key.startsWith('cache:'));
        await AsyncStorage.multiRemove(cacheKeys);
      } catch (error) {
        console.error('Failed to clear persistent cache:', error);
      }
    }

    this.cacheStats = { hits: 0, misses: 0, sets: 0, evictions: 0 };
  }

  /**
   * Preload critical data for instant app startup
   */
  async preloadCriticalData(userId: string): Promise<void> {
    const criticalData = [
      `user_profile:${userId}`,
      `dashboard_stats:${userId}`,
      `user_projects:${userId}:recent`,
    ];

    const promises = criticalData.map(key => 
      this.get(key, undefined, { forceRefresh: false })
    );

    try {
      await Promise.allSettled(promises);
      console.log('✅ Critical data preloaded');
    } catch (error) {
      console.warn('⚠️ Critical data preload failed:', error);
    }
  }

  // Private methods

  private generateCacheKey(key: string): string {
    return `cache:${key}`;
  }

  private getTTL(key: string): number {
    for (const [type, ttl] of Object.entries(this.cacheTTLs)) {
      if (key.includes(type)) {
        return ttl;
      }
    }
    return this.config.defaultTTL;
  }

  private isValid<T>(item: CacheItem<T>): boolean {
    if (item.version !== this.currentVersion) {
      return false;
    }
    
    return (Date.now() - item.timestamp) < item.ttl;
  }

  private async getFromStorage<T>(key: string): Promise<CacheItem<T> | null> {
    try {
      const stored = await AsyncStorage.getItem(key);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      return parsed as CacheItem<T>;
    } catch (error) {
      console.warn('Failed to get from storage:', error);
      return null;
    }
  }

  private async setToStorage<T>(key: string, item: CacheItem<T>): Promise<void> {
    try {
      const serialized = JSON.stringify(item);
      await AsyncStorage.setItem(key, serialized);
    } catch (error) {
      console.warn('Failed to set to storage:', error);
    }
  }

  private async removeFromStorage(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn('Failed to remove from storage:', error);
    }
  }

  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.memoryCache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.memoryCache.delete(oldestKey);
      this.cacheStats.evictions++;
    }
  }
}

// Create singleton instance
export const cacheService = new CacheService();

// Cache-aware data fetching utilities
export class CachedDataService {
  
  /**
   * Get user profile with caching
   */
  static async getUserProfile(userId: string, forceRefresh = false) {
    return cacheService.get(
      `user_profile:${userId}`,
      async () => {
        // Call your Supabase function here
        // const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
        // return data;
        return null; // Implement actual query
      },
      { forceRefresh }
    );
  }

  /**
   * Get user projects with caching
   */
  static async getUserProjects(userId: string, forceRefresh = false) {
    return cacheService.get(
      `user_projects:${userId}`,
      async () => {
        // Call your optimized Supabase function
        // const { data } = await supabase.rpc('get_user_projects_with_stats', { p_user_id: userId });
        // return data;
        return null; // Implement actual query
      },
      { forceRefresh }
    );
  }

  /**
   * Get project details with caching
   */
  static async getProjectDetails(projectId: string, forceRefresh = false) {
    return cacheService.get(
      `project_details:${projectId}`,
      async () => {
        // Call your Supabase query here
        return null; // Implement actual query
      },
      { forceRefresh }
    );
  }

  /**
   * Get chat conversations with caching
   */
  static async getChatConversations(userId: string, forceRefresh = false) {
    return cacheService.get(
      `chat_conversations:${userId}`,
      async () => {
        // Call your optimized Supabase function
        // const { data } = await supabase.rpc('get_user_conversations_with_counts', { p_user_id: userId });
        // return data;
        return null; // Implement actual query
      },
      { forceRefresh }
    );
  }

  /**
   * Get dashboard stats with caching
   */
  static async getDashboardStats(userId: string, forceRefresh = false) {
    return cacheService.get(
      `dashboard_stats:${userId}`,
      async () => {
        // Query materialized view for instant results
        // const { data } = await supabase.from('user_dashboard_stats').select('*').eq('user_id', userId).single();
        // return data;
        return null; // Implement actual query
      },
      { forceRefresh }
    );
  }

  /**
   * Smart cache invalidation after data mutations
   */
  static async invalidateAfterMutation(
    operation: 'create' | 'update' | 'delete',
    entityType: 'project' | 'task' | 'conversation' | 'message',
    entityId: string,
    userId: string
  ) {
    // Invalidate related cache entries
    await cacheService.invalidateRelated(entityType, entityId);
    
    // Warm critical data after mutation
    if (operation === 'create' || operation === 'update') {
      // Immediately refresh dashboard stats
      await this.getDashboardStats(userId, true);
      
      // Refresh user projects if project/task related
      if (entityType === 'project' || entityType === 'task') {
        await this.getUserProjects(userId, true);
      }
      
      // Refresh conversations if chat related
      if (entityType === 'conversation' || entityType === 'message') {
        await this.getChatConversations(userId, true);
      }
    }
  }

  /**
   * Background cache refresh
   */
  static async backgroundRefresh(userId: string) {
    // Refresh data in background without blocking UI
    const refreshTasks = [
      this.getUserProjects(userId, true),
      this.getDashboardStats(userId, true),
      this.getChatConversations(userId, true),
    ];

    Promise.allSettled(refreshTasks).then(() => {
      console.log('🔄 Background cache refresh completed');
    });
  }
}

// React Native Hook for cache-aware data fetching
export function useCachedData<T>(
  key: string,
  loader: () => Promise<T>,
  options?: { ttl?: number; forceRefresh?: boolean }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await cacheService.get(key, loader, options);
        
        if (isMounted) {
          setData(result);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to fetch data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [key, options?.forceRefresh]);

  const refresh = useCallback(async () => {
    const result = await cacheService.get(key, loader, { ...options, forceRefresh: true });
    setData(result);
  }, [key, loader, options]);

  return { data, loading, error, refresh };
}

// Auto-import for useState, useEffect, useCallback
import { useCallback, useEffect, useState } from 'react';
