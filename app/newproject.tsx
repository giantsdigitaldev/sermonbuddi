import { View, Text, StatusBar, StyleSheet, TouchableOpacity, Image, ImageSourcePropType, Modal, TouchableWithoutFeedback, FlatList } from 'react-native'
import React, { useCallback, useReducer, useRef, useState } from 'react'
import { COLORS, icons, illustrations, images, SIZES } from '@/constants';
import { useNavigation } from 'expo-router';
import { NavigationProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import RBSheet from "react-native-raw-bottom-sheet";
import Button from '@/components/Button';
import { useTheme } from '@/theme/ThemeProvider';
import Input from '@/components/Input';
import { validateInput } from '@/utils/actions/formActions';
import { reducer } from '@/utils/reducers/formReducers';
import { Calendar } from "react-native-calendars";

const isTestMode = true;

const initialState = {
    inputValues: {
        boardName: isTestMode ? 'Board Name' : '',
    },
    inputValidities: {
        boardName: false
    },
    formIsValid: false,
}

const NewProject = () => {
    const refBoardRBSheet = useRef<any>(null);
    const refAddCoverRBSheet = useRef<any>(null);
    const refDeadlineRBSheet = useRef<any>(null);
    const refDeleteProjectRBSheet = useRef<any>(null);
    const [selectedDate, setSelectedDate] = useState("2024-12-14");
    const members = [images.user1, images.user2, images.user3];
    const navigation = useNavigation<NavigationProp<any>>();
    const { dark } = useTheme();
    const [formState, dispatchFormState] = useReducer(reducer, initialState);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);

    const dropdownItems = [
        { label: 'Add Cover', value: 'cover', icon: icons.image },
        { label: 'Add Logo', value: 'addLogo', icon: icons.status2 },
        { label: 'Set Color', value: 'setColor', icon: icons.show },
        { label: 'Edit Project', value: 'editProject', icon: icons.editText },
        { label: 'Delete Project', value: 'deleteProject', icon: icons.trash2 },
    ];

    const handleDropdownSelect = (item: any) => {
        setSelectedItem(item.value);
        setModalVisible(false);

        // Perform actions based on the selected item
        switch (item.value) {
            case 'cover':
                // Handle Cover action
                setModalVisible(false);
                navigation.navigate("newprojectaddcover")
                break;
            case 'addLogo':
                // Add logo action
                setModalVisible(false);
                break;
            case 'setColor':
                // Set color action
                setModalVisible(false)
                navigation.navigate("newprojectsetcolor")
                break;
            case 'editProject':
                // Edit project action
                setModalVisible(false)
                break;
            case 'deleteProject':
                // Delete Project action
                setModalVisible(false)
                refDeleteProjectRBSheet.current.open()
                break;
            default:
                break;
        }
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

    return (
        <View style={{ flex: 1 }}>
            <StatusBar hidden />
            <View style={styles.banner} />
            {/* Header  */}
            <View style={styles.headerContainer}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}>
                    <Image
                        source={icons.back}
                        resizeMode='contain'
                        style={styles.arrowBackIcon}
                    />
                </TouchableOpacity>
                <View style={styles.rightContainer}>
                    <TouchableOpacity>
                        <Image
                            source={icons.search}
                            resizeMode='contain'
                            style={styles.searchIcon}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setModalVisible(true)}>
                        <Image
                            source={icons.moreCircle}
                            resizeMode='contain'
                            style={styles.menuIcon}
                        />
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => refAddCoverRBSheet.current.open()}
                    style={styles.logoContainer}>
                    <Image source={icons.editPencil} style={styles.logo} />
                </TouchableOpacity>
                <View style={styles.membersContainer}>
                    {members.slice(0, 3).map((member, index) => (
                        <Image
                            key={index}
                            source={member as ImageSourcePropType}
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
            <View style={{ flex: 1, backgroundColor: dark ? COLORS.dark1 : "white" }}>
                <View style={styles.container}>
                    <Text style={[styles.title, {
                        color: dark ? COLORS.white : COLORS.greyscale900,
                    }]}>E-Wallet App Project</Text>
                    <Text style={[styles.subtitle, {
                        color: dark ? COLORS.white : COLORS.greyscale900,
                    }]}>Add Description</Text>
                    <TouchableOpacity
                        onPress={() => refDeadlineRBSheet.current.open()}
                        style={styles.addBtn}>
                        <Text style={styles.addText}>Set Deadline Project</Text>
                    </TouchableOpacity>
                    <Image
                        source={illustrations.project}
                        resizeMode='contain'
                        style={styles.illustration}
                    />
                </View>
            </View>

            {/* Add Button */}
            <TouchableOpacity
                onPress={() => refBoardRBSheet.current.open()}
                style={styles.addIconContainer}>
                <Ionicons name="add" size={24} color="#FFF" />
            </TouchableOpacity>

            {/* Board Bottom Sheet */}
            <RBSheet
                ref={refBoardRBSheet}
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
                        paddingHorizontal: 16
                    }
                }}
            >
                <Text style={[styles.bottomTitle, {
                    color: dark ? COLORS.white : COLORS.greyscale900
                }]}>Add New Board</Text>
                <View style={[styles.separateLine, {
                    backgroundColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                    marginVertical: 12
                }]} />
                <Input
                    id="boardName"
                    onInputChanged={inputChangedHandler}
                    errorText={formState.inputValidities['boardName']}
                    placeholder="Board Name"
                    placeholderTextColor={dark ? COLORS.grayTie : COLORS.black}
                />
                <Button
                    title="Create New Board"
                    filled
                    style={{
                        width: SIZES.width - 32,
                        marginTop: 18,
                    }}
                    onPress={() => {
                        refBoardRBSheet.current.close();
                        navigation.navigate("newprojectsetted")
                    }}
                />
            </RBSheet>

            {/* Delete Project Bottom Sheet */}
            <RBSheet
                ref={refDeleteProjectRBSheet}
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
                        paddingHorizontal: 16
                    }
                }}
            >
                <Text style={[styles.bottomTitle, {
                    color: "red"
                }]}>Delete Project</Text>
                <View style={[styles.separateLine, {
                    backgroundColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                    marginVertical: 12
                }]} />
                <Text style={[styles.projectDesc, {
                    color: dark ? COLORS.white : COLORS.greyscale900,
                }]}>Are you sure you want to delete
                    the project?</Text>
                <Button
                    title="Yes, Delete"
                    filled
                    style={{
                        width: SIZES.width - 32,
                        marginTop: 18,
                    }}
                    onPress={() => {
                        refDeleteProjectRBSheet.current.close();
                    }}
                />

                <Button
                    title="Cancel"
                    style={{
                        width: SIZES.width - 32,
                        marginTop: 18,
                        backgroundColor: dark ? COLORS.dark3 : COLORS.transparentPrimary,
                        borderColor: dark ? COLORS.dark3 : COLORS.transparentPrimary
                    }}
                    textColor={dark ? COLORS.white : COLORS.primary}
                    onPress={() => {
                        refDeleteProjectRBSheet.current.close();
                    }}
                />
            </RBSheet>

            {/* Attachment Bottom Sheet */}
            <RBSheet
                ref={refAddCoverRBSheet}
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
                }]}>Add Cover</Text>
                <View style={[styles.separateLine, {
                    backgroundColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                    marginVertical: 12
                }]} />
                <View style={styles.attachContainer}>
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
            {/* Set Deadline Project Bottom Sheet */}
            <RBSheet
                ref={refDeadlineRBSheet}
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
                }]}>Set Deadline Project</Text>
                <View style={[styles.separateLine, {
                    backgroundColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                    marginVertical: 12
                }]} />
                <View style={{ width: SIZES.width - 32 }}>
                    <Calendar
                        current={"2024-12-01"}
                        minDate={"2024-12-01"}
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
                            dayTextColor: dark ? COLORS.grayscale200 : "#222",
                            arrowColor: "#3D73FF",
                            monthTextColor: dark ? COLORS.white : "#000",
                        }}
                    />
                </View>
            </RBSheet>

            {/* Modal for dropdown selection */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
            >
                <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
                    <View style={{ position: "absolute", top: 112, right: 12 }}>
                        <View style={{
                            width: 172,
                            padding: 16,
                            backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                            borderRadius: 8
                        }}>
                            <FlatList
                                data={dropdownItems}
                                keyExtractor={(item) => item.value}
                                renderItem={({ item, index }) => (
                                    <TouchableOpacity
                                        style={{
                                            flexDirection: "row",
                                            alignItems: 'center',
                                            marginTop: 12,
                                            borderBottomColor: COLORS.grayscale200,
                                            borderBottomWidth: index === dropdownItems.length - 1 ? 0 : 0,
                                            paddingBottom: 12
                                        }}
                                        onPress={() => handleDropdownSelect(item)}>
                                        <Image
                                            source={item.icon}
                                            resizeMode='contain'
                                            style={{
                                                width: 20,
                                                height: 20,
                                                marginRight: 16,
                                                tintColor: index === dropdownItems.length - 1 ? "red" : dark ? COLORS.white : COLORS.black,
                                            }}
                                        />
                                        <Text style={{
                                            fontSize: 14,
                                            fontFamily: "semiBold",
                                            color: index === dropdownItems.length - 1 ? "red" : dark ? COLORS.white : COLORS.black,
                                        }}>{item.label}</Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>

        </View>
    )
};

const styles = StyleSheet.create({
    banner: {
        width: '100%',
        height: 240,
        backgroundColor: "#E9F0FF"
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
        marginTop: - 72,
        marginLeft: 16,
        marginRight: 16,
        marginBottom: 16,
    },
    logoContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 18,
        height: 18,
        tintColor: COLORS.primary
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
        fontFamily: 'regular',
    },
    moreIcon: {
        height: 24,
        width: 24,
        tintColor: COLORS.greyscale900,
    },
    title: {
        fontSize: 32,
        fontFamily: 'bold',
        color: COLORS.greyscale900,
        marginTop: 16,
        marginBottom: 12,
    },
    container: {
        paddingHorizontal: 16
    },
    subtitle: {
        fontSize: 16,
        color: COLORS.greyscale900,
        fontFamily: 'regular',
    },
    addBtn: {
        height: 46,
        width: SIZES.width - 32,
        borderRadius: 32,
        borderWidth: 1.4,
        borderColor: COLORS.primary,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: "row",
        marginVertical: 16
    },
    addIcon: {
        height: 20,
        width: 20,
        tintColor: COLORS.primary,
        marginRight: 12
    },
    addText: {
        fontSize: 18,
        fontFamily: "bold",
        color: COLORS.primary
    },
    illustration: {
        width: 380,
        height: 320
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
        elevation: 2, // For Android shadow
    },
    bottomTitle: {
        fontSize: 24,
        fontFamily: "bold",
        color: COLORS.black,
        textAlign: "center",
        marginTop: 12
    },
    separateLine: {
        width: "100%",
        height: 1,
        backgroundColor: COLORS.grayscale200
    },
    attachmentBtn: {
        height: 80,
        width: 80,
        borderRadius: 999,
        backgroundColor: COLORS.transparentPrimary,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12
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
        width: 270
    },
    projectDesc: {
        fontSize: 20,
        color: COLORS.greyscale900,
        marginTop: 12,
        marginBottom: 16,
        fontFamily: "bold",
        textAlign: "center",
    }
})

export default NewProject