import { COLORS, icons, SIZES } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import React from 'react';
import { Alert, Image, ImageSourcePropType, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import * as Progress from 'react-native-progress';

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
    onDelete
}) => {
    const { dark } = useTheme();
    const progress = numberOfTaskCompleted / numberOfTask;

    const handleMorePress = () => {
        Alert.alert(
            'Project Options',
            'What would you like to do?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Edit Name', 
                    onPress: () => {
                        Alert.prompt(
                            'Edit Project Name',
                            'Enter new project name:',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                { 
                                    text: 'Save', 
                                    onPress: (text) => {
                                        if (text && text.trim() && onEdit) {
                                            onEdit('name', text.trim());
                                        }
                                    }
                                }
                            ],
                            'plain-text',
                            name
                        );
                    }
                },
                { 
                    text: 'Edit Description', 
                    onPress: () => {
                        Alert.prompt(
                            'Edit Project Description',
                            'Enter new description:',
                            [
                                { text: 'Cancel', style: 'cancel' },
                                { 
                                    text: 'Save', 
                                    onPress: (text) => {
                                        if (text && onEdit) {
                                            onEdit('description', text);
                                        }
                                    }
                                }
                            ],
                            'plain-text',
                            description
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
                                { 
                                    text: 'Active', 
                                    onPress: () => onEdit && onEdit('status', 'active')
                                },
                                { 
                                    text: 'Completed', 
                                    onPress: () => onEdit && onEdit('status', 'completed')
                                },
                                { 
                                    text: 'Archived', 
                                    onPress: () => onEdit && onEdit('status', 'archived')
                                }
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
        <TouchableOpacity onPress={onPress} style={[styles.card, customStyles.card, { 
            backgroundColor: dark ? COLORS.dark2 : "white",
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
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: "white",
        borderRadius: SIZES.radius,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
        marginBottom: 12,
        width: SIZES.width - 48,
        marginRight: 8
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
});

export default ProjectCard;