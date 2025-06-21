import { COLORS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/theme/ThemeProvider';
import { ProjectService } from '@/utils/projectService';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
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
import { PanGestureHandler, State } from 'react-native-gesture-handler';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  projectId: string;
  onTaskCreated: () => void;
}

interface SubTask {
  id: string;
  title: string;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({
  visible,
  onClose,
  projectId,
  onTaskCreated,
}) => {
  const { colors, dark } = useTheme();
  const { user } = useAuth();
  
  // Form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [subtasksInput, setSubtasksInput] = useState('');
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal state
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Animation values
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const modalAnimation = useRef(new Animated.Value(0)).current;
  const panY = useRef(new Animated.Value(0)).current;
  const modalTranslateY = useRef(new Animated.Value(0)).current;

  // CI Color palette for diverse icons
  const iconColors = [
    COLORS.primary,      // Blue
    COLORS.success,      // Green
    COLORS.warning,      // Orange
    COLORS.info,         // Cyan
    COLORS.secondary,    // Purple
    COLORS.tertiary,     // Pink
  ];

  // Animation functions
  const openModal = () => {
    setShowDatePicker(false);
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(modalAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 60,
        friction: 12,
        delay: 50,
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
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      // Reset form
      setTaskTitle('');
      setTaskDescription('');
      setSelectedDate(new Date().toISOString().split('T')[0]);
      setSubtasksInput('');
      setSubtasks([]);
    });
  };

