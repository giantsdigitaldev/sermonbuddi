import UserAvatar from '@/components/UserAvatar';
import { COLORS, icons, images, SIZES } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import { Project, ProjectService, Task } from '@/utils/projectService';
import { TeamMember } from '@/utils/teamService';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import { useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Image,
  ImageSourcePropType,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import Svg, { Circle, Path } from 'react-native-svg';

const colors = {
  advanced: COLORS.primary,
  intermediate: "#ff566e",
  medium: "#fbd027",
  weak: "#26c2a3",
  completed: COLORS.greeen
};

// CircularProgress component for the first card
const CircularProgress: React.FC<{
  progress: number;
  size: number;
  strokeWidth: number;
  completed: number;
  total: number;
  color: string;
}> = ({ progress, size, strokeWidth, completed, total, color }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E5E5"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      {/* Center text */}
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontSize: 16, fontFamily: 'bold', color: color }}>
          {completed}/{total}
        </Text>
        <Text style={{ fontSize: 10, fontFamily: 'regular', color: '#666' }}>
          Tasks
        </Text>
      </View>
    </View>
  );
};

// TrafficLight component that switches colors based on project status
const TrafficLight: React.FC<{ 
  status: string; 
  onPress: () => void; 
  style?: any; 
}> = ({ status, onPress, style }) => {
  // Determine which light should be active based on status
  const getActiveLight = () => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'active':
      case 'in_progress':
      case 'ongoing':
        return 'green'; // Left light (default - active/good states)
      case 'on_hold':
      case 'paused':
      case 'pending':
      case 'review':
        return 'yellow'; // Center light (caution states)
      case 'archived':
      case 'cancelled':
      case 'failed':
      case 'blocked':
        return 'red'; // Right light (stop/problem states)
      default:
        return 'green'; // Default to green (left light)
    }
  };

  const activeLight = getActiveLight();

  return (
    <TouchableOpacity onPress={onPress} style={style}>
      <Svg width="58" height="29" viewBox="0 0 100 40">
        {/* Traffic light background/frame */}
        <Path
          d="m19 2.5h62c8.3 0 15 6.7 15 15v5c0 8.3-6.7 15-15 15h-62c-8.3 0-15-6.7-15-15v-5c0-8.3 6.7-15 15-15z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="2"
        />
        
        {/* Left light (Green) */}
        <Path
          d="m22 30c-5.5 0-10-4.5-10-10 0-5.5 4.5-10 10-10 5.5 0 10 4.5 10 10 0 5.5-4.5 10-10 10z"
          fill={activeLight === 'green' ? COLORS.success : 'transparent'}
          stroke="#ffffff"
          strokeWidth="2"
        />
        
        {/* Center light (Yellow) */}
        <Path
          d="m50 30c-5.5 0-10-4.5-10-10 0-5.5 4.5-10 10-10 5.5 0 10 4.5 10 10 0 5.5-4.5 10-10 10z"
          fill={activeLight === 'yellow' ? COLORS.warning : 'transparent'}
          stroke="#ffffff"
          strokeWidth="2"
        />
        
        {/* Right light (Red) */}
        <Path
          d="m78 30c-5.5 0-10-4.5-10-10 0-5.5 4.5-10 10-10 5.5 0 10 4.5 10 10 0 5.5-4.5 10-10 10z"
          fill={activeLight === 'red' ? COLORS.error : 'transparent'}
          stroke="#ffffff"
          strokeWidth="2"
        />
      </Svg>
    </TouchableOpacity>
  );
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
    <View style={[styles.card, {
      backgroundColor: dark ? COLORS.dark2 : "#fff",
      marginHorizontal: 0,
      marginVertical: 8,
    }]}>
      {/* Task Title and Menu Button */}
      <TouchableOpacity onPress={onPress} style={{ flex: 1 }}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, {
            color: dark ? COLORS.white : "#333",
          }]}>{task.title || 'Untitled Task'}</Text>
          <TouchableOpacity onPress={handleMorePress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
            backgroundColor: task.status === 'completed' ? COLORS.primary : 
                            task.status === 'in_progress' ? COLORS.secondary : COLORS.grayscale400 
          }]}>
            <Text style={styles.statusText}>{(task.status || 'todo').replace('_', ' ')}</Text>
          </View>
          <View style={[styles.priorityBadge, { 
            backgroundColor: task.priority === 'high' ? COLORS.error : 
                            task.priority === 'medium' ? COLORS.warning : COLORS.success 
          }]}>
            <Text style={styles.priorityText}>{task.priority || 'low'}</Text>
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
    </View>
  );
};

