import { COLORS, icons, SIZES } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import { ProjectService } from '@/utils/projectService';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { Animated, Image, ImageSourcePropType, Modal, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import * as Progress from 'react-native-progress';
import Toast from './Toast';

type CustomStyles = {
    card?: ViewStyle;
};

type ProjectCardProps = {
    id: string;
    name: string;
    description: string;
    image: string;
    status: string;
    numberOfTask: number;
    numberOfTaskCompleted: number;
    numberOfDaysLeft: number;
    logo: string;
    members: string[];
    endDate: string;
    customStyles?: CustomStyles;
    onPress?: () => void;
    onEdit?: (field: string, value: any) => void;
    onDelete?: () => void;
    onRefresh?: () => void; // Add refresh callback
};

const colors = {
    advanced: COLORS.primary,
    intermediate: "#ff566e",
    medium: "#fbd027",
    weak: "#26c2a3",
    completed: COLORS.greeen
}

const ProjectCard: React.FC<ProjectCardProps> = ({
    id,
    name,
    description,
    image,
    status,
    numberOfTask,
    numberOfTaskCompleted,
    numberOfDaysLeft,
    logo,
    members,
    endDate,
    customStyles = {},
    onPress,
    onEdit,
    onDelete,
    onRefresh
}) => {
    const { dark } = useTheme();
    const navigation = useNavigation<NavigationProp<any>>();
    const progress = numberOfTaskCompleted / numberOfTask;
    
    // Dropdown state
    const [showDropdown, setShowDropdown] = useState(false);
    const [dropdownAnimation] = useState(new Animated.Value(0));
    
    // Confirmation modal state
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
    const [confirmationAnimation] = useState(new Animated.Value(0));
    
    // Card vanishing animation state
    const [isDeleting, setIsDeleting] = useState(false);
    const [cardAnimation] = useState(new Animated.Value(1));
    
    // Toast state
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastType, setToastType] = useState<'success' | 'error' | 'warning' | 'info'>('success');

    // Dropdown menu options matching projectdetails page
    const dropdownOptions = [
        {
            id: 'add-task',
            title: 'Add New Task',
            icon: icons.addFile,
            onPress: () => {
                setShowDropdown(false);
                navigation.navigate("addnewtaskform", { projectId: id });
            }
        },
        {
            id: 'add-user',
            title: 'Add New User',
            icon: icons.user,
            onPress: () => {
                setShowDropdown(false);
                navigation.navigate("projectdetailsaddteammenber", { projectId: id });
            }
        },
        {
            id: 'delete-project',
            title: 'Delete Project',
            icon: icons.trash,
            onPress: () => {
                setShowDropdown(false);
                showDeleteConfirmationModal();
            }
        }
    ];

     // Dropdown animation functions
     const showDropdownMenu = () => {
        setShowDropdown(true);
        Animated.timing(dropdownAnimation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    const hideDropdownMenu = () => {
        Animated.timing(dropdownAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setShowDropdown(false);
        });
    };

    // Confirmation modal functions
    const showDeleteConfirmationModal = () => {
        setShowDeleteConfirmation(true);
        Animated.timing(confirmationAnimation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    };

    const hideDeleteConfirmationModal = () => {
        Animated.timing(confirmationAnimation, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setShowDeleteConfirmation(false);
        });
    };

    // Card vanishing animation with smooth easing
    const startVanishingAnimation = () => {
        setIsDeleting(true);
        Animated.timing(cardAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false, // Need false for height animation
        }).start();
    };

    // Handle project deletion with database support and vanishing animation
    const handleDeleteProject = async () => {
        try {
            hideDeleteConfirmationModal();
            
            console.log('🗑️ Starting project deletion process for:', id, name);
            
            // Start vanishing animation immediately for smooth UX
            startVanishingAnimation();
            
            // Show loading toast
            setToastMessage('Deleting project...');
            setToastType('info');
            setToastVisible(true);

            console.log('💾 Calling ProjectService.deleteProject for:', id);
            const success = await ProjectService.deleteProject(id);
            console.log('🔄 ProjectService.deleteProject result:', success);
            
            if (success) {
                console.log('✅ Project deletion successful, updating UI');
                setToastMessage('Project deleted successfully!');
                setToastType('success');
                setToastVisible(true);
                
                // Wait for animation to complete before calling callbacks
                setTimeout(() => {
                    console.log('🔄 Calling deletion callbacks');
                    // Call the onDelete callback if provided
                    if (onDelete) {
                        onDelete();
                    }
                    
                    // Call refresh callback to update the parent list
                    if (onRefresh) {
                        onRefresh();
                    }
                }, 550); // Slightly longer than animation duration
                
            } else {
                console.error('❌ Project deletion failed, resetting animation');
                // Reset animation on failure
                setIsDeleting(false);
                cardAnimation.setValue(1);
                
                setToastMessage('Failed to delete project. Please try again.');
                setToastType('error');
                setToastVisible(true);
            }
        } catch (error) {
            console.error('❌ Error in handleDeleteProject:', error);
            
            // Reset animation on error
            setIsDeleting(false);
            cardAnimation.setValue(1);
            
            setToastMessage('An error occurred while deleting the project.');
            setToastType('error');
            setToastVisible(true);
        }
    };

    const handleMorePress = () => {
        showDropdownMenu();
    };
    
    return (
        <>
            <Animated.View
                style={[
                    {
                        opacity: cardAnimation,
                        transform: [
                            {
                                scale: cardAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.8, 1],
                                }),
                            },
                            {
                                translateY: cardAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [-20, 0],
                                }),
                            },
                        ],
                        height: cardAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 280], // Approximate card height
                        }),
                        marginVertical: cardAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 8],
                        }),
                    },
                ]}
            >
                <TouchableOpacity 
                    onPress={onPress} 
                    disabled={isDeleting}
                    style={[styles.card, customStyles.card, { 
                        backgroundColor: dark ? COLORS.dark2 : "white",
                        // Much stronger shadow for maximum visibility
                        shadowColor: dark ? 'rgba(231, 230, 230, 0.4)' : 'rgba(0, 0, 0, 0.4)',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: dark ? 0.8 : 0.8,
                        shadowRadius: 1,
                        elevation: 1,
                        borderColor: dark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)',
                    }]}>
                <Image source={image as ImageSourcePropType} style={styles.banner} />
                <View style={styles.content}>
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <Image source={logo as ImageSourcePropType} style={styles.logo} />
                        </View>
                        <View style={styles.membersContainer}>
                            {members.slice(0, 3).map((member, index) => (
                                <Image
                                    key={index}
                                    source={member as ImageSourcePropType}
                                    style={[styles.memberAvatar, { left: index * -10 }]}
                                />
                            ))}
                            {members.length > 3 && (
                                <View style={styles.moreMembers}>
                                    <Text style={styles.moreText}>+{members.length - 3}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <View style={styles.nameContainer}>
                        <Text style={[styles.projectName, { 
                            color: dark? COLORS.white : COLORS.greyscale900
                        }]}>{name}</Text>
                        <TouchableOpacity onPress={handleMorePress}>
                            <Image
                                source={icons.moreCircle}
                                resizeMode='contain'
                                style={[styles.moreIcon, { 
                                    tintColor: dark ? COLORS.white : COLORS.greyscale900,
                                }]}
                            />
                        </TouchableOpacity>
                    </View>
                    <Text style={[styles.description, { 
                        color: dark ? COLORS.white : COLORS.greyScale800,
                    }]}>{description} - {endDate}</Text>
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
                            color: dark ? COLORS.grayscale400 : COLORS.grayscale700,
                        }]}>{numberOfDaysLeft} Days Left</Text>
                    </View>
                    <Progress.Bar
                        progress={numberOfTaskCompleted / numberOfTask}
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
                </View>
            </TouchableOpacity>
            </Animated.View>

            {/* Dropdown Modal */}
            <Modal
                visible={showDropdown}
                transparent={true}
                animationType="none"
                onRequestClose={hideDropdownMenu}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
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
                                        { 
                                            tintColor: option.id === 'delete-project' 
                                                ? '#FF6B6B' 
                                                : (dark ? COLORS.white : COLORS.greyscale900) 
                                        },
                                    ]}
                                />
                                <Text
                                    style={[
                                        styles.dropdownText,
                                        { 
                                            color: option.id === 'delete-project' 
                                                ? '#FF6B6B' 
                                                : (dark ? COLORS.white : COLORS.greyscale900) 
                                        },
                                    ]}
                                >
                                    {option.title}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </Animated.View>
                </TouchableOpacity>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                visible={showDeleteConfirmation}
                transparent={true}
                animationType="none"
                onRequestClose={hideDeleteConfirmationModal}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={hideDeleteConfirmationModal}
                >
                    <Animated.View
                        style={[
                            styles.confirmationContainer,
                            {
                                backgroundColor: dark ? COLORS.dark2 : COLORS.white,
                                opacity: confirmationAnimation,
                                transform: [
                                    {
                                        scale: confirmationAnimation.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.8, 1],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        <View style={styles.confirmationContent}>
                            <Ionicons 
                                name="warning" 
                                size={48} 
                                color="#FF6B6B" 
                                style={styles.warningIcon}
                            />
                            <Text style={[styles.confirmationTitle, { 
                                color: dark ? COLORS.white : COLORS.greyscale900 
                            }]}>
                                Delete Project
                            </Text>
                            <Text style={[styles.confirmationMessage, { 
                                color: dark ? COLORS.grayscale200 : COLORS.grayscale700 
                            }]}>
                                Are you sure you want to delete "{name}"? This action cannot be undone and will remove all associated data.
                            </Text>
                            <View style={styles.confirmationButtons}>
                                <TouchableOpacity
                                    style={[styles.confirmationButton, styles.cancelButton, {
                                        backgroundColor: dark ? COLORS.grayscale700 : COLORS.grayscale200,
                                    }]}
                                    onPress={hideDeleteConfirmationModal}
                                >
                                    <Text style={[styles.cancelButtonText, { 
                                        color: dark ? COLORS.white : COLORS.greyscale900 
                                    }]}>
                                        Cancel
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.confirmationButton, styles.deleteButton]}
                                    onPress={handleDeleteProject}
                                >
                                    <Text style={styles.deleteButtonText}>
                                        Delete
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                </TouchableOpacity>
            </Modal>

            {/* Toast Notification */}
            <Toast
                visible={toastVisible}
                message={toastMessage}
                type={toastType}
                onHide={() => setToastVisible(false)}
            />
        </>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: "white",
        borderRadius: SIZES.radius,
        overflow: 'hidden',
        // Much stronger shadow and border for maximum visibility - applied directly to card
        shadowColor: '#ff0000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 1,
        // Add much stronger border for additional contrast
        borderWidth: 1.5,
        borderColor: 'rgba(0, 0, 0, 0.2)',
        width: SIZES.width - 20, // Maximum width with minimal side margins (10px each side)
        marginHorizontal: 6, // Minimal margins for maximum width
        // Ensure proper spacing for shadow visibility
        marginVertical: 8,
        alignSelf: 'center', // Center the card within its container
    },
    banner: {
        width: '100%',
        height: 120,
    },
    content: {
        padding: SIZES.padding,
        paddingBottom: 18
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: - 72,
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
        fontSize: 24,
        fontFamily: 'bold',
    },
    moreIcon: {
        height: 24,
        width: 24,
        tintColor: COLORS.greyscale900,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: "100%",
        justifyContent: "space-between",
        marginTop: 32,
        marginBottom: 16
    },
    projectName: {
        fontSize: 24,
        fontFamily: 'bold',
    },
    description: {
        fontSize: 14,
        color: COLORS.greyScale800,
        fontFamily: "regular",
        marginBottom: 6
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
    // Dropdown styles matching projectdetails page
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropdownContainer: {
        marginHorizontal: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    dropdownOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    dropdownIcon: {
        width: 24,
        height: 24,
        marginRight: 16,
    },
    dropdownText: {
        fontSize: 16,
        fontWeight: '500',
    },
    // Confirmation modal styles
    confirmationContainer: {
        marginHorizontal: 20,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    confirmationContent: {
        padding: 24,
        alignItems: 'center',
    },
    warningIcon: {
        marginBottom: 16,
    },
    confirmationTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    confirmationMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
    },
    confirmationButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    confirmationButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButton: {
        marginRight: 8,
    },
    deleteButton: {
        backgroundColor: '#FF6B6B',
        marginLeft: 8,
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    deleteButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.white,
    },
});

export default ProjectCard;