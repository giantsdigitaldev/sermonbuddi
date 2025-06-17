import Button from '@/components/Button';
import Input from '@/components/Input';
import SubHeaderItem from '@/components/SubHeaderItem';
import TaskCard from '@/components/TaskCard';
import UserAvatar from '@/components/UserAvatar';
import { COLORS, icons, images, SIZES } from '@/constants';
import { subTasks } from '@/data';
import { useTheme } from '@/theme/ThemeProvider';
import { validateInput } from '@/utils/actions/formActions';
import { reducer } from '@/utils/reducers/formReducers';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import { useNavigation } from 'expo-router';
import React, { useCallback, useReducer, useRef, useState } from 'react';
import { FlatList, Image, ImageSourcePropType, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar } from "react-native-calendars";
import RBSheet from "react-native-raw-bottom-sheet";
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView } from 'react-native-virtualized-view';

const statuses = ["To-Do", "In-Progress", "Revision", "Completed"];

const isTestMode = true;

const initialState = {
    inputValues: {
        taskName: isTestMode ? 'Board Name' : '',
    },
    inputValidities: {
        taskName: false
    },
    formIsValid: false,
}

const NewProjectBoardTaskDetails = () => {
    const { colors, dark } = useTheme();
    const navigation = useNavigation<NavigationProp<any>>();
    const participants = [images.user2, images.user3, images.user4, images.user5, images.user6, images.user1, images.user7];
    const [comment, setComment] = useState("");
    const [selectedStatus, setSelectedStatus] = useState<string>("To-Do");
    const refStatusRBSheet = useRef<any>(null);
    const refAttachmentRBSheet = useRef<any>(null);
    const refDueDateRBSheet = useRef<any>(null);
    const refSubTaskRBSheet = useRef<any>(null);
    const [selectedDate, setSelectedDate] = useState("2024-12-14");
    const [formState, dispatchFormState] = useReducer(reducer, initialState);
    const [modalVisible, setModalVisible] = useState(false);

    const handleSend = () => {
        if (comment.trim().length > 0) {
            console.log("Comment sent:", comment);
            setComment("");
        }
    };
    const [completedTasks, setCompletedTasks] = useState<{ [key: string]: boolean }>({});

    const handleToggle = (id: string, completed: boolean) => {
        setCompletedTasks((prev) => ({ ...prev, [id]: completed }));
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
    /**
    * Render header
    */
    const renderHeader = () => {
        return (
            <View style={styles.headerContainer}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}>
                        <Image
                            source={icons.back}
                            resizeMode='contain'
                            style={[styles.backIcon, {
                                tintColor: dark ? COLORS.white : COLORS.black
                            }]} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, {
                        color: dark ? COLORS.white : COLORS.black
                    }]}>Build Wireframe</Text>
                </View>
                <View style={styles.viewRightContainer}>
                    <TouchableOpacity>
                        <Image
                            source={icons.starOutline}
                            resizeMode='contain'
                            style={styles.starIcon}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Image
                            source={icons.moreCircle}
                            resizeMode='contain'
                            style={[styles.moreIcon, {
                                tintColor: dark ? COLORS.secondaryWhite : COLORS.black
                            }]}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        )
    };

    return (
        <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {renderHeader()}
                <ScrollView showsVerticalScrollIndicator={false}>
                    <View>
                        <Image
                            source={images.projectImage}
                            resizeMode='cover'
                            style={styles.projectImage}
                        />
                        <TouchableOpacity style={styles.editIconContainer}>
                            <Image
                                source={icons.editPencil}
                                resizeMode='contain'
                                style={styles.editIcon}
                            />
                        </TouchableOpacity>
                    </View>
                    <View>
                        <Text style={[styles.description, {
                            color: dark ? COLORS.grayscale100 : COLORS.greyscale900
                        }]}>Create 24 different wireframe views each case
                            that occurs from the application.</Text>
                        <View style={{ marginVertical: 12 }}>
                            {/* Team Section */}
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

                                {/* Participants Avatars */}
                                <View style={styles.avatars}>
                                    {participants.map((avatar, index) => (
                                        <Image key={index} source={avatar as ImageSourcePropType} style={styles.avatar} />
                                    ))}
                                </View>
                                <TouchableOpacity
                                    onPress={() => navigation.navigate("projectdetailsteammenber")}
                                    style={styles.plusIcon}>
                                    <Text style={styles.plusText}>+</Text>
                                </TouchableOpacity>
                            </View>
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
                                    }]}>Leader</Text>
                                </View>
                                <UserAvatar
                                    size={32}
                                    style={styles.leaderAvatar}
                                />
                                <Text style={[styles.leaderName, {
                                    color: dark ? COLORS.white : COLORS.greyscale900,
                                }]}>Daniel Austin (you)</Text>
                            </View>
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
                                    onPress={() => refStatusRBSheet.current.open()}
                                    style={styles.viewContainer}>
                                    <Text style={styles.viewText}>{selectedStatus}</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionLeftContainer}>
                                    <Image
                                        source={icons.calendar5}
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
                                }]}>Due date: Dec 14, 2026</Text>
                                <TouchableOpacity
                                    onPress={() => refDueDateRBSheet.current.open()}>
                                    <Image
                                        source={icons.editText}
                                        resizeMode='contain'
                                        style={styles.editPencilIcon}
                                    />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.sectionContainer}>
                                <View style={styles.sectionLeftContainer}>
                                    <Image
                                        source={icons.document3}
                                        resizeMode='contain'
                                        style={[styles.sectionIcon, {
                                            tintColor: dark ? "#EEEEEE" : COLORS.grayscale700,
                                        }]}
                                    />
                                    <Text style={[styles.sectionTitle, {
                                        color: dark ? "#EEEEEE" : COLORS.grayscale700
                                    }]}>Attachment</Text>
                                </View>
                                <TouchableOpacity style={styles.refBtn}>
                                    <Image
                                        source={icons.document3}
                                        resizeMode='contain'
                                        style={styles.refBtnText}
                                    />
                                    <Text style={styles.refText}>References.pdf</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => refAttachmentRBSheet.current.open()}
                                    style={styles.addBtn}>
                                    <Image
                                        source={icons.addPlus}
                                        resizeMode='contain'
                                        style={styles.addIcon}
                                    />
                                    <Text style={styles.addText}>Add</Text>
                                </TouchableOpacity>
                            </View>

                            <Button
                                title="Add Custom Section"
                                style={{
                                    backgroundColor: dark ? COLORS.dark2 : COLORS.transparentPrimary,
                                    borderColor: dark ? COLORS.dark2 : COLORS.transparentPrimary,
                                    marginTop: 12
                                }}
                                textColor={dark ? COLORS.white : COLORS.primary}
                            />

                            <SubHeaderItem
                                title={`Sub-Task (${subTasks.length})`}
                                navTitle="See All"
                                onPress={() => navigation.navigate("boarddetailssubtasks")}
                            />
                            <FlatList
                                data={subTasks.slice(0, 4)}
                                keyExtractor={(item) => item.id}
                                renderItem={({ item }) => (
                                    <TaskCard task={item} isCompleted={!!completedTasks[item.id]} onToggle={handleToggle} />
                                )}
                            />
                            <TouchableOpacity
                                onPress={() => navigation.navigate("boarddetailssubtasks")}
                                style={[styles.expandBtn, {
                                    backgroundColor: dark ? COLORS.dark2 : COLORS.transparentPrimary,
                                    borderColor: dark ? COLORS.dark2 : COLORS.transparentPrimary,
                                }]}>
                                <Image
                                    source={icons.arrowDown}
                                    resizeMode='contain'
                                    style={[styles.expandIcon, {
                                        tintColor: dark ? COLORS.white : COLORS.primary
                                    }]}
                                />
                                <Text style={[styles.expandBtnText, {
                                    color: dark ? COLORS.white : COLORS.primary
                                }]}>Expand More</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                </ScrollView>

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
                        onPress={() => setSelectedStatus(status)}
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
                }]}>Attachment</Text>
                <View style={[styles.separateLine, {
                    backgroundColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                    marginVertical: 12
                }]} />
                <View style={styles.attachContainer}>
                    <View style={styles.attachOptionContainer}>
                        <TouchableOpacity style={styles.attachmentBtn}>
                            <Image
                                source={icons.folder}
                                resizeMode='contain'
                                style={styles.attachmentIcon}
                            />
                        </TouchableOpacity>
                        <Text style={[styles.attachmentText, {
                            color: dark ? COLORS.white : COLORS.greyScale800
                        }]}>Document</Text>
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
                    <View style={styles.attachOptionContainer}>
                        <TouchableOpacity style={styles.attachmentBtn}>
                            <Image
                                source={icons.image2}
                                resizeMode='contain'
                                style={styles.attachmentIcon}
                            />
                        </TouchableOpacity>
                        <Text style={[styles.attachmentText, {
                            color: dark ? COLORS.white : COLORS.greyScale800
                        }]}>Gallery</Text>
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
                        current={"2024-12-01"}
                        minDate={"2026-12-01"}
                        maxDate={"2099-12-31"}
                        onDayPress={(day: any) => setSelectedDate(day.dateString)}
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
                            dayTextColor: "#222",
                            arrowColor: "#3D73FF",
                            monthTextColor: dark ? COLORS.white : "#000",
                        }}
                    />
                </View>
            </RBSheet>
            {/* Sub Task Bottom Sheet */}
            <RBSheet
                ref={refSubTaskRBSheet}
                closeOnPressMask={true}
                height={250}
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
                        height: 250,
                        backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                        alignItems: "center",
                    }
                }}
            >
                <Text style={[styles.bottomTitle, {
                    color: dark ? COLORS.white : COLORS.greyscale900
                }]}>Add New Sub-Task</Text>
                <View style={[styles.separateLine, {
                    backgroundColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                    marginVertical: 12
                }]} />
                <View style={{ width: SIZES.width - 32 }}>
                    <Input
                        id="Sub Task Name"
                        onInputChanged={inputChangedHandler}
                        errorText={formState.inputValidities['taskName']}
                        placeholder="Sub Task Name"
                        placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
                    />

                </View>
                <TouchableOpacity
                    style={[styles.bottomBtn, { marginVertical: 12 }]}>
                    <Image
                        source={icons.addPlus}
                        resizeMode='contain'
                        style={styles.addIcon}
                    />
                    <Text style={styles.addText}>Add New Sub-Task</Text>
                </TouchableOpacity>
            </RBSheet>
            <View style={[styles.bottomContainer, { 
                borderTopColor: dark ? COLORS.dark2 : COLORS.grayscale100,
            }]}>
                <TouchableOpacity
                    onPress={() => refSubTaskRBSheet.current.open()}
                    style={styles.bottomBtn}>
                    <Image
                        source={icons.addPlus}
                        resizeMode='contain'
                        style={styles.addIcon}
                    />
                    <Text style={styles.addText}>Add New Sub-Task</Text>
                </TouchableOpacity>
            </View>
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
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingBottom: 16
    },
    scrollView: {
        backgroundColor: COLORS.tertiaryWhite
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
    moreIcon: {
        width: 24,
        height: 24,
        tintColor: COLORS.black
    },
    starIcon: {
        width: 28,
        height: 28,
        marginRight: 12
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
    description: {
        fontSize: 16,
        fontFamily: "regular",
        color: COLORS.greyscale900
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
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginRight: -10,
        borderWidth: 2,
        borderColor: "#fff",
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
    refText: {
        fontSize: 14,
        fontFamily: "semiBold",
        color: COLORS.primary,
    },
    refBtnText: {
        height: 12,
        width: 12,
        tintColor: COLORS.primary,
        marginRight: 4
    },
    refBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.primary,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    addBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        marginLeft: 6
    },
    addIcon: {
        height: 12,
        width: 12,
        tintColor: COLORS.white,
        marginRight: 4
    },
    addText: {
        fontSize: 14,
        fontFamily: "semiBold",
        color: COLORS.white,
        marginLeft: 4
    },
    expandBtn: {
        width: SIZES.width - 32,
        backgroundColor: COLORS.transparentPrimary,
        paddingHorizontal: SIZES.padding,
        paddingVertical: SIZES.padding,
        borderRadius: 25,
        alignItems: 'center',
        justifyContent: 'center',
        height: 52,
        flexDirection: "row",
    },
    expandBtnText: {
        fontSize: 16,
        fontFamily: "bold",
        color: COLORS.primary
    },
    expandIcon: {
        height: 20,
        width: 20,
        tintColor: COLORS.primary,
        marginRight: 16,
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
    bottomContainer: {
        height: 64,
        width: "100%",
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        bottom: 0,
        borderTopColor: COLORS.grayscale100,
        borderTopWidth: 1,
        alignItems: "center",
        justifyContent: "center"
    },
    bottomBtn: {
        width: SIZES.width - 32,
        height: 52,
        borderRadius: 32,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary,
        marginBottom: 16
    },
})

export default NewProjectBoardTaskDetails