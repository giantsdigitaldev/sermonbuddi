import { Ionicons } from '@expo/vector-icons';
import { NavigationProp, useFocusEffect, useNavigation } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, icons, images } from '../../constants';
import { useTheme } from '../../theme/ThemeProvider';
import { ChatService, ChatSession } from '../../utils/chatService';

const Inbox = () => {
  const navigation = useNavigation<NavigationProp<any>>();
  const { colors, dark } = useTheme();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load chat sessions
  const loadChatSessions = useCallback(async () => {
    try {
      setIsLoading(true);
      const chatSessions = await ChatService.getChatSessions();
      setSessions(chatSessions);
    } catch (error) {
      console.error('Error loading chat sessions:', error);
      Alert.alert('Error', 'Failed to load chat sessions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh chat sessions
  const onRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const chatSessions = await ChatService.getChatSessions();
      setSessions(chatSessions);
    } catch (error) {
      console.error('Error refreshing chat sessions:', error);
      Alert.alert('Error', 'Failed to refresh chat sessions. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // Load sessions when screen focuses
  useFocusEffect(
    useCallback(() => {
      loadChatSessions();
    }, [loadChatSessions])
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Handle chat session press
  const handleSessionPress = (sessionId: string) => {
    navigation.navigate('aiassistant', { conversationId: sessionId });
  };

  // Handle delete session
  const handleDeleteSession = async (sessionId: string, sessionTitle: string) => {
    Alert.alert(
      'Delete Conversation',
      `Are you sure you want to delete "${sessionTitle}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ChatService.deleteConversation(sessionId);
              setSessions(prev => prev.filter(session => session.id !== sessionId));
            } catch (error) {
              console.error('Error deleting session:', error);
              Alert.alert('Error', 'Failed to delete conversation. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Create new chat session
  const handleNewChat = async () => {
    try {
      const conversationId = await ChatService.createConversation();
      navigation.navigate('aiassistant', { conversationId });
    } catch (error) {
      console.error('Error creating new chat:', error);
      Alert.alert('Error', 'Failed to create new chat. Please try again.');
    }
  };

  // Render header
  const renderHeader = () => {
    return (
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <Image
            source={images.logo}
            resizeMode='contain'
            style={styles.headerLogo}
          />
          <Text style={[styles.headerTitle, {
            color: dark ? COLORS.white : COLORS.greyscale900
          }]}>AI Assistant</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('chatsessions')}>
            <Ionicons
              name="list-outline"
              size={24}
              color={dark ? COLORS.secondaryWhite : COLORS.greyscale900}
            />
          </TouchableOpacity>
          <TouchableOpacity style={{ marginLeft: 12 }}>
            <Image
              source={icons.moreCircle}
              resizeMode='contain'
              style={[styles.moreCircleIcon, {
                tintColor: dark ? COLORS.secondaryWhite : COLORS.greyscale900
              }]}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render chat session item
  const renderSessionItem = ({ item }: { item: ChatSession }) => (
    <TouchableOpacity
      style={[
        styles.sessionCard,
        {
          backgroundColor: dark ? COLORS.dark2 : COLORS.white,
          borderColor: dark ? COLORS.dark3 : COLORS.grayscale200,
        },
      ]}
      onPress={() => handleSessionPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.sessionHeader}>
        <View style={styles.sessionAvatar}>
          <Ionicons
            name="sparkles"
            size={24}
            color={COLORS.primary}
          />
        </View>
        <View style={styles.sessionInfo}>
          <Text
            style={[
              styles.sessionTitle,
              { color: dark ? COLORS.white : COLORS.greyscale900 },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            style={[
              styles.sessionPreview,
              { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 },
            ]}
            numberOfLines={2}
          >
            {item.preview}
          </Text>
        </View>
        <View style={styles.sessionMeta}>
          <Text
            style={[
              styles.sessionDate,
              { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 },
            ]}
          >
            {formatDate(item.updated_at)}
          </Text>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteSession(item.id, item.title)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color={dark ? COLORS.grayscale400 : COLORS.grayscale700}
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {item.message_count && item.message_count > 0 && (
        <View style={styles.sessionFooter}>
          <View style={styles.messageCount}>
            <Ionicons
              name="chatbubble-outline"
              size={12}
              color={dark ? COLORS.grayscale400 : COLORS.grayscale700}
            />
            <Text
              style={[
                styles.messageCountText,
                { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 },
              ]}
            >
              {item.message_count} messages
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name="chatbubbles-outline"
        size={80}
        color={dark ? COLORS.grayscale400 : COLORS.grayscale700}
      />
      <Text
        style={[
          styles.emptyStateTitle,
          { color: dark ? COLORS.white : COLORS.greyscale900 },
        ]}
      >
        Start Your First Chat
      </Text>
      <Text
        style={[
          styles.emptyStateDescription,
          { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 },
        ]}
      >
        Ask your AI assistant anything! Get help with project planning, task management, or general questions.
      </Text>
      <TouchableOpacity
        style={[styles.newChatButton, { backgroundColor: COLORS.primary }]}
        onPress={handleNewChat}
      >
        <Text style={styles.newChatButtonText}>Start New Chat</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.area, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {renderHeader()}
        
        {/* Content */}
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text
                style={[
                  styles.loadingText,
                  { color: dark ? COLORS.grayscale400 : COLORS.grayscale700 },
                ]}
              >
                Loading conversations...
              </Text>
            </View>
          ) : (
            <FlatList
              data={sessions}
              renderItem={renderSessionItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[
                styles.listContainer,
                sessions.length === 0 && styles.listContainerEmpty,
              ]}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={onRefresh}
                  colors={[COLORS.primary]}
                  tintColor={COLORS.primary}
                />
              }
              ListEmptyComponent={renderEmptyState}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>

        {/* Floating Action Button */}
        <TouchableOpacity 
          style={styles.addPostBtn}
          onPress={handleNewChat}
        >
          <Ionicons name="add" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  area: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center"
  },
  headerLogo: {
    height: 36,
    width: 36,
    tintColor: COLORS.primary
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "bold",
    marginLeft: 12
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center"
  },
  moreCircleIcon: {
    width: 24,
    height: 24,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'medium',
    marginTop: 16,
  },
  listContainer: {
    paddingTop: 8,
  },
  listContainerEmpty: {
    flex: 1,
  },
  sessionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginVertical: 6,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  sessionAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sessionInfo: {
    flex: 1,
    marginRight: 12,
  },
  sessionTitle: {
    fontSize: 16,
    fontFamily: 'semiBold',
    marginBottom: 4,
  },
  sessionPreview: {
    fontSize: 14,
    fontFamily: 'regular',
    lineHeight: 20,
  },
  sessionMeta: {
    alignItems: 'flex-end',
  },
  sessionDate: {
    fontSize: 12,
    fontFamily: 'medium',
    marginBottom: 8,
  },
  deleteButton: {
    padding: 4,
  },
  sessionFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayscale200,
  },
  messageCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageCountText: {
    fontSize: 12,
    fontFamily: 'medium',
    marginLeft: 6,
  },
  separator: {
    height: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: 'semiBold',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    fontFamily: 'regular',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
  },
  newChatButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  newChatButtonText: {
    fontSize: 16,
    fontFamily: 'semiBold',
    color: COLORS.white,
  },
  addPostBtn: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: COLORS.primary,
    position: "absolute",
    bottom: 72,
    right: 16,
    zIndex: 999,
    shadowRadius: 10,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 10 }
  }
});

export default Inbox;