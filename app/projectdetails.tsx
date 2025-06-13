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
import { ScrollView } from 'react-native-virtualized-view';

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

const ProjectDetails = () => {
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
        <Text style={[styles.loadingText, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
          Loading project...
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
    (project.metadata?.end_date ? ProjectService.calculateDaysLeft(project.metadata.end_date) : 0);

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
                  text: 'Change Status', 
                  onPress: () => {
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
                  }
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
          {members.slice(0, 3).map((member, index) => (
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

        {/* Task Details */}
        <ScrollView showsVerticalScrollIndicator={false}
          style={[styles.taskDetailsContainer, {
            backgroundColor: dark ? COLORS.dark1 : "#E9F0FF",
          }]}>
          <FlatList
            data={tasks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TaskCard 
                task={item} 
                onPress={() => navigation.navigate("projectdetailsboarddetails", { 
                  projectId: project.id, 
                  taskId: item.id 
                })}
                onEdit={(field, value) => handleTaskEdit(item, field, value)}
                onDelete={() => handleTaskDelete(item.id)}
              />
            )}
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
          />
        </ScrollView>
      </View>
      
      {/* Add Task Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate("addnewtaskform", { projectId: project.id })}
        style={styles.addIconContainer}>
        <Ionicons name="add" size={24} color="#FFF" />
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
    fontSize: 12,
    fontFamily: 'bold',
  },
  title: {
    fontSize: 28,
    fontFamily: 'bold',
    color: COLORS.greyscale900,
    marginTop: 20,
    marginBottom: 12,
  },
  container: {
    paddingHorizontal: 16,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.greyscale900,
    fontFamily: 'regular',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  progressView: {
    width: 78,
    height: 32,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  progressText: {
    fontSize: 14,
    color: COLORS.white,
    fontFamily: "semiBold"
  },
  daysLeft: {
    fontSize: 12,
    color: COLORS.grayscale700,
    fontFamily: 'regular',
  },
  progressBar: {
    marginTop: 12,
  },
  taskDetailsContainer: {
    marginTop: 24,
    backgroundColor: "#E9F0FF",
    flex: 1,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "bold",
    color: "#333",
    flex: 1,
  },
  dueDate: {
    fontSize: 14,
    color: "#777",
    marginVertical: 5,
    fontFamily: "regular",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  iconGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#333",
    fontFamily: "regular",
  },
  addIconContainer: {
    height: 58,
    width: 58,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    bottom: 24,
    right: 16,
    backgroundColor: COLORS.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
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
  statusContainer: {
    flexDirection: 'row',
    marginVertical: 8,
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: 'semiBold',
    textTransform: 'capitalize',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: 'semiBold',
    textTransform: 'capitalize',
  },
  emptyTasksContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTasksText: {
    fontSize: 16,
    fontFamily: 'regular',
    marginBottom: 16,
  },
  addTaskButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addTaskButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontFamily: 'semiBold',
  },
});

export default ProjectDetails;