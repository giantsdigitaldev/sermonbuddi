import OptimizedUserAvatar from '@/components/OptimizedUserAvatar';
import ProjectCard from '@/components/ProjectCard';
import SubHeaderItem from '@/components/SubHeaderItem';
import TaskCard from '@/components/TaskCard';
import { COLORS, icons, images, SIZES, WEB_INPUT_STYLES } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { todayTasks } from '@/data';
import { useRoutePredictiveCache } from '@/hooks/usePredictiveCache';
import { useTheme } from '@/theme/ThemeProvider';
import { Project, ProjectService } from '@/utils/projectService';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Transform database project to ProjectCard format
const transformProjectForCard = (project: Project) => {
  const metadata = project.metadata || {};
  const totalTasks = metadata.total_tasks || metadata.numberOfTask || 0;
  const completedTasks = metadata.completed_tasks || metadata.numberOfTaskCompleted || 0;
  const daysLeft = metadata.days_left || metadata.numberOfDaysLeft || 0;
  
  // Map database image references to actual images
  const getProjectImage = (coverImage: string) => {
    const imageMap: { [key: string]: any } = {
      'cover1.png': images.cover1,
      'cover2.png': images.cover2,
      'cover3.png': images.cover3,
      'cover4.png': images.cover4,
      'cover5.png': images.cover5,
      'cover6.png': images.cover6,
      'cover7.png': images.cover7,
    };
    return imageMap[coverImage] || images.cover1;
  };

  const getProjectLogo = (logoImage: string) => {
    const logoMap: { [key: string]: any } = {
      'logo1.png': images.logo1,
      'logo2.png': images.logo2,
      'logo3.png': images.logo3,
      'logo4.png': images.logo4,
      'logo5.png': images.logo5,
      'logo6.png': images.logo6,
      'logo7.png': images.logo7,
    };
    return logoMap[logoImage] || images.logo1;
  };

  // Get team member avatars
  const getTeamAvatars = (teamMembers: any[]) => {
    if (!teamMembers || !Array.isArray(teamMembers)) {
      return [images.user1, images.user2, images.user3]; // Default avatars
    }
    
    const avatarMap: { [key: string]: any } = {
      'user1.jpeg': images.user1,
      'user2.jpeg': images.user2,
      'user3.jpeg': images.user3,
      'user4.jpeg': images.user4,
      'user5.jpeg': images.user5,
      'user6.jpeg': images.user6,
      'user7.jpeg': images.user7,
      'user8.jpeg': images.user8,
      'user9.jpeg': images.user9,
      'user10.jpeg': images.user10,
      'user11.jpeg': images.user11,
    };
    
    return teamMembers.slice(0, 5).map(member => 
      avatarMap[member.avatar] || images.user1
    );
  };

  return {
    id: project.id,
    name: project.name,
    description: project.description || 'No description available',
    image: getProjectImage(metadata.cover_image),
    status: project.status === 'active' ? 'In Progress' : 
           project.status === 'completed' ? 'Completed' :
           project.status === 'on_hold' ? 'On Hold' : 'Active',
    numberOfTask: totalTasks,
    numberOfTaskCompleted: completedTasks,
    numberOfDaysLeft: daysLeft,
    logo: getProjectLogo(metadata.cover_image),
    members: getTeamAvatars(metadata.team_members),
    endDate: metadata.end_date || new Date().toISOString().split('T')[0],
  };
};

