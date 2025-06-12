import { COLORS } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useTabBar } from '@/contexts/TabBarContext';
import { useTheme } from '@/theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Dimensions,
    FlatList,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatMessageWithId, ChatService } from '../../utils/chatService';

const { height: screenHeight } = Dimensions.get('window');

interface ChatBubbleProps {
  message: ChatMessageWithId;
  isUser: boolean;
  dark: boolean;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, isUser, dark }) => {
  return (
    <View style={[
      styles.messageContainer,
      isUser ? styles.userMessage : styles.assistantMessage
    ]}>
      <View style={[
        styles.messageBubble,
        {
          backgroundColor: isUser 
            ? COLORS.primary 
            : (dark ? COLORS.dark3 : COLORS.grayscale100),
          alignSelf: isUser ? 'flex-end' : 'flex-start',
        }
      ]}>
        <Text style={[
          styles.messageText,
          {
            color: isUser 
              ? COLORS.white 
              : (dark ? COLORS.white : COLORS.greyscale900)
          }
        ]}>
          {message.content}
        </Text>
        <Text style={[
          styles.timestamp,
          {
            color: isUser 
              ? COLORS.white 
              : (dark ? COLORS.grayscale400 : COLORS.greyscale600)
          }
        ]}>
          {new Date(message.created_at).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </Text>
      </View>
    </View>
  );
};

const AddNewProject = () => {
  const { dark } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { handleScroll, tabBarTranslateY } = useTabBar();
  const [messages, setMessages] = useState<ChatMessageWithId[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const textInputRef = useRef<TextInput>(null);

  // Enhanced keyboard event listeners
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        const keyboardHeight = event.endCoordinates.height;
        setKeyboardHeight(keyboardHeight);
        setIsKeyboardVisible(true);
        
        // Scroll to bottom when keyboard appears with delay for animation
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, Platform.OS === 'ios' ? 50 : 150);
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  useEffect(() => {
    // Create new conversation and send initial greeting
    const initializeChat = async () => {
      try {
        const newConversationId = await ChatService.createConversation();
        setConversationId(newConversationId);

        // Create a welcome message (this will be displayed immediately)
        const welcomeMessage: ChatMessageWithId = {
          id: 'welcome',
          user_id: user?.id || '',
          conversation_id: newConversationId,
          role: 'assistant',
          content: `Hi there! 👋 I'm your AI project assistant powered by Claude 3.5 Sonnet. I'm here to help you create and plan your new project.

Let's start by telling me about your project idea. What would you like to work on?`,
          metadata: {},
          created_at: new Date().toISOString()
        };
        
        setMessages([welcomeMessage]);
      } catch (error) {
        console.error('Error initializing chat:', error);
      }
    };

    initializeChat();
  }, [user?.id]);

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading || !conversationId) return;

    const messageToSend = inputText.trim();
    setInputText('');
    setIsLoading(true);

    // Dismiss keyboard on send
    Keyboard.dismiss();

    try {
      const { userMessage, assistantMessage } = await ChatService.sendMessage(
        conversationId,
        messageToSend
      );

      // Add both messages to chat
      setMessages(prev => [...prev, userMessage, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Create error message
      const errorMessage: ChatMessageWithId = {
        id: `error-${Date.now()}`,
        user_id: user?.id || '',
        conversation_id: conversationId,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please check your connection and try again.',
        metadata: {},
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: any) => {
    if (event.nativeEvent.key === 'Enter') {
      event.preventDefault();
      sendMessage();
    }
  };

  const renderMessage = ({ item, index }: { item: ChatMessageWithId; index: number }) => {
    return (
      <ChatBubble
        key={index}
        message={item}
        isUser={item.role === 'user'}
        dark={dark}
      />
    );
  };

  // Calculate the tab bar height for positioning
  const tabBarHeight = Platform.OS === 'ios' ? 90 : 60;

  return (
    <View style={[
      styles.container,
      { backgroundColor: dark ? COLORS.dark1 : COLORS.white }
    ]}>
      {/* Header with Back Navigation */}
      <SafeAreaView style={[
        styles.header,
        { backgroundColor: dark ? COLORS.dark2 : COLORS.white }
      ]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons 
              name="arrow-back" 
              size={24} 
              color={dark ? COLORS.white : COLORS.greyscale900} 
            />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <View style={styles.headerTitleRow}>
              <Ionicons 
                name="chatbubbles" 
                size={24} 
                color={COLORS.primary} 
              />
              <Text style={[
                styles.headerTitle,
                { color: dark ? COLORS.white : COLORS.greyscale900 }
              ]}>
                AI Project Assistant
              </Text>
            </View>
            <Text style={[
              styles.headerSubtitle,
              { color: dark ? COLORS.grayscale400 : COLORS.greyscale600 }
            ]}>
              Powered by Claude 3.5 Sonnet
            </Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Main Content with Keyboard Avoidance */}
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Chat Container */}
        <View style={[
          styles.chatContainer,
          {
            marginBottom: isKeyboardVisible ? 0 : (Platform.OS === 'ios' ? 90 : 60), // Tab bar height when keyboard is hidden
          }
        ]}>
          {/* Chat Messages */}
          <Animated.FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => index.toString()}
            style={styles.messagesList}
            contentContainerStyle={[
              styles.messagesContent,
              {
                paddingBottom: isKeyboardVisible ? 20 : 80, // Extra space when keyboard is visible
              }
            ]}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }}
            onLayout={() => {
              // Scroll to bottom when layout changes
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }, 100);
            }}
          />

          {/* Loading indicator */}
          {isLoading && (
            <View style={[
              styles.loadingContainer,
              { 
                bottom: isKeyboardVisible ? 80 : (Platform.OS === 'ios' ? 90 : 60) + 80 // Position above input
              }
            ]}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={[
                styles.loadingText,
                { color: dark ? COLORS.grayscale400 : COLORS.greyscale600 }
              ]}>
                AI is thinking...
              </Text>
            </View>
          )}
        </View>

        {/* Input Container - Fixed at bottom with keyboard avoidance */}
        <Animated.View style={[
          styles.inputContainer,
          { 
            backgroundColor: dark ? COLORS.dark2 : COLORS.white,
            paddingBottom: Platform.OS === 'ios' ? insets.bottom : 16,
            // Apply tab bar animation only when keyboard is NOT visible
            transform: isKeyboardVisible ? [] : [{ 
              translateY: Animated.multiply(tabBarTranslateY, 0.3)
            }],
            // Position above tab bar when keyboard is hidden, at bottom when visible
            bottom: isKeyboardVisible ? 0 : (Platform.OS === 'ios' ? 90 : 60),
            position: 'absolute',
            left: 0,
            right: 0,
          }
        ]}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={textInputRef}
              style={[
                styles.textInput,
                {
                  backgroundColor: dark ? COLORS.dark3 : COLORS.grayscale100,
                  color: dark ? COLORS.white : COLORS.greyscale900,
                }
              ]}
              placeholder="Type your message..."
              placeholderTextColor={dark ? COLORS.grayscale400 : COLORS.greyscale600}
              value={inputText}
              onChangeText={setInputText}
              onKeyPress={handleKeyPress}
              multiline
              maxLength={1000}
              editable={!isLoading}
              returnKeyType="send"
              onSubmitEditing={sendMessage}
              blurOnSubmit={false}
              onFocus={() => {
                // Scroll to bottom when input is focused
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, Platform.OS === 'ios' ? 300 : 500);
              }}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: inputText.trim() && !isLoading ? COLORS.primary : COLORS.greyscale300,
                }
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={COLORS.white} 
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayscale200,
    zIndex: 1000,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  headerSubtitle: {
    fontSize: 12,
    marginLeft: 32,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingTop: 8,
  },
  messageContainer: {
    marginVertical: 4,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  assistantMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayscale200,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AddNewProject;