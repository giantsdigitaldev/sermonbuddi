import Button from '@/components/Button';
import Header from '@/components/Header';
import Input from '@/components/Input';
import { COLORS, FONTS, SIZES } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import { validateInput } from '@/utils/actions/formActions';
import { launchImagePicker } from '@/utils/ImagePickerHelper';
import { Project, ProjectService } from '@/utils/projectService';
import { reducer } from '@/utils/reducers/formReducers';
import { Feather, Ionicons } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useReducer, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getFormatedDate } from 'react-native-modern-datepicker';
import RNPickerSelect from 'react-native-picker-select';
import { SafeAreaView } from 'react-native-safe-area-context';
import DatePickerModal from '../components/DatePickerModal';

const isTestMode = true;

const initialState = {
    inputValues: {
        taskTitle: isTestMode ? 'Task Title' : '',
        taskDescription: isTestMode ? 'Description' : '',
    },
    inputValidities: {
        email: false,
        password: false
    },
    formIsValid: false,
}

const AddNewTaskForm = () => {
    const { colors, dark } = useTheme();
    const [formState, dispatchFormState] = useReducer(reducer, initialState);
    const [selectedProjectLeader, setSelectedProjectLeader] = useState<string>("");
    const [selectedTeamMember, setSelectedTeamMember] = useState<string>("");
    const navigation = useNavigation<NavigationProp<any>>();
    const params = useLocalSearchParams();
    const projectId = params.projectId as string;
    const today = new Date();
    const [image, setImage] = useState<any>(null);
    const [openStartDatePicker, setOpenStartDatePicker] = useState(false);
    const startDate = getFormatedDate(
        new Date(today.setDate(today.getDate() + 1)),
        "YYYY/MM/DD"
    );
    const [startedDate, setStartedDate] = useState("12/12/2023");
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(false);

    const handleOnPressStartDate = () => {
        setOpenStartDatePicker(!openStartDatePicker);
    };

    const projectLeaderOptions = [
        { label: 'Lucas Ditala', value: 'lucas ditala' },
        { label: 'Marc Marcson', value: 'marc marcson' },
        { label: 'Jean Florent', value: 'jean florent' },
    ];

    const projectTeamMemberOptions = [
        { label: 'Lucas Ditala', value: 'lucas ditala' },
        { label: 'Marc Marcson', value: 'marc marcson' },
        { label: 'Jean Florent', value: 'jean florent' },
        { label: 'General Peakner', value: 'general peakner' },
    ];

    const handleProjectLeaderChange = (value: string) => {
        setSelectedProjectLeader(value);
    };

    const handleTeamMemberChange = (value: string) => {
        setSelectedTeamMember(value);
    };

    const inputChangedHandler = useCallback(
        (inputId: string, inputValue: string) => {
            const result = validateInput(inputId, inputValue)
            dispatchFormState({
                inputId,
                validationResult: result,
                inputValue,
            })
        }, [dispatchFormState]);

    const pickImage = async () => {
        try {
            const tempUri = await launchImagePicker()

            if (!tempUri) return

            // Set the image
            setImage({ uri: tempUri })
        } catch (error) { }
    };

    // Load project data
    useEffect(() => {
        const loadProject = async () => {
            if (projectId) {
                const projectData = await ProjectService.getProject(projectId);
                setProject(projectData);
            }
        };
        loadProject();
    }, [projectId]);

    const handleSubmit = async () => {
        // Validate required fields
        if (!formState.inputValues.taskTitle.trim()) {
            Alert.alert('Error', 'Task title is required');
            return;
        }

        if (!projectId) {
            Alert.alert('Error', 'Project ID is required');
            return;
        }

        try {
            setLoading(true);
            
            const taskData = {
                project_id: projectId,
                title: formState.inputValues.taskTitle.trim(),
                description: formState.inputValues.taskDescription.trim() || undefined,
                status: 'todo' as 'todo' | 'in_progress' | 'completed',
                priority: 'medium' as 'low' | 'medium' | 'high',
                due_date: formState.inputValues.due_date || undefined,
                metadata: {
                    section: formState.inputValues.section || undefined,
                    comments: 0,
                    attachments: 0,
                    participants: []
                }
            };

            const result = await ProjectService.createTask(taskData);
            
            if (result) {
                // Update project progress
                await ProjectService.updateProjectProgress(projectId);
                
                Alert.alert(
                    'Success',
                    'Task created successfully!',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                navigation.goBack();
                            }
                        }
                    ]
                );
            } else {
                Alert.alert('Error', 'Failed to create task');
            }
        } catch (error) {
            console.error('Error creating task:', error);
            Alert.alert('Error', 'Failed to create task');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <Header title="Add New Task" />
                <ScrollView showsVerticalScrollIndicator={false}>
                    {
                        image ? (
                            <TouchableOpacity onPress={pickImage}>
                                <Image source={image} resizeMode='cover' style={styles.image} />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity onPress={pickImage} style={[styles.coverButton, {
                                borderColor: dark ? COLORS.grayscale700 : "#ddd",
                            }]}>
                                <Ionicons name="add" size={24} color={dark ? COLORS.white : COLORS.greyscale900} />
                                <Text style={styles.coverText}>Add Cover</Text>
                            </TouchableOpacity>
                        )
                    }

                    <Input
                        id="taskTitle"
                        onInputChanged={inputChangedHandler}
                        errorText={formState.inputValidities['taskTitle']}
                        placeholder="Task Title"
                        placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
                    />
                    <Input
                        id="taskDescription"
                        onInputChanged={inputChangedHandler}
                        errorText={formState.inputValidities['taskDescription']}
                        placeholder="Description"
                        placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
                    />
                    <View style={{ marginVertical: 10 }}>
                        <RNPickerSelect
                            placeholder={{ label: 'Select', value: '' }}
                            items={projectLeaderOptions}
                            onValueChange={(value) => handleProjectLeaderChange(value)}
                            value={selectedProjectLeader}
                            style={{
                                inputIOS: {
                                    fontSize: 16,
                                    paddingHorizontal: 10,
                                    borderRadius: 4,
                                    color: COLORS.greyscale600,
                                    paddingRight: 30,
                                    height: 52,
                                    width: SIZES.width - 32,
                                    alignItems: 'center',
                                    backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                                },
                                inputAndroid: {
                                    fontSize: 16,
                                    paddingHorizontal: 10,
                                    borderRadius: 8,
                                    color: COLORS.greyscale600,
                                    paddingRight: 30,
                                    height: 52,
                                    width: SIZES.width - 32,
                                    alignItems: 'center',
                                    backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                                },
                            }}
                        />
                    </View>
                    <RNPickerSelect
                        placeholder={{ label: 'Select', value: '' }}
                        items={projectTeamMemberOptions}
                        onValueChange={(value) => handleTeamMemberChange(value)}
                        value={selectedTeamMember}
                        style={{
                            inputIOS: {
                                fontSize: 16,
                                paddingHorizontal: 10,
                                borderRadius: 4,
                                color: COLORS.greyscale600,
                                paddingRight: 30,
                                height: 52,
                                width: SIZES.width - 32,
                                alignItems: 'center',
                                backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                            },
                            inputAndroid: {
                                fontSize: 16,
                                paddingHorizontal: 10,
                                borderRadius: 8,
                                color: COLORS.greyscale600,
                                paddingRight: 30,
                                height: 52,
                                width: SIZES.width - 32,
                                alignItems: 'center',
                                backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                            },
                        }}
                    />
                    <View style={{
                        width: SIZES.width - 32
                    }}>
                        <TouchableOpacity
                            style={[styles.inputBtn, {
                                backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                                borderColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                            }]}
                            onPress={handleOnPressStartDate}
                        >
                            <Text style={{ ...FONTS.body4, color: COLORS.grayscale400 }}>{startedDate}</Text>
                            <Feather name="calendar" size={24} color={COLORS.grayscale400} />
                        </TouchableOpacity>
                    </View>
                    <View style={{
                        width: SIZES.width - 32
                    }}>
                        <TouchableOpacity
                            style={[styles.inputBtn, {
                                backgroundColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                                borderColor: dark ? COLORS.dark2 : COLORS.greyscale500,
                            }]}
                        >
                            <Text style={{ ...FONTS.body4, color: COLORS.grayscale400 }}>Attachment</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
            <View style={[styles.bottomContainer, {
                borderTopColor: dark ? COLORS.dark1 : COLORS.grayscale100,
            }]}>
                <Button
                    title={loading ? 'Creating...' : 'Create Task'}
                    filled
                    style={styles.button}
                    onPress={handleSubmit}
                    disabled={loading}
                />
            </View>
            <DatePickerModal
                open={openStartDatePicker}
                startDate={startDate}
                selectedDate={startedDate}
                onClose={() => setOpenStartDatePicker(false)}
                onChangeStartDate={(date) => setStartedDate(date)}
            />
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
    bottomContainer: {
        height: 64,
        width: "100%",
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        bottom: 16,
        borderTopColor: COLORS.grayscale100,
        borderTopWidth: 1,
        alignItems: "center",
        justifyContent: "center"
    },
    button: {
        width: SIZES.width - 32,
        height: 52,
        borderRadius: 32,
        backgroundColor: COLORS.primary,
        marginTop: 12
    },
    coverButton: {
        height: 160,
        borderWidth: 1,
        borderColor: "#ddd",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
        borderRadius: 16,
        marginVertical: 16
    },
    coverText: { color: "#888", marginTop: 5 },
    inputBtn: {
        borderWidth: 1,
        borderRadius: 12,
        borderColor: COLORS.greyscale500,
        height: 50,
        paddingLeft: 8,
        fontSize: 18,
        justifyContent: "space-between",
        marginTop: 4,
        backgroundColor: COLORS.greyscale500,
        flexDirection: "row",
        alignItems: "center",
        paddingRight: 8
    },
    image: {
        height: 160,
        width: SIZES.width - 32,
        borderRadius: 16,
        marginVertical: 16
    }
});

export default AddNewTaskForm