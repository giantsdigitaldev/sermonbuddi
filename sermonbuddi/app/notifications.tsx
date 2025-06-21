import { COLORS } from '@/constants';
import { useTheme } from '@/theme/ThemeProvider';
import { NotificationData, TeamService } from '@/utils/teamService';
import { Ionicons } from '@expo/vector-icons';
import { NavigationProp } from '@react-navigation/native';
import { useFocusEffect, useNavigation } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const Notifications = () => {
    const { colors, dark } = useTheme();
    const navigation = useNavigation<NavigationProp<any>>();
    
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processing, setProcessing] = useState<{ [key: string]: boolean }>({});

    // Load notifications
    const loadNotifications = useCallback(async () => {
        try {
            const data = await TeamService.getUserNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Refresh notifications
    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadNotifications();
        setRefreshing(false);
    }, [loadNotifications]);

    // Load notifications when screen focuses
    useFocusEffect(
        useCallback(() => {
            loadNotifications();
        }, [loadNotifications])
    );

    // Handle team invitation acceptance
    const handleAcceptInvitation = async (notification: NotificationData) => {
        const invitationCode = notification.data?.invitation_code;
        if (!invitationCode) return;

        setProcessing(prev => ({ ...prev, [notification.id]: true }));

        try {
            const result = await TeamService.acceptInvitation(invitationCode);
            
            if (result.success) {
                Alert.alert(
                    'Invitation Accepted!',
                    `You've successfully joined ${result.projectName}`,
                    [
                        {
                            text: 'View Project',
                            onPress: () => {
                                navigation.navigate('dashboard/[projectId]', {
                                    projectId: result.projectId
                                });
                            }
                        },
                        { text: 'OK' }
                    ]
                );

                // Mark notification as read and reload
                await TeamService.markNotificationAsRead(notification.id);
                loadNotifications();
            } else {
                Alert.alert('Error', result.error || 'Failed to accept invitation');
            }
        } catch (error) {
            console.error('Accept invitation error:', error);
            Alert.alert('Error', 'Failed to accept invitation');
        } finally {
            setProcessing(prev => ({ ...prev, [notification.id]: false }));
        }
    };

    // Handle team invitation decline
    const handleDeclineInvitation = async (notification: NotificationData) => {
        Alert.alert(
            'Decline Invitation',
            'Are you sure you want to decline this team invitation?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Decline',
                    style: 'destructive',
                    onPress: async () => {
                        // Mark as read (this effectively declines it)
                        await TeamService.markNotificationAsRead(notification.id);
                        loadNotifications();
                    }
                }
            ]
        );
    };

    // Mark notification as read
    const markAsRead = async (notificationId: string) => {
        await TeamService.markNotificationAsRead(notificationId);
        loadNotifications();
    };

    // Get notification icon
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'team_invitation':
                return 'people-outline';
            case 'team_accepted':
                return 'checkmark-circle-outline';
            case 'team_removed':
                return 'person-remove-outline';
            case 'role_changed':
                return 'shield-outline';
            default:
                return 'notifications-outline';
        }
    };

    // Get notification color
    const getNotificationColor = (type: string) => {
        switch (type) {
            case 'team_invitation':
                return COLORS.primary;
            case 'team_accepted':
                return COLORS.success;
            case 'team_removed':
                return COLORS.error;
            case 'role_changed':
                return COLORS.warning;
            default:
                return COLORS.grayscale400;
        }
    };

    // Render notification item
    const renderNotification = ({ item: notification }: { item: NotificationData }) => {
        const isUnread = !notification.read;
        const isProcessing = processing[notification.id];
        const isTeamInvitation = notification.type === 'team_invitation';

        return (
            <TouchableOpacity
                style={[styles.notificationContainer, {
                    backgroundColor: isUnread 
                        ? (dark ? COLORS.dark2 : COLORS.primary + '10') 
                        : (dark ? COLORS.dark3 : COLORS.white),
                    borderLeftColor: getNotificationColor(notification.type),
                    opacity: isProcessing ? 0.7 : 1
                }]}
                onPress={() => !isUnread && markAsRead(notification.id)}
                disabled={isProcessing}
            >
                <View style={styles.notificationContent}>
                    <View style={styles.notificationHeader}>
                        <View style={[styles.iconContainer, {
                            backgroundColor: getNotificationColor(notification.type) + '20'
                        }]}>
                            <Ionicons 
                                name={getNotificationIcon(notification.type) as any} 
                                size={20} 
                                color={getNotificationColor(notification.type)} 
                            />
                        </View>
                        <View style={styles.notificationInfo}>
                            <Text style={[styles.notificationTitle, {
                                color: dark ? COLORS.white : COLORS.greyscale900,
                                fontWeight: isUnread ? 'bold' : 'normal'
                            }]}>
                                {notification.title}
                            </Text>
                            <Text style={[styles.notificationMessage, {
                                color: dark ? COLORS.grayscale400 : COLORS.grayscale700
                            }]}>
                                {notification.message}
                            </Text>
                            <Text style={[styles.notificationTime, {
                                color: dark ? COLORS.grayscale400 : COLORS.grayscale700
                            }]}>
                                {new Date(notification.created_at).toLocaleDateString()}
                            </Text>
                        </View>
                        {isUnread && (
                            <View style={[styles.unreadDot, {
                                backgroundColor: COLORS.primary
                            }]} />
                        )}
                    </View>

                    {/* Team invitation actions */}
                    {isTeamInvitation && isUnread && (
                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.declineButton, {
                                    backgroundColor: dark ? COLORS.dark2 : COLORS.grayscale200
                                }]}
                                onPress={() => handleDeclineInvitation(notification)}
                                disabled={isProcessing}
                            >
                                <Text style={[styles.actionButtonText, {
                                    color: dark ? COLORS.white : COLORS.greyscale900
                                }]}>
                                    Decline
                                </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                                style={[styles.actionButton, styles.acceptButton, {
                                    backgroundColor: COLORS.primary
                                }]}
                                onPress={() => handleAcceptInvitation(notification)}
                                disabled={isProcessing}
                            >
                                {isProcessing ? (
                                    <ActivityIndicator size="small" color={COLORS.white} />
                                ) : (
                                    <Text style={styles.acceptButtonText}>Accept</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    // Empty state
    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <Ionicons 
                name="notifications-outline" 
                size={64} 
                color={dark ? COLORS.grayscale400 : COLORS.grayscale200} 
            />
            <Text style={[styles.emptyTitle, {
                color: dark ? COLORS.white : COLORS.greyscale900
            }]}>
                No Notifications
            </Text>
            <Text style={[styles.emptyMessage, {
                color: dark ? COLORS.grayscale400 : COLORS.grayscale700
            }]}>
                You're all caught up! New notifications will appear here.
            </Text>
        </View>
    );

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, {
                backgroundColor: dark ? COLORS.dark1 : COLORS.white
            }]}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={styles.backButton}
                    >
                        <Ionicons name="arrow-back" size={24} color={dark ? COLORS.white : COLORS.black} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, {
                        color: dark ? COLORS.white : COLORS.greyscale900
                    }]}>
                        Notifications
                    </Text>
                    <View style={styles.placeholder} />
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, {
            backgroundColor: dark ? COLORS.dark1 : COLORS.white
        }]}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <Ionicons name="arrow-back" size={24} color={dark ? COLORS.white : COLORS.black} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, {
                    color: dark ? COLORS.white : COLORS.greyscale900
                }]}>
                    Notifications
                </Text>
                <View style={styles.placeholder} />
            </View>

            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderNotification}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={[COLORS.primary]}
                        tintColor={COLORS.primary}
                    />
                }
                ListEmptyComponent={renderEmptyState}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.grayscale100,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    placeholder: {
        width: 32,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        flexGrow: 1,
        padding: 16,
    },
    notificationContainer: {
        marginBottom: 12,
        borderRadius: 12,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    notificationContent: {
        padding: 16,
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    notificationInfo: {
        flex: 1,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    notificationMessage: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    notificationTime: {
        fontSize: 12,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    actionButtons: {
        flexDirection: 'row',
        marginTop: 16,
        gap: 12,
    },
    actionButton: {
        flex: 1,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    declineButton: {
        // Additional styles for decline button
    },
    acceptButton: {
        // Additional styles for accept button
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    acceptButtonText: {
        color: COLORS.white,
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyMessage: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
});

export default Notifications