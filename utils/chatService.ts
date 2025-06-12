import { Platform } from 'react-native';
import { Database, supabase } from './supabase';

type ChatConversation = Database['public']['Tables']['chat_conversations']['Row'];
type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type InsertChatConversation = Database['public']['Tables']['chat_conversations']['Insert'];
type InsertChatMessage = Database['public']['Tables']['chat_messages']['Insert'];

export interface ChatSession {
  id: string;
  user_id: string;
  project_id?: string;
  title: string;
  preview: string;
  message_count: number;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessageWithId {
  id: string;
  user_id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: Record<string, any>;
  created_at: string;
}

interface ClaudeAPIResponse {
  success: boolean;
  message: string;
  conversationId?: string;
  usage?: any;
  error?: string;
  details?: string;
}

interface ClaudeDirectResponse {
  content: Array<{ text: string }>;
  usage?: any;
}

export class ChatService {
  
  /**
   * Detect if running on web platform
   */
  private static isWeb(): boolean {
    return Platform.OS === 'web';
  }

  /**
   * Call Claude API directly - for mobile platforms
   */
  private static async callClaudeAPIDirect(
    messages: Array<{role: 'user' | 'assistant', content: string}>
  ): Promise<string> {
    try {
      const claudeApiKey = process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
      if (!claudeApiKey) {
        throw new Error('Claude API key not found. Please add EXPO_PUBLIC_CLAUDE_API_KEY to your .env file');
      }

      console.log('🤖 Calling Claude API directly (mobile)...');

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': claudeApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          messages: messages,
          system: "You are a helpful AI assistant for project management and productivity. Provide clear, actionable advice and help users organize their work effectively."
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Claude API Error:', response.status, errorText);
        throw new Error('Failed to get response from Claude API');
      }

      const data: ClaudeDirectResponse = await response.json();
      const assistantMessage = data.content?.[0]?.text || 'Sorry, I could not generate a response.';
      
      console.log('✅ Received response from Claude (direct)');
      return assistantMessage;
    } catch (error: any) {
      console.error('🚨 Claude API call failed:', error);
      throw new Error('Failed to get response from AI assistant. Please try again.');
    }
  }

  /**
   * Check if local proxy server is available
   */
  private static async isProxyServerAvailable(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3001/health', {
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Call Claude API for web platforms - optimized for speed
   */
  private static async callClaudeAPIForWeb(
    messages: Array<{role: 'user' | 'assistant', content: string}>
  ): Promise<string> {
    console.log('🌐 Attempting Claude API call for web...');

    // Quick connectivity check first
    const isProxyAvailable = await this.isProxyServerAvailable();
    
    if (isProxyAvailable) {
      // Strategy 1: Use local proxy server (fastest and most reliable)
      try {
        console.log('🚀 Using local proxy server...');
        
        const response = await fetch('http://localhost:3001/api/claude-proxy', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: messages,
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4000
          }),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Received response from Claude (Local Proxy)');
          return data.message;
        }
      } catch (error) {
        console.log('❌ Local proxy request failed...');
      }
    } else {
      console.log('❌ Local proxy server not available...');
    }

    // Strategy 2: Try Supabase Edge Function (if deployed)
    try {
      console.log('Trying Supabase Edge Function...');
      const { data, error } = await supabase.functions.invoke('claude-chat', {
        body: {
          messages: messages,
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          system: "You are a helpful AI assistant for project management and productivity. Provide clear, actionable advice and help users organize their work effectively."
        }
      });

      if (!error && data?.success) {
        console.log('✅ Received response from Claude (Edge Function)');
        return data.message;
      }
    } catch (error) {
      console.log('Edge Function not available...');
    }

    // Strategy 3: Provide helpful fallback with setup instructions
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    const userQuestion = lastUserMessage?.content || '';
    
