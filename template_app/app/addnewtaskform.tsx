import SubHeaderItem from '@/components/SubHeaderItem';
import UserAvatar from '@/components/UserAvatar';
import { COLORS, icons, images, SIZES } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/theme/ThemeProvider';
import { Project, ProjectService } from '@/utils/projectService';
import { SearchUser, TeamService } from '@/utils/teamService';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from "react-native-calendars";
import RBSheet from "react-native-raw-bottom-sheet";
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-virtualized-view';

const statuses = ["To-Do", "In-Progress", "Revision", "Completed"];
const priorities = ["Low", "Medium", "High", "Urgent"];

interface SubTask {
    id: string;
    title: string;
    completed: boolean;
}

const AddNewTaskForm = () => {
    const { colors, dark } = useTheme();
    const navigation = useNavigation<NavigationProp<any>>();
    const params = useLocalSearchParams();
    const { user } = useAuth();
    
    // 🚨 CRITICAL FIX: Completely stabilize projectId to prevent route reprocessing
    const [stableProjectId, setStableProjectId] = useState<string>('');
    
    // Initialize projectId once and never change it during component lifecycle
    useEffect(() => {
        if (!stableProjectId) {
            const searchParams = params as any;
            const possibleProjectId = searchParams?.projectId || 
                                     searchParams?.project_id || 
                                     searchParams?.id ||
                                     searchParams?.project ||
                                     searchParams?.pid;
            
            if (possibleProjectId) {
                setStableProjectId(possibleProjectId as string);
            }
        }
    }, []); // Empty dependency array to run only once

    // Use refs to prevent multiple calls and infinite loops
    const dataLoaded = useRef(false);
    const currentProjectId = useRef(stableProjectId);
    
    // Update currentProjectId ref when stableProjectId changes
    useEffect(() => {
        if (stableProjectId && currentProjectId.current !== stableProjectId) {
            currentProjectId.current = stableProjectId;
            console.log('🔄 Updated currentProjectId ref to:', stableProjectId);
        }
    }, [stableProjectId]);

    // Task data state
    const [taskTitle, setTaskTitle] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string>("To-Do");
    const [selectedPriority, setSelectedPriority] = useState<string>("Medium");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [taskImage, setTaskImage] = useState<string | null>(null);
    const [subtasks, setSubtasks] = useState<SubTask[]>([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
    const [comment, setComment] = useState("");
    const [completedTasks, setCompletedTasks] = useState<{ [key: string]: boolean }>({});

    // Project and user data
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [assignedUsers, setAssignedUsers] = useState<SearchUser[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [tempSelectedUsers, setTempSelectedUsers] = useState<SearchUser[]>([]);

    // Refs for bottom sheets
    const refStatusRBSheet = useRef<any>(null);
    const refPriorityRBSheet = useRef<any>(null);
    const refDueDateRBSheet = useRef<any>(null);
    const refAttachmentRBSheet = useRef<any>(null);
    const refTeamSearchRBSheet = useRef<any>(null);

    // Mock participants for now
    const participants = [images.user2, images.user3, images.user4, images.user5, images.user6, images.user1, images.user7];

    // Load project data with infinite loop prevention
    const loadData = useCallback(async () => {
        // Prevent multiple calls and infinite loops
        if (dataLoaded.current) return;
        
        const currentId = stableProjectId;
        if (!currentId) {
            // Fallback: Try to get the most recent project
            try {
                const projects = await ProjectService.getProjects();
                if (projects && projects.length > 0) {
                    const recentProject = projects[0];
                    console.log('🔄 Using fallback project:', recentProject.id, recentProject.name);
                    setProject(recentProject);
                }
            } catch (error) {
                console.error('❌ Error fetching fallback project:', error);
            }
            setLoading(false);
            dataLoaded.current = true;
            return;
        }
        
        try {
            setLoading(true);
            dataLoaded.current = true; // Set flag before API call
            console.log('📋 Project ID resolved:', currentId);
            const projectData = await ProjectService.getProject(currentId);
            setProject(projectData);
            console.log('✅ Project loaded for task creation:', projectData?.name);
        } catch (error) {
            console.error('Error loading project data:', error);
            Alert.alert('Error', 'Failed to load project data');
        } finally {
            setLoading(false);
        }
    }, []); // Empty dependency array to prevent recreation

    useEffect(() => {
        // Only load if stableProjectId changed or first time
        if (!dataLoaded.current || currentProjectId.current !== stableProjectId) {
            dataLoaded.current = false; // Reset flag when stableProjectId changes
            currentProjectId.current = stableProjectId;
            loadData();
        }
        
        return () => {
            // Reset flag on unmount
            dataLoaded.current = false;
            // Clear any pending search timeouts
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [stableProjectId, loadData]);

         // Handle user search with debouncing
     const handleUserSearch = useCallback(async (query: string) => {
         if (!query.trim()) {
             setSearchResults([]);
             return;
         }

         console.log('🔍 Searching users with query:', query);
         setSearchLoading(true);
         
         try {
             const searchResult = await TeamService.searchUsers(query, 20);
             // Extract users array from the search result
             const users = Array.isArray(searchResult) ? searchResult : searchResult.users || [];
             setSearchResults(users);
             console.log('✅ User search results:', users.length);
         } catch (error) {
             console.error('❌ Error searching users:', error);
             setSearchResults([]);
         } finally {
             setSearchLoading(false);
         }
     }, []);

    // Handle user selection toggle
    const handleUserToggle = (user: SearchUser) => {
        const isSelected = tempSelectedUsers.some(u => u.id === user.id);
        
        if (isSelected) {
            setTempSelectedUsers(prev => prev.filter(u => u.id !== user.id));
        } else {
            setTempSelectedUsers(prev => [...prev, user]);
        }
        
        console.log('👤 User toggled:', user.full_name, isSelected ? 'removed' : 'added');
    };

    // Handle confirming user selection
    const handleConfirmUserSelection = () => {
        const newUsers = tempSelectedUsers.filter(user => 
            !assignedUsers.some(assigned => assigned.id === user.id)
        );
        
        setAssignedUsers(prev => [...prev, ...newUsers]);
        setTempSelectedUsers([]);
        setSearchQuery('');
        setSearchResults([]);
        refTeamSearchRBSheet.current?.close();
        
        console.log('✅ Users assigned to task:', newUsers.map(u => u.full_name));
    };

    // Handle opening team search
    const handleOpenTeamSearch = () => {
        setTempSelectedUsers([]);
        refTeamSearchRBSheet.current?.open();
    };

    // Handle image picker
    const handleImagePicker = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [16, 9],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setTaskImage(result.assets[0].uri);
                console.log('📷 Image selected for task');
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick image');
        }
        refAttachmentRBSheet.current?.close();
    };

    // Handle subtask addition
    const handleAddSubtask = () => {
        if (!newSubtaskTitle.trim()) return;
        
        const newSubtask: SubTask = {
            id: Date.now().toString(),
            title: newSubtaskTitle.trim(),
            completed: false
        };
        
        setSubtasks(prev => [...prev, newSubtask]);
        setNewSubtaskTitle("");
        console.log('➕ Added subtask:', newSubtask.title);
    };

    // Handle subtask toggle
    const handleSubtaskToggle = (id: string, completed: boolean) => {
        setSubtasks(prev => prev.map(task => 
            task.id === id ? { ...task, completed } : task
        ));
        setCompletedTasks(prev => ({ ...prev, [id]: completed }));
    };

    // Handle comment submission
    const handleSendComment = () => {
        if (comment.trim().length > 0) {
            console.log("💬 Comment added:", comment);
            setComment("");
            // In a real app, this would save to database
        }
    };

    // Add debounce ref for search only
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearchChange = useCallback((text: string) => {
        setSearchQuery(text);
        
        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        // Debounce the search to prevent excessive API calls
        searchTimeoutRef.current = setTimeout(() => {
            handleUserSearch(text);
        }, 300);
    }, [handleUserSearch]);

         // Handle task creation
     const handleCreateTask = async () => {
         console.log('🚀 Starting task creation...');
         
         // Validation
         if (!taskTitle.trim()) {
             Alert.alert('Validation Error', 'Please enter a task title');
             return;
         }
         
         if (!taskDescription.trim()) {
             Alert.alert('Validation Error', 'Please enter a task description');
             return;
         }
         
         const currentProjectId = project?.id || stableProjectId;
         if (!currentProjectId) {
             Alert.alert('Error', 'No project ID available');
             return;
         }

         console.log('📋 Creating task for project:', currentProjectId);
         
         try {
             setLoading(true);
             
             // Create task data with all required fields
             const taskData = {
                 title: taskTitle.trim(),
                 description: taskDescription.trim(),
                 project_id: currentProjectId,
                 status: selectedStatus.toLowerCase().replace(/[-\s]/g, '_').replace('to_do', 'todo') as 'todo' | 'in_progress' | 'completed' | 'blocked',
                 priority: selectedPriority.toLowerCase() as 'low' | 'medium' | 'high' | 'urgent',
                 due_date: selectedDate,
                 assigned_to: assignedUsers.map(u => u.id),
                 created_by: user?.id,
                 metadata: {
                     attachments: taskImage ? [taskImage] : [],
                 },
             };

             console.log('📝 Task data prepared:', taskData);
             
             const createdTask = await ProjectService.createTask(taskData);
             
             if (createdTask) {
                 console.log('✅ Task created successfully:', createdTask.id);
                 
                 // Create subtasks if any
                 if (subtasks.length > 0) {
                     console.log('📝 Creating subtasks...');
                     for (let i = 0; i < subtasks.length; i++) {
                         const subtask = subtasks[i];
                         await ProjectService.createSubtask({
                             task_id: createdTask.id,
                             title: subtask.title,
                             completed: subtask.completed,
                             order_index: i
                         });
                     }
                     console.log('✅ Subtasks created successfully');
                 }
                 
                 // Add initial comment if provided
                 if (comment.trim()) {
                     console.log('💬 Adding initial comment...');
                     await ProjectService.createComment({
                         task_id: createdTask.id,
                         user_id: user?.id || '',
                         content: comment.trim()
                     });
                     console.log('✅ Initial comment added');
                 }
                 
                 // Send notifications to assigned users
                 let notificationResults = { sent: 0, failed: 0 };
                 if (assignedUsers.length > 0) {
                     console.log('📧 Sending notifications to assigned users...');
                     const { TeamService } = await import('@/utils/teamService');
                     
                     for (const assignedUser of assignedUsers) {
                         try {
                             const notificationSent = await TeamService.sendInAppNotification(assignedUser.id, {
                                 type: 'task_assigned',
                                 title: 'New Task Assigned',
                                 message: `You've been assigned to task: ${taskTitle}`,
                                 data: {
                                     taskId: createdTask.id,
                                     projectId: currentProjectId,
                                     projectName: project?.name
                                 }
                             });
                             
                             if (notificationSent) {
                                 console.log('✅ Notification sent to:', assignedUser.full_name);
                                 notificationResults.sent++;
                             } else {
                                 console.log('⚠️ Notification failed for:', assignedUser.full_name);
                                 notificationResults.failed++;
                             }
                         } catch (notificationError) {
                             console.error('❌ Failed to send notification to user:', assignedUser.id, notificationError);
                             notificationResults.failed++;
                         }
                     }
                 }
                 
                 // Create success message with notification status
                 let successMessage = 'Task created successfully!';
                 if (assignedUsers.length > 0) {
                     if (notificationResults.sent > 0 && notificationResults.failed === 0) {
                         successMessage += `\n\n✅ Notifications sent to all ${notificationResults.sent} assigned users.`;
                     } else if (notificationResults.sent > 0 && notificationResults.failed > 0) {
                         successMessage += `\n\n⚠️ Notifications sent to ${notificationResults.sent} users, but ${notificationResults.failed} failed.`;
                     } else if (notificationResults.failed > 0) {
                         successMessage += `\n\n⚠️ Notifications could not be sent (${notificationResults.failed} failed). Check notification settings.`;
                     }
                 }

                 console.log('🎉 Task creation completed! Preparing navigation...');
                 console.log('📍 Current project ID for navigation:', currentProjectId);
                 console.log('📍 Stable project ID for navigation:', stableProjectId);
                 
                 // Navigate immediately without Alert for better UX
                 const projectIdToUse = currentProjectId || stableProjectId;
                 console.log('🔄 Using project ID for navigation:', projectIdToUse);
                 
                 if (!projectIdToUse) {
                     console.error('❌ No project ID available for navigation!');
                     Alert.alert('Success', successMessage + '\n\nPlease go back to projects manually.');
                     return;
                 }

                 try {
                     console.log('🚀 Attempting navigation to project details...');
                     
                     // Method 1: Try expo-router first (most reliable for expo-router apps)
                     console.log('📱 Method 1: Trying router.push...');
                     router.push(`/projectdetails?projectId=${projectIdToUse}` as any);
                     console.log('✅ Router.push successful!');
                     
                     // Show success message after navigation starts
                     setTimeout(() => {
                         Alert.alert('Success', successMessage);
                     }, 500);
                     
                 } catch (routerError) {
                     console.error('❌ Router.push failed:', routerError);
                     
                     try {
                         console.log('📱 Method 2: Trying router.replace...');
                         router.replace(`/projectdetails?projectId=${projectIdToUse}` as any);
                         console.log('✅ Router.replace successful!');
                         
                         setTimeout(() => {
                             Alert.alert('Success', successMessage);
                         }, 500);
                         
                     } catch (replaceError) {
                         console.error('❌ Router.replace failed:', replaceError);
                         
                         try {
                             console.log('📱 Method 3: Trying navigation.navigate...');
                             navigation.navigate("projectdetails", { projectId: projectIdToUse });
                             console.log('✅ Navigation.navigate successful!');
                             
                             setTimeout(() => {
                                 Alert.alert('Success', successMessage);
                             }, 500);
                             
                         } catch (navError) {
                             console.error('❌ All navigation methods failed:', navError);
                             
                             // Fallback: Show alert with manual navigation instruction
                             Alert.alert(
                                 'Success', 
                                 successMessage + '\n\nNavigation failed. Please go back to see your new task.',
                                 [
                                     {
                                         text: 'Go to Projects',
                                         onPress: () => {
                                             try {
                                                 router.push(('/projectdetails?projectId=' + projectIdToUse) as any);
                                             } catch (e) {
                                                 console.error('Manual navigation failed:', e);
                                             }
                                         }
                                     },
                                     { text: 'OK' }
                                 ]
                             );
                         }
                     }
                 }
             } else {
                 throw new Error('Failed to create task');
             }
         } catch (error) {
             console.error('❌ Error creating task:', error);
             Alert.alert('Error', 'Failed to create task. Please try again.');
         } finally {
             setLoading(false);
         }
     };

    // Render header
    const renderHeader = () => {
        return (
            <View style={styles.headerContainer}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => {
                        console.log('🔙 Back button pressed');
                        try {
                            if (navigation.canGoBack()) {
                                console.log('✅ Can go back, using navigation.goBack()');
                                navigation.goBack();
                            } else {
                                console.log('❌ Cannot go back, using router.back()');
                                router.back();
                            }
                        } catch (error) {
                            console.error('❌ Back navigation failed:', error);
                            console.log('🔄 Trying fallback navigation to projects');
                            try {
                                router.push('/projects' as any);
                            } catch (fallbackError) {
                                console.error('❌ Fallback navigation failed:', fallbackError);
                            }
                        }
                    }}>
                        <Image
                            source={icons.back}
                            resizeMode='contain'
                            style={[styles.backIcon, {
                                tintColor: dark ? COLORS.white : COLORS.black
                            }]} 
                        />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, {
                        color: dark ? COLORS.white : COLORS.black
                    }]}>Create New Task</Text>
                </View>
                <View style={styles.viewRightContainer}>
                    <TouchableOpacity onPress={handleCreateTask} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator size="small" color={COLORS.primary} />
                        ) : (
                            <Ionicons name="checkmark" size={24} color={COLORS.primary} />
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        )
    };

    if (loading && !project) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: dark ? COLORS.dark1 : COLORS.white }]}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={[styles.loadingText, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                    Loading project...
                </Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
            <StatusBar hidden />
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {renderHeader()}
                <ScrollView 
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Task Image Section */}
                    <View>
                        <Image
                            source={taskImage ? { uri: taskImage } : images.projectImage}
                            resizeMode='cover'
                            style={styles.projectImage}
                        />
                        <TouchableOpacity 
                            style={styles.editIconContainer}
                            onPress={() => refAttachmentRBSheet.current?.open()}
                        >
                            <Image
                                source={icons.editPencil}
                                resizeMode='contain'
                                style={styles.editIcon}
                            />
                        </TouchableOpacity>
                    </View>

                    <View>
                        {/* ✨ CLEAN TITLE INPUT - No avatar dependencies */}
                        <View style={styles.inputSection}>
                            <Text style={[styles.inputLabel, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                                Task Title
                            </Text>
                            <TextInput
                                key="task-title-input-stable"
                                style={[styles.cleanTitleInput, {
                                    color: dark ? COLORS.white : COLORS.greyscale900,
                                    backgroundColor: dark ? COLORS.dark3 : COLORS.white,
                                    borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                                }]}
                                placeholder="Enter task title..."
                                placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale700}
                                value={taskTitle}
                                onChangeText={setTaskTitle}
                                autoFocus={false}
                                blurOnSubmit={false}
                                returnKeyType="next"
                                keyboardType="default"
                                autoComplete="off"
                                autoCorrect={false}
                                autoCapitalize="sentences"
                                selectTextOnFocus={false}
                                clearButtonMode="never"
                            />
                        </View>

                        {/* ✨ CLEAN DESCRIPTION INPUT - No avatar dependencies */}
                        <View style={styles.inputSection}>
                            <Text style={[styles.inputLabel, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                                Description
                            </Text>
                            <TextInput
                                key="task-description-input-stable"
                                style={[styles.cleanDescriptionInput, {
                                    color: dark ? COLORS.white : COLORS.greyscale900,
                                    backgroundColor: dark ? COLORS.dark3 : COLORS.white,
                                    borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                                }]}
                                placeholder="Describe the task in detail..."
                                placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale700}
                                value={taskDescription}
                                onChangeText={setTaskDescription}
                                multiline={true}
                                numberOfLines={4}
                                textAlignVertical="top"
                                autoFocus={false}
                                blurOnSubmit={false}
                                autoComplete="off"
                                autoCorrect={true}
                                autoCapitalize="sentences"
                                selectTextOnFocus={false}
                            />
                        </View>

                        <View style={{ marginVertical: 12 }}>
                            {/* Team Section - Static avatars only */}
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionLeftContainer}>
                                    <Image
                                        source={icons.people2}
                                        resizeMode='contain'
                                        style={[styles.sectionIcon, {
                                            tintColor: dark ? "#EEEEEE" : COLORS.grayscale700,
                                        }]}
                                    />
                                    <Text style={[styles.sectionTitle, {
                                        color: dark ? "#EEEEEE" : COLORS.grayscale700
                                    }]}>Team</Text>
                                </View>

                                {/* 🖼️ REAL USER AVATARS */}
                                <View style={styles.avatars}>
                                    {assignedUsers.slice(0, 3).map((user, index) => (
                                        <UserAvatar
                                            key={user.id}
                                            size={36}
                                            userId={user.id}
                                            style={[styles.teamAvatar, {
                                                marginLeft: index > 0 ? -10 : 0,
                                            }]}
                                        />
                                    ))}
                                    {assignedUsers.length > 3 && (
                                        <View style={[styles.moreMembers, {
                                            marginLeft: -10,
                                            backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale200,
                                        }]}>
                                            <Text style={[styles.moreText, {
                                                color: dark ? COLORS.white : COLORS.greyscale900
                                            }]}>+{assignedUsers.length - 3}</Text>
                                        </View>
                                    )}
                                </View>
                                <TouchableOpacity
                                    onPress={handleOpenTeamSearch}
                                    style={styles.plusIcon}
                                >
                                    <Text style={styles.plusText}>+</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Creator Section - Static avatar */}
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionLeftContainer}>
                                    <Image
                                        source={icons.user3}
                                        resizeMode='contain'
                                        style={[styles.sectionIcon, {
                                            tintColor: dark ? "#EEEEEE" : COLORS.grayscale700,
                                        }]}
                                    />
                                    <Text style={[styles.sectionTitle, {
                                        color: dark ? "#EEEEEE" : COLORS.grayscale700
                                    }]}>Creator</Text>
                                </View>
                                {/* 🖼️ REAL CREATOR AVATAR */}
                                <UserAvatar
                                    size={32}
                                    style={styles.creatorAvatar}
                                />
                                <Text style={[styles.leaderName, {
                                    color: dark ? COLORS.white : COLORS.greyscale900,
                                }]}>{user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'You'}</Text>
                            </View>

                            {/* Status Section */}
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionLeftContainer}>
                                    <Image
                                        source={icons.status}
                                        resizeMode='contain'
                                        style={[styles.sectionIcon, {
                                            tintColor: dark ? "#EEEEEE" : COLORS.grayscale700,
                                        }]}
                                    />
                                    <Text style={[styles.sectionTitle, {
                                        color: dark ? "#EEEEEE" : COLORS.grayscale700
                                    }]}>Status</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => refStatusRBSheet.current?.open()}
                                    style={styles.viewContainer}
                                >
                                    <Text style={styles.viewText}>{selectedStatus}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Priority Section */}
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionLeftContainer}>
                                    <Image
                                        source={icons.star}
                                        resizeMode='contain'
                                        style={[styles.sectionIcon, {
                                            tintColor: dark ? "#EEEEEE" : COLORS.grayscale700,
                                        }]}
                                    />
                                    <Text style={[styles.sectionTitle, {
                                        color: dark ? "#EEEEEE" : COLORS.grayscale700
                                    }]}>Priority</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => refPriorityRBSheet.current?.open()}
                                    style={styles.viewContainer}
                                >
                                    <Text style={styles.viewText}>{selectedPriority}</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Due Date Section */}
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionLeftContainer}>
                                    <Image
                                        source={icons.calendar}
                                        resizeMode='contain'
                                        style={[styles.sectionIcon, {
                                            tintColor: dark ? "#EEEEEE" : COLORS.grayscale700,
                                        }]}
                                    />
                                    <Text style={[styles.sectionTitle, {
                                        color: dark ? "#EEEEEE" : COLORS.grayscale700
                                    }]}>Due Date</Text>
                                </View>
                                <Text style={[styles.dueDateText, {
                                    color: dark ? COLORS.white : COLORS.greyscale900
                                }]}>Due: {new Date(selectedDate).toLocaleDateString()}</Text>
                                <TouchableOpacity
                                    onPress={() => refDueDateRBSheet.current?.open()}
                                >
                                    <Image
                                        source={icons.editText}
                                        resizeMode='contain'
                                        style={styles.editPencilIcon}
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* ✨ CLEAN SUBTASKS SECTION */}
                            <SubHeaderItem
                                title={`Sub-Tasks (${subtasks.length})`}
                                navTitle="Add New"
                                onPress={handleAddSubtask}
                            />
                            
                            {/* ✨ CLEAN SUBTASK INPUT */}
                            <View style={styles.inputSection}>
                                <Text style={[styles.inputLabel, { color: dark ? COLORS.white : COLORS.greyscale900 }]}>
                                    Add Subtask
                                </Text>
                                <View style={styles.subtaskInputContainer}>
                                    <TextInput
                                        key="subtask-input-stable"
                                        style={[styles.cleanSubtaskInput, {
                                            color: dark ? COLORS.white : COLORS.greyscale900,
                                            backgroundColor: dark ? COLORS.dark3 : COLORS.white,
                                            borderColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                                        }]}
                                        placeholder="Add a subtask..."
                                        placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale700}
                                        value={newSubtaskTitle}
                                        onChangeText={setNewSubtaskTitle}
                                        autoFocus={false}
                                        blurOnSubmit={false}
                                        onSubmitEditing={handleAddSubtask}
                                        autoComplete="off"
                                        autoCorrect={false}
                                        autoCapitalize="sentences"
                                        selectTextOnFocus={false}
                                        returnKeyType="done"
                                    />
                                    <TouchableOpacity
                                        onPress={handleAddSubtask}
                                        style={styles.addSubtaskBtn}
                                    >
                                        <Ionicons name="add" size={20} color={COLORS.white} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Subtasks List - Fixed VirtualizedList nesting */}
                            {subtasks.map((item) => (
                                <View key={item.id} style={styles.subtaskItem}>
                                    <TouchableOpacity
                                        onPress={() => handleSubtaskToggle(item.id, !item.completed)}
                                        style={styles.subtaskCheckbox}
                                    >
                                        <Ionicons
                                            name={item.completed ? "checkbox" : "checkbox-outline"}
                                            size={20}
                                            color={item.completed ? COLORS.primary : COLORS.grayscale400}
                                        />
                                    </TouchableOpacity>
                                    <Text style={[styles.subtaskText, {
                                        color: dark ? COLORS.white : COLORS.greyscale900,
                                        textDecorationLine: item.completed ? 'line-through' : 'none',
                                    }]}>
                                        {item.title}
                                    </Text>
                                </View>
                            ))}

                            {/* Comments Preview */}
                            <SubHeaderItem
                                title="Comments (0)"
                                navTitle=""
                                onPress={() => {}}
                            />
                            <Text style={[styles.commentsPreview, {
                                color: dark ? COLORS.grayscale400 : COLORS.grayscale700
                            }]}>
                                Comments will appear here after task creation
                            </Text>
                        </View>
                    </View>
                </ScrollView>

                {/* Create Task Button */}
                <View style={styles.createButtonContainer}>
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

                {/* ✨ CLEAN COMMENT INPUT - No avatar dependencies */}
                <View style={[styles.inputContainer, {
                    backgroundColor: dark ? COLORS.dark2 : "#f8f8f8",
                }]}>
                    {/* ✨ STATIC PROFILE AVATAR */}
                    <View style={[styles.profileImage, { backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' }]}>
                        <Text style={[styles.avatarInitial, { fontSize: 16 }]}>
                            {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || 'Y'}
                        </Text>
                    </View>
                    <TextInput
                        nativeID="task-comment-input"
                        testID="task-comment-input"
                        autoComplete="off"
                        style={[styles.input, {
                            color: dark ? COLORS.white : "#333",
                        }]}
                        placeholder="Add a note about this task..."
                        placeholderTextColor="#aaa"
                        value={comment}
                        onChangeText={setComment}
                        blurOnSubmit={false}
                        autoFocus={false}
                        returnKeyType="send"
                        onSubmitEditing={handleSendComment}
                    />
                    <TouchableOpacity onPress={handleSendComment} style={styles.sendButton}>
                        <Ionicons name="send" size={20} color="#007AFF" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Status Bottom Sheet */}
            <RBSheet
                ref={refStatusRBSheet}
                closeOnPressMask={true}
                height={320}
                customStyles={{
                    wrapper: {
                        backgroundColor: "rgba(0,0,0,0.5)",
                    },
                    draggableIcon: {
                        backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale200,
                    },
                    container: {
                        borderTopRightRadius: 32,
                        borderTopLeftRadius: 32,
                        height: 320,
                        backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                        alignItems: "center",
                    }
                }}
            >
                <Text style={[styles.bottomTitle, {
                    color: dark ? COLORS.white : COLORS.greyscale900
                }]}>Status</Text>
                <View style={[styles.separateLine, {
                    backgroundColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                    marginVertical: 12
                }]} />
                {statuses.map((status) => (
                    <TouchableOpacity
                        key={status}
                        style={styles.statusOption}
                        onPress={() => {
                            setSelectedStatus(status);
                            refStatusRBSheet.current?.close();
                        }}
                    >
                        <Text style={[styles.statusText, {
                            color: dark ? COLORS.white : COLORS.greyscale900
                        }]}>{status}</Text>
                        <Ionicons
                            name={selectedStatus === status ? "radio-button-on" : "radio-button-off"}
                            size={24}
                            color={selectedStatus === status ? "#007AFF" : "#888"}
                        />
                    </TouchableOpacity>
                ))}
            </RBSheet>

            {/* Priority Bottom Sheet */}
            <RBSheet
                ref={refPriorityRBSheet}
                closeOnPressMask={true}
                height={320}
                customStyles={{
                    wrapper: {
                        backgroundColor: "rgba(0,0,0,0.5)",
                    },
                    draggableIcon: {
                        backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale200,
                    },
                    container: {
                        borderTopRightRadius: 32,
                        borderTopLeftRadius: 32,
                        height: 320,
                        backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                        alignItems: "center",
                    }
                }}
            >
                <Text style={[styles.bottomTitle, {
                    color: dark ? COLORS.white : COLORS.greyscale900
                }]}>Priority</Text>
                <View style={[styles.separateLine, {
                    backgroundColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                    marginVertical: 12
                }]} />
                {priorities.map((priority) => (
                    <TouchableOpacity
                        key={priority}
                        style={styles.statusOption}
                        onPress={() => {
                            setSelectedPriority(priority);
                            refPriorityRBSheet.current?.close();
                        }}
                    >
                        <Text style={[styles.statusText, {
                            color: dark ? COLORS.white : COLORS.greyscale900
                        }]}>{priority}</Text>
                        <Ionicons
                            name={selectedPriority === priority ? "radio-button-on" : "radio-button-off"}
                            size={24}
                            color={selectedPriority === priority ? "#007AFF" : "#888"}
                        />
                    </TouchableOpacity>
                ))}
            </RBSheet>

            {/* Team Search Bottom Sheet */}
            <RBSheet
                ref={refTeamSearchRBSheet}
                closeOnPressMask={true}
                height={500}
                customStyles={{
                    wrapper: {
                        backgroundColor: "rgba(0,0,0,0.5)",
                    },
                    draggableIcon: {
                        backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale200,
                    },
                    container: {
                        borderTopRightRadius: 32,
                        borderTopLeftRadius: 32,
                        height: 500,
                        backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                        alignItems: "center",
                    }
                }}
            >
                <Text style={[styles.bottomTitle, {
                    color: dark ? COLORS.white : COLORS.greyscale900
                }]}>Add Team Member</Text>
                <View style={[styles.separateLine, {
                    backgroundColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                    marginVertical: 12
                }]} />
                
                <View style={styles.searchContainer}>
                    <TextInput
                        key="team-search-input-stable"
                        style={[styles.searchInput, {
                            color: dark ? COLORS.white : COLORS.greyscale900,
                            backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                        }]}
                        placeholder="Search users..."
                        placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.grayscale700}
                        value={searchQuery}
                        onChangeText={handleSearchChange}
                        autoFocus={false}
                        blurOnSubmit={false}
                        returnKeyType="search"
                        keyboardType="default"
                        autoComplete="off"
                        autoCorrect={false}
                        autoCapitalize="none"
                        selectTextOnFocus={false}
                        clearButtonMode="while-editing"
                    />
                </View>

                {searchLoading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 20 }} />
                ) : (
                    <>
                        <FlatList
                            data={searchResults}
                            keyExtractor={(item) => item.id}
                            style={{ width: '100%', paddingHorizontal: 20, maxHeight: 300 }}
                            renderItem={({ item }) => {
                                const isSelected = tempSelectedUsers.some(u => u.id === item.id);
                                const isAlreadyAssigned = assignedUsers.some(u => u.id === item.id);
                                
                                return (
                                    <TouchableOpacity
                                        style={[styles.userSearchItem, {
                                            opacity: isAlreadyAssigned ? 0.5 : 1,
                                            backgroundColor: isSelected ? COLORS.primary + '20' : 'transparent'
                                        }]}
                                        onPress={() => !isAlreadyAssigned && handleUserToggle(item)}
                                        disabled={isAlreadyAssigned}
                                    >
                                        {/* 🖼️ REAL SEARCH USER AVATAR */}
                                        <UserAvatar
                                            size={40}
                                            userId={item.id}
                                            style={styles.searchUserAvatar}
                                        />
                                        <Text style={[styles.searchUserName, {
                                            color: dark ? COLORS.white : COLORS.greyscale900
                                        }]}>{item.full_name}</Text>
                                        {isAlreadyAssigned ? (
                                            <Text style={styles.assignedText}>Assigned</Text>
                                        ) : (
                                            <Ionicons
                                                name={isSelected ? "checkmark-circle" : "person-add"}
                                                size={20}
                                                color={isSelected ? COLORS.primary : COLORS.grayscale400}
                                            />
                                        )}
                                    </TouchableOpacity>
                                );
                            }}
                        />
                        
                        {tempSelectedUsers.length > 0 && (
                            <View style={styles.selectionFooter}>
                                <Text style={[styles.selectionCount, {
                                    color: dark ? COLORS.white : COLORS.greyscale900
                                }]}>
                                    {tempSelectedUsers.length} member{tempSelectedUsers.length > 1 ? 's' : ''} selected
                                </Text>
                                <TouchableOpacity
                                    style={styles.confirmButton}
                                    onPress={handleConfirmUserSelection}
                                >
                                    <Text style={styles.confirmButtonText}>
                                        Add Selected
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                )}
            </RBSheet>

            {/* Attachment Bottom Sheet */}
            <RBSheet
                ref={refAttachmentRBSheet}
                closeOnPressMask={true}
                height={240}
                customStyles={{
                    wrapper: {
                        backgroundColor: "rgba(0,0,0,0.5)",
                    },
                    draggableIcon: {
                        backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale200,
                    },
                    container: {
                        borderTopRightRadius: 32,
                        borderTopLeftRadius: 32,
                        height: 240,
                        backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                        alignItems: "center",
                    }
                }}
            >
                <Text style={[styles.bottomTitle, {
                    color: dark ? COLORS.white : COLORS.greyscale900
                }]}>Task Image</Text>
                <View style={[styles.separateLine, {
                    backgroundColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                    marginVertical: 12
                }]} />
                <View style={styles.attachContainer}>
                    <View style={styles.attachOptionContainer}>
                        <TouchableOpacity 
                            style={styles.attachmentBtn}
                            onPress={handleImagePicker}
                        >
                            <Image
                                source={icons.image}
                                resizeMode='contain'
                                style={styles.attachmentIcon}
                            />
                        </TouchableOpacity>
                        <Text style={[styles.attachmentText, {
                            color: dark ? COLORS.white : COLORS.greyScale800
                        }]}>Gallery</Text>
                    </View>
                    <View style={styles.attachOptionContainer}>
                        <TouchableOpacity style={styles.attachmentBtn}>
                            <Image
                                source={icons.camera}
                                resizeMode='contain'
                                style={styles.attachmentIcon}
                            />
                        </TouchableOpacity>
                        <Text style={[styles.attachmentText, {
                            color: dark ? COLORS.white : COLORS.greyScale800
                        }]}>Camera</Text>
                    </View>
                </View>
            </RBSheet>

            {/* Due Date Bottom Sheet */}
            <RBSheet
                ref={refDueDateRBSheet}
                closeOnPressMask={true}
                height={420}
                customStyles={{
                    wrapper: {
                        backgroundColor: "rgba(0,0,0,0.5)",
                    },
                    draggableIcon: {
                        backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale200,
                    },
                    container: {
                        borderTopRightRadius: 32,
                        borderTopLeftRadius: 32,
                        height: 420,
                        backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                        alignItems: "center",
                    }
                }}
            >
                <Text style={[styles.bottomTitle, {
                    color: dark ? COLORS.white : COLORS.greyscale900
                }]}>Due Date</Text>
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
                            setSelectedDate(day.dateString);
                            refDueDateRBSheet.current?.close();
                        }}
                        markedDates={{
                            [selectedDate]: {
                                selected: true,
                                selectedColor: "#3D73FF",
                            },
                        }}
                        theme={{
                            backgroundColor: dark ? COLORS.dark2 : "#F8FAFC",
                            calendarBackground: dark ? COLORS.dark2 : "#F8FAFC",
                            textSectionTitleColor: dark ? COLORS.white : "#000",
                            selectedDayBackgroundColor: "#3D73FF",
                            selectedDayTextColor: "#fff",
                            todayTextColor: "#3D73FF",
                            dayTextColor: dark ? COLORS.grayscale200 : "#222",
                            arrowColor: "#3D73FF",
                            monthTextColor: dark ? COLORS.white : "#000",
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
        backgroundColor: COLORS.white
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        padding: 16
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 16
    },
    headerLeft: {
        flexDirection: "row",
        alignItems: "center"
    },
    backIcon: {
        height: 24,
        width: 24,
        tintColor: COLORS.black,
        marginRight: 16
    },
    headerTitle: {
        fontSize: 24,
        fontFamily: "bold",
        color: COLORS.greyscale900
    },
    viewRightContainer: {
        flexDirection: "row",
        alignItems: "center"
    },
    projectImage: {
        height: 200,
        width: '100%',
        marginBottom: 24,
        borderRadius: 16
    },
    editIcon: {
        height: 24,
        width: 24,
        tintColor: COLORS.white
    },
    editIconContainer: {
        position: "absolute",
        bottom: 42,
        right: 16,
    },
    titleInput: {
        fontSize: 20,
        fontFamily: "bold",
        color: COLORS.greyscale900,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 12,
        minHeight: 50,
    },
    descriptionInput: {
        fontSize: 16,
        fontFamily: "regular",
        color: COLORS.greyscale900,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 12,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    sectionContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12
    },
    sectionLeftContainer: {
        flexDirection: "row",
        alignItems: 'center',
        width: 120
    },
    sectionIcon: {
        width: 20,
        height: 20,
        tintColor: COLORS.grayscale700,
        marginRight: 8
    },
    sectionTitle: {
        fontSize: 14,
        fontFamily: "medium",
        color: COLORS.grayscale700
    },
    avatars: {
        flexDirection: "row",
    },
    plusIcon: {
        height: 24,
        width: 24,
        borderWidth: 1.4,
        borderRadius: 10,
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 18
    },
    plusText: {
        fontSize: 14,
        fontFamily: "medium",
        color: COLORS.primary
    },
    leaderAvatar: {
        height: 28,
        width: 28,
        borderRadius: 999
    },
    leaderName: {
        fontSize: 16,
        fontFamily: "medium",
        color: COLORS.greyscale900,
        marginLeft: 16,
    },
    viewText: {
        fontSize: 14,
        fontFamily: "semiBold",
        color: COLORS.primary,
    },
    viewContainer: {
        borderColor: COLORS.primary,
        borderWidth: 1.4,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 5,
    },
    dueDateText: {
        fontSize: 16,
        fontFamily: "medium",
        color: COLORS.greyscale900,
        marginLeft: 16,
    },
    editPencilIcon: {
        height: 20,
        width: 20,
        tintColor: COLORS.primary,
        marginLeft: 10
    },
    subtaskInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    subtaskInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
    },
    addSubtaskBtn: {
        backgroundColor: COLORS.primary,
        padding: 8,
        borderRadius: 8,
    },
    subtaskItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    subtaskCheckbox: {
        marginRight: 12,
    },
    subtaskText: {
        fontSize: 16,
        fontFamily: 'regular',
        flex: 1,
    },
    commentsPreview: {
        fontSize: 14,
        fontFamily: 'regular',
        fontStyle: 'italic',
        textAlign: 'center',
        marginVertical: 20,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f8f8f8",
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        paddingHorizontal: 16,
        paddingVertical: 16,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 2,
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        fontFamily: "regular",
        color: "#333",
    },
    sendButton: {
        padding: 5,
    },
    bottomTitle: {
        fontSize: 24,
        fontFamily: "semiBold",
        color: COLORS.black,
        textAlign: "center",
        marginTop: 12
    },
    separateLine: {
        width: "100%",
        height: 1,
        backgroundColor: COLORS.grayscale200
    },
    statusOption: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        width: SIZES.width - 32
    },
    statusText: {
        fontSize: 18,
        fontFamily: "bold",
        color: COLORS.greyscale900
    },
    searchContainer: {
        width: '100%',
        paddingHorizontal: 20,
        marginBottom: 10,
    },
    searchInput: {
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        fontFamily: 'regular',
    },
    userSearchItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.grayscale200,
    },
    searchUserAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 12,
    },
    searchUserName: {
        flex: 1,
        fontSize: 16,
        fontFamily: 'medium',
    },
    attachmentBtn: {
        height: 80,
        width: 80,
        borderRadius: 999,
        backgroundColor: COLORS.transparentPrimary,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 6
    },
    attachmentIcon: {
        height: 32,
        width: 32,
        tintColor: COLORS.primary,
    },
    attachmentText: {
        fontSize: 14,
        fontFamily: "semiBold",
        color: COLORS.greyScale800
    },
    attachOptionContainer: {
        alignItems: "center",
    },
    attachContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 10,
        paddingHorizontal: 24,
        width: SIZES.width - 32
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
    participantAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginLeft: 0,
    },
    avatarImage: {
        width: 30,
        height: 30,
        borderRadius: 15,
    },
    createButtonContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    createTaskButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    createTaskButtonText: {
        color: COLORS.white,
        fontSize: 16,
        fontFamily: 'bold',
    },
    assignedText: {
        fontSize: 12,
        fontFamily: 'medium',
        color: COLORS.grayscale400,
    },
    selectionFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.grayscale200,
    },
    selectionCount: {
        fontSize: 14,
        fontFamily: 'medium',
    },
    confirmButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    confirmButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontFamily: 'bold',
    },
    inputSection: {
        marginBottom: 12,
    },
    inputLabel: {
        fontSize: 14,
        fontFamily: "medium",
        color: COLORS.greyscale900,
        marginBottom: 8,
    },
    cleanTitleInput: {
        fontSize: 20,
        fontFamily: "bold",
        color: COLORS.greyscale900,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 50,
    },
    cleanDescriptionInput: {
        fontSize: 16,
        fontFamily: "regular",
        color: COLORS.greyscale900,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    cleanSubtaskInput: {
        flex: 1,
        fontSize: 16,
        fontFamily: "regular",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginRight: 8,
    },
    staticAvatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
    },
    teamAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: COLORS.white,
    },
    creatorAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    avatarInitial: {
        fontSize: 14,
        fontFamily: "bold",
        color: COLORS.white,
        textAlign: 'center',
    },
});

export default AddNewTaskForm;