  // Gesture handler for swipe to close ONLY
  const onGestureEvent = (event: any) => {
    const { translationY, state, velocityY } = event.nativeEvent;

    if (state === State.ACTIVE) {
      // Only allow downward dragging (translationY >= 0)
      if (translationY >= 0) {
        panY.setValue(translationY);
      } else {
        panY.setValue(0);
      }
    }

    if (state === State.END) {
      // Close if dragged down > 120px or with a flick
      if (translationY > 120 || velocityY > 800) {
        Animated.parallel([
          Animated.timing(overlayOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(panY, {
            toValue: 800, // Animate off-screen
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onClose();
          panY.setValue(0);
        });
      } else {
        // Snap back to anchored position
        Animated.spring(panY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
  };

  // Handle modal visibility changes
  useEffect(() => {
    if (visible) {
      openModal();
    }
  }, [visible]);

  // Enhanced keyboard event listeners for iOS
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        const keyboardHeight = event.endCoordinates.height;
        setKeyboardHeight(keyboardHeight);
        setKeyboardVisible(true);
        // Only move modal up for keyboard on iOS
        if (Platform.OS === 'ios') {
          const moveUpAmount = Math.max(0, Math.min(keyboardHeight - 100, keyboardHeight * 0.2));
          Animated.timing(modalTranslateY, {
            toValue: -moveUpAmount,
            duration: event.duration || 250,
            useNativeDriver: true,
          }).start();
        }
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (event) => {
        setKeyboardHeight(0);
        setKeyboardVisible(false);
        // Return modal to anchored position
        if (Platform.OS === 'ios') {
          Animated.timing(modalTranslateY, {
            toValue: 0,
            duration: event.duration || 250,
            useNativeDriver: true,
          }).start();
        }
      }
    );

    return () => {
      keyboardWillShowListener?.remove();
      keyboardWillHideListener?.remove();
    };
  }, []);

  // Handle adding subtasks
  const handleAddSubtasks = () => {
    if (!subtasksInput.trim()) return;
    
    // Parse comma-separated subtasks
    const newSubtasks = subtasksInput
      .split(',')
      .map(task => task.trim())
      .filter(task => task.length > 0)
      .map(task => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        title: task,
      }));
    
    setSubtasks(prev => [...prev, ...newSubtasks]);
    setSubtasksInput('');
  };

  const handleSubtaskKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter') {
      handleAddSubtasks();
    }
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(prev => prev.filter(task => task.id !== id));
  };

  const handleCreateTask = async () => {
    if (!taskTitle.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    if (!taskDescription.trim()) {
      Alert.alert('Error', 'Please enter a task description');
      return;
    }

    try {
      setLoading(true);
      
      const taskData = {
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        project_id: projectId,
        status: 'todo' as const,
        priority: 'medium' as const,
        due_date: selectedDate,
        assigned_to: [user?.id || ''],
        created_by: user?.id || '',
      };

      const createdTask = await ProjectService.createTask(taskData);
      
      if (createdTask && subtasks.length > 0) {
        // Create subtasks
        for (const subtask of subtasks) {
          await ProjectService.createSubtask({
            task_id: createdTask.id,
            title: subtask.title,
            completed: false,
            order_index: 0
          });
        }
      }

      Alert.alert('Success', 'Task created successfully!');
      onTaskCreated();
      closeModal();
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Overlay */}
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: overlayOpacity,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={closeModal}
          />
        </Animated.View>

        {/* Modal Content */}
        <PanGestureHandler 
          onGestureEvent={onGestureEvent}
          activeOffsetY={[-10, 10]} // Activate on vertical movement
          failOffsetX={[-15, 15]} // Fail if horizontal movement is too much
          shouldCancelWhenOutside={false}
        >
          <Animated.View
            style={[
              styles.modalContainer,
              {
                backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                transform: [
                  {
                    translateY: Animated.add(
                      modalAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [600, 0],
                      }),
                      Animated.add(panY, modalTranslateY)
                    ),
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
                <View style={[styles.headerIcon, { backgroundColor: iconColors[0] + '20' }]}>
                  <Ionicons name="add-circle" size={24} color={iconColors[0]} />
                </View>
                <View>
                  <Text style={[styles.title, {
                    color: dark ? COLORS.white : COLORS.greyscale900,
                  }]}>
                    Add New Task
                  </Text>
                  <Text style={[styles.subtitle, {
                    color: dark ? COLORS.grayscale400 : COLORS.grayscale700,
                  }]}>
                    Create a new task for your project
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons 
                  name="close-circle" 
                  size={28} 
                  color={dark ? COLORS.grayscale400 : COLORS.grayscale700} 
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
            >
              {/* Task Title */}
              <View style={styles.inputSection}>
                <View style={styles.labelContainer}>
                  <Ionicons name="document-text" size={16} color={iconColors[1]} />
                  <Text style={[styles.label, {
                    color: dark ? COLORS.white : COLORS.greyscale900,
                  }]}>
                    Task Title *
                  </Text>
                </View>
                <TextInput
                  style={[styles.input, {
                    color: dark ? COLORS.white : COLORS.greyscale900,
                    backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                    borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                  }]}
                  placeholder="Enter task title..."
                  placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale700}
                  value={taskTitle}
                  onChangeText={setTaskTitle}
                  autoFocus={false}
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>

              {/* Task Description */}
              <View style={styles.inputSection}>
                <View style={styles.labelContainer}>
                  <Ionicons name="chatbubble-ellipses" size={16} color={iconColors[2]} />
                  <Text style={[styles.label, {
                    color: dark ? COLORS.white : COLORS.greyscale900,
                  }]}>
                    Description *
                  </Text>
                </View>
                <TextInput
                  style={[styles.textArea, {
                    color: dark ? COLORS.white : COLORS.greyscale900,
                    backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                    borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                  }]}
                  placeholder="Describe the task..."
                  placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale700}
                  value={taskDescription}
                  onChangeText={setTaskDescription}
                  multiline={true}
                  numberOfLines={3}
                  textAlignVertical="top"
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
              </View>

              {/* Due Date */}
              <View style={styles.inputSection}>
                <View style={styles.labelContainer}>
                  <Ionicons name="calendar" size={16} color={iconColors[3]} />
                  <Text style={[styles.label, {
                    color: dark ? COLORS.white : COLORS.greyscale900,
                  }]}>
                    Due Date
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.dateButton, {
                    backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                    borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                  }]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={[styles.dateText, {
                    color: dark ? COLORS.white : COLORS.greyscale900,
                  }]}>
                    {new Date(selectedDate).toLocaleDateString()}
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
                  <Ionicons name="list" size={16} color={iconColors[4]} />
                  <Text style={[styles.label, {
                    color: dark ? COLORS.white : COLORS.greyscale900,
                  }]}>
                    Subtasks
                  </Text>
                </View>
                <Text style={[styles.hint, {
                  color: dark ? COLORS.grayscale400 : COLORS.grayscale700,
                }]}>
                  Separate multiple subtasks with commas or press Enter
                </Text>
                <View style={styles.subtaskInputContainer}>
                  <TextInput
                    style={[styles.subtaskInput, {
                      color: dark ? COLORS.white : COLORS.greyscale900,
                      backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                      borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                    }]}
                    placeholder="e.g., Research, Design, Implement, Test"
                    placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale700}
                    value={subtasksInput}
                    onChangeText={setSubtasksInput}
                    onSubmitEditing={handleAddSubtasks}
                    returnKeyType="done"
                    blurOnSubmit={false}
                  />
                  <TouchableOpacity
                    style={[styles.addSubtaskButton, { backgroundColor: iconColors[4] }]}
                    onPress={handleAddSubtasks}
                  >
                    <Ionicons name="add" size={20} color={COLORS.white} />
                  </TouchableOpacity>
                </View>

                {/* Subtasks List */}
                {subtasks.length > 0 && (
                  <View style={styles.subtasksList}>
                    <Text style={[styles.subtasksListTitle, {
                      color: dark ? COLORS.white : COLORS.greyscale900,
                    }]}>
                      Added Subtasks ({subtasks.length})
                    </Text>
                    {subtasks.map((subtask, index) => (
                      <View key={subtask.id} style={[styles.subtaskItem, {
                        backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                      }]}>
                        <View style={styles.subtaskItemLeft}>
                          <Ionicons 
                            name="checkmark-circle-outline" 
                            size={16} 
                            color={iconColors[index % iconColors.length]} 
                          />
                          <Text style={[styles.subtaskItemText, {
                            color: dark ? COLORS.white : COLORS.greyscale900,
                          }]}>
                            {subtask.title}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.removeSubtaskButton}
                          onPress={() => handleRemoveSubtask(subtask.id)}
                        >
                          <Ionicons name="close-circle" size={16} color={COLORS.error} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.createTaskButton, {
                  backgroundColor: loading ? COLORS.grayscale400 : COLORS.primary,
                }]}
                onPress={handleCreateTask}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <Text style={styles.createTaskButtonText}>Create Task</Text>
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </PanGestureHandler>

        {/* Date Picker Modal */}
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.datePickerOverlay}>
            <TouchableOpacity
              style={styles.datePickerOverlay}
              activeOpacity={1}
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
                current={selectedDate}
                minDate={new Date().toISOString().split('T')[0]}
                maxDate="2099-12-31"
                onDayPress={(day) => {
                  setSelectedDate(day.dateString);
                  setShowDatePicker(false);
                }}
                markedDates={{
                  [selectedDate]: {
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
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    flex: 1,
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
    paddingVertical: 12,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: 'bold',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'regular',
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
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
  hint: {
    fontSize: 12,
    fontFamily: 'regular',
    marginBottom: 8,
    fontStyle: 'italic',
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
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'regular',
  },
  subtaskInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subtaskInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'regular',
  },
  addSubtaskButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtasksList: {
    marginTop: 12,
  },
  subtasksListTitle: {
    fontSize: 14,
    fontFamily: 'semiBold',
    marginBottom: 8,
  },
  subtaskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 6,
  },
  subtaskItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  subtaskItemText: {
    fontSize: 14,
    fontFamily: 'regular',
    marginLeft: 8,
    flex: 1,
  },
  removeSubtaskButton: {
    padding: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayscale200,
  },
  createTaskButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    minWidth: 0,
    width: '100%',
    marginTop: 0,
  },
  createTaskButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontFamily: 'bold',
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  datePickerContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
});

export default AddTaskModal; 