    return `I'd love to help you with "${userQuestion.substring(0, 50)}${userQuestion.length > 50 ? '...' : ''}"

🚨 **AI Proxy Server Not Running**

To enable full AI responses on web, please start the proxy server:

**Quick Fix:**
\`\`\`bash
# In a new terminal window:
cd /Users/blokz/Documents/_cristOS
node server.js
\`\`\`

**Or use the automated script:**
\`\`\`bash
./start-with-ai.sh
\`\`\`

📱 **Alternative:** Use the mobile app for full AI functionality:
1. Install Expo Go
2. Scan QR code from terminal
3. Navigate to AI Assistant

Once the proxy server is running, refresh this page and try again!`;
  }

  /**
   * Smart API call that chooses the right method based on platform
   */
  private static async callClaudeAPI(
    messages: Array<{role: 'user' | 'assistant', content: string}>,
    conversationId?: string
  ): Promise<string> {
    if (this.isWeb()) {
      // Use Supabase Edge Function for web (avoids CORS issues)
      return await this.callClaudeAPIForWeb(messages);
    } else {
      // Use direct API for mobile (no CORS issues)
      return await this.callClaudeAPIDirect(messages);
    }
  }

  /**
   * Create a new conversation
   */
  static async createConversation(projectId?: string): Promise<string> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({
          user_id: user.id,
          project_id: projectId || null,
          title: 'New Chat',
          metadata: {}
        })
        .select('id')
        .single();

      if (error) {
        console.error('Supabase error creating conversation:', error);
        throw new Error(`Failed to create conversation: ${error.message}`);
      }

      return data.id;
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  /**
   * Send a message and get AI response
   */
  static async sendMessage(
    conversationId: string,
    content: string
  ): Promise<{
    userMessage: ChatMessageWithId;
    assistantMessage: ChatMessageWithId;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get conversation history for context
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10); // Limit to last 10 messages for context

      // Build messages array for Claude
      const conversationHistory: Array<{role: 'user' | 'assistant', content: string}> = 
        messages || [];

      // Add the new user message
      conversationHistory.push({ role: 'user', content });

      // Call Claude API using smart routing
      const assistantResponse = await this.callClaudeAPI(conversationHistory, conversationId);

      // Save user message to database
      const { data: userMessageData, error: userError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          conversation_id: conversationId,
          role: 'user',
          content: content,
          metadata: {}
        })
        .select()
        .single();

      if (userError) {
        throw new Error(`Failed to save user message: ${userError.message}`);
      }

      // Save assistant message to database
      const { data: assistantMessageData, error: assistantError } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          conversation_id: conversationId,
          role: 'assistant',
          content: assistantResponse,
          metadata: {}
        })
        .select()
        .single();

      if (assistantError) {
        throw new Error(`Failed to save assistant message: ${assistantError.message}`);
      }

      // Update conversation with title if it's the first exchange
      if (conversationHistory.length <= 2) {
        const title = await this.generateConversationTitle(assistantResponse, content);
        const preview = this.generatePreview(content);
        
        await supabase
          .from('chat_conversations')
          .update({ 
            title,
            metadata: { preview }
          })
          .eq('id', conversationId);
      }

      return {
        userMessage: userMessageData,
        assistantMessage: assistantMessageData
      };
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Generate a conversation title using AI
   */
  private static async generateConversationTitle(
    assistantResponse: string, 
    userMessage: string
  ): Promise<string> {
    try {
      const titlePrompt = `Based on this conversation, create a short, descriptive title (max 6 words):

User: ${userMessage}
Assistant: ${assistantResponse.substring(0, 200)}...

Title:`;

      const titleResponse = await this.callClaudeAPI([
        { role: 'user', content: titlePrompt }
      ]);

      const title = titleResponse
        .replace(/^(Title:|AI Chat|Conversation):?\s*/i, '')
        .trim()
        .substring(0, 50);

      return title || 'New Conversation';
    } catch (error) {
      console.log('Failed to generate title, using default');
      // Fallback to simple title based on user message
      return `Chat: ${userMessage.substring(0, 30)}${userMessage.length > 30 ? '...' : ''}`;
    }
  }

  /**
   * Generate a 10-word preview from user message
   */
  private static generatePreview(content: string): string {
    const words = content.trim().split(/\s+/);
    const preview = words.slice(0, 10).join(' ');
    return preview.length < content.length ? preview + '...' : preview;
  }

  /**
   * Get all chat sessions for the current user
   */
  static async getChatSessions(): Promise<ChatSession[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('chat_conversations')
        .select(`
          id,
          user_id,
          project_id,
          title,
          metadata,
          created_at,
          updated_at
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch chat sessions: ${error.message}`);
      }

      // Transform data and add message counts
      const sessions: ChatSession[] = await Promise.all(
        (data || []).map(async (conversation) => {
          // Get message count and last message
          const { data: messageData } = await supabase
            .from('chat_messages')
            .select('created_at')
            .eq('conversation_id', conversation.id)
            .order('created_at', { ascending: false })
            .limit(1);

          const messageCount = await supabase
            .from('chat_messages')
            .select('id', { count: 'exact' })
            .eq('conversation_id', conversation.id);

          return {
            id: conversation.id,
            user_id: conversation.user_id,
            project_id: conversation.project_id,
            title: conversation.title,
            preview: conversation.metadata?.preview || 'No messages yet',
            message_count: messageCount.count || 0,
            last_message_at: messageData?.[0]?.created_at || conversation.created_at,
            created_at: conversation.created_at,
            updated_at: conversation.updated_at
          };
        })
      );

      return sessions;
    } catch (error: any) {
      console.error('Error fetching chat sessions:', error);
      throw error;
    }
  }

  /**
   * Get conversation details with messages
   */
  static async getConversationDetails(conversationId: string): Promise<{
    conversation: any;
    messages: ChatMessageWithId[];
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get conversation
      const { data: conversation, error: convError } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (convError) {
        throw new Error(`Failed to fetch conversation: ${convError.message}`);
      }

      // Get messages
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (messagesError) {
        throw new Error(`Failed to fetch messages: ${messagesError.message}`);
      }

      return {
        conversation,
        messages: messages || []
      };
    } catch (error: any) {
      console.error('Error fetching conversation details:', error);
      throw error;
    }
  }

  /**
   * Delete a conversation and all its messages
   */
  static async deleteConversation(conversationId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Delete messages first
      const { error: messagesError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id);

      if (messagesError) {
        throw new Error(`Failed to delete messages: ${messagesError.message}`);
      }

      // Delete conversation
      const { error: conversationError } = await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', user.id);

      if (conversationError) {
        throw new Error(`Failed to delete conversation: ${conversationError.message}`);
      }
    } catch (error: any) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }
} 