const HomeScreen = () => {
  const { dark, colors } = useTheme();
  const navigation = useNavigation<NavigationProp<any>>();
  const { user } = useAuth();
  // Navigation bar no longer hides on scroll - removed handleScroll
  
  // Projects state management
  const [projects, setProjects] = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // Search state management
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Today's tasks state management
  const [completedTasks, setCompletedTasks] = useState<{ [key: string]: boolean }>({});

  // 🚀 PREDICTIVE CACHE: Track home page behavior
  useRoutePredictiveCache('home');

  // Load projects from database
  const loadProjects = useCallback(async () => {
    try {
      setProjectsLoading(true);
      setProjectsError(null);
      
      console.log('🔄 Loading projects from database for user:', user?.id);
      
      // Pass user ID to get user-specific projects
      const dbProjects = await ProjectService.getProjects(user?.id);
      
      if (dbProjects && dbProjects.length > 0) {
        console.log('✅ Successfully loaded projects from database:', dbProjects.length);
        const transformedProjects = dbProjects.map(transformProjectForCard);
        setProjects(transformedProjects);
      } else {
        console.log('📭 No projects found in database for user:', user?.id);
        console.log('⚠️ Displaying empty state - no fallback to mock data');
        setProjects([]);
      }
    } catch (error) {
      console.error('❌ Error loading projects:', error);
      setProjectsError('Failed to load projects');
      setProjects([]);
    } finally {
      setProjectsLoading(false);
    }
  }, [user?.id]);

  // Load projects on component mount
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Search functionality
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      console.log('🔍 Performing comprehensive search for:', query);
      const results = await ProjectService.searchAllContent(query, user?.id);
      console.log('✅ Search results:', results);
      
      setSearchResults(results);
      setShowSearchResults(true);
    } catch (error) {
      console.error('❌ Search error:', error);
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
  }, [user?.id]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery) {
        performSearch(searchQuery);
      } else {
        setSearchResults(null);
        setShowSearchResults(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, performSearch]);

  // Get user display name and greeting
  const getUserDisplayName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning👋';
    if (hour < 17) return 'Good Afternoon👋';
    return 'Good Evening👋';
  };

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <View style={styles.viewLeft}>
          <OptimizedUserAvatar
            size={48}
            style={styles.userIcon}
            showLoading={true}
            showCacheIndicator={true}
          />
          <View style={styles.viewNameContainer}>
            <Text style={styles.greeeting}>{getGreeting()}</Text>
            <Text style={[styles.title, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
              {getUserDisplayName()}
            </Text>
          </View>
        </View>
        <View style={styles.viewRight}>
          <TouchableOpacity onPress={() => navigation.navigate('notifications')}>
            <Image
              source={icons.notificationBell2}
              resizeMode="contain"
              style={[styles.bellIcon, { tintColor: dark ? COLORS.white : COLORS.greyscale900 }]}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderSearchBar = () => {
    return (
      <View style={[styles.searchBarContainer, { backgroundColor: dark ? COLORS.dark2 : COLORS.secondaryWhite }]}>
        <Image
          source={icons.search2}
          resizeMode="contain"
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Search projects, tasks, and subtasks..."
          placeholderTextColor={COLORS.gray}
          style={[
            styles.searchInput, 
            { color: dark ? COLORS.white : COLORS.greyscale900 },
            Platform.OS === 'web' && WEB_INPUT_STYLES
          ]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
          autoComplete="off"
          autoCorrect={false}
        />
        {(searchQuery || isSearching) && (
          <TouchableOpacity 
            onPress={() => {
              setSearchQuery('');
              setSearchResults(null);
              setShowSearchResults(false);
            }}
            style={styles.clearButton}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Text style={styles.clearButtonText}>×</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderSearchResults = () => {
    if (!showSearchResults || !searchResults) return null;

    const { projects, tasks, subtasks, matchCounts } = searchResults;

    return (
      <View style={[styles.sectionContainer, { 
        backgroundColor: dark ? COLORS.dark1 : COLORS.white,
      }]}>
        <View style={styles.searchResultsHeader}>
          <Text style={[styles.searchResultsTitle, { 
            color: dark ? COLORS.white : COLORS.greyscale900 
          }]}>
            Search Results ({matchCounts.total} found)
          </Text>
          <TouchableOpacity 
            onPress={() => {
              setSearchQuery('');
              setSearchResults(null);
              setShowSearchResults(false);
            }}
            style={styles.closeSearchButton}
          >
            <Text style={styles.closeSearchButtonText}>Close</Text>
          </TouchableOpacity>
        </View>

        {matchCounts.projects > 0 && (
          <View style={styles.searchSection}>
            <Text style={[styles.searchSectionTitle, { 
              color: dark ? COLORS.white : COLORS.greyscale900 
            }]}>
              Projects ({matchCounts.projects})
            </Text>
            <FlatList
              data={projects}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => {
                const transformedProject = transformProjectForCard(item);
                return (
                  <ProjectCard
                    id={transformedProject.id}
                    name={transformedProject.name}
                    description={transformedProject.description}
                    image={transformedProject.image}
                    status={transformedProject.status}
                    numberOfTask={transformedProject.numberOfTask}
                    numberOfTaskCompleted={transformedProject.numberOfTaskCompleted}
                    numberOfDaysLeft={transformedProject.numberOfDaysLeft}
                    logo={transformedProject.logo}
                    members={transformedProject.members}
                    endDate={transformedProject.endDate}
                    onPress={() => {
                      setSearchQuery('');
                      setShowSearchResults(false);
                      navigation.navigate("projectdetails", { projectId: item.id });
                    }}
                    onRefresh={loadProjects}
                  />
                );
              }}
            />
          </View>
        )}

        {matchCounts.tasks > 0 && (
          <View style={styles.searchSection}>
            <Text style={[styles.searchSectionTitle, { 
              color: dark ? COLORS.white : COLORS.greyscale900 
            }]}>
              Tasks ({matchCounts.tasks})
            </Text>
            <FlatList
              data={tasks}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.searchResultItem, {
                    backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                    borderColor: dark ? COLORS.dark3 : COLORS.grayscale200,
                  }]}
                  onPress={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                    navigation.navigate("taskdetails", { taskId: item.id });
                  }}
                >
                  <Text style={[styles.searchResultItemTitle, { 
                    color: dark ? COLORS.white : COLORS.greyscale900 
                  }]}>
                    {item.title}
                  </Text>
                  {item.description && (
                    <Text style={[styles.searchResultItemDescription, { 
                      color: dark ? COLORS.grayscale400 : COLORS.greyScale800 
                    }]}>
                      {item.description}
                    </Text>
                  )}
                  <Text style={[styles.searchResultItemMeta, { 
                    color: dark ? COLORS.grayscale400 : COLORS.greyScale800 
                  }]}>
                    Task • {item.status} • {item.priority} priority
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {matchCounts.subtasks > 0 && (
          <View style={styles.searchSection}>
            <Text style={[styles.searchSectionTitle, { 
              color: dark ? COLORS.white : COLORS.greyscale900 
            }]}>
              Subtasks ({matchCounts.subtasks})
            </Text>
            <FlatList
              data={subtasks}
              keyExtractor={item => item.id}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.searchResultItem, {
                    backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                    borderColor: dark ? COLORS.dark3 : COLORS.grayscale200,
                  }]}
                  onPress={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                    navigation.navigate("taskdetails", { taskId: item.task_id });
                  }}
                >
                  <Text style={[styles.searchResultItemTitle, { 
                    color: dark ? COLORS.white : COLORS.greyscale900 
                  }]}>
                    {item.title}
                  </Text>
                  {(item.description || item.notes) && (
                    <Text style={[styles.searchResultItemDescription, { 
                      color: dark ? COLORS.grayscale400 : COLORS.greyScale800 
                    }]}>
                      {item.description || item.notes}
                    </Text>
                  )}
                  <Text style={[styles.searchResultItemMeta, { 
                    color: dark ? COLORS.grayscale400 : COLORS.greyScale800 
                  }]}>
                    Subtask • {item.completed ? 'Completed' : 'Pending'}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}

        {matchCounts.total === 0 && (
          <View style={styles.noResultsContainer}>
            <Text style={[styles.noResultsText, { 
              color: dark ? COLORS.grayscale400 : COLORS.greyScale800 
            }]}>
              No results found for "{searchQuery}"
            </Text>
          </View>
        )}
      </View>
    );
  };

  /**
   * render recent project
   */
  const renderRecentProject = () => {
    return (
      <View style={[styles.sectionContainer, { 
        backgroundColor: dark ? COLORS.dark1 : COLORS.white,
      }]}>
        <SubHeaderItem
          title="Recent Projects"
          navTitle="See All"
          onPress={() => navigation.navigate("projects")}
        />
        
        {projectsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={[styles.loadingText, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
              Loading projects...
            </Text>
          </View>
        ) : projectsError ? (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
              {projectsError}
            </Text>
            <TouchableOpacity onPress={loadProjects} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : projects.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
              No projects found. Create your first project!
            </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate("addnewproject")} 
              style={styles.createProjectButton}
            >
              <Text style={styles.createProjectButtonText}>Create Project</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={projects}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <ProjectCard
                id={item.id}
                name={item.name}
                description={item.description}
                image={item.image}
                status={item.status}
                numberOfTask={item.numberOfTask}
                numberOfTaskCompleted={item.numberOfTaskCompleted}
                numberOfDaysLeft={item.numberOfDaysLeft}
                logo={item.logo}
                members={item.members}
                endDate={item.endDate}
                onPress={() => navigation.navigate("projectdetails", { projectId: item.id })}
                onRefresh={loadProjects}
              />
            )}
          />
        )}
      </View>
    )
  }
  /**
   * render today task
   */
  // Handle today's task toggle
  const handleTaskToggle = useCallback((id: string, completed: boolean) => {
    setCompletedTasks((prev) => ({ ...prev, [id]: completed }));
  }, []);

  const renderTodayTask = () => {
    return (
      <View style={[styles.sectionContainer, { 
        backgroundColor: dark ? COLORS.dark1 : COLORS.white,
      }]}>
        <SubHeaderItem
          title="Today's Tasks"
          navTitle="See All"
          onPress={() => navigation.navigate("todaytask")}
        />
        <FlatList
          data={todayTasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskCard task={item} isCompleted={!!completedTasks[item.id]} onToggle={handleTaskToggle} />
          )}
          scrollEnabled={false}
          nestedScrollEnabled={false}
        />
      </View>
    )
  }
  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {renderSearchBar()}
          {showSearchResults ? (
            renderSearchResults()
          ) : (
            <>
              {renderRecentProject()}
              {renderTodayTask()}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  )
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
    backgroundColor: COLORS.tertiaryWhite,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.tertiaryWhite,
    paddingHorizontal: 4, // Minimal horizontal padding for maximum card width
    paddingVertical: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    width: SIZES.width - 16, // Wider header to match minimal padding
    justifyContent: 'space-between',
    alignItems: 'center',
    alignSelf: 'center', // Center the header
  },
  userIcon: {
    width: 48,
    height: 48,
    borderRadius: 32,
  },
  viewLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  greeeting: {
    fontSize: 12,
    fontFamily: 'regular',
    color: 'gray',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontFamily: 'bold',
    color: COLORS.greyscale900,
  },
  viewNameContainer: {
    marginLeft: 12,
  },
  viewRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bellIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.black,
    marginRight: 8,
  },
  bookmarkIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.black,
  },
  searchBarContainer: {
    width: SIZES.width - 16, // Wider search bar to match minimal padding
    backgroundColor: COLORS.secondaryWhite,
    padding: 16,
    borderRadius: 12,
    height: 52,
    marginVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center', // Center the search bar
    // Add subtle shadow for search bar
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.gray,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'regular',
    marginHorizontal: 8,
  },
  filterIcon: {
    width: 24,
    height: 24,
    tintColor: COLORS.primary,
  },
  // Loading, error and empty state styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'regular',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'regular',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'semiBold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'regular',
    textAlign: 'center',
    marginBottom: 20,
  },
  createProjectButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createProjectButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'semiBold',
  },
  // Clean section container styles without shadows (shadows are on individual cards)
  sectionContainer: {
    marginVertical: 8,
    paddingVertical: 16,
    paddingHorizontal: 2, // Minimal padding for maximum card width
  },
  clearButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  clearButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.gray,
  },
  searchResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  searchResultsTitle: {
    fontSize: 18,
    fontFamily: 'bold',
    color: COLORS.greyscale900,
  },
  closeSearchButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  closeSearchButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'semiBold',
  },
  searchSection: {
    marginBottom: 20,
  },
  searchSectionTitle: {
    fontSize: 16,
    fontFamily: 'semiBold',
    color: COLORS.greyscale900,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  searchResultItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.grayscale200,
  },
  searchResultItemTitle: {
    fontSize: 16,
    fontFamily: 'semiBold',
    color: COLORS.greyscale900,
    marginBottom: 4,
  },
  searchResultItemDescription: {
    fontSize: 14,
    fontFamily: 'regular',
    color: COLORS.greyScale800,
    marginBottom: 8,
    lineHeight: 20,
  },
  searchResultItemMeta: {
    fontSize: 12,
    fontFamily: 'regular',
    color: COLORS.greyScale800,
  },
  noResultsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    fontFamily: 'regular',
    color: COLORS.greyScale800,
    textAlign: 'center',
  },
})

export default HomeScreen