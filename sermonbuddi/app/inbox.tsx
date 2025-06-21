import { COLORS } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import {
    TeamService,
    type NotificationData,
    type TeamInvitation
} from '@/utils/teamService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface InboxItem {
  id: string;
  type: 'notification' | 'invitation';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
}

export default function InboxScreen() {
  const { user } = useAuth();
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);

  const loadInboxData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Load notifications and invitations in parallel
      const [notifications, invitations] = await Promise.all([
        TeamService.getUserNotifications(user.id),
        TeamService.getUserInvitations()
      ]);

      // Combine notifications and invitations into inbox items
      const items: InboxItem[] = [
        // Map notifications
        ...notifications.map((notification: NotificationData) => ({
          id: `notification-${notification.id}`,
          type: 'notification' as const,
          title: notification.title,
          message: notification.message,
          timestamp: notification.created_at,
          read: notification.read,
          data: notification.data
        })),
        // Map invitations
        ...invitations.map((invitation: TeamInvitation) => ({
          id: `invitation-${invitation.id}`,
          type: 'invitation' as const,
          title: 'Project Invitation',
          message: `${invitation.inviter_name} invited you to join ${invitation.project_name} as ${invitation.role}`,
          timestamp: invitation.created_at,
          read: false, // Invitations are always unread until accepted/declined
          data: {
            invitation_code: invitation.invitation_code,
            project_id: invitation.project_id,
            project_name: invitation.project_name,
            role: invitation.role
          }
        }))
      ];

      // Sort by timestamp (newest first)
      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      setInboxItems(items);
    } catch (error) {
      console.error('❌ Error loading inbox data:', error);
      Alert.alert('Error', 'Failed to load inbox data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadInboxData();
    setRefreshing(false);
  };

  const handleAcceptInvitation = async (item: InboxItem) => {
    if (!item.data?.invitation_code) return;

    try {
      setProcessingInvitation(item.id);
      
      const result = await TeamService.acceptInvitation(item.data.invitation_code);
      
      if (result.success) {
        Alert.alert(
          'Invitation Accepted!',
          `You've joined ${result.projectName} as ${result.role}`,
          [
            {
              text: 'View Project',
              onPress: () => router.push(`/dashboard/${result.projectId}`)
            },
            { text: 'OK' }
          ]
        );
        
        // Refresh inbox to remove accepted invitation
        await loadInboxData();
      }
    } catch (error) {
      console.error('❌ Error accepting invitation:', error);
      Alert.alert('Error', 'Failed to accept invitation. Please try again.');
    } finally {
      setProcessingInvitation(null);
    }
  };

  const handleMarkAsRead = async (item: InboxItem) => {
    if (item.type === 'notification' && !item.read) {
      try {
        const notificationId = item.id.replace('notification-', '');
        await TeamService.markNotificationAsRead(notificationId);
        
        // Update local state
        setInboxItems(prev => 
          prev.map(inboxItem => 
            inboxItem.id === item.id 
              ? { ...inboxItem, read: true }
              : inboxItem
          )
        );
      } catch (error) {
        console.error('❌ Error marking notification as read:', error);
      }
    }
  };

  const handleItemPress = (item: InboxItem) => {
    handleMarkAsRead(item);

    if (item.type === 'invitation') {
      // Show invitation details with accept/decline options
      Alert.alert(
        'Team Invitation',
        item.message,
        [
          { text: 'Decline', style: 'cancel' },
          {
            text: 'Accept',
            onPress: () => handleAcceptInvitation(item)
          }
        ]
      );
    } else if (item.data?.action_url) {
      // Navigate to action URL if available
      router.push(item.data.action_url);
    }
  };

  const renderInboxItem = ({ item }: { item: InboxItem }) => (
    <TouchableOpacity
      style={[
        styles.inboxItem,
        !item.read && styles.unreadItem
      ]}
      onPress={() => handleItemPress(item)}
      disabled={processingInvitation === item.id}
    >
      <View style={styles.itemIcon}>
        {item.type === 'invitation' ? (
          <Ionicons name="people" size={24} color={COLORS.primary} />
        ) : (
          <Ionicons name="notifications" size={24} color={COLORS.primary} />
        )}
      </View>
      
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={[styles.itemTitle, !item.read && styles.unreadText]}>
            {item.title}
          </Text>
          <Text style={styles.timestamp}>
            {new Date(item.timestamp).toLocaleDateString()}
          </Text>
        </View>
        
        <Text style={styles.itemMessage} numberOfLines={2}>
          {item.message}
        </Text>
        
        {item.type === 'invitation' && (
          <View style={styles.invitationActions}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={() => handleAcceptInvitation(item)}
              disabled={processingInvitation === item.id}
            >
              {processingInvitation === item.id ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.acceptButtonText}>Accept</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  useEffect(() => {
    if (user) {
      loadInboxData();
    }
  }, [user]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Inbox</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading inbox...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Inbox</Text>
        <TouchableOpacity onPress={handleRefresh}>
          <Ionicons name="refresh" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={inboxItems}
        keyExtractor={(item) => item.id}
        renderItem={renderInboxItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="mail-open" size={64} color={COLORS.gray} />
            <Text style={styles.emptyTitle}>No messages</Text>
            <Text style={styles.emptyMessage}>
              You'll see team invitations and notifications here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyscale300,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
  },
  listContainer: {
    padding: 16,
  },
  inboxItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadItem: {
    backgroundColor: '#f8f9ff',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  itemIcon: {
    marginRight: 12,
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    flex: 1,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  timestamp: {
    fontSize: 12,
    color: COLORS.gray,
  },
  itemMessage: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: 8,
  },
  invitationActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  acceptButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
    alignSelf: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginTop: 16,
  },
  emptyMessage: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
});