import { COLORS, icons } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import { Project, ProjectService, Task } from '@/utils/projectService';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import { useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}



const ProjectDashboard = () => {
  const { dark } = useTheme();
  const navigation = useNavigation<NavigationProp<any>>();
  const params = useLocalSearchParams();
  const projectId = params.projectId as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatSummary, setChatSummary] = useState<string>('');

  // Load project data
  const loadProjectData = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      const [projectData, tasksData] = await Promise.all([
        ProjectService.getProject(projectId),
        ProjectService.getProjectTasks(projectId)
      ]);
      
      setProject(projectData);
      setTasks(tasksData);
      
      // Load chat summary if available
      try {
        // For now, set a placeholder summary since chat methods need to be implemented
        setChatSummary('Chat functionality available. Start a conversation to see summary.');
      } catch (error) {
        console.log('No chat data available');
      }
    } catch (error) {
      console.error('Error loading project data:', error);
      Alert.alert('Error', 'Failed to load project data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  useFocusEffect(
    useCallback(() => {
      loadProjectData();
    }, [loadProjectData])
  );

  // Handle project edit
  const handleProjectEdit = async (field: string, value: any) => {
    if (!project) return;
    
    try {
      let updatedProject: Partial<Project>;
      
      if (field === 'name' || field === 'description' || field === 'status') {
        updatedProject = { [field]: value };
      } else {
        updatedProject = {
          metadata: {
            ...project.metadata,
            [field]: value
          }
        };
      }

      const result = await ProjectService.updateProject(project.id, updatedProject);
      if (result) {
        setProject(result);
      } else {
        Alert.alert('Error', 'Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      Alert.alert('Error', 'Failed to update project');
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: dark ? COLORS.dark1 : COLORS.white }]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { color: dark ? COLORS.white : COLORS.black }]}>
          Loading dashboard...
        </Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: dark ? COLORS.dark1 : COLORS.white }]}>
        <Text style={[styles.errorText, { color: dark ? COLORS.white : COLORS.black }]}>
          Project not found
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
  const todoTasks = tasks.filter(task => task.status === 'todo').length;
  const progress = totalTasks > 0 ? completedTasks / totalTasks : 0;
  const daysLeft = project.metadata?.days_left || 
    (project.metadata?.end_date ? ProjectService.calculateDaysLeft(project.metadata.end_date) : 0);

  // Calculate flow score based on project health
  const calculateFlowScore = () => {
    let score = 0;
    
    // Progress contribution (40%)
    score += progress * 40;
    
    // Task distribution contribution (30%)
    if (totalTasks > 0) {
      const distributionScore = (inProgressTasks / totalTasks) * 30;
      score += Math.min(distributionScore, 30);
    }
    
    // Time management contribution (30%)
    if (daysLeft > 0) {
      const timeScore = Math.min((daysLeft / 30) * 30, 30);
      score += timeScore;
    }
    
    return Math.round(score);
  };

  const flowScore = calculateFlowScore();
  const getFlowScoreColor = (score: number) => {
    if (score >= 80) return COLORS.success;
    if (score >= 60) return COLORS.primary;
    if (score >= 40) return "#fbd027";
    return "#ff566e";
  };

  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={icons.back}
            resizeMode='contain'
            style={[styles.backIcon, {
              tintColor: dark ? COLORS.white : COLORS.greyscale900
            }]}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, {
          color: dark ? COLORS.white : COLORS.greyscale900
        }]}>
          Project Dashboard
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate("projectdetails", { projectId: project.id })}>
          <Image
            source={icons.edit}
            resizeMode='contain'
            style={[styles.editIcon, {
              tintColor: COLORS.primary
            }]}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const renderProjectInfo = () => {
    return (
      <View style={[styles.widget, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
        <View style={styles.widgetHeader}>
          <Text style={[styles.widgetTitle, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
            Project Information
          </Text>
          <TouchableOpacity onPress={() => {
            Alert.prompt(
              'Edit Project Name',
              'Enter new project name:',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Save', 
                  onPress: (text) => {
                    if (text && text.trim()) {
                      handleProjectEdit('name', text.trim());
                    }
                  }
                }
              ],
              'plain-text',
              project.name
            );
          }}>
            <Ionicons name="pencil" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={() => {
          Alert.prompt(
            'Edit Project Name',
            'Enter new project name:',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Save', 
                onPress: (text) => {
                  if (text && text.trim()) {
                    handleProjectEdit('name', text.trim());
                  }
                }
              }
            ],
            'plain-text',
            project.name
          );
        }}>
          <Text style={[styles.projectTitle, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
            {project.name}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => {
          Alert.prompt(
            'Edit Description',
            'Enter new description:',
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Save', 
                onPress: (text) => {
                  if (text) {
                    handleProjectEdit('description', text);
                  }
                }
              }
            ],
            'plain-text',
            project.description
          );
        }}>
          <Text style={[styles.projectDescription, { color: dark ? COLORS.grayscale100 : COLORS.greyscale900 }]}>
            {project.description}
          </Text>
        </TouchableOpacity>

        <View style={styles.projectMeta}>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
              Status
            </Text>
            <TouchableOpacity 
              style={[styles.statusBadge, { 
                backgroundColor: project.status === 'completed' ? COLORS.success : 
                                project.status === 'active' ? COLORS.primary : COLORS.grayscale400 
              }]}
              onPress={() => {
                Alert.alert(
                  'Change Status',
                  'Select new status:',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Active', onPress: () => handleProjectEdit('status', 'active') },
                    { text: 'Completed', onPress: () => handleProjectEdit('status', 'completed') },
                    { text: 'Archived', onPress: () => handleProjectEdit('status', 'archived') }
                  ]
                );
              }}
            >
              <Text style={styles.statusText}>{project.status}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
              Created
            </Text>
            <Text style={[styles.metaValue, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
              {new Date(project.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        <View style={styles.projectMeta}>
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
              Owner
            </Text>
            <TouchableOpacity onPress={() => {
              Alert.prompt(
                'Edit Owner',
                'Enter project owner:',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Save', 
                    onPress: (text) => {
                      handleProjectEdit('owner', text || '');
                    }
                  }
                ],
                'plain-text',
                project.metadata?.owner || ''
              );
            }}>
              <Text style={[styles.metaValue, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                {project.metadata?.owner || 'Tap to set'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.metaItem}>
            <Text style={[styles.metaLabel, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
              End Date
            </Text>
            <TouchableOpacity onPress={() => {
              Alert.prompt(
                'Edit End Date',
                'Enter end date (YYYY-MM-DD):',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Save', 
                    onPress: (text) => {
                      if (text) {
                        handleProjectEdit('end_date', text);
                      }
                    }
                  }
                ],
                'plain-text',
                project.metadata?.end_date || ''
              );
            }}>
              <Text style={[styles.metaValue, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                {project.metadata?.end_date ? new Date(project.metadata.end_date).toLocaleDateString() : 'Tap to set'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderTaskSummary = () => {
    return (
      <View style={[styles.widget, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
        <Text style={[styles.widgetTitle, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
          Task Summary
        </Text>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressInfo}>
            <Text style={[styles.progressText, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
              {completedTasks} of {totalTasks} tasks completed
            </Text>
            <Text style={[styles.progressPercentage, { color: COLORS.primary }]}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
          
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { 
                width: `${progress * 100}%`,
                backgroundColor: COLORS.primary 
              }]} 
            />
          </View>
        </View>

        <View style={styles.taskStats}>
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: "#26c2a3" }]} />
            <Text style={[styles.statLabel, { color: dark ? COLORS.grayscale100 : COLORS.greyscale900 }]}>
              To Do: {todoTasks}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: "#fbd027" }]} />
            <Text style={[styles.statLabel, { color: dark ? COLORS.grayscale100 : COLORS.greyscale900 }]}>
              In Progress: {inProgressTasks}
            </Text>
          </View>
          
          <View style={styles.statItem}>
            <View style={[styles.statDot, { backgroundColor: COLORS.success }]} />
            <Text style={[styles.statLabel, { color: dark ? COLORS.grayscale100 : COLORS.greyscale900 }]}>
              Completed: {completedTasks}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.viewTasksButton}
          onPress={() => navigation.navigate("projectdetails", { projectId: project.id })}
        >
          <Text style={styles.viewTasksButtonText}>View All Tasks</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderFlowScore = () => {
    return (
      <View style={[styles.widget, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
        <Text style={[styles.widgetTitle, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
          Flow Score
        </Text>
        
        <View style={styles.flowScoreContainer}>
          <View style={[styles.flowScoreCircle, { borderColor: getFlowScoreColor(flowScore) }]}>
            <Text style={[styles.flowScoreNumber, { color: getFlowScoreColor(flowScore) }]}>
              {flowScore}
            </Text>
          </View>
          
          <View style={styles.flowScoreInfo}>
            <Text style={[styles.flowScoreLabel, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
              Project Health
            </Text>
            <Text style={[styles.flowScoreDescription, { color: dark ? COLORS.grayscale100 : COLORS.greyscale900 }]}>
              {flowScore >= 80 ? 'Excellent' : 
               flowScore >= 60 ? 'Good' : 
               flowScore >= 40 ? 'Fair' : 'Needs Attention'}
            </Text>
          </View>
        </View>

        <View style={styles.flowMetrics}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
              Progress
            </Text>
            <Text style={[styles.metricValue, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
              {Math.round(progress * 100)}%
            </Text>
          </View>
          
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
              Days Left
            </Text>
            <Text style={[styles.metricValue, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
              {daysLeft}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderChatSummary = () => {
    return (
      <View style={[styles.widget, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
        <View style={styles.widgetHeader}>
          <Text style={[styles.widgetTitle, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
            AI Chat Summary
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("chat", { projectId: project.id })}>
            <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.chatSummaryText, { color: dark ? COLORS.grayscale100 : COLORS.greyscale900 }]}>
          {chatSummary || 'No chat history available. Start a conversation with AI to get project insights and assistance.'}
        </Text>
        
        <TouchableOpacity 
          style={styles.startChatButton}
          onPress={() => navigation.navigate("chat", { projectId: project.id })}
        >
          <Text style={styles.startChatButtonText}>
            {chatSummary ? 'Continue Chat' : 'Start AI Chat'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: dark ? COLORS.dark1 : COLORS.tertiaryWhite }]}>
      <View style={[styles.container, { backgroundColor: dark ? COLORS.dark1 : COLORS.tertiaryWhite }]}>
        {renderHeader()}
        
        <ScrollView 
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
        >
          {renderProjectInfo()}
          {renderTaskSummary()}
          {renderFlowScore()}
          {renderChatSummary()}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  backIcon: {
    height: 24,
    width: 24,
  },
  editIcon: {
    height: 24,
    width: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  widget: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  widgetTitle: {
    fontSize: 18,
    fontFamily: 'semiBold',
  },
  projectTitle: {
    fontSize: 24,
    fontFamily: 'bold',
    marginBottom: 8,
  },
  projectDescription: {
    fontSize: 16,
    fontFamily: 'regular',
    lineHeight: 24,
    marginBottom: 16,
  },
  projectMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 12,
    fontFamily: 'medium',
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 14,
    fontFamily: 'semiBold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: 'semiBold',
    textTransform: 'capitalize',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 16,
    fontFamily: 'medium',
  },
  progressPercentage: {
    fontSize: 18,
    fontFamily: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.grayscale200,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  taskStats: {
    marginBottom: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'medium',
  },
  viewTasksButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewTasksButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'semiBold',
  },
  flowScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  flowScoreCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  flowScoreNumber: {
    fontSize: 24,
    fontFamily: 'bold',
  },
  flowScoreInfo: {
    flex: 1,
  },
  flowScoreLabel: {
    fontSize: 16,
    fontFamily: 'semiBold',
    marginBottom: 4,
  },
  flowScoreDescription: {
    fontSize: 14,
    fontFamily: 'regular',
  },
  flowMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: 'medium',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontFamily: 'bold',
  },
  chatSummaryText: {
    fontSize: 14,
    fontFamily: 'regular',
    lineHeight: 20,
    marginBottom: 16,
  },
  startChatButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  startChatButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'semiBold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'regular',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'semiBold',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'semiBold',
  },
});

export default ProjectDashboard; 