const ProjectDetails = () => {
  const params = useLocalSearchParams();
  const projectId = params.projectId as string;
  const navigation = useNavigation<NavigationProp<any>>();
  const { dark } = useTheme();
  
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownAnimation] = useState(new Animated.Value(0));
  const [enhancedProgress, setEnhancedProgress] = useState<{ completed: number; total: number; percentage: number }>({ completed: 0, total: 0, percentage: 0 });
  
  // Scroll animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const HEADER_MAX_HEIGHT = 180;
  const HEADER_MIN_HEIGHT = 60; // Height for collapsed header (10px below back/menu buttons)
  const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
  
  // Edit modal states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [datePickerType, setDatePickerType] = useState<'edc' | 'fud'>('edc');
  
  // Modal refs (legacy - keeping for potential future use)
  // All modals now use custom animations instead of RBSheet

  // Title/Description edit modal states
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');

  // Category management states
  const [projectCategories, setProjectCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');

  // Team management states
  const [searchUsers, setSearchUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<any[]>([]);
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>({});

  // Modal animations
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showDatePickerModal, setShowDatePickerModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  
  const teamModalAnimation = useRef(new Animated.Value(0)).current;
  const datePickerModalAnimation = useRef(new Animated.Value(0)).current;
  const editProjectModalAnimation = useRef(new Animated.Value(0)).current;
  const categoryModalAnimation = useRef(new Animated.Value(0)).current;
  
  const teamOverlayOpacity = useRef(new Animated.Value(0)).current;
  const datePickerOverlayOpacity = useRef(new Animated.Value(0)).current;
  const editProjectOverlayOpacity = useRef(new Animated.Value(0)).current;
  const categoryOverlayOpacity = useRef(new Animated.Value(0)).current;

  // Animated values for header elements
  const headerHeight = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
    extrapolate: 'clamp',
  });

  const headerElementsOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });

  const headerControlsOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_SCROLL_DISTANCE],
    outputRange: [1, 1], // Always visible
    extrapolate: 'clamp',
  });

  // Load project data with team members
  const loadProjectData = useCallback(async () => {
    if (!projectId) return;
    
    try {
      setLoading(true);
      console.log('📋 Loading project data for:', projectId);
      
      // Get project with team data
      const { project, teamMembers } = await ProjectService.getProjectWithTeam(projectId);
      
      if (project) {
        setProject(project);
        setTeamMembers(teamMembers);
        
        // Load tasks
        const projectTasks = await ProjectService.getProjectTasks(projectId);
        setTasks(projectTasks);
        
        // Calculate enhanced progress with subtasks
        const progressWithSubtasks = await ProjectService.calculateProjectProgressWithSubtasks(projectId);
        setEnhancedProgress(progressWithSubtasks);
        
        console.log('✅ Project loaded:', project.name);
        console.log('👥 Team members:', teamMembers.length);
        console.log('📋 Tasks:', projectTasks.length);
        console.log('📊 Enhanced Progress:', progressWithSubtasks);
      } else {
        console.error('❌ Project not found');
      }
    } catch (error) {
      console.error('❌ Error loading project data:', error);
      Alert.alert('Error', 'Failed to load project data');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // Method to refresh enhanced progress (called when returning from task details)
  const refreshEnhancedProgress = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const progressWithSubtasks = await ProjectService.calculateProjectProgressWithSubtasks(projectId);
      setEnhancedProgress(progressWithSubtasks);
      
      // Also reload tasks to get updated statuses
      const projectTasks = await ProjectService.getProjectTasks(projectId);
      setTasks(projectTasks);
      
      console.log('📊 Progress refreshed:', progressWithSubtasks);
    } catch (error) {
      console.error('❌ Error refreshing progress:', error);
    }
  }, [projectId]);

  useFocusEffect(
    useCallback(() => {
      loadProjectData();
      
      // Also refresh enhanced progress when returning to screen
      // (in case subtasks were updated in task details)
      const refreshTimer = setTimeout(() => {
        refreshEnhancedProgress();
      }, 500); // Small delay to ensure any pending updates are complete
      
      return () => clearTimeout(refreshTimer);
    }, [loadProjectData, refreshEnhancedProgress])
  );

  // Dropdown menu options
  const dropdownOptions = [
    {
      id: 'add-task',
      title: 'Add New Task',
      icon: icons.addPlus,
      onPress: () => {
        setShowDropdown(false);
        navigation.navigate("addnewtaskform", { projectId: projectId });
      }
    },
    {
      id: 'add-user',
      title: 'Add New User',
      icon: icons.addUser,
      onPress: () => {
        setShowDropdown(false);
        navigation.navigate("projectdetailsaddteammenber", { projectId: projectId });
      }
    },
    {
      id: 'edit-background',
      title: 'Edit Background Image',
      icon: icons.image,
      onPress: () => {
        setShowDropdown(false);
        Alert.alert(
          'Edit Background Image',
          'Choose how to update the background image:',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Choose from Gallery', 
              onPress: () => {
                // TODO: Implement image picker functionality
                Alert.alert('Info', 'Image picker functionality will be implemented soon');
              }
            }
          ]
        );
      }
    }
  ];

  // Show dropdown menu with enhanced spring animation
  const showDropdownMenu = () => {
    setShowDropdown(true);
    Animated.spring(dropdownAnimation, {
      toValue: 1,
      tension: 100,
      friction: 8,
      useNativeDriver: false,
    }).start();
  };

  // Hide dropdown menu with smooth animation
  const hideDropdownMenu = () => {
    Animated.timing(dropdownAnimation, {
      toValue: 0,
      duration: 200, // Fast, consistent timing for closing
      useNativeDriver: false,
    }).start(() => {
      setShowDropdown(false);
    });
  };

  // Handle edit field
  const handleEditField = (field: string, currentValue: any) => {
    if (field === 'edc_date' || field === 'fud_date') {
      setDatePickerType(field as 'edc' | 'fud');
      setSelectedDate(currentValue || new Date().toISOString().split('T')[0]);
      openDatePickerModal();
    } else {
      setEditingField(field);
      setEditValue(typeof currentValue === 'string' ? currentValue : String(currentValue || ''));
    }
  };

  // Handle save field
  const handleSaveField = async () => {
    if (!project || !editingField) return;
    
    try {
      let updatedProject: Partial<Project>;
      
      if (['name', 'description', 'status'].includes(editingField)) {
        updatedProject = { [editingField]: editValue };
      } else {
        // For metadata fields, convert numeric values appropriately
        let processedValue: any = editValue;
        if (editingField === 'budget') {
          processedValue = editValue ? parseFloat(editValue) : undefined;
        }
        
        updatedProject = {
          metadata: {
            ...project.metadata,
            [editingField]: processedValue
          }
        };
      }

      const result = await ProjectService.updateProject(project.id, updatedProject);
      if (result) {
        setProject(result);
        setEditingField(null);
        setEditValue('');
        Alert.alert('Success', 'Project updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      Alert.alert('Error', 'Failed to update project');
    }
  };

  // Handle date save
  const handleDateSave = async (dateString: string) => {
    if (!project) return;
    
    try {
      const field = datePickerType === 'edc' ? 'edc_date' : 'fud_date';
      
      const updatedProject = {
        metadata: {
          ...project.metadata,
          [field]: dateString,
          // Recalculate days left if EDC date is updated
          ...(field === 'edc_date' && {
            days_left: ProjectService.calculateDaysLeft(dateString)
          })
        }
      };

      const result = await ProjectService.updateProject(project.id, updatedProject);
      if (result) {
        setProject(result);
        closeDatePickerModal();
        Alert.alert('Success', 'Date updated successfully');
      }
    } catch (error) {
      console.error('Error updating date:', error);
      Alert.alert('Error', 'Failed to update date');
    }
  };

  // Handle task operations
  const handleTaskEdit = async (task: Task, field: string, value: any) => {
    try {
      const updatedTask = await ProjectService.updateTask(task.id, { [field]: value });
      if (updatedTask) {
        setTasks(tasks.map(t => t.id === task.id ? updatedTask : t));
        
        // Recalculate enhanced progress after task update
        const progressWithSubtasks = await ProjectService.calculateProjectProgressWithSubtasks(projectId);
        setEnhancedProgress(progressWithSubtasks);
        
        Alert.alert('Success', 'Task updated successfully');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      await ProjectService.deleteTask(taskId);
      setTasks(tasks.filter(t => t.id !== taskId));
      
      // Recalculate enhanced progress after task deletion
      const progressWithSubtasks = await ProjectService.calculateProjectProgressWithSubtasks(projectId);
      setEnhancedProgress(progressWithSubtasks);
      
      Alert.alert('Success', 'Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      Alert.alert('Error', 'Failed to delete task');
    }
  };

  // Team Management Modal Animation Functions
  const openTeamModal = () => {
    setShowTeamModal(true);
    
    // Start overlay fade-in immediately but slowly
    Animated.timing(teamOverlayOpacity, {
      toValue: 1,
      duration: 600, // Slower overlay animation
      useNativeDriver: true,
    }).start();
    
    // Start modal slide-in with a slight delay
    Animated.spring(teamModalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,  // Reduced from 100 to make it slower
      friction: 12, // Increased from 8 to reduce bounce/overjump
      delay: 50, // Small delay to let overlay start first
    }).start();
  };

  const closeTeamModal = () => {
    // Animate both overlay and modal out together
    Animated.parallel([
      Animated.timing(teamOverlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(teamModalAnimation, {
        toValue: 0,
        duration: 400, // Increased from 300ms to make closing slower
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowTeamModal(false);
    });
  };

  // Date Picker Modal Animation Functions
  const openDatePickerModal = () => {
    setShowDatePickerModal(true);
    
    Animated.timing(datePickerOverlayOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    
    Animated.spring(datePickerModalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 12,
      delay: 50,
    }).start();
  };

  const closeDatePickerModal = () => {
    Animated.parallel([
      Animated.timing(datePickerOverlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(datePickerModalAnimation, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowDatePickerModal(false);
    });
  };

  // Edit Project Modal Animation Functions
  const openEditProjectModal = () => {
    setShowEditProjectModal(true);
    
    Animated.timing(editProjectOverlayOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    
    Animated.spring(editProjectModalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 12,
      delay: 50,
    }).start();
  };

  const closeEditProjectModal = () => {
    Animated.parallel([
      Animated.timing(editProjectOverlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(editProjectModalAnimation, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowEditProjectModal(false);
    });
  };

  // Category Modal Animation Functions
  const openCategoryModal = () => {
    setShowCategoryModal(true);
    
    Animated.timing(categoryOverlayOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
    
    Animated.spring(categoryModalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 12,
      delay: 50,
    }).start();
  };

  const closeCategoryModal = () => {
    Animated.parallel([
      Animated.timing(categoryOverlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(categoryModalAnimation, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowCategoryModal(false);
    });
  };

  // Team Management Functions
  const handleTeamManagement = () => {
    setSelectedTeamMembers(teamMembers.map(member => member.user_id));
    // Initialize roles for existing team members
    const initialRoles: Record<string, string> = {};
    teamMembers.forEach(member => {
      if (member.user_name === project?.metadata?.project_lead) {
        initialRoles[member.user_id] = 'Leader';
      } else {
        initialRoles[member.user_id] = member.role === 'admin' ? 'Collaborator' : 'FYI';
      }
    });
    setMemberRoles(initialRoles);
    openTeamModal();
  };

  const searchTeamMembers = async (query: string) => {
    if (query.length < 2) {
      setSearchUsers([]);
      return;
    }

    try {
      const { TeamService } = await import('@/utils/teamService');
      const result = await TeamService.searchUsers(query);
      setSearchUsers(result.users);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleTeamMemberSelect = (userId: string) => {
    setSelectedTeamMembers(prev => {
      if (prev.includes(userId)) {
        // Remove member and their role
        setMemberRoles(prevRoles => {
          const newRoles = { ...prevRoles };
          delete newRoles[userId];
          return newRoles;
        });
        return prev.filter(id => id !== userId);
      } else {
        // Add member with default role
        setMemberRoles(prevRoles => ({
          ...prevRoles,
          [userId]: 'FYI' // Default role for new members
        }));
        return [...prev, userId];
      }
    });
  };

  const handleSaveTeamMembers = async () => {
    if (!project) return;

    try {
      const { TeamService } = await import('@/utils/teamService');
      
      // Add new team members
      for (const userId of selectedTeamMembers) {
        if (!teamMembers.find(member => member.user_id === userId)) {
          const assignedRole = memberRoles[userId] || 'FYI';
          // Map UI roles to database roles
          const dbRole = assignedRole === 'Leader' ? 'admin' : 
                        assignedRole === 'Collaborator' ? 'member' : 'viewer';
          await TeamService.inviteTeamMember({
            projectId: project.id,
            userId: userId,
            role: dbRole
          });
        }
      }

      // Update project lead if someone is assigned as Leader
      const leaderUserId = Object.keys(memberRoles).find(userId => memberRoles[userId] === 'Leader');
      if (leaderUserId) {
        const leaderMember = teamMembers.find(member => member.user_id === leaderUserId) ||
                           searchUsers.find(user => user.id === leaderUserId);
        if (leaderMember) {
          const updatedProject = {
            metadata: {
              ...project.metadata,
              project_lead: leaderMember.user_name || leaderMember.full_name || leaderMember.username
            }
          };
          await ProjectService.updateProject(project.id, updatedProject);
        }
      }
      
      // Reload project data to get updated team members
      await loadProjectData();
      
      closeTeamModal();
      Alert.alert('Success', 'Team members and roles updated successfully');
    } catch (error) {
      console.error('Error updating team members:', error);
      Alert.alert('Error', 'Failed to update team members');
    }
  };

  // Role Management Functions
  const handleRoleChange = (userId: string, role: string) => {
    setMemberRoles(prev => ({
      ...prev,
      [userId]: role
    }));
  };

  // Project Title/Description Edit Functions
  const handleEditProject = () => {
    if (!project) return;
    
    setEditTitle(project.name || '');
    setEditDescription(project.description || '');
    openEditProjectModal();
  };

  const handleSaveProject = async () => {
    if (!project) return;
    
    try {
      const updatedProject = {
        name: editTitle.trim(),
        description: editDescription.trim()
      };

      const result = await ProjectService.updateProject(project.id, updatedProject);
      if (result) {
        setProject(result);
        closeEditProjectModal();
        Alert.alert('Success', 'Project updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      Alert.alert('Error', 'Failed to update project');
    }
  };

  // Category Management Functions
  const handleCategoryManagement = () => {
    // Parse categories from metadata or use empty array
    const categories = project?.metadata?.categories 
      ? (typeof project.metadata.categories === 'string' 
          ? project.metadata.categories.split(',').map((cat: string) => cat.trim()).filter((cat: string) => cat.length > 0)
          : project.metadata.categories)
      : [];
    setProjectCategories(categories);
    openCategoryModal();
  };

  const handleAddCategory = () => {
    if (newCategory.trim() && !projectCategories.includes(newCategory.trim())) {
      setProjectCategories(prev => [...prev, newCategory.trim()]);
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (categoryToRemove: string) => {
    setProjectCategories(prev => prev.filter(cat => cat !== categoryToRemove));
  };

  const handleSaveCategories = async () => {
    if (!project) return;
    
    try {
      const updatedProject = {
        metadata: {
          ...project.metadata,
          categories: projectCategories
        }
      };

      const result = await ProjectService.updateProject(project.id, updatedProject);
      if (result) {
        setProject(result);
        closeCategoryModal();
        Alert.alert('Success', 'Categories updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update categories');
      }
    } catch (error) {
      console.error('Error updating categories:', error);
      Alert.alert('Error', 'Failed to update categories');
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

  const numberOfTask = enhancedProgress.total;
  const numberOfTaskCompleted = enhancedProgress.completed;
  const progress = enhancedProgress.percentage;
  const numberOfDaysLeft = project.metadata?.days_left || 
    (project.metadata?.edc_date ? ProjectService.calculateDaysLeft(project.metadata.edc_date) : 0);

  return (
    <View style={{ flex: 1 }}>
      <StatusBar hidden />
      
      {/* Animated Project Card Style Header */}
      <Animated.View style={[styles.projectCardHeader, { height: headerHeight }]}>
        {/* Header Image Container */}
        <View style={styles.headerImageContainer}>
          <Animated.Image 
            source={project.metadata?.image ? { uri: project.metadata.image } : images.projectImage} 
            style={[styles.headerImage, { height: headerHeight }]} 
          />
          
          {/* Header Controls - Always Visible */}
          <Animated.View style={[styles.headerControls, { opacity: headerControlsOpacity }]}>
            <TouchableOpacity 
              style={styles.backButtonContainer}
              onPress={() => {
                // Check if we can go back in navigation history
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  // If no history, go to projects page or home
                  navigation.navigate('(tabs)', { screen: 'projects' });
                }
              }}
            >
              <Image
                source={icons.back}
                resizeMode='contain'
                style={styles.arrowBackIcon}
              />
            </TouchableOpacity>
            <View style={styles.rightContainer}>
              <TouchableOpacity 
                style={styles.menuButtonContainer}
                onPress={showDropdownMenu}
              >
                <Image
                  source={icons.moreCircle}
                  resizeMode='contain'
                  style={styles.menuIcon}
                />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Animated Elements - Fade out on scroll */}
          <Animated.View style={[styles.animatedElements, { opacity: headerElementsOpacity }]}>
            {/* Traffic Light Status Icon - Bottom Left */}
            <TrafficLight 
              status={project.status}
              style={styles.statusTrafficLight}
              onPress={() => {
                Alert.alert(
                  'Change Status',
                  'Select project status:',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Active', onPress: () => handleEditField('status', 'active') },
                    { text: 'On Hold', onPress: () => handleEditField('status', 'on_hold') },
                    { text: 'Completed', onPress: () => handleEditField('status', 'completed') },
                    { text: 'Archived', onPress: () => handleEditField('status', 'archived') }
                  ]
                );
              }}
            />

            {/* Budget Display - Next to Traffic Light */}
            <TouchableOpacity 
              style={styles.budgetContainer}
              onPress={() => handleEditField('budget', project.metadata?.budget)}
            >
              <View style={styles.budgetContent}>
                <Ionicons name="wallet" size={16} color={COLORS.white} />
                <Text style={styles.budgetText}>
                  ${project.metadata?.budget ? Number(project.metadata.budget).toLocaleString() : '0'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Team Member Avatars - Bottom Right */}
            <View style={styles.headerTeamMembers}>
              {/* Team Member Avatars with Project Lead First */}
              {(() => {
                // Sort team members so project lead appears first
                const sortedMembers = teamMembers.sort((a, b) => {
                  const aIsLead = a.user_name === project?.metadata?.project_lead;
                  const bIsLead = b.user_name === project?.metadata?.project_lead;
                  if (aIsLead && !bIsLead) return -1;
                  if (!aIsLead && bIsLead) return 1;
                  return 0;
                });

                const visibleMembers = sortedMembers.slice(0, 3);
                
                return visibleMembers.map((member, index) => {
                  const isProjectLead = member.user_name === project?.metadata?.project_lead;
                  // Position from right: leftmost avatar has highest right value
                  // Project lead (index 0) gets position 3, next gets 2, etc.
                  const rightPosition = (visibleMembers.length - index) * 24;
                  
                  return (
                    <TouchableOpacity
                      key={member.id}
                      onPress={handleTeamManagement}
                      style={[styles.headerMemberAvatar, { 
                        right: rightPosition, 
                        zIndex: visibleMembers.length - index
                      }]}
                    >
                      <View style={styles.avatarContainer}>
                        <UserAvatar
                          size={28}
                          userId={member.user_id}
                        />
                      </View>
                      {/* Star icon for project lead */}
                      {isProjectLead && (
                        <View style={styles.projectLeadStar}>
                          <Ionicons name="star" size={10} color={COLORS.warning} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                });
              })()}
              {teamMembers.length > 3 && (
                <TouchableOpacity 
                  style={[styles.headerMoreMembers, { 
                    right: 4 * 24 // Position after the 3 visible avatars
                  }]}
                  onPress={handleTeamManagement}
                >
                  <Text style={styles.headerMoreText}>+{teamMembers.length - 3}</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </View>
      </Animated.View>

      <Animated.ScrollView 
        style={[styles.container, { backgroundColor: dark ? COLORS.dark1 : COLORS.white }]}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Project Info Section - Now scrollable without card frame */}
        <View style={styles.projectInfoScrollable}>
          {/* Title and Days Left Row */}
          <View style={styles.titleDaysRow}>
            <View style={styles.titleDescriptionContainer}>
              <TouchableOpacity onPress={handleEditProject}>
                <Text style={[styles.projectTitleBelow, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                  {project.name}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleEditProject}>
                <Text style={[styles.projectDescriptionBelow, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
                  {project.description || 'Tap to add description'}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.daysLeftBelowContainer}>
              <Text style={[styles.daysLeftBelowText, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
                {numberOfDaysLeft} Days Left
              </Text>
            </View>
          </View>

          {/* Category Tags Section */}
          <View style={styles.categorySection}>
            {(() => {
              const categories = project?.metadata?.categories 
                ? (typeof project.metadata.categories === 'string' 
                    ? project.metadata.categories.split(',').map((cat: string) => cat.trim()).filter((cat: string) => cat.length > 0)
                    : project.metadata.categories)
                : [];
              
              const visibleCategories = categories.slice(0, 5);
              const hasMoreCategories = categories.length > 5;
              
              return (
                <View style={styles.categoryContainerScrollable}>
                  {visibleCategories.map((category: string, index: number) => (
                    <TouchableOpacity 
                      key={index}
                      style={styles.categoryPillScrollable}
                      onPress={handleCategoryManagement}
                    >
                      <Text style={styles.categoryTextScrollable}>{category}</Text>
                    </TouchableOpacity>
                  ))}
                  {hasMoreCategories && (
                    <TouchableOpacity 
                      style={[styles.categoryPillScrollable, styles.moreCategoriesPillScrollable]}
                      onPress={handleCategoryManagement}
                    >
                      <Ionicons name="add" size={12} color={COLORS.white} />
                      <Text style={[styles.categoryTextScrollable, { color: COLORS.white }]}>+{categories.length - 5}</Text>
                    </TouchableOpacity>
                  )}
                  {categories.length === 0 && (
                    <TouchableOpacity 
                      style={[styles.categoryPillScrollable, styles.addCategoryPillScrollable]}
                      onPress={handleCategoryManagement}
                    >
                      <Ionicons name="add" size={12} color={COLORS.white} />
                      <Text style={[styles.categoryTextScrollable, { color: COLORS.white }]}>Add Categories</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })()}
          </View>
        </View>

        {/* Horizontal Slider with Square Cards */}
        <View style={[styles.sliderSection, { 
          backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
          marginHorizontal: -16,
          paddingVertical: 24
        }]}>
          <FlatList
            data={[
              {
                id: 'progress',
                type: 'progress',
                title: 'Progress',
                data: { completed: numberOfTaskCompleted, total: numberOfTask, progress }
              },
              {
                id: 'flow_status',
                type: 'flow_status',
                title: 'Flow Status',
                data: { status: project.status }
              },
              {
                id: 'priority_budget',
                type: 'priority_budget',
                title: 'Priority & Budget',
                data: { 
                  priority: project.metadata?.priority || 'low',
                  budget: project.metadata?.budget 
                }
              },
              {
                id: 'dates',
                type: 'dates',
                title: 'Key Dates',
                data: { 
                  edc: project.metadata?.edc_date,
                  fud: project.metadata?.fud_date
                }
              }
            ]}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.sliderContent}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.sliderCard, { backgroundColor: dark ? COLORS.dark2 : COLORS.white }]}
                onPress={() => {
                  // Handle card press based on type
                  switch (item.type) {
                    case 'flow_status':
                      Alert.alert(
                        'Change Status',
                        'Select project status:',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Active', onPress: () => handleEditField('status', 'active') },
                          { text: 'On Hold', onPress: () => handleEditField('status', 'on_hold') },
                          { text: 'Completed', onPress: () => handleEditField('status', 'completed') },
                          { text: 'Archived', onPress: () => handleEditField('status', 'archived') }
                        ]
                      );
                      break;
                    case 'priority_budget':
                      Alert.alert(
                        'Edit Priority & Budget',
                        'What would you like to edit?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { 
                            text: 'Priority', 
                            onPress: () => Alert.alert(
                              'Select Priority',
                              'Choose priority level:',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                { text: 'Low', onPress: () => handleEditField('priority', 'low') },
                                { text: 'Medium', onPress: () => handleEditField('priority', 'medium') },
                                { text: 'High', onPress: () => handleEditField('priority', 'high') }
                              ]
                            )
                          },
                          { 
                            text: 'Budget', 
                            onPress: () => handleEditField('budget', project.metadata?.budget)
                          }
                        ]
                      );
                      break;
                    case 'dates':
                      Alert.alert(
                        'Edit Dates',
                        'Which date would you like to edit?',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'EDC Date', onPress: () => handleEditField('edc_date', project.metadata?.edc_date) },
                          { text: 'FUD Date', onPress: () => handleEditField('fud_date', project.metadata?.fud_date) }
                        ]
                      );
                      break;
                  }
                }}
              >
                {/* Card Content Based on Type */}
                {item.type === 'progress' && (
                  <View style={styles.sliderCardContent}>
                    <Text style={[styles.sliderCardTitle, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                      {item.title}
                    </Text>
                    <View style={styles.progressCardContent}>
                      <CircularProgress
                        progress={item.data.progress || 0}
                        size={60}
                        strokeWidth={6}
                        completed={item.data.completed || 0}
                        total={item.data.total || 0}
                        color={
                          (item.data.progress || 0) === 1 ? colors.completed :
                          (item.data.progress || 0) >= 0.75 ? colors.advanced :
                          (item.data.progress || 0) >= 0.50 ? colors.intermediate :
                          (item.data.progress || 0) >= 0.35 ? colors.medium : colors.weak
                        }
                      />
                    </View>
                  </View>
                )}

                {item.type === 'flow_status' && (
                  <View style={[
                    styles.sliderCardContent,
                    {
                      backgroundColor: (() => {
                        const status = item.data.status || 'active';
                        switch (status.toLowerCase()) {
                          case 'completed':
                          case 'active':
                          case 'in_progress':
                          case 'ongoing':
                            return 'rgba(34, 197, 94, 0.15)'; // Faded pastel green
                          case 'on_hold':
                          case 'paused':
                          case 'pending':
                          case 'review':
                            return 'rgba(251, 191, 36, 0.15)'; // Faded pastel yellow/orange
                          case 'archived':
                          case 'cancelled':
                          case 'failed':
                          case 'blocked':
                            return 'rgba(239, 68, 68, 0.15)'; // Faded pastel red
                          default:
                            return 'rgba(34, 197, 94, 0.15)'; // Default to green
                        }
                      })(),
                      borderRadius: 12,
                      padding: 12,
                    }
                  ]}>
                    <Text style={[styles.sliderCardTitle, { color: COLORS.white }]}>
                      {item.title}
                    </Text>
                    <View style={styles.flowStatusContent}>
                      <TrafficLight 
                        status={item.data.status || 'active'}
                        style={styles.sliderTrafficLight}
                        onPress={() => {}}
                      />
                      <Text style={[styles.statusLabel, { color: COLORS.white }]}>
                        {(item.data.status || 'active').replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                )}

                {item.type === 'priority_budget' && (
                  <View style={styles.sliderCardContent}>
                    <Text style={[styles.sliderCardTitle, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                      {item.title}
                    </Text>
                    <View style={styles.priorityBudgetContent}>
                      <View style={styles.prioritySection}>
                        <Ionicons name="flag" size={16} color={COLORS.primary} />
                        <View style={[styles.priorityBadgeSmall, {
                          backgroundColor: item.data.priority === 'high' ? COLORS.error :
                                         item.data.priority === 'medium' ? COLORS.warning : COLORS.success
                        }]}>
                          <Text style={styles.priorityTextSmall}>
                            {item.data.priority.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.budgetSection}>
                        <Ionicons name="wallet" size={16} color={COLORS.primary} />
                        <Text style={[styles.budgetTextSmall, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                          ${item.data.budget ? Number(item.data.budget).toLocaleString() : '0'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {item.type === 'dates' && (
                  <View style={styles.sliderCardContent}>
                    <Text style={[styles.sliderCardTitle, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                      {item.title}
                    </Text>
                    <View style={styles.datesContent}>
                      <TouchableOpacity style={styles.dateItem}>
                        <Ionicons name="calendar" size={18} color={COLORS.primary} />
                        <View style={styles.dateTextContainer}>
                          <Text style={[styles.dateLabel, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
                            EDC
                          </Text>
                          <Text style={[styles.dateValue, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                            {item.data.edc ? new Date(item.data.edc).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Set Date'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.dateItem}>
                        <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
                        <View style={styles.dateTextContainer}>
                          <Text style={[styles.dateLabel, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
                            FUD
                          </Text>
                          <Text style={[styles.dateValue, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                            {item.data.fud ? new Date(item.data.fud).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Set Date'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
          />
        </View>

        {/* Project Details Cards */}
        <View style={styles.detailsSection}>
          {/* Priority and Category Row */}
          <View style={styles.detailsRow}>
            <TouchableOpacity 
              style={[styles.detailCard, styles.halfCard]}
              onPress={() => {
                Alert.alert(
                  'Select Priority',
                  'Choose priority level:',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Low', onPress: () => handleEditField('priority', 'low') },
                    { text: 'Medium', onPress: () => handleEditField('priority', 'medium') },
                    { text: 'High', onPress: () => handleEditField('priority', 'high') }
                  ]
                );
              }}
            >
              <View style={styles.detailCardHeader}>
                <Ionicons name="flag" size={20} color={COLORS.primary} />
                <Text style={[styles.detailCardTitle, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                  Priority
                </Text>
              </View>
              <View style={[styles.priorityBadge, {
                backgroundColor: project.metadata?.priority === 'high' ? COLORS.error :
                               project.metadata?.priority === 'medium' ? COLORS.warning : COLORS.success
              }]}>
                <Text style={styles.priorityText}>
                  {project.metadata?.priority?.toUpperCase() || 'LOW'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.detailCard, styles.halfCard]}
              onPress={() => {
                Alert.alert(
                  'Select Category',
                  'Choose project category:',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Web Development', onPress: () => handleEditField('category', 'web development') },
                    { text: 'Mobile Development', onPress: () => handleEditField('category', 'mobile development') },
                    { text: 'Data Science', onPress: () => handleEditField('category', 'data science') },
                    { text: 'E-commerce', onPress: () => handleEditField('category', 'e-commerce') },
                    { text: 'Marketing', onPress: () => handleEditField('category', 'marketing') },
                    { text: 'Design', onPress: () => handleEditField('category', 'design') },
                    { text: 'Other', onPress: () => handleEditField('category', 'other') }
                  ]
                );
              }}
            >
              <View style={styles.detailCardHeader}>
                <Ionicons name="folder" size={20} color={COLORS.primary} />
                <Text style={[styles.detailCardTitle, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                  Category
                </Text>
              </View>
              <Text style={[styles.detailCardValue, { color: dark ? COLORS.grayscale400 : COLORS.greyscale900 }]}>
                {project.metadata?.category || 'Not set'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Budget Card */}
          <TouchableOpacity 
            style={styles.detailCard}
            onPress={() => handleEditField('budget', project.metadata?.budget)}
          >
            <View style={styles.detailCardHeader}>
              <Ionicons name="wallet" size={20} color={COLORS.primary} />
              <Text style={[styles.detailCardTitle, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                Budget
              </Text>
              <Ionicons name="pencil" size={14} color={COLORS.grayscale400} />
            </View>
            <Text style={[styles.budgetValue, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
              {project.metadata?.budget ? `$${project.metadata.budget.toLocaleString()}` : 'Not set'}
            </Text>
          </TouchableOpacity>

          {/* Dates Row */}
          <View style={styles.detailsRow}>
            <TouchableOpacity 
              style={[styles.detailCard, styles.halfCard]}
              onPress={() => handleEditField('edc_date', project.metadata?.edc_date)}
            >
              <View style={styles.detailCardHeader}>
                <Ionicons name="calendar" size={20} color={COLORS.primary} />
                <Text style={[styles.detailCardTitle, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                  EDC Date
                </Text>
              </View>
              <Text style={[styles.detailCardValue, { color: dark ? COLORS.grayscale400 : COLORS.greyscale900 }]}>
                {project.metadata?.edc_date ? new Date(project.metadata.edc_date).toLocaleDateString() : 'Not set'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.detailCard, styles.halfCard]}
              onPress={() => handleEditField('fud_date', project.metadata?.fud_date)}
            >
              <View style={styles.detailCardHeader}>
                <Ionicons name="calendar-outline" size={20} color={COLORS.primary} />
                <Text style={[styles.detailCardTitle, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                  FUD Date
                </Text>
              </View>
              <Text style={[styles.detailCardValue, { color: dark ? COLORS.grayscale400 : COLORS.greyscale900 }]}>
                {project.metadata?.fud_date ? new Date(project.metadata.fud_date).toLocaleDateString() : 'Not set'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Team Members Row */}
          <View style={styles.detailsRow}>
            <TouchableOpacity 
              style={[styles.detailCard, styles.halfCard]}
              onPress={() => handleEditField('project_owner', project.metadata?.project_owner)}
            >
              <View style={styles.detailCardHeader}>
                <Ionicons name="person" size={20} color={COLORS.primary} />
                <Text style={[styles.detailCardTitle, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                  Owner
                </Text>
              </View>
              <Text style={[styles.detailCardValue, { color: dark ? COLORS.grayscale400 : COLORS.greyscale900 }]}>
                {project.metadata?.project_owner || 'Not set'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.detailCard, styles.halfCard]}
              onPress={() => handleEditField('project_lead', project.metadata?.project_lead)}
            >
              <View style={styles.detailCardHeader}>
                <Ionicons name="star" size={20} color={COLORS.primary} />
                <Text style={[styles.detailCardTitle, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                  Lead
                </Text>
              </View>
              <Text style={[styles.detailCardValue, { color: dark ? COLORS.grayscale400 : COLORS.greyscale900 }]}>
                {project.metadata?.project_lead || 'Not set'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tools and Dependencies */}
          <TouchableOpacity 
            style={styles.detailCard}
            onPress={() => handleEditField('tools_needed', project.metadata?.tools_needed)}
          >
            <View style={styles.detailCardHeader}>
              <Ionicons name="construct" size={20} color={COLORS.primary} />
              <Text style={[styles.detailCardTitle, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                Tools & Technologies
              </Text>
              <Ionicons name="pencil" size={14} color={COLORS.grayscale400} />
            </View>
            <Text style={[styles.detailCardDescription, { color: dark ? COLORS.grayscale400 : COLORS.greyscale900 }]}>
              {project.metadata?.tools_needed || 'Tap to add tools and technologies needed'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.detailCard}
            onPress={() => handleEditField('dependencies', project.metadata?.dependencies)}
          >
            <View style={styles.detailCardHeader}>
              <Ionicons name="git-network" size={20} color={COLORS.primary} />
              <Text style={[styles.detailCardTitle, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                Dependencies
              </Text>
              <Ionicons name="pencil" size={14} color={COLORS.grayscale400} />
            </View>
            <Text style={[styles.detailCardDescription, { color: dark ? COLORS.grayscale400 : COLORS.greyscale900 }]}>
              {project.metadata?.dependencies || 'Tap to add project dependencies'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tasks Section */}
        <View style={styles.tasksSection}>
          <View style={styles.tasksSectionHeader}>
            <Text style={[styles.sectionTitle, { 
              color: dark ? COLORS.white : COLORS.greyscale900
            }]}>
              Tasks ({tasks.length})
            </Text>
            <TouchableOpacity
              style={styles.addTaskButton}
              onPress={() => navigation.navigate("addnewtaskform", { projectId: project.id })}
            >
              <Ionicons name="add" size={20} color={COLORS.white} />
              <Text style={styles.addTaskButtonText}>Add Task</Text>
            </TouchableOpacity>
          </View>
          
          {tasks.length === 0 ? (
            <View style={styles.emptyTasksContainer}>
              <Ionicons name="clipboard-outline" size={48} color={COLORS.grayscale400} />
              <Text style={[styles.emptyTasksText, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                No tasks yet
              </Text>
              <Text style={[styles.emptyTasksSubtext, { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 }]}>
                Start by adding your first task
              </Text>
            </View>
          ) : (
            <View style={styles.tasksList}>
              {tasks.map((task) => (
                <TaskCard 
                  key={task.id}
                  task={task} 
                  onPress={() => navigation.navigate("projectdetailsboarddetails", { 
                    projectId: project.id, 
                    taskId: task.id 
                  })}
                  onEdit={(field, value) => handleTaskEdit(task, field, value)}
                  onDelete={() => handleTaskDelete(task.id)}
                />
              ))}
            </View>
          )}
        </View>
      </Animated.ScrollView>
      
      {/* Custom Animated Date Picker Modal */}
      <Modal
        visible={showDatePickerModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeDatePickerModal}
      >
        <Animated.View
          style={[
            styles.teamModalOverlay,
            {
              opacity: datePickerOverlayOpacity,
            }
          ]}
        >
          <TouchableOpacity
            style={styles.teamModalTouchableOverlay}
            activeOpacity={1}
            onPress={closeDatePickerModal}
          >
            <Animated.View
              style={[
                styles.datePickerModalContainer,
                {
                  backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                  transform: [
                    {
                      translateY: datePickerModalAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [420, 0],
                      }),
                    },
                  ],
                  opacity: datePickerModalAnimation,
                },
              ]}
            >
              <TouchableOpacity activeOpacity={1} onPress={() => {}}>
                {/* Draggable Handle */}
                <View style={styles.teamModalHandle}>
                  <View style={[styles.teamModalDragIndicator, {
                    backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale200,
                  }]} />
                </View>
        <Text style={[styles.bottomSheetTitle, {
          color: dark ? COLORS.white : COLORS.greyscale900
        }]}>
          {datePickerType === 'edc' ? 'Estimated Completion Date' : 'Follow Up Date'}
        </Text>
        <View style={[styles.separateLine, {
          backgroundColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
          marginVertical: 12
        }]} />
        <View style={{ width: SIZES.width - 32 }}>
          <Calendar
            current={selectedDate}
            minDate={new Date().toISOString().split('T')[0]}
            maxDate={"2099-12-31"}
            onDayPress={(day: any) => {
              handleDateSave(day.dateString);
            }}
            markedDates={{
              [selectedDate]: {
                selected: true,
                selectedColor: COLORS.primary,
              },
            }}
            theme={{
              backgroundColor: dark ? COLORS.dark2 : "#F8FAFC",
              calendarBackground: dark ? COLORS.dark2 : "#F8FAFC",
              textSectionTitleColor: dark ? COLORS.white : "#000",
              selectedDayBackgroundColor: COLORS.primary,
              selectedDayTextColor: "#fff",
              todayTextColor: COLORS.primary,
              dayTextColor: dark ? COLORS.grayscale200 : "#222",
              arrowColor: COLORS.primary,
              monthTextColor: dark ? COLORS.white : "#000",
            }}
                />
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
        </Animated.View>
      </Modal>
      
      {/* Dropdown Modal */}
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="none"
        onRequestClose={hideDropdownMenu}
      >
        <Animated.View
          style={[
            styles.modalOverlay,
            {
              opacity: dropdownAnimation, // Animate background with same timing
            }
          ]}
        >
          <TouchableOpacity
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={hideDropdownMenu}
          >
          <Animated.View
            style={[
              styles.dropdownContainer,
              {
                backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                opacity: dropdownAnimation,
                transform: [
                  {
                    translateY: dropdownAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-10, 0],
                    }),
                  },
                  {
                    scale: dropdownAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1],
                    }),
                  },
                ],
              },
            ]}
          >
            {dropdownOptions.map((option, index) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.dropdownOption,
                  {
                    backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                    borderBottomWidth: index < dropdownOptions.length - 1 ? 1 : 0,
                    borderBottomColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                    borderTopLeftRadius: index === 0 ? 16 : 0,
                    borderTopRightRadius: index === 0 ? 16 : 0,
                    borderBottomLeftRadius: index === dropdownOptions.length - 1 ? 16 : 0,
                    borderBottomRightRadius: index === dropdownOptions.length - 1 ? 16 : 0,
                  },
                ]}
                onPress={option.onPress}
              >
                <Image
                  source={option.icon as ImageSourcePropType}
                  style={[
                    styles.dropdownIcon,
                    { tintColor: dark ? COLORS.white : COLORS.greyscale900 },
                  ]}
                />
                <Text
                  style={[
                    styles.dropdownText,
                    { color: dark ? COLORS.white : COLORS.greyscale900 },
                  ]}
                >
                  {option.title}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </TouchableOpacity>
        </Animated.View>
      </Modal>
      
      {/* Custom Animated Team Management Modal */}
      <Modal
        visible={showTeamModal}
        transparent={true}
        animationType="none"
        onRequestClose={closeTeamModal}
      >
        <Animated.View
          style={[
            styles.teamModalOverlay,
            {
              opacity: teamOverlayOpacity,
            }
          ]}
        >
          <TouchableOpacity
            style={styles.teamModalTouchableOverlay}
            activeOpacity={1}
            onPress={closeTeamModal}
          >
          <Animated.View
            style={[
              styles.teamModalContainer,
              {
                backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                transform: [
                  {
                    translateY: teamModalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [500, 0],
                    }),
                  },
                ],
                opacity: teamModalAnimation,
              },
            ]}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              {/* Draggable Handle */}
              <View style={styles.teamModalHandle}>
                <View style={[styles.teamModalDragIndicator, {
                  backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale200,
                }]} />
              </View>

              <Text style={[styles.bottomSheetTitle, {
                color: dark ? COLORS.white : COLORS.greyscale900,
                marginTop: 16,
                marginBottom: 16,
              }]}>
                Manage Team Members
              </Text>
        
        {/* Search Input */}
        <View style={[styles.searchContainer, {
          backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
          marginBottom: 16,
        }]}>
          <Ionicons name="search" size={20} color={COLORS.grayscale400} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, {
              color: dark ? COLORS.white : COLORS.greyscale900,
            }]}
            placeholder="Search users to add..."
            placeholderTextColor={COLORS.grayscale400}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              searchTeamMembers(text);
            }}
          />
        </View>

        {/* Current Team Members */}
        <Text style={[styles.sectionTitle, {
          color: dark ? COLORS.white : COLORS.greyscale900,
          marginBottom: 12,
        }]}>
          Current Team Members ({teamMembers.length})
        </Text>
        
        <ScrollView style={{ maxHeight: 150, marginBottom: 16 }}>
          {teamMembers.map((member) => (
            <View key={member.id} style={[styles.teamMemberItem, {
              backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
            }]}>
              <UserAvatar size={32} userId={member.user_id} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.memberName, {
                  color: dark ? COLORS.white : COLORS.greyscale900,
                }]}>
                  {member.user_name}
                </Text>
                <Text style={[styles.memberRole, {
                  color: COLORS.grayscale400,
                }]}>
                  Current: {memberRoles[member.user_id] || (member.user_name === project?.metadata?.project_lead ? 'Leader' : 'FYI')}
                </Text>
              </View>
              {/* Role Selection */}
              <View style={styles.roleSelector}>
                {['Leader', 'Collaborator', 'FYI'].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[styles.roleButton, {
                      backgroundColor: memberRoles[member.user_id] === role ? COLORS.primary : COLORS.grayscale200,
                    }]}
                    onPress={() => handleRoleChange(member.user_id, role)}
                  >
                    <Text style={[styles.roleButtonText, {
                      color: memberRoles[member.user_id] === role ? COLORS.white : COLORS.greyscale900,
                    }]}>
                      {role}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Search Results */}
        {searchQuery.length >= 2 && (
          <>
            <Text style={[styles.sectionTitle, {
              color: dark ? COLORS.white : COLORS.greyscale900,
              marginBottom: 12,
            }]}>
              Search Results ({searchUsers.length})
            </Text>
            
            <ScrollView style={{ maxHeight: 250 }}>
              {searchUsers.map((user) => (
                <View
                  key={user.id}
                  style={[styles.teamMemberItem, {
                    backgroundColor: selectedTeamMembers.includes(user.id) 
                      ? COLORS.primary + '20' 
                      : (dark ? COLORS.dark3 : COLORS.grayscale100),
                  }]}
                >
                  <TouchableOpacity 
                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                    onPress={() => handleTeamMemberSelect(user.id)}
                  >
                    <UserAvatar size={32} userId={user.id} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.memberName, {
                        color: dark ? COLORS.white : COLORS.greyscale900,
                      }]}>
                        {user.full_name || user.username}
                      </Text>
                      {user.username && user.full_name && (
                        <Text style={[styles.memberRole, {
                          color: COLORS.grayscale400,
                        }]}>
                          @{user.username}
                        </Text>
                      )}
                    </View>
                    {selectedTeamMembers.includes(user.id) && (
                      <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                    )}
                  </TouchableOpacity>
                  
                  {/* Role Selection for new members */}
                  {selectedTeamMembers.includes(user.id) && (
                    <View style={styles.roleSelector}>
                      {['Leader', 'Collaborator', 'FYI'].map((role) => (
                        <TouchableOpacity
                          key={role}
                          style={[styles.roleButton, {
                            backgroundColor: memberRoles[user.id] === role ? COLORS.primary : COLORS.grayscale200,
                          }]}
                          onPress={() => handleRoleChange(user.id, role)}
                        >
                          <Text style={[styles.roleButtonText, {
                            color: memberRoles[user.id] === role ? COLORS.white : COLORS.greyscale900,
                          }]}>
                            {role}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </>
        )}

        {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveTeamButton, {
                  backgroundColor: COLORS.primary,
                  marginTop: 16,
                  marginBottom: 16,
                }]}
                onPress={handleSaveTeamMembers}
              >
                <Text style={styles.saveTeamButtonText}>
                  Save Team Changes
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
        </Animated.View>
      </Modal>

              {/* Custom Animated Edit Project Modal */}
        <Modal
          visible={showEditProjectModal}
          transparent={true}
          animationType="none"
          onRequestClose={closeEditProjectModal}
        >
          <Animated.View
            style={[
              styles.teamModalOverlay,
              {
                opacity: editProjectOverlayOpacity,
              }
            ]}
          >
            <TouchableOpacity
              style={styles.teamModalTouchableOverlay}
              activeOpacity={1}
              onPress={closeEditProjectModal}
            >
              <Animated.View
                style={[
                  styles.editProjectModalContainer,
                  {
                    backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                    transform: [
                      {
                        translateY: editProjectModalAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [300, 0],
                        }),
                      },
                    ],
                    opacity: editProjectModalAnimation,
                  },
                ]}
              >
                <TouchableOpacity activeOpacity={1} onPress={() => {}}>
                  {/* Draggable Handle */}
                  <View style={styles.teamModalHandle}>
                    <View style={[styles.teamModalDragIndicator, {
                      backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale200,
                    }]} />
                  </View>
        <Text style={[styles.bottomSheetTitle, {
          color: dark ? COLORS.white : COLORS.greyscale900,
          marginTop: 16,
          marginBottom: 16,
        }]}>
          Edit Project Title and Description
        </Text>
        
        <TextInput
          style={[styles.editInput, {
            color: dark ? COLORS.white : COLORS.greyscale900,
          }]}
          placeholder="Enter new title"
          placeholderTextColor={COLORS.grayscale400}
          value={editTitle}
          onChangeText={(text) => setEditTitle(text)}
        />
        <TextInput
          style={[styles.editInput, {
            color: dark ? COLORS.white : COLORS.greyscale900,
          }]}
          placeholder="Enter new description"
          placeholderTextColor={COLORS.grayscale400}
          value={editDescription}
          onChangeText={(text) => setEditDescription(text)}
        />

        <View style={styles.editActions}>
          <TouchableOpacity
            style={[styles.cancelButton, {
              backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale200,
            }]}
            onPress={closeEditProjectModal}
          >
            <Text style={[styles.cancelButtonText, {
              color: dark ? COLORS.white : COLORS.greyscale900,
            }]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveButton, {
              backgroundColor: COLORS.primary,
            }]}
            onPress={handleSaveProject}
          >
            <Text style={[styles.saveButtonText, {
              color: dark ? COLORS.white : COLORS.greyscale900,
            }]}>
              Save
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
        </Animated.View>
      </Modal>

              {/* Custom Animated Category Management Modal */}
        <Modal
          visible={showCategoryModal}
          transparent={true}
          animationType="none"
          onRequestClose={closeCategoryModal}
        >
          <Animated.View
            style={[
              styles.teamModalOverlay,
              {
                opacity: categoryOverlayOpacity,
              }
            ]}
          >
            <TouchableOpacity
              style={styles.teamModalTouchableOverlay}
              activeOpacity={1}
              onPress={closeCategoryModal}
            >
              <Animated.View
                style={[
                  styles.categoryModalContainer,
                  {
                    backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                    transform: [
                      {
                        translateY: categoryModalAnimation.interpolate({
                          inputRange: [0, 1],
                          outputRange: [400, 0],
                        }),
                      },
                    ],
                    opacity: categoryModalAnimation,
                  },
                ]}
              >
                <TouchableOpacity activeOpacity={1} onPress={() => {}}>
                  {/* Draggable Handle */}
                  <View style={styles.teamModalHandle}>
                    <View style={[styles.teamModalDragIndicator, {
                      backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale200,
                    }]} />
                  </View>
        <Text style={[styles.bottomSheetTitle, {
          color: dark ? COLORS.white : COLORS.greyscale900,
          marginTop: 16,
          marginBottom: 16,
        }]}>
          Manage Categories
        </Text>
        
        {/* Add New Category */}
        <View style={[styles.searchContainer, {
          backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
          marginBottom: 16,
        }]}>
          <Ionicons name="add" size={20} color={COLORS.grayscale400} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, {
              color: dark ? COLORS.white : COLORS.greyscale900,
            }]}
            placeholder="Add new category..."
            placeholderTextColor={COLORS.grayscale400}
            value={newCategory}
            onChangeText={setNewCategory}
            onSubmitEditing={handleAddCategory}
          />
          <TouchableOpacity onPress={handleAddCategory} style={{ padding: 4 }}>
            <Ionicons name="checkmark" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Current Categories */}
        <Text style={[styles.sectionTitle, {
          color: dark ? COLORS.white : COLORS.greyscale900,
          marginBottom: 12,
        }]}>
          Current Categories ({projectCategories.length})
        </Text>
        
        <ScrollView style={{ maxHeight: 200, marginBottom: 16 }}>
          {projectCategories.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={[styles.memberRole, {
                color: COLORS.grayscale400,
                textAlign: 'center',
              }]}>
                No categories added yet. Add your first category above.
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {projectCategories.map((category: string, index: number) => (
                <View key={index} style={[styles.categoryPill, {
                  backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }]}>
                  <Text style={[styles.categoryText, {
                    color: dark ? COLORS.white : COLORS.greyscale900,
                    fontSize: 12,
                  }]}>
                    {category}
                  </Text>
                  <TouchableOpacity 
                    onPress={() => handleRemoveCategory(category)}
                    style={{ marginLeft: 6 }}
                  >
                    <Ionicons name="close" size={14} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveTeamButton, {
            backgroundColor: COLORS.primary,
            marginBottom: 16,
          }]}
          onPress={handleSaveCategories}
        >
          <Text style={styles.saveTeamButtonText}>
            Save Categories
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
        </Animated.View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  backButtonContainer: {
    padding: 12,
    // Removed marginTop and marginLeft to align with index.tsx bell icon positioning
  },
  editButtonContainer: {
    padding: 12,
    // Removed marginTop to align with index.tsx bell icon positioning
  },
  menuButtonContainer: {
    padding: 12,
    marginRight: 8, // Match index.tsx bell icon marginRight: 8
    // Removed marginTop to align with index.tsx bell icon positioning
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
    alignItems: "center",
    // Match index.tsx viewRight alignment
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
  statusText: {
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
  teamManageButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 96,
    paddingRight: 16,
  },
  dropdownContainer: {
    borderRadius: 16,
    shadowColor: COLORS.black,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
    minWidth: 200,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  dropdownIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: 'medium',
  },
  editableField: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontFamily: 'bold',
    marginBottom: 8,
  },
  editingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editInput: {
    borderWidth: 1,
    borderColor: COLORS.grayscale200,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    fontFamily: 'regular',
    backgroundColor: 'transparent',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'semiBold',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'semiBold',
    color: COLORS.white,
  },
  fieldValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldValue: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'regular',
  },
  tasksSection: {
    marginTop: 24,
  },
  tasksSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'semiBold',
  },
  tasksList: {
    flex: 1,
  },
  bottomSheetTitle: {
    fontSize: 20,
    fontFamily: 'bold',
    textAlign: 'center',
  },
  separateLine: {
    height: 1,
    width: '100%',
  },
  detailsGrid: {
    flexDirection: 'row',
    marginVertical: 16,
    gap: 16,
  },
  detailsColumn: {
    flex: 1,
  },
  emptyTasksSubtext: {
    fontSize: 14,
    fontFamily: 'regular',
    textAlign: 'center',
  },
  bannerContainer: {
    position: 'relative',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bannerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 16,
  },
  bannerTitle: {
    fontSize: 28,
    fontFamily: 'bold',
    color: COLORS.white,
    marginBottom: 12,
  },
  bannerDescription: {
    fontSize: 16,
    color: COLORS.white,
    fontFamily: 'regular',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  statusBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: 'semiBold',
  },
  progressCard: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressView: {
    width: 78,
    height: 32,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  detailsSection: {
    marginBottom: 24,
  },
  detailsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailCard: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  detailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailCardTitle: {
    fontSize: 16,
    fontFamily: 'bold',
    marginRight: 8,
  },
  detailCardValue: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'regular',
  },
  halfCard: {
    flex: 1,
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
  },
  budgetValue: {
    fontSize: 16,
    fontFamily: 'regular',
  },
  detailCardDescription: {
    fontSize: 14,
    fontFamily: 'regular',
  },
  projectCardHeader: {
    position: 'relative',
    overflow: 'hidden',
  },
  headerImageContainer: {
    position: 'relative',
    flex: 1,
  },
  headerImage: {
    width: '100%',
    resizeMode: 'cover',
  },
  headerControls: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    zIndex: 10, // Ensure controls stay above other elements
  },
  animatedElements: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60, // Space for bottom elements
  },
  statusTrafficLight: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetContainer: {
    position: 'absolute',
    bottom: 10,
    left: 80,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  budgetContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  budgetText: {
    color: COLORS.white,
    fontSize: 12,
    fontFamily: 'semiBold',
  },
  headerTeamMembers: {
    position: 'absolute',
    bottom: 30,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerMemberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.white,
    position: 'absolute',
    backgroundColor: COLORS.white, // Ensure solid white background
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
  },
  headerMoreMembers: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  headerMoreText: {
    color: COLORS.white,
    fontSize: 10,
    fontFamily: 'bold',
  },
  projectInfoBelowImage: {
    padding: 16,
    backgroundColor: 'transparent',
  },
  titleDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleDescriptionContainer: {
    flex: 1,
    marginRight: 16,
  },
  projectTitleBelow: {
    fontSize: 24,
    fontFamily: 'bold',
    marginBottom: 4,
  },
  projectDescriptionBelow: {
    fontSize: 14,
    fontFamily: 'regular',
    lineHeight: 20,
  },
  daysLeftBelowContainer: {
    alignItems: 'flex-end',
  },
  daysLeftBelowText: {
    fontSize: 12,
    fontFamily: 'regular',
  },
  progressRowBelow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  tasksCompletedBadgeBelow: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  tasksCompletedTextBelow: {
    fontSize: 12,
    color: COLORS.white,
    fontFamily: 'bold',
  },
  progressBarBelow: {
    flex: 1,
    borderRadius: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    padding: 8,
  },
  teamMemberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 2,
    borderColor: COLORS.grayscale200,
    borderRadius: 8,
  },
  memberName: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'bold',
  },
  memberRole: {
    fontSize: 12,
    fontFamily: 'regular',
  },
  saveTeamButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveTeamButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'bold',
  },
  projectLeadStar: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleSelector: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 4,
  },
  roleButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 60,
    alignItems: 'center',
  },
  roleButtonText: {
    fontSize: 10,
    fontFamily: 'semiBold',
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginRight: 8,
    maxWidth: 200, // Increased from 180 to accommodate extended header
  },
  categoryPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  moreCategoriesPill: {
    backgroundColor: COLORS.primary,
  },
  addCategoryPill: {
    backgroundColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: 'semiBold',
    color: COLORS.greyscale900,
  },
  // New styles for scrollable project info section
  projectInfoScrollable: {
    padding: 16,
    marginBottom: 24,
  },
  categorySection: {
    marginTop: 24,
  },
  categorySectionTitle: {
    fontSize: 14,
    fontFamily: 'semiBold',
    marginBottom: 8,
  },
  categoryContainerScrollable: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryPillScrollable: {
    backgroundColor: COLORS.grayscale100,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  moreCategoriesPillScrollable: {
    backgroundColor: COLORS.primary,
  },
  addCategoryPillScrollable: {
    backgroundColor: COLORS.primary,
  },
  categoryTextScrollable: {
    fontSize: 12,
    fontFamily: 'semiBold',
    color: COLORS.greyscale900,
  },
  sliderSection: {
    marginBottom: 24,
  },
  sliderContent: {
    paddingHorizontal: 16,
  },
  sliderCard: {
    width: 120,
    height: 120,
    borderRadius: 16,
    marginRight: 16,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sliderCardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderCardTitle: {
    fontSize: 12,
    fontFamily: 'semiBold',
    textAlign: 'center',
    marginBottom: 8,
  },
  progressCardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowStatusContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    fontSize: 8,
    fontFamily: 'regular',
    textAlign: 'center',
  },
  priorityBudgetContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityBadgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 4,
  },
  priorityTextSmall: {
    color: COLORS.white,
    fontSize: 8,
    fontFamily: 'semiBold',
  },
  budgetTextSmall: {
    fontSize: 10,
    fontFamily: 'semiBold',
    textAlign: 'center',
  },
  datesContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateItem: {
    alignItems: 'center',
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 8,
    fontFamily: 'regular',
    marginTop: 2,
  },
  dateValue: {
    fontSize: 8,
    fontFamily: 'semiBold',
    textAlign: 'center',
  },
  sliderTrafficLight: {
    marginBottom: 4,
    alignSelf: 'center',
  },
  prioritySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  budgetSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateTextContainer: {
    alignItems: 'center',
    marginLeft: 4,
  },
  // Custom Team Modal Styles
  teamModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  teamModalTouchableOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlayTouchable: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 96,
    paddingRight: 16,
  },
  teamModalContainer: {
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24,
    minHeight: 500,
    maxHeight: '90%',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  teamModalHandle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  teamModalDragIndicator: {
    width: 50,
    height: 5,
    borderRadius: 2.5,
  },
  // Date Picker Modal Styles
  datePickerModalContainer: {
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24,
    height: 420,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  // Edit Project Modal Styles
  editProjectModalContainer: {
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24,
    height: 300,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  // Category Modal Styles
  categoryModalContainer: {
    borderTopRightRadius: 24,
    borderTopLeftRadius: 24,
    height: 400,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
});

export default ProjectDetails;