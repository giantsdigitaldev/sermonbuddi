import UserAvatar from '@/components/UserAvatar';
import { COLORS, SIZES } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/theme/ThemeProvider';
import { Project, ProjectService, Task } from '@/utils/projectService';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Animated,
    Keyboard,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { Calendar } from 'react-native-calendars';

interface TaskDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  project: Project | null;
  tasks: Task[];
  currentTaskIndex: number;
  onTaskUpdate: (taskId: string, updates: any) => void;
  onTaskDelete: (taskId: string) => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  visible,
  onClose,
  project,
  tasks,
  currentTaskIndex,
  onTaskUpdate,
  onTaskDelete,
}) => {
  const { colors, dark } = useTheme();
  const { user } = useAuth();
  
  // State
  const [currentIndex, setCurrentIndex] = useState(currentTaskIndex);
  const [task, setTask] = useState<Task | null>(null);
  const [subtasks, setSubtasks] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newComment, setNewComment] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);
  
  // Modal state
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Subtask state
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  
  // Animation values
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // CI Color palette for diverse icons - using app's UI colors
  const iconColors = [
    COLORS.primary,      // Primary blue
    COLORS.success,      // Success green
    COLORS.warning,      // Warning orange
    COLORS.info,         // Info cyan
    COLORS.secondary,    // Secondary purple
    COLORS.tertiary,     // Tertiary pink
  ];

  // App UI colors for subtasks
  const subtaskColors = [
    COLORS.primary,      // Primary blue
    COLORS.success,      // Success green
    COLORS.warning,      // Warning orange
    COLORS.info,         // Info cyan
    COLORS.secondary,    // Secondary purple
    COLORS.tertiary,     // Tertiary pink
  ];

  // Animation functions
  const openModal = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(modalAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(modalAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  // Handle modal visibility changes
  useEffect(() => {
    if (visible) {
      openModal();
    }
  }, [visible]);

  // Load task data when currentIndex changes
  useEffect(() => {
    if (tasks.length > 0 && currentIndex >= 0 && currentIndex < tasks.length) {
      const currentTask = tasks[currentIndex];
      setTask(currentTask);
      loadTaskData(currentTask.id);
    }
  }, [currentIndex, tasks]);

  // Load task data
  const loadTaskData = useCallback(async (taskId: string) => {
    try {
      setLoading(true);
      const [taskSubtasks, taskComments] = await Promise.all([
        ProjectService.getTaskSubtasks(taskId),
        ProjectService.getTaskComments(taskId)
      ]);
      
      setSubtasks(taskSubtasks || []);
      setComments(taskComments || []);
      
      console.log('📋 Loaded task details:', {
        task: task?.title,
        subtasks: taskSubtasks?.length || 0,
        comments: taskComments?.length || 0
      });
    } catch (error) {
      console.error('Error loading task data:', error);
      Alert.alert('Error', 'Failed to load task data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Keyboard handling for subtask input
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        if (showSubtaskInput) {
          // Scroll to subtask input when keyboard appears
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      }
    );

    return () => {
      keyboardWillShowListener?.remove();
    };
  }, [showSubtaskInput]);

  // Navigation handlers
  const goToPreviousTask = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNextTask = () => {
    if (currentIndex < tasks.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  // Task update handlers
  const handleTaskUpdate = async (field: string, value: any) => {
    if (!task) return;
    
    try {
      const updatedTask = await ProjectService.updateTask(task.id, { [field]: value });
      if (updatedTask) {
        setTask(updatedTask);
        onTaskUpdate(task.id, { [field]: value });
        
        // Update project progress after task change
        if (project) {
          await ProjectService.updateProjectProgress(project.id);
        }
      } else {
        Alert.alert('Error', 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  // Subtask handlers
  const handleSubtaskToggle = async (subtaskId: string, completed: boolean) => {
    // Optimistic update - update UI immediately
    setSubtasks(prev => prev.map(subtask => 
      subtask.id === subtaskId ? { ...subtask, completed } : subtask
    ));

    try {
      // Update in background
      await ProjectService.updateSubtask(subtaskId, { completed });
    } catch (error) {
      console.error('Error updating subtask:', error);
      // Revert on error
      setSubtasks(prev => prev.map(subtask => 
        subtask.id === subtaskId ? { ...subtask, completed: !completed } : subtask
      ));
      Alert.alert('Error', 'Failed to update subtask');
    }
  };

  const handleAddSubtasks = async () => {
    if (!newSubtaskText.trim() || !task) return;

    // Split by commas and handle both single and multiple entries
    const subtaskTitles = newSubtaskText
      .split(',')
      .map(title => title.trim())
      .filter(title => title.length > 0);

    if (subtaskTitles.length === 0) return;

    // Optimistic update - add subtasks immediately
    const newSubtasks = subtaskTitles.map((title, index) => ({
      id: `temp-${Date.now()}-${index}`,
      title,
      completed: false,
      order_index: subtasks.length + index,
    }));

    setSubtasks(prev => [...prev, ...newSubtasks]);
    setNewSubtaskText('');
    setShowSubtaskInput(false);

    try {
      // Create subtasks in background
      for (const subtask of newSubtasks) {
        await ProjectService.createSubtask({
          task_id: task.id,
          title: subtask.title,
          completed: false,
          order_index: subtask.order_index,
        });
      }
      
      // Reload subtasks to get real IDs
      const realSubtasks = await ProjectService.getTaskSubtasks(task.id);
      setSubtasks(realSubtasks);
      
      console.log('✅ Subtasks created successfully');
    } catch (error) {
      console.error('Error creating subtasks:', error);
      // Revert on error
      setSubtasks(prev => prev.filter(s => !s.id.startsWith('temp-')));
      Alert.alert('Error', 'Failed to create subtasks');
    }
  };

  const handleSubtaskDelete = async (subtaskId: string) => {
    Alert.alert(
      'Delete Subtask',
      'Are you sure you want to delete this subtask?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await ProjectService.deleteSubtask(subtaskId);
              if (success) {
                setSubtasks(prev => prev.filter(s => s.id !== subtaskId));
                console.log('✅ Subtask deleted:', subtaskId);
              } else {
                Alert.alert('Error', 'Failed to delete subtask');
              }
            } catch (error) {
              console.error('Error deleting subtask:', error);
              Alert.alert('Error', 'Failed to delete subtask');
            }
          }
        }
      ]
    );
  };

  // Comment handlers
  const handlePostComment = async () => {
    if (!task || !newComment.trim() || isPostingComment) return;
    
    try {
      setIsPostingComment(true);
      const comment = await ProjectService.createComment({
        task_id: task.id,
        user_id: user?.id || '',
        content: newComment.trim()
      });
      
      if (comment) {
        setComments(prev => [comment, ...prev]);
        setNewComment('');
        console.log('✅ Comment posted successfully');
      } else {
        Alert.alert('Error', 'Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      Alert.alert('Error', 'Failed to post comment');
    } finally {
      setIsPostingComment(false);
    }
  };

  // Delete task handler
  const handleDeleteTask = () => {
    if (!task) return;
    
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
              const success = await ProjectService.deleteTask(task.id);
              if (success) {
                onTaskDelete(task.id);
                closeModal();
                console.log('✅ Task deleted:', task.id);
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

  // Edit handlers
  const startEditing = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const saveEdit = async () => {
    if (!task || !editingField) return;
    
    await handleTaskUpdate(editingField, editValue);
    setEditingField(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleTaskCompleteToggle = async () => {
    if (!task) return;
    
    const newStatus = task.status === 'completed' ? 'in_progress' : 'completed';
    
    try {
      const updatedTask = await ProjectService.updateTask(task.id, { status: newStatus });
      if (updatedTask) {
        setTask(updatedTask);
        onTaskUpdate(task.id, { status: newStatus });
        
        // If marking as completed, also mark all subtasks as completed
        if (newStatus === 'completed') {
          await handleCompleteAllSubtasks();
        }
        
        // Update project progress after task change
        if (project) {
          await ProjectService.updateProjectProgress(project.id);
        }
      } else {
        Alert.alert('Error', 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      Alert.alert('Error', 'Failed to update task');
    }
  };

  const handleCompleteAllSubtasks = async () => {
    if (!task || subtasks.length === 0) return;
    
    // Optimistic update - mark all subtasks as completed immediately
    setSubtasks(prev => prev.map(subtask => ({ ...subtask, completed: true })));
    
    try {
      // Update all subtasks in background
      const updatePromises = subtasks.map(subtask => 
        ProjectService.updateSubtask(subtask.id, { completed: true })
      );
      await Promise.all(updatePromises);
      
      console.log('✅ All subtasks marked as completed');
    } catch (error) {
      console.error('Error completing all subtasks:', error);
      // Revert on error
      setSubtasks(prev => prev.map(subtask => ({ ...subtask, completed: false })));
      Alert.alert('Error', 'Failed to complete all subtasks');
    }
  };

  if (!task) return null;

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={closeModal}
      >
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <TouchableOpacity
            style={styles.overlayTouchable}
            onPress={closeModal}
            activeOpacity={1}
          />
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [
                  {
                    translateY: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [SIZES.height, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {/* Drag Handle */}
            <View style={styles.dragHandle}>
              <View style={[styles.dragIndicator, {
                backgroundColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
              }]} />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <TouchableOpacity
                  onPress={handleTaskCompleteToggle}
                  style={[styles.titleIcon, { 
                    backgroundColor: task?.status === 'completed' 
                      ? iconColors[1] + '20' 
                      : iconColors[0] + '20' 
                  }]}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={task?.status === 'completed' ? "checkmark-circle" : "list"} 
                    size={20} 
                    color={task?.status === 'completed' ? iconColors[1] : iconColors[0]} 
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onLongPress={() => startEditing('title', task.title)}
                  style={styles.titleContainer}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.title, {
                    color: dark ? COLORS.white : COLORS.greyscale900,
                    textDecorationLine: task?.status === 'completed' ? 'line-through' : 'none',
                    opacity: task?.status === 'completed' ? 0.6 : 1,
                  }]}>
                    {task.title}
                  </Text>
                  <Text style={[styles.editHint, {
                    color: dark ? COLORS.grayscale400 : COLORS.grayscale700,
                  }]}>
                    Long press to edit
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <Ionicons 
                    name="close-circle" 
                    size={28} 
                    color={dark ? COLORS.grayscale400 : COLORS.grayscale700} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Navigation */}
            <View style={styles.navigationContainer}>
              <TouchableOpacity
                onPress={goToPreviousTask}
                disabled={currentIndex === 0}
                style={[styles.navButton, {
                  opacity: currentIndex === 0 ? 0.5 : 1,
                }]}
              >
                <Ionicons 
                  name="chevron-back" 
                  size={20} 
                  color={dark ? COLORS.white : COLORS.greyscale900} 
                />
              </TouchableOpacity>
              
              <Text style={[styles.navigationTitle, {
                color: dark ? COLORS.white : COLORS.greyscale900,
              }]}>
                {currentIndex + 1} of {tasks.length}
              </Text>
              
              <TouchableOpacity
                onPress={goToNextTask}
                disabled={currentIndex === tasks.length - 1}
                style={[styles.navButton, {
                  opacity: currentIndex === tasks.length - 1 ? 0.5 : 1,
                }]}
              >
                <Ionicons 
                  name="chevron-forward" 
                  size={20} 
                  color={dark ? COLORS.white : COLORS.greyscale900} 
                />
              </TouchableOpacity>
            </View>

            {/* Form Content */}
            <ScrollView 
              style={styles.content} 
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              contentContainerStyle={[
                styles.contentContainer,
                {
                  paddingBottom: keyboardVisible ? keyboardHeight + 100 : 100,
                }
              ]}
              nestedScrollEnabled={true}
              ref={scrollViewRef}
            >
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={[styles.loadingText, {
                    color: dark ? COLORS.white : COLORS.greyscale900,
                  }]}>
                    Loading task details...
                  </Text>
                </View>
              ) : (
                <>
                  
                  {/* Task Description */}
                  <View style={styles.inputSection}>
                    <View style={styles.labelContainer}>
                      <Ionicons name="chatbubble-ellipses" size={18} color={iconColors[2]} />
                      <Text style={[styles.label, {
                        color: dark ? COLORS.white : COLORS.greyscale900,
                      }]}>
                        Description
                      </Text>
                    </View>
                    {editingField === 'description' ? (
                      <View style={styles.editContainer}>
                        <TextInput
                          style={[styles.textArea, {
                            color: dark ? COLORS.white : COLORS.greyscale900,
                            backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                            borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                          }]}
                          value={editValue}
                          onChangeText={setEditValue}
                          multiline
                          numberOfLines={4}
                          autoFocus
                          onBlur={saveEdit}
                          onSubmitEditing={saveEdit}
                        />
                        <View style={styles.editButtons}>
                          <TouchableOpacity onPress={saveEdit} style={styles.saveButton}>
                            <Ionicons name="checkmark" size={20} color={COLORS.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={cancelEdit} style={styles.cancelButton}>
                            <Ionicons name="close" size={20} color={COLORS.error} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => startEditing('description', task.description || '')}
                        style={styles.editableField}
                      >
                        <Text style={[styles.taskDescription, {
                          color: dark ? COLORS.grayscale400 : COLORS.grayscale700,
                          fontSize: 16,
                          lineHeight: 24,
                          flex: 1,
                        }]}>
                          {task.description || 'No description provided'}
                        </Text>
                        <Ionicons name="pencil" size={16} color={COLORS.primary} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Due Date */}
                  <View style={styles.inputSection}>
                    <View style={styles.labelContainer}>
                      <Ionicons name="calendar" size={18} color={iconColors[3]} />
                      <Text style={[styles.label, {
                        color: dark ? COLORS.white : COLORS.greyscale900,
                      }]}>
                        Due Date
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(true)}
                      style={[styles.dateButton, {
                        backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                        borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                      }]}
                    >
                      <Text style={[styles.dateText, {
                        color: dark ? COLORS.white : COLORS.greyscale900,
                      }]}>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        }) : 'No due date set'}
                      </Text>
                      <Ionicons 
                        name="calendar-outline" 
                        size={20} 
                        color={iconColors[3]} 
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Subtasks */}
                  <View style={styles.inputSection}>
                    <View style={styles.labelContainer}>
                      <Ionicons name="checkmark-circle" size={18} color={iconColors[1]} />
                      <Text style={[styles.label, {
                        color: dark ? COLORS.white : COLORS.greyscale900,
                      }]}>
                        Subtasks ({subtasks.length})
                      </Text>
                      <TouchableOpacity
                        onPress={() => setShowSubtaskInput(!showSubtaskInput)}
                        style={styles.addSubtaskButton}
                      >
                        <Ionicons 
                          name={showSubtaskInput ? "remove" : "add"} 
                          size={20} 
                          color={iconColors[1]} 
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Subtask Input */}
                    {showSubtaskInput && (
                      <View style={styles.subtaskInputContainer}>
                        <TextInput
                          style={[styles.subtaskInput, {
                            color: dark ? COLORS.white : COLORS.greyscale900,
                            backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                            borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                          }]}
                          placeholder="Add subtasks (separate with commas)..."
                          placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale700}
                          value={newSubtaskText}
                          onChangeText={setNewSubtaskText}
                          multiline
                          numberOfLines={2}
                          onSubmitEditing={handleAddSubtasks}
                          onKeyPress={(e) => {
                            if (e.nativeEvent.key === 'Enter') {
                              handleAddSubtasks();
                            }
                          }}
                          onFocus={() => {
                            // Scroll to input when focused
                            setTimeout(() => {
                              scrollViewRef.current?.scrollToEnd({ animated: true });
                            }, 100);
                          }}
                          returnKeyType="done"
                          blurOnSubmit={false}
                        />
                        <TouchableOpacity
                          onPress={handleAddSubtasks}
                          style={[styles.addSubtaskActionButton, {
                            backgroundColor: iconColors[1],
                          }]}
                        >
                          <Ionicons name="add" size={20} color={COLORS.white} />
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* Subtasks List */}
                    <View style={styles.subtasksList}>
                      {subtasks.map((subtask, index) => {
                        // Use app UI colors for subtasks
                        const colorIndex = index % subtaskColors.length;
                        const backgroundColor = dark 
                          ? subtaskColors[colorIndex] + '20' 
                          : subtaskColors[colorIndex] + '15';
                        
                        return (
                          <View key={subtask.id} style={[styles.subtaskItem, {
                            backgroundColor: backgroundColor,
                            borderLeftWidth: 4,
                            borderLeftColor: subtaskColors[colorIndex],
                          }]}>
                            <TouchableOpacity
                              onPress={() => handleSubtaskToggle(subtask.id, !subtask.completed)}
                              style={styles.subtaskCheckbox}
                            >
                              <Ionicons
                                name={subtask.completed ? "checkbox" : "square-outline"}
                                size={20}
                                color={subtask.completed ? subtaskColors[colorIndex] : COLORS.grayscale400}
                              />
                            </TouchableOpacity>
                            
                            <Text style={[styles.subtaskText, {
                              color: dark ? COLORS.white : COLORS.greyscale900,
                              textDecorationLine: subtask.completed ? 'line-through' : 'none',
                              opacity: subtask.completed ? 0.6 : 1,
                            }]}>
                              {subtask.title}
                            </Text>
                            
                            <TouchableOpacity
                              onPress={() => handleSubtaskDelete(subtask.id)}
                              style={styles.deleteButton}
                            >
                              <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  {/* Comments */}
                  <View style={styles.inputSection}>
                    <View style={styles.labelContainer}>
                      <Ionicons name="chatbubbles" size={16} color={iconColors[5]} />
                      <Text style={[styles.label, {
                        color: dark ? COLORS.white : COLORS.greyscale900,
                      }]}>
                        Comments ({comments.length})
                      </Text>
                    </View>
                    
                    {/* Add Comment */}
                    <View style={styles.commentInputContainer}>
                      <UserAvatar
                        size={32}
                        style={styles.commentInputAvatar}
                      />
                      <View style={styles.commentInputSection}>
                        <TextInput
                          style={[styles.commentInput, {
                            color: dark ? COLORS.white : COLORS.greyscale900,
                            backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                            borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                          }]}
                          placeholder="Add a comment..."
                          placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale700}
                          value={newComment}
                          onChangeText={setNewComment}
                          multiline
                          numberOfLines={2}
                          onSubmitEditing={handlePostComment}
                          blurOnSubmit={false}
                        />
                        <TouchableOpacity
                          onPress={handlePostComment}
                          disabled={!newComment.trim() || isPostingComment}
                          style={[styles.postCommentButton, {
                            backgroundColor: newComment.trim() ? iconColors[5] : COLORS.grayscale400,
                          }]}
                        >
                          {isPostingComment ? (
                            <ActivityIndicator size="small" color={COLORS.white} />
                          ) : (
                            <Ionicons name="send" size={16} color={COLORS.white} />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    {/* Comments List */}
                    {comments.length > 0 && (
                      <View style={styles.commentsList}>
                        {comments.map((comment) => (
                          <View key={comment.id} style={styles.commentItem}>
                            <UserAvatar
                              size={32}
                              userId={comment.user_id}
                              style={styles.commentAvatar}
                            />
                            <View style={styles.commentContent}>
                              <Text style={[styles.commentAuthor, {
                                color: dark ? COLORS.white : COLORS.greyscale900,
                              }]}>
                                {comment.user?.full_name || 'Unknown User'}
                              </Text>
                              <Text style={[styles.commentText, {
                                color: dark ? COLORS.white : COLORS.greyscale900,
                              }]}>
                                {comment.content}
                              </Text>
                              <Text style={[styles.commentDate, {
                                color: dark ? COLORS.grayscale400 : COLORS.grayscale700,
                              }]}>
                                {new Date(comment.created_at).toLocaleDateString()}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </>
              )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.deleteTaskButton}
                onPress={handleDeleteTask}
              >
                <Ionicons name="trash" size={20} color={COLORS.white} />
                <Text style={styles.deleteTaskText}>Delete Task</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>

      {/* Calendar Modal */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.datePickerOverlay}>
          <TouchableOpacity
            style={styles.datePickerOverlayTouchable}
            onPress={() => setShowDatePicker(false)}
          />
          <View style={[styles.datePickerContainer, {
            backgroundColor: dark ? COLORS.dark2 : COLORS.white,
          }]}>
            <View style={styles.datePickerHeader}>
              <View style={styles.datePickerTitleContainer}>
                <Ionicons name="calendar" size={20} color={iconColors[3]} />
                <Text style={[styles.datePickerTitle, {
                  color: dark ? COLORS.white : COLORS.greyscale900,
                }]}>
                  Select Due Date
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={[styles.datePickerButton, { color: iconColors[3] }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <Calendar
              current={task?.due_date || new Date().toISOString().split('T')[0]}
              minDate={new Date().toISOString().split('T')[0]}
              maxDate="2099-12-31"
              onDayPress={async (day) => {
                if (task) {
                  try {
                    await ProjectService.updateTask(task.id, { due_date: day.dateString });
                    setTask(prev => prev ? { ...prev, due_date: day.dateString } : null);
                  } catch (error) {
                    console.error('Error updating due date:', error);
                    Alert.alert('Error', 'Failed to update due date');
                  }
                }
                setShowDatePicker(false);
              }}
              markedDates={{
                [task?.due_date || '']: {
                  selected: true,
                  selectedColor: iconColors[3],
                },
              }}
              theme={{
                backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                calendarBackground: dark ? COLORS.dark2 : COLORS.white,
                textSectionTitleColor: dark ? COLORS.white : COLORS.greyscale900,
                selectedDayBackgroundColor: iconColors[3],
                selectedDayTextColor: COLORS.white,
                todayTextColor: iconColors[3],
                dayTextColor: dark ? COLORS.white : COLORS.greyscale900,
                arrowColor: iconColors[3],
                monthTextColor: dark ? COLORS.white : COLORS.greyscale900,
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  overlayTouchable: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '75%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  dragHandle: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayscale200,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: 'bold',
  },
  editHint: {
    fontSize: 12,
    fontFamily: 'regular',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    padding: 4,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayscale200,
  },
  navButton: {
    padding: 8,
  },
  navigationTitle: {
    fontSize: 14,
    fontFamily: 'medium',
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'regular',
  },
  inputSection: {
    marginBottom: 20,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontFamily: 'semiBold',
    marginLeft: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'regular',
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'regular',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editContainer: {
    marginTop: 8,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  saveButton: {
    padding: 8,
  },
  cancelButton: {
    padding: 8,
  },
  taskTitle: {
    fontSize: 20,
    fontFamily: 'bold',
    lineHeight: 28,
  },
  taskDescription: {
    fontSize: 16,
    fontFamily: 'regular',
    lineHeight: 24,
    flex: 1,
  },
  dueDate: {
    fontSize: 16,
    fontFamily: 'medium',
  },
  editableField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  subtasksList: {
    gap: 8,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  subtaskCheckbox: {
    marginRight: 12,
  },
  subtaskText: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'regular',
  },
  deleteButton: {
    padding: 4,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'regular',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  commentInputAvatar: {
    marginRight: 12,
  },
  commentInputSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  commentInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'regular',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    minHeight: 40,
  },
  postCommentButton: {
    padding: 8,
    borderRadius: 8,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentsList: {
    gap: 12,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentAvatar: {
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentAuthor: {
    fontSize: 14,
    fontFamily: 'bold',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 16,
    fontFamily: 'regular',
    lineHeight: 24,
    marginBottom: 4,
  },
  commentDate: {
    fontSize: 12,
    fontFamily: 'regular',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayscale200,
  },
  deleteTaskButton: {
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  deleteTaskText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'bold',
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'regular',
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  datePickerOverlayTouchable: {
    flex: 1,
  },
  datePickerContainer: {
    height: SIZES.height * 0.75,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayscale200,
  },
  datePickerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  datePickerTitle: {
    fontSize: 18,
    fontFamily: 'semiBold',
  },
  datePickerButton: {
    fontSize: 16,
    fontFamily: 'medium',
  },
  addSubtaskButton: {
    padding: 8,
    marginLeft: 'auto',
  },
  subtaskInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 16,
    gap: 8,
  },
  subtaskInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'regular',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  addSubtaskActionButton: {
    padding: 8,
    borderRadius: 12,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TaskDetailsModal; 