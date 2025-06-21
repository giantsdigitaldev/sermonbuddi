import Button from '@/components/Button';
import UserAvatar from '@/components/UserAvatar';
import { COLORS, icons } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/theme/ThemeProvider';
import { Project, ProjectService, Task, TaskComment, TaskSubtask } from '@/utils/projectService';
import { SearchUser, TeamService } from '@/utils/teamService';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import { useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from "react-native-calendars";
import RBSheet from "react-native-raw-bottom-sheet";
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-virtualized-view';

const statuses = ["To-Do", "In-Progress", "Revision", "Completed"];
const priorities = ["Low", "Medium", "High", "Urgent"];

const TaskDetails = () => {
    const { colors, dark } = useTheme();
    const navigation = useNavigation<NavigationProp<any>>();
    const params = useLocalSearchParams();
    const projectId = params.projectId as string;
    const taskId = params.taskId as string;
    const { user } = useAuth();

    // State for task data
    const [project, setProject] = useState<Project | null>(null);
    const [task, setTask] = useState<Task | null>(null);
    const [subtasks, setSubtasks] = useState<TaskSubtask[]>([]);
    const [comments, setComments] = useState<TaskComment[]>([]);
    const [assignedUsers, setAssignedUsers] = useState<SearchUser[]>([]);
    const [createdByUser, setCreatedByUser] = useState<SearchUser | null>(null);
    const [loading, setLoading] = useState(true);

    // State for UI interactions
    const [comment, setComment] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string>("To-Do");
    const [selectedPriority, setSelectedPriority] = useState<string>("Medium");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

    // Refs for bottom sheets
    const refStatusRBSheet = useRef<any>(null);
    const refPriorityRBSheet = useRef<any>(null);
    const refDueDateRBSheet = useRef<any>(null);

    // Load complete task data
    const loadTaskData = useCallback(async () => {
        if (!projectId || !taskId) return;
        
        try {
            setLoading(true);
            
            // Load all task-related data
            const [projectData, taskDetails] = await Promise.all([
                ProjectService.getProject(projectId),
                ProjectService.getTaskDetails(taskId)
            ]);
            
            setProject(projectData);
            setTask(taskDetails.task);
            setSubtasks(taskDetails.subtasks);
            setComments(taskDetails.comments);
            
            // Set status and priority from task
            if (taskDetails.task) {
                const statusMapping = {
                    'todo': 'To-Do',
                    'in_progress': 'In-Progress', 
                    'completed': 'Completed',
                    'blocked': 'Revision'
                };
                const priorityMapping = {
                    'low': 'Low',
                    'medium': 'Medium',
                    'high': 'High', 
                    'urgent': 'Urgent'
                };
                
                setSelectedStatus(statusMapping[taskDetails.task.status as keyof typeof statusMapping] || 'To-Do');
                setSelectedPriority(priorityMapping[taskDetails.task.priority as keyof typeof priorityMapping] || 'Medium');
                
                if (taskDetails.task.due_date) {
                    setSelectedDate(taskDetails.task.due_date);
                }
                
                // Load assigned users and creator
                if (taskDetails.task.assigned_to && taskDetails.task.assigned_to.length > 0) {
                    const users = await Promise.all(
                        taskDetails.task.assigned_to.map(userId => TeamService.getUserById(userId))
                    );
                    setAssignedUsers(users.filter(u => u !== null) as SearchUser[]);
                }
                
                if (taskDetails.task.created_by) {
                    const creator = await TeamService.getUserById(taskDetails.task.created_by);
                    setCreatedByUser(creator);
                }
            }
        } catch (error) {
            console.error('Error loading task data:', error);
            Alert.alert('Error', 'Failed to load task data');
        } finally {
            setLoading(false);
        }
    }, [projectId, taskId]);

    useEffect(() => {
        loadTaskData();
    }, [loadTaskData]);

    useFocusEffect(
        useCallback(() => {
            loadTaskData();
        }, [loadTaskData])
    );

    // Handle task field updates
    const handleTaskUpdate = async (field: string, value: any) => {
        if (!task) return;
        
        try {
            const updatedTask = await ProjectService.updateTask(task.id, { [field]: value });
            if (updatedTask) {
                setTask(updatedTask);
                await ProjectService.updateProjectProgress(projectId);
            } else {
                Alert.alert('Error', 'Failed to update task');
            }
        } catch (error) {
            console.error('Error updating task:', error);
            Alert.alert('Error', 'Failed to update task');
        }
    };

    // Handle status change
    const handleStatusChange = async (status: string) => {
        const statusMap = {
            'To-Do': 'todo',
            'In-Progress': 'in_progress',
            'Completed': 'completed',
            'Revision': 'blocked'
        };
        
        setSelectedStatus(status);
        await handleTaskUpdate('status', statusMap[status as keyof typeof statusMap]);
        refStatusRBSheet.current?.close();
    };

    // Handle priority change
    const handlePriorityChange = async (priority: string) => {
        setSelectedPriority(priority);
        await handleTaskUpdate('priority', priority.toLowerCase());
        refPriorityRBSheet.current?.close();
    };

    // Handle due date change
    const handleDateChange = async (date: string) => {
        setSelectedDate(date);
        await handleTaskUpdate('due_date', date);
        refDueDateRBSheet.current?.close();
    };

    // Handle subtask operations
    const handleAddSubtask = async () => {
        if (!newSubtaskTitle.trim() || !task) return;
        
        try {
            const newSubtask = await ProjectService.createSubtask({
                task_id: task.id,
                title: newSubtaskTitle.trim(),
                completed: false,
                order_index: subtasks.length
            });
            
            if (newSubtask) {
                setSubtasks([...subtasks, newSubtask]);
                setNewSubtaskTitle('');
            }
        } catch (error) {
            console.error('Error adding subtask:', error);
            Alert.alert('Error', 'Failed to add subtask');
        }
    };

    const handleSubtaskToggle = async (subtaskId: string, completed: boolean) => {
        try {
            const updatedSubtask = await ProjectService.updateSubtask(subtaskId, { completed });
            if (updatedSubtask) {
                setSubtasks(subtasks.map(st => 
                    st.id === subtaskId ? { ...st, completed } : st
                ));
            }
        } catch (error) {
            console.error('Error updating subtask:', error);
        }
    };

    const handleDeleteSubtask = async (subtaskId: string) => {
        try {
            const success = await ProjectService.deleteSubtask(subtaskId);
            if (success) {
                setSubtasks(subtasks.filter(st => st.id !== subtaskId));
            }
        } catch (error) {
            console.error('Error deleting subtask:', error);
        }
    };

    // Handle comment operations
    const handleSendComment = async () => {
        if (!comment.trim() || !task || !user) return;
        
        try {
            const newComment = await ProjectService.createComment({
                task_id: task.id,
                user_id: user.id,
                content: comment.trim()
            });
            
            if (newComment) {
                setComments([...comments, newComment]);
                setComment('');
            }
        } catch (error) {
            console.error('Error sending comment:', error);
            Alert.alert('Error', 'Failed to send comment');
        }
    };

    // Handle task deletion
    const handleTaskDelete = async () => {
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
                                await ProjectService.updateProjectProgress(projectId);
                                navigation.goBack();
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

    // Helper function to get priority color
    const getPriorityColor = (priority: string) => {
        switch (priority.toLowerCase()) {
            case 'urgent': return '#ef4444';
            case 'high': return '#f97316';
            case 'medium': return '#eab308';
            case 'low': return '#22c55e';
            default: return '#6b7280';
        }
    };

    // Helper function to get status color
    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return '#22c55e';
            case 'in-progress': return '#3b82f6';
            case 'revision': return '#f59e0b';
            case 'to-do': return '#6b7280';
            default: return '#6b7280';
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={[styles.loadingText, { color: colors.text }]}>
                    Loading task details...
                </Text>
            </View>
        );
    }

    if (!task) {
        return (
            <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                <Text style={[styles.errorText, { color: colors.text }]}>
                    Task not found
                </Text>
                <Button
                    title="Go Back"
                    onPress={() => navigation.goBack()}
                    style={styles.goBackButton}
                />
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
            <StatusBar hidden />
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <View style={styles.headerLeft}>
                        <TouchableOpacity onPress={() => navigation.goBack()}>
                            <Image
                                source={icons.back}
                                resizeMode='contain'
                                style={[styles.backIcon, {
                                    tintColor: colors.text
                                }]} 
                            />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: colors.text }]}>
                            Task Details
                        </Text>
                    </View>
                    <View style={styles.viewRightContainer}>
                        <TouchableOpacity onPress={handleTaskDelete}>
                            <Ionicons name="trash-outline" size={24} color="#ef4444" />
                        </TouchableOpacity>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Task Title and Description */}
                    <View style={styles.taskInfoContainer}>
                        <Text style={[styles.taskTitle, { color: colors.text }]}>
                            {task.title}
                        </Text>
                        <Text style={[styles.taskDescription, { color: colors.text }]}>
                            {task.description}
                        </Text>
                    </View>

                    {/* Task Metadata */}
                    <View style={styles.metadataContainer}>
                        {/* Status */}
                        <TouchableOpacity
                            style={styles.metadataItem}
                            onPress={() => refStatusRBSheet.current?.open()}
                        >
                            <Text style={[styles.metadataLabel, { color: colors.text }]}>Status</Text>
                            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedStatus) }]}>
                                <Text style={styles.statusText}>{selectedStatus}</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Priority */}
                        <TouchableOpacity
                            style={styles.metadataItem}
                            onPress={() => refPriorityRBSheet.current?.open()}
                        >
                            <Text style={[styles.metadataLabel, { color: colors.text }]}>Priority</Text>
                            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(selectedPriority) }]}>
                                <Text style={styles.priorityText}>{selectedPriority}</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Due Date */}
                        <TouchableOpacity
                            style={styles.metadataItem}
                            onPress={() => refDueDateRBSheet.current?.open()}
                        >
                            <Text style={[styles.metadataLabel, { color: colors.text }]}>Due Date</Text>
                            <Text style={[styles.metadataValue, { color: colors.text }]}>
                                {selectedDate}
                            </Text>
                        </TouchableOpacity>

                        {/* Creator */}
                        <View style={styles.metadataItem}>
                            <Text style={[styles.metadataLabel, { color: colors.text }]}>Created By</Text>
                            <View style={styles.userContainer}>
                                <UserAvatar 
                                    user={createdByUser || { full_name: 'Unknown', avatar_url: null }}
                                    size={24}
                                />
                                <Text style={[styles.userName, { color: colors.text }]}>
                                    {createdByUser?.full_name || 'Unknown'}
                                </Text>
                            </View>
                        </View>

                        {/* Assigned Users */}
                        <View style={styles.metadataItem}>
                            <Text style={[styles.metadataLabel, { color: colors.text }]}>Assigned To</Text>
                            <View style={styles.assignedUsersContainer}>
                                {assignedUsers.map((assignedUser, index) => (
                                    <View key={index} style={styles.assignedUserItem}>
                                        <UserAvatar 
                                            user={assignedUser}
                                            size={24}
                                        />
                                        <Text style={[styles.userName, { color: colors.text }]}>
                                            {assignedUser.full_name}
                                        </Text>
                                    </View>
                                ))}
                                {assignedUsers.length === 0 && (
                                    <Text style={[styles.noAssigneeText, { color: colors.text }]}>
                                        No one assigned
                                    </Text>
                                )}
                            </View>
                        </View>
                    </View>

                    {/* Subtasks Section */}
                    <View style={styles.sectionContainer}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Subtasks ({subtasks.length})
                        </Text>
                        
                        {/* Add new subtask */}
                        <View style={styles.addSubtaskContainer}>
                            <TextInput
                                style={[styles.addSubtaskInput, { 
                                    backgroundColor: colors.background,
                                    borderColor: colors.border,
                                    color: colors.text 
                                }]}
                                placeholder="Add new subtask..."
                                placeholderTextColor={colors.textSecondary}
                                value={newSubtaskTitle}
                                onChangeText={setNewSubtaskTitle}
                                onSubmitEditing={handleAddSubtask}
                            />
                            <TouchableOpacity
                                style={styles.addSubtaskButton}
                                onPress={handleAddSubtask}
                            >
                                <Ionicons name="add" size={20} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>

                        {/* Subtasks list */}
                        {subtasks.map((subtask, index) => (
                            <View key={subtask.id} style={styles.subtaskItem}>
                                <TouchableOpacity
                                    style={styles.subtaskCheckbox}
                                    onPress={() => handleSubtaskToggle(subtask.id, !subtask.completed)}
                                >
                                    <Ionicons
                                        name={subtask.completed ? "checkmark-circle" : "ellipse-outline"}
                                        size={20}
                                        color={subtask.completed ? COLORS.primary : colors.textSecondary}
                                    />
                                </TouchableOpacity>
                                <Text style={[
                                    styles.subtaskTitle,
                                    { color: colors.text },
                                    subtask.completed && styles.subtaskCompleted
                                ]}>
                                    {subtask.title}
                                </Text>
                                <TouchableOpacity
                                    style={styles.deleteSubtaskButton}
                                    onPress={() => handleDeleteSubtask(subtask.id)}
                                >
                                    <Ionicons name="trash-outline" size={16} color="#ef4444" />
                                </TouchableOpacity>
                            </View>
                        ))}

                        {subtasks.length === 0 && (
                            <Text style={[styles.noSubtasksText, { color: colors.textSecondary }]}>
                                No subtasks yet. Add one above!
                            </Text>
                        )}
                    </View>

                    {/* Comments Section */}
                    <View style={styles.sectionContainer}>
                        <Text style={[styles.sectionTitle, { color: colors.text }]}>
                            Comments ({comments.length})
                        </Text>
                        
                        {/* Add comment */}
                        <View style={styles.addCommentContainer}>
                            <TextInput
                                style={[styles.commentInput, { 
                                    backgroundColor: colors.background,
                                    borderColor: colors.border,
                                    color: colors.text 
                                }]}
                                placeholder="Add a comment..."
                                placeholderTextColor={colors.textSecondary}
                                value={comment}
                                onChangeText={setComment}
                                multiline
                                numberOfLines={3}
                            />
                            <TouchableOpacity
                                style={styles.sendCommentButton}
                                onPress={handleSendComment}
                            >
                                <Ionicons name="send" size={20} color={COLORS.white} />
                            </TouchableOpacity>
                        </View>

                        {/* Comments list */}
                        {comments.map((taskComment, index) => (
                            <View key={taskComment.id} style={styles.commentItem}>
                                <UserAvatar 
                                    user={taskComment.user || { full_name: 'Unknown', avatar_url: null }}
                                    size={32}
                                />
                                <View style={styles.commentContent}>
                                    <View style={styles.commentHeader}>
                                        <Text style={[styles.commentAuthor, { color: colors.text }]}>
                                            {taskComment.user?.full_name || 'Unknown'}
                                        </Text>
                                        <Text style={[styles.commentDate, { color: colors.textSecondary }]}>
                                            {new Date(taskComment.created_at).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <Text style={[styles.commentText, { color: colors.text }]}>
                                        {taskComment.content}
                                    </Text>
                                </View>
                            </View>
                        ))}

                        {comments.length === 0 && (
                            <Text style={[styles.noCommentsText, { color: colors.textSecondary }]}>
                                No comments yet. Start the conversation!
                            </Text>
                        )}
                    </View>
                </ScrollView>
            </View>

            {/* Status Selection Bottom Sheet */}
            <RBSheet
                ref={refStatusRBSheet}
                height={300}
                openDuration={250}
                customStyles={{
                    wrapper: styles.bottomSheetWrapper,
                    draggableIcon: styles.bottomSheetDraggableIcon,
                    container: [styles.bottomSheetContainer, { backgroundColor: colors.background }]
                }}
            >
                <View style={styles.bottomSheetContent}>
                    <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>Select Status</Text>
                    {statuses.map((status, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.bottomSheetItem,
                                selectedStatus === status && styles.bottomSheetItemSelected
                            ]}
                            onPress={() => handleStatusChange(status)}
                        >
                            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(status) }]} />
                            <Text style={[
                                styles.bottomSheetItemText,
                                { color: colors.text },
                                selectedStatus === status && { color: COLORS.primary }
                            ]}>
                                {status}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </RBSheet>

            {/* Priority Selection Bottom Sheet */}
            <RBSheet
                ref={refPriorityRBSheet}
                height={300}
                openDuration={250}
                customStyles={{
                    wrapper: styles.bottomSheetWrapper,
                    draggableIcon: styles.bottomSheetDraggableIcon,
                    container: [styles.bottomSheetContainer, { backgroundColor: colors.background }]
                }}
            >
                <View style={styles.bottomSheetContent}>
                    <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>Select Priority</Text>
                    {priorities.map((priority, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.bottomSheetItem,
                                selectedPriority === priority && styles.bottomSheetItemSelected
                            ]}
                            onPress={() => handlePriorityChange(priority)}
                        >
                            <View style={[styles.priorityIndicator, { backgroundColor: getPriorityColor(priority) }]} />
                            <Text style={[
                                styles.bottomSheetItemText,
                                { color: colors.text },
                                selectedPriority === priority && { color: COLORS.primary }
                            ]}>
                                {priority}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </RBSheet>

            {/* Due Date Selection Bottom Sheet */}
            <RBSheet
                ref={refDueDateRBSheet}
                height={450}
                openDuration={250}
                customStyles={{
                    wrapper: styles.bottomSheetWrapper,
                    draggableIcon: styles.bottomSheetDraggableIcon,
                    container: [styles.bottomSheetContainer, { backgroundColor: colors.background }]
                }}
            >
                <View style={styles.bottomSheetContent}>
                    <Text style={[styles.bottomSheetTitle, { color: colors.text }]}>Select Due Date</Text>
                    <Calendar
                        current={selectedDate}
                        onDayPress={(day) => handleDateChange(day.dateString)}
                        markedDates={{
                            [selectedDate]: {
                                selected: true,
                                selectedColor: COLORS.primary
                            }
                        }}
                        theme={{
                            backgroundColor: colors.background,
                            calendarBackground: colors.background,
                            textSectionTitleColor: colors.text,
                            selectedDayBackgroundColor: COLORS.primary,
                            selectedDayTextColor: COLORS.white,
                            todayTextColor: COLORS.primary,
                            dayTextColor: colors.text,
                            textDisabledColor: colors.textSecondary,
                            arrowColor: COLORS.primary,
                            monthTextColor: colors.text,
                            indicatorColor: COLORS.primary,
                        }}
                    />
                </View>
            </RBSheet>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    area: {
        flex: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: 16,
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
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 18,
        marginBottom: 16,
        textAlign: 'center',
    },
    goBackButton: {
        marginTop: 16,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingTop: 10,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backIcon: {
        height: 24,
        width: 24,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    viewRightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    taskInfoContainer: {
        marginBottom: 24,
    },
    taskTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    taskDescription: {
        fontSize: 16,
        lineHeight: 24,
    },
    metadataContainer: {
        marginBottom: 24,
    },
    metadataItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    metadataLabel: {
        fontSize: 16,
        fontWeight: '500',
    },
    metadataValue: {
        fontSize: 16,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '500',
    },
    priorityBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    priorityText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '500',
    },
    userContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userName: {
        marginLeft: 8,
        fontSize: 16,
    },
    assignedUsersContainer: {
        flex: 1,
        alignItems: 'flex-end',
    },
    assignedUserItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    noAssigneeText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    addSubtaskContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    addSubtaskInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
    },
    addSubtaskButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subtaskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    subtaskCheckbox: {
        marginRight: 12,
    },
    subtaskTitle: {
        flex: 1,
        fontSize: 16,
    },
    subtaskCompleted: {
        textDecorationLine: 'line-through',
        opacity: 0.6,
    },
    deleteSubtaskButton: {
        padding: 4,
    },
    noSubtasksText: {
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 20,
    },
    addCommentContainer: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    commentInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    sendCommentButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'flex-start',
    },
    commentItem: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    commentContent: {
        flex: 1,
        marginLeft: 12,
    },
    commentHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    commentAuthor: {
        fontSize: 14,
        fontWeight: '500',
    },
    commentDate: {
        fontSize: 12,
    },
    commentText: {
        fontSize: 14,
        lineHeight: 20,
    },
    noCommentsText: {
        fontSize: 14,
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 20,
    },
    bottomSheetWrapper: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    bottomSheetContainer: {
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    bottomSheetDraggableIcon: {
        backgroundColor: '#ccc',
    },
    bottomSheetContent: {
        padding: 20,
    },
    bottomSheetTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    bottomSheetItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 8,
        borderRadius: 8,
    },
    bottomSheetItemSelected: {
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
    },
    bottomSheetItemText: {
        fontSize: 16,
        marginLeft: 12,
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    priorityIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
});

export default TaskDetails; 