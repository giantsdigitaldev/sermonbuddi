import { COLORS, icons, images, SIZES } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import { Project, ProjectService, Task } from '@/utils/projectService';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import { useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, ImageSourcePropType, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Progress from 'react-native-progress';

const colors = {
  advanced: COLORS.primary,
  intermediate: "#ff566e",
  medium: "#fbd027",
  weak: "#26c2a3",
  completed: COLORS.greeen
};

const TaskCard: React.FC<{ 
  task: Task; 
  onPress: () => void;
  onEdit: (field: string, value: any) => void;
  onDelete: () => void;
}> = ({ task, onPress, onEdit, onDelete }) => {
  const navigation = useNavigation<NavigationProp<any>>();
  const { dark } = useTheme();

  const handleMorePress = () => {
    Alert.alert(
      'Task Options',
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Edit Title', 
          onPress: () => {
            Alert.prompt(
              'Edit Task Title',
              'Enter new task title:',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Save', 
                  onPress: (text) => {
                    if (text && text.trim()) {
                      onEdit('title', text.trim());
                    }
                  }
                }
              ],
              'plain-text',
              task.title
            );
          }
        },
        { 
          text: 'Change Status', 
          onPress: () => {
            Alert.alert(
              'Change Status',
              'Select new status:',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'To Do', onPress: () => onEdit('status', 'todo') },
                { text: 'In Progress', onPress: () => onEdit('status', 'in_progress') },
                { text: 'Completed', onPress: () => onEdit('status', 'completed') }
              ]
            );
          }
        },
        { 
          text: 'Change Priority', 
          onPress: () => {
            Alert.alert(
              'Change Priority',
              'Select new priority:',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Low', onPress: () => onEdit('priority', 'low') },
                { text: 'Medium', onPress: () => onEdit('priority', 'medium') },
                { text: 'High', onPress: () => onEdit('priority', 'high') }
              ]
            );
          }
        },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: onDelete
        }
      ]
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, {
        backgroundColor: dark ? COLORS.dark2 : "#fff",
      }]}>
      {/* Task Title and Menu Button */}
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, {
          color: dark ? COLORS.white : "#333",
        }]}>{task.title}</Text>
        <TouchableOpacity onPress={handleMorePress}>
          <Ionicons name="ellipsis-horizontal" size={20} color={dark ? COLORS.white : "#333"} />
        </TouchableOpacity>
      </View>

      {/* Due Date */}
      <Text style={[styles.dueDate, {
        color: dark ? COLORS.grayscale200 : "#777",
      }]}>Due date: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</Text>

      {/* Status and Priority */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusBadge, { 
          backgroundColor: task.status === 'completed' ? colors.completed : 
                          task.status === 'in_progress' ? colors.intermediate : colors.weak 
        }]}>
          <Text style={styles.statusText}>{task.status.replace('_', ' ')}</Text>
        </View>
        <View style={[styles.priorityBadge, { 
          backgroundColor: task.priority === 'high' ? colors.intermediate : 
                          task.priority === 'medium' ? colors.medium : colors.weak 
        }]}>
          <Text style={styles.priorityText}>{task.priority}</Text>
        </View>
      </View>

      {/* Comments & Attachments */}
      <View style={styles.footer}>
        <View style={styles.iconGroup}>
          <Ionicons name="chatbubble-outline" size={18} color={dark ? COLORS.greyscale300 : "#333"} />
          <Text style={[styles.iconText, { color: dark ? COLORS.greyscale300 : "#333" }]}>
            {task.metadata?.comments || 0}
          </Text>
        </View>
        <View style={styles.iconGroup}>
          <Ionicons name="attach-outline" size={18} color={dark ? COLORS.greyscale300 : "#333"} />
          <Text style={[styles.iconText, {
            color: dark ? COLORS.greyscale300 : "#333",
          }]}>{task.metadata?.attachments || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Enhanced Project Info Card Component
const ProjectInfoCard: React.FC<{ project: Project; dark: boolean; onEdit: (field: string, value: any) => void }> = ({ project, dark, onEdit }) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Not set';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return colors.intermediate;
      case 'medium': return colors.medium;
      case 'low': return colors.weak;
      default: return colors.weak;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.completed;
      case 'active': return colors.advanced;
      case 'on_hold': return colors.medium;
      case 'archived': return colors.weak;
      default: return colors.weak;
    }
  };

  return (
    <View style={[styles.infoCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}>
      <Text style={[styles.infoCardTitle, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
        Project Details
      </Text>
      
      {/* Basic Information */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>Category</Text>
          <TouchableOpacity onPress={() => {
            Alert.alert(
              'Change Category',
              'Select new category:',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Web Development', onPress: () => onEdit('category', 'web development') },
                { text: 'Mobile Development', onPress: () => onEdit('category', 'mobile development') },
                { text: 'Data Science', onPress: () => onEdit('category', 'data science') },
                { text: 'E-commerce', onPress: () => onEdit('category', 'e-commerce') },
                { text: 'Marketing', onPress: () => onEdit('category', 'marketing') },
                { text: 'Design', onPress: () => onEdit('category', 'design') },
                { text: 'Other', onPress: () => onEdit('category', 'other') }
              ]
            );
          }}>
            <Text style={[styles.infoValue, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
              {project.category || 'Other'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>Priority</Text>
          <TouchableOpacity onPress={() => {
            Alert.alert(
              'Change Priority',
              'Select new priority:',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Low', onPress: () => onEdit('priority', 'low') },
                { text: 'Medium', onPress: () => onEdit('priority', 'medium') },
                { text: 'High', onPress: () => onEdit('priority', 'high') }
              ]
            );
          }}>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(project.priority || 'medium') }]}>
              <Text style={styles.priorityText}>{project.priority || 'Medium'}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Status and Budget */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>Status</Text>
          <TouchableOpacity onPress={() => {
            Alert.alert(
              'Change Status',
              'Select new status:',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Active', onPress: () => onEdit('status', 'active') },
                { text: 'On Hold', onPress: () => onEdit('status', 'on_hold') },
                { text: 'Completed', onPress: () => onEdit('status', 'completed') },
                { text: 'Archived', onPress: () => onEdit('status', 'archived') }
              ]
            );
          }}>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
              <Text style={styles.statusText}>{project.status.replace('_', ' ')}</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>Budget</Text>
          <TouchableOpacity onPress={() => {
            Alert.prompt(
              'Edit Budget',
              'Enter project budget:',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Save', 
                  onPress: (text) => {
                    const amount = parseFloat(text || '0');
                    if (!isNaN(amount)) {
                      onEdit('budget', amount);
                    }
                  }
                }
              ],
              'numeric',
              project.budget ? project.budget.toString() : ''
            );
          }}>
            <Text style={[styles.infoValue, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
              {formatCurrency(project.budget)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Dates */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>EDC Date</Text>
          <Text style={[styles.infoValue, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
            {formatDate(project.edc_date)}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>FUD Date</Text>
          <Text style={[styles.infoValue, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
            {formatDate(project.fud_date)}
          </Text>
        </View>
      </View>

      {/* Team Information */}
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>Project Owner</Text>
          <TouchableOpacity onPress={() => {
            Alert.prompt(
              'Edit Project Owner',
              'Enter project owner name:',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Save', 
                  onPress: (text) => {
                    if (text && text.trim()) {
                      onEdit('project_owner', text.trim());
                    }
                  }
                }
              ],
              'plain-text',
              project.project_owner || ''
            );
          }}>
            <Text style={[styles.infoValue, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
              {project.project_owner || 'Not assigned'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.infoItem}>
          <Text style={[styles.infoLabel, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>Project Lead</Text>
          <TouchableOpacity onPress={() => {
            Alert.prompt(
              'Edit Project Lead',
              'Enter project lead name:',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Save', 
                  onPress: (text) => {
                    if (text && text.trim()) {
                      onEdit('project_lead', text.trim());
                    }
                  }
                }
              ],
              'plain-text',
              project.project_lead || ''
            );
          }}>
            <Text style={[styles.infoValue, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
              {project.project_lead || 'Not assigned'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tools and Dependencies */}
      {project.metadata?.tools_needed && (
        <View style={styles.infoSection}>
          <Text style={[styles.infoLabel, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>Tools Needed</Text>
          <View style={styles.tagContainer}>
            {(Array.isArray(project.metadata.tools_needed) 
              ? project.metadata.tools_needed 
              : typeof project.metadata.tools_needed === 'string' 
                ? project.metadata.tools_needed.split(',').map(tool => tool.trim()).filter(tool => tool.length > 0)
                : []
            ).map((tool: string, index: number) => (
              <View key={index} style={[styles.tag, { backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100 }]}>
                <Text style={[styles.tagText, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>{tool}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {project.metadata?.dependencies && (
        <View style={styles.infoSection}>
          <Text style={[styles.infoLabel, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>Dependencies</Text>
          <View style={styles.tagContainer}>
            {(Array.isArray(project.metadata.dependencies) 
              ? project.metadata.dependencies 
              : typeof project.metadata.dependencies === 'string' 
                ? project.metadata.dependencies.split(',').map(dep => dep.trim()).filter(dep => dep.length > 0)
                : []
            ).map((dep: string, index: number) => (
              <View key={index} style={[styles.tag, { backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100 }]}>
                <Text style={[styles.tagText, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>{dep}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const ProjectDashboard = () => {
  const params = useLocalSearchParams();
  const projectId = params.projectId as string;
  const navigation = useNavigation<NavigationProp<any>>();
  const { dark } = useTheme();
  
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Load project and tasks
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
      
      // Update project progress
      if (projectData) {
        await ProjectService.updateProjectProgress(projectId);
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

  // Handle task edit
  const handleTaskEdit = async (task: Task, field: string, value: any) => {
    try {
      const updatedTask = await ProjectService.updateTask(task.id, { [field]: value });
      if (updatedTask) {
        setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
        // Update project progress after task change
        await ProjectService.updateProjectProgress(projectId);
        loadProjectData(); // Reload to get updated progress
      } else {
        Alert.alert('Error', 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  // Handle task delete
  const handleTaskDelete = async (taskId: string) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await ProjectService.deleteTask(taskId);
              if (success) {
                setTasks(prev => prev.filter(t => t.id !== taskId));
                await ProjectService.updateProjectProgress(projectId);
                loadProjectData();
              } else {
                Alert.alert('Error', 'Failed to delete task');
              }
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Error', 'Failed to delete task');
            }
          }
        }
      ]
    );
  };

  // Handle project edit
  const handleProjectEdit = async (field: string, value: any) => {
    if (!project) return;
    
    try {
      let updatedProject: Partial<Project>;
      
      if (['name', 'description', 'status', 'category', 'priority', 'edc_date', 'fud_date', 'budget', 'project_owner', 'project_lead'].includes(field)) {
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
        <Text style={[styles.loadingText, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
          Loading project dashboard...
        </Text>
      </View>
    );
  }

  if (!project) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: dark ? COLORS.dark1 : COLORS.white }]}>
        <Text style={[styles.errorText, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
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

  const members = project.metadata?.members || [];
  const numberOfTask = tasks.length;
  const numberOfTaskCompleted = tasks.filter(task => task.status === 'completed').length;
  const progress = numberOfTask > 0 ? numberOfTaskCompleted / numberOfTask : 0;
  const numberOfDaysLeft = project.metadata?.days_left || 
    (project.edc_date ? ProjectService.calculateDaysLeft(project.edc_date) : 0);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar hidden />
      <Image source={project.metadata?.image ? { uri: project.metadata.image } : images.projectImage} style={styles.banner} />
      
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image
            source={icons.back}
            resizeMode='contain'
            style={styles.arrowBackIcon}
          />
        </TouchableOpacity>
        <View style={styles.rightContainer}>
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
            <Image
              source={icons.edit}
              resizeMode='contain'
              style={styles.searchIcon}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            Alert.alert(
              'Project Options',
              'What would you like to do?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Edit Description', 
                  onPress: () => {
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
                  }
                },
                { 
                  text: 'View Full Project', 
                  onPress: () => navigation.navigate('projectdetails', { projectId: project.id })
                }
              ]
            );
          }}>
            <Image
              source={icons.moreCircle}
              resizeMode='contain'
              style={styles.menuIcon}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Image source={project.metadata?.logo ? { uri: project.metadata.logo } : images.logo5} style={styles.logo} />
        </View>
        <View style={styles.membersContainer}>
          {members.slice(0, 3).map((member: any, index: number) => (
            <Image
              key={index}
              source={typeof member === 'string' ? { uri: member } : member as ImageSourcePropType}
              style={[styles.memberAvatar, { left: index * -14 }]}
            />
          ))}
          {members.length > 3 && (
            <View style={styles.moreMembers}>
              <Text style={styles.moreText}>+{members.length - 3}</Text>
            </View>
          )}
          <TouchableOpacity
            onPress={() => navigation.navigate('projectdetailsteammenber', { projectId: project.id })}
            style={styles.teamManageButton}
          >
            <Ionicons name="people" size={16} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.container, { backgroundColor: dark ? COLORS.dark1 : COLORS.white }]}>
        <Text style={[styles.title, {
          color: dark ? COLORS.white : COLORS.greyscale900
        }]}>{project.name}</Text>
        <Text style={[styles.subtitle, {
          color: dark ? COLORS.grayscale100 : COLORS.greyscale900
        }]}>{project.description}</Text>

        {/* Progress bar item */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressView, {
            backgroundColor: progress === 1 ? colors.completed :
              progress >= 0.75 ? colors.advanced :
                progress >= 0.50 ? colors.intermediate :
                  progress >= 0.35 ? colors.medium : colors.weak
          }]}>
            <Text style={styles.progressText}>{numberOfTaskCompleted} / {numberOfTask}</Text>
          </View>
          <Text style={[styles.daysLeft, {
            color: dark ? COLORS.grayscale400 : COLORS.grayscale700
          }]}>{numberOfDaysLeft} Days Left</Text>
        </View>
        
        <Progress.Bar
          progress={progress}
          width={null}
          height={8}
          unfilledColor={dark ? COLORS.grayscale700 : "#EEEEEE"}
          borderColor={dark ? "transparent" : "#FFF"}
          borderWidth={0}
          style={styles.progressBar}
          color={
            progress === 1 ? colors.completed :
              progress >= 0.75 ? colors.advanced :
                progress >= 0.50 ? colors.intermediate :
                  progress >= 0.35 ? colors.medium : colors.weak
          }
        />

        {/* Enhanced Project Information Card */}
        <ProjectInfoCard project={project} dark={dark} onEdit={handleProjectEdit} />

        {/* Task Details - Fixed VirtualizedList nesting */}
        <View style={[styles.taskDetailsContainer, {
          backgroundColor: dark ? COLORS.dark1 : "#E9F0FF",
          flex: 1,
        }]}>
          <Text style={[styles.sectionTitle, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
            Project Tasks ({tasks.length})
          </Text>
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item, index }) => {
              console.log('Dashboard rendering task:', item.id, item.title);
              return (
                <TaskCard 
                  task={item} 
                  onPress={() => navigation.navigate("projectdetailsboarddetails", { 
                    projectId: project.id, 
                    taskId: item.id 
                  })}
                  onEdit={(field, value) => handleTaskEdit(item, field, value)}
                  onDelete={() => handleTaskDelete(item.id)}
                />
              );
            }}
            ListEmptyComponent={() => (
              <View style={styles.emptyTasksContainer}>
                <Text style={[styles.emptyTasksText, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                  No tasks yet
                </Text>
                <TouchableOpacity
                  style={styles.addTaskButton}
                  onPress={() => navigation.navigate("addnewtaskform", { projectId: project.id })}
                >
                  <Text style={styles.addTaskButtonText}>Add First Task</Text>
                </TouchableOpacity>
              </View>
            )}
            // iOS optimizations
            removeClippedSubviews={false}
            initialNumToRender={10}
            maxToRenderPerBatch={5}
            windowSize={10}
          />
        </View>
      </View>
      
      {/* Add Task Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate("addnewtaskform", { projectId: project.id })}
        style={styles.addIconContainer}>
        <Ionicons name="add" size={24} color="#FFF" />
      </TouchableOpacity>
      
      {/* Add Team Member Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate("projectdetailsaddteammenber", { projectId: project.id })}
        style={styles.addTeamIconContainer}>
        <Ionicons name="person-add" size={20} color="#FFF" />
      </TouchableOpacity>
    </View>
  )
};

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    height: 240,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: SIZES.width - 32,
    position: "absolute",
    top: 32,
    left: 16,
  },
  arrowBackIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.white
  },
  searchIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.white,
    marginRight: 8,
  },
  menuIcon: {
    height: 24,
    width: 24,
    tintColor: COLORS.white
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center"
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: -72,
    marginLeft: 16,
    marginRight: 16,
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  logo: {
    width: 24,
    height: 24,
  },
  membersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 32,
  },
  memberAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: COLORS.white,
    position: 'absolute',
  },
  moreMembers: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  moreText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
  },
  teamManageButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  container: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -32,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressView: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  progressText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  daysLeft: {
    fontSize: 14,
    fontWeight: '500',
  },
  progressBar: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 8,
  },
  taskDetailsContainer: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 100,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  dueDate: {
    fontSize: 12,
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flex: 0.48,
    alignItems: 'center',
  },
  statusText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flex: 0.48,
    alignItems: 'center',
  },
  priorityText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconText: {
    marginLeft: 4,
    fontSize: 12,
  },
  emptyTasksContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTasksText: {
    fontSize: 16,
    marginBottom: 16,
  },
  addTaskButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addTaskButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  addIconContainer: {
    position: 'absolute',
    bottom: 30,
    right: 16,
    backgroundColor: COLORS.primary,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addTeamIconContainer: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    backgroundColor: COLORS.secondary,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  // Enhanced Project Info Card Styles
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  infoItem: {
    flex: 0.48,
  },
  infoSection: {
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default ProjectDashboard; 