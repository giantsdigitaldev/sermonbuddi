import ProjectCard from '@/components/ProjectCard';
import { COLORS, icons, images, SIZES } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { categories } from '@/data';
import { useRoutePredictiveCache } from '@/hooks/usePredictiveCache';
import { useTheme } from '@/theme/ThemeProvider';
import { cacheService } from '@/utils/cacheService';
import { Project, ProjectService } from '@/utils/projectService';
import { supabase } from '@/utils/supabase';
import { NavigationProp } from '@react-navigation/native';
import { useFocusEffect, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, ImageSourcePropType, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-virtualized-view';

interface Category {
  id: string;
  name: string;
}

const ProjectPage = () => {
  const { dark, colors } = useTheme();
  const { user } = useAuth(); // Get current user from auth context
  const navigation = useNavigation<NavigationProp<any>>();
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["1"]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 🚀 PREDICTIVE CACHE: Track projects page behavior
  useRoutePredictiveCache('projects');

  // 🚀 OPTIMIZED: Load projects with instant caching
  const loadProjects = useCallback(async (forceRefresh = false) => {
    if (!user?.id) {
      console.log('No user ID available, using mock data');
      setProjects(ProjectService.getMockProjects());
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Use optimized caching service for instant loading
      const projectsData = await cacheService.get(
        `user_projects:${user.id}`,
        async () => {
          console.log('🔄 Loading projects from database with optimization...');
          
          // Try the optimized database function first
          const { data, error } = await supabase.rpc('get_user_projects_with_stats', { 
            p_user_id: user.id 
          });

          if (error) {
            console.log('Optimized query failed, falling back to regular query:', error);
            // Fallback to regular ProjectService
            return await ProjectService.getProjects(user.id);
          }

          console.log('✅ Optimized projects loaded:', data?.length || 0);
          return data ? (data as Project[]) : [];
        },
        { 
          forceRefresh,
          ttl: 5 * 60 * 1000 // 5 minutes cache
        }
      );

      setProjects(projectsData || []);
      
      // Log cache performance
      const stats = cacheService.getStats();
      console.log('📊 Cache Performance:', {
        hitRate: `${stats.hitRate.toFixed(1)}%`,
        totalOperations: stats.hits + stats.misses
      });
      
    } catch (error) {
      console.error('Error loading projects:', error);
      Alert.alert('Error', 'Failed to load projects');
      // Fallback to mock data
      setProjects(ProjectService.getMockProjects());
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // 🚀 OPTIMIZED: Refresh with cache invalidation
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProjects(true); // Force refresh bypasses cache
    setRefreshing(false);
  }, [loadProjects]);

  // Load projects on component mount and when screen is focused
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  useFocusEffect(
    useCallback(() => {
      // Simple refresh on focus for now
      const shouldRefresh = async () => {
        if (!user?.id) return;
        
        console.log('🔄 Refreshing projects on focus...');
        loadProjects();
      };
      
      shouldRefresh();
    }, [loadProjects, user?.id])
  );

  // Filter projects based on selected categories
  const filteredProjects = useMemo(() => {
    if (selectedCategories.length === 0) return projects;
    
    return projects.filter(project => {
      const categoryId = project.metadata?.category_id || "1";
      return selectedCategories.includes(categoryId);
    });
  }, [selectedCategories, projects]);

  // Handle project card press
  const handleProjectPress = (project: Project) => {
    navigation.navigate("projectdetails", { projectId: project.id });
  };

  // 🚀 OPTIMIZED: Handle project edit with smart cache invalidation
  const handleProjectEdit = async (project: Project, field: string, value: any) => {
    try {
      let updatedProject: Partial<Project>;
      
      if (field === 'name' || field === 'description' || field === 'status') {
        updatedProject = { [field]: value };
      } else {
        // Update metadata field
        updatedProject = {
          metadata: {
            ...project.metadata,
            [field]: value
          }
        };
      }

      const result = await ProjectService.updateProject(project.id, updatedProject);
      if (result) {
        // Update local state immediately
        setProjects(prev => prev.map(p => p.id === project.id ? { ...p, ...updatedProject } : p));
        
        // 🚀 Smart cache invalidation - invalidate related caches
        if (user?.id) {
          await cacheService.invalidate(`user_projects:${user.id}`);
          await cacheService.invalidate(`project_details:${project.id}`);
          await cacheService.invalidate(`dashboard_stats:${user.id}`);
          console.log('🗑️ Cache invalidated after project update');
        }
      } else {
        Alert.alert('Error', 'Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      Alert.alert('Error', 'Failed to update project');
    }
  };

  // 🚀 OPTIMIZED: Handle project delete with cache invalidation
  const handleProjectDelete = async (projectId: string) => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await ProjectService.deleteProject(projectId);
              if (success) {
                // Update local state immediately
                setProjects(prev => prev.filter(p => p.id !== projectId));
                
                // 🚀 Smart cache invalidation
                if (user?.id) {
                  await cacheService.invalidate(`user_projects:${user.id}`);
                  await cacheService.invalidate(`project_details:${projectId}`);
                  await cacheService.invalidate(`dashboard_stats:${user.id}`);
                  console.log('🗑️ Cache invalidated after project deletion');
                }
              } else {
                Alert.alert('Error', 'Failed to delete project');
              }
            } catch (error) {
              console.error('Error deleting project:', error);
              Alert.alert('Error', 'Failed to delete project');
            }
          }
        }
      ]
    );
  };

  // Category item
  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={{
        backgroundColor: selectedCategories.includes(item.id) ? COLORS.primary : "transparent",
        padding: 10,
        marginVertical: 5,
        borderColor: COLORS.primary,
        borderWidth: 1.3,
        borderRadius: 24,
        marginRight: 12,
      }}
      onPress={() => toggleCategory(item.id)}>
      <Text style={{ color: selectedCategories.includes(item.id) ? COLORS.white : COLORS.primary }}>
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    const updatedCategories = [...selectedCategories];
    const index = updatedCategories.indexOf(categoryId);

    if (index === -1) {
      updatedCategories.push(categoryId);
    } else {
      updatedCategories.splice(index, 1);
    }

    setSelectedCategories(updatedCategories);
  };

  /**
  * Render header
  */
  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}>
            <Image
              source={images.logo as ImageSourcePropType}
              resizeMode='contain'
              style={[styles.backIcon, {
                tintColor: COLORS.primary
              }]}
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {
            color: dark ? COLORS.white : COLORS.greyscale900
          }]}>
            My Projects ({projects.length}) {user?.id ? '⚡' : '🔄'}
          </Text>
        </View>
        <View style={styles.viewContainer}>
          <TouchableOpacity onPress={() => navigation.navigate("search")}>
            <Image
              source={icons.search as ImageSourcePropType}
              resizeMode='contain'
              style={[styles.imageIcon, {
                tintColor: dark ? COLORS.white : COLORS.greyscale900
              }]}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate("addnewproject")}>
            <Image
              source={icons.plus as ImageSourcePropType}
              resizeMode='contain'
              style={[styles.moreIcon, {
                tintColor: COLORS.primary
              }]}
            />
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  /**
   * render content
   */
  const renderContent = () => {
    if (loading && projects.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
            Loading projects...
          </Text>
        </View>
      );
    }

    if (projects.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Image
            source={icons.document2}
            style={[styles.emptyIcon, { tintColor: dark ? COLORS.gray : COLORS.gray }]}
          />
          <Text style={[styles.emptyTitle, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
            No Projects Yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: dark ? COLORS.gray : COLORS.gray }]}>
            Create your first project to get started
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate("addnewproject")}
          >
            <Text style={styles.createButtonText}>Create Project</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View>
        <FlatList
          data={categories}
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          horizontal
          renderItem={renderCategoryItem}
        />
        <FlatList
          data={filteredProjects}
          keyExtractor={item => item.id}
          style={{ marginVertical: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          renderItem={({ item }) => {
            // Calculate project metrics
            const totalTasks = item.metadata?.total_tasks || 0;
            const completedTasks = item.metadata?.completed_tasks || 0;
            const daysLeft = item.metadata?.days_left || 
              (item.metadata?.end_date ? ProjectService.calculateDaysLeft(item.metadata.end_date) : 0);

            return (
              <ProjectCard
                id={item.id}
                name={item.name}
                description={item.description}
                image={item.metadata?.image || images.projectImage}
                status={item.status}
                numberOfTask={totalTasks}
                numberOfTaskCompleted={completedTasks}
                numberOfDaysLeft={daysLeft}
                logo={item.metadata?.logo || images.logo5}
                members={item.metadata?.members || []}
                endDate={item.metadata?.end_date || new Date().toISOString()}
                onPress={() => handleProjectPress(item)}
                onEdit={(field, value) => handleProjectEdit(item, field, value)}
                onDelete={() => handleProjectDelete(item.id)}
                customStyles={{
                  card: {
                    width: SIZES.width - 32
                  }
                }}
              />
            );
          }}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyTitle, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                No projects found
              </Text>
              <Text style={[styles.emptySubtitle, { color: dark ? COLORS.gray : COLORS.gray }]}>
                Try adjusting your category filters
              </Text>
            </View>
          )}
        />
      </View>
    )
  }

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: dark ? COLORS.dark1 : COLORS.tertiaryWhite }]}>
      <View style={[styles.container, { backgroundColor: dark ? COLORS.dark1 : COLORS.tertiaryWhite }]}>
        {renderHeader()}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        >
          {renderContent()}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.white
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 16
  },
  headerContainer: {
    flexDirection: "row",
    width: SIZES.width - 32,
    justifyContent: "space-between",
    marginBottom: 16
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  backIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.black
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'bold',
    color: COLORS.black,
    marginLeft: 16
  },
  viewContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  moreIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.black,
    marginLeft: 12
  },
  imageIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'regular'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50
  },
  emptyIcon: {
    width: 64,
    height: 64,
    marginBottom: 16
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'bold',
    marginBottom: 8
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'regular',
    textAlign: 'center',
    marginBottom: 24
  },
  createButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  createButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'semiBold'
  }
});

export default ProjectPage;