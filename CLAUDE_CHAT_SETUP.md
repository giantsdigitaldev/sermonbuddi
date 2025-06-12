# Claude AI Chat System - Complete Setup Guide

## 🚀 System Overview

Your cristOS app now has a complete Claude AI chat system with:

✅ **Intelligent Conversation Management**: AI generates conversation titles based on content  
✅ **Supabase Integration**: All conversations and messages stored securely  
✅ **Modern UI/UX**: Beautiful chat interface following app design patterns  
✅ **Session Management**: View, delete, and navigate between chat sessions  
✅ **Real-time Chat**: Claude 3.5 Sonnet AI assistant integration  
✅ **Preview System**: Shows first 10 words of conversation content  

## 📋 Prerequisites

### 1. Claude API Key
Get your API key from [Anthropic Console](https://console.anthropic.com/):
1. Sign up/log in to your account
2. Navigate to API Keys section
3. Create a new API key
4. Copy the key (starts with `sk-ant-`)

### 2. Supabase Configuration
Ensure your Supabase project is set up with the required environment variables:
```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🔧 Installation & Setup

### Step 1: Environment Configuration
Add your Claude API key to your `.env` file:
```bash
# Add this to your .env file
EXPO_PUBLIC_CLAUDE_API_KEY=sk-ant-your-actual-api-key-here
```

### Step 2: Database Setup
The database tables should be automatically created, but if you encounter issues, run:
```bash
node scripts/setupDatabase.js
```

If you get permission errors, manually create these tables in your Supabase SQL editor:

```sql
-- Chat conversations table
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chat_conversations
CREATE POLICY "Users can manage own conversations" ON public.chat_conversations
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for chat_messages
CREATE POLICY "Users can manage own messages" ON public.chat_messages
  FOR ALL USING (auth.uid() = user_id);
```

### Step 3: Install Dependencies
All required dependencies should already be installed, but ensure you have:
```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
```

### Step 4: Restart Development Server
```bash
npx expo start --clear
```

## 🎯 Features Implemented

### 1. AI Chat Interface (`app/aiassistant.tsx`)
- **Real-time chat with Claude 3.5 Sonnet**
- **Conversation context preservation**
- **Typing indicators and loading states**
- **Automatic title generation**
- **Message timestamps**
- **Keyboard-friendly input**

### 2. Chat Sessions Management (`app/chatsessions.tsx`)
- **List all conversations with previews**
- **Smart date formatting** (Today: time, This week: day, Older: date)
- **Delete conversations with confirmation**
- **Pull-to-refresh functionality**
- **Empty state with onboarding**

### 3. Inbox Integration (`app/(tabs)/inbox.tsx`)
- **Replaced default inbox with chat sessions**
- **AI assistant branding and icons**
- **Floating action button for new chats**
- **Consistent with app design patterns**

### 4. Chat Service (`utils/chatService.ts`)
- **Complete Claude API integration**
- **Intelligent title generation**
- **Conversation management**
- **Message history and context**
- **Error handling and retry logic**

## 🔍 How It Works

### Conversation Flow
1. **User opens Inbox tab** → Shows list of chat sessions
2. **Taps "+" or "Start New Chat"** → Creates new conversation
3. **Sends first message** → AI responds and generates intelligent title
4. **Continues conversation** → Context preserved, messages saved
5. **Returns to inbox** → Sees conversation with title and preview

### Title Generation
The AI automatically generates conversation titles by:
1. Analyzing the first user message and AI response
2. Creating a 6-word descriptive title
3. Updating the conversation record
4. Falling back to "New Conversation" if generation fails

### Data Storage
- **Conversations**: Stored in `chat_conversations` table
- **Messages**: Stored in `chat_messages` table with role (user/assistant)
- **Previews**: Generated from first user message (10 words max)
- **Security**: All data protected by Row Level Security (RLS)

## 🎨 UI/UX Features

### Chat Interface
- **Modern bubble design** with user messages on right, AI on left
- **Typing indicator** with animated dots during AI processing
- **Timestamps** on each message
- **Auto-scroll** to latest messages
- **Keyboard avoidance** for optimal mobile experience

### Session List
- **Card-based design** with avatars and metadata
- **Smart previews** showing conversation context
- **Swipe actions** for deletion
- **Date grouping** and formatting
- **Empty states** with clear calls-to-action

## 📱 Navigation Structure

```
app/
├── (tabs)/
│   ├── inbox.tsx          # Chat sessions list (main entry)
│   └── ...
├── aiassistant.tsx        # Chat interface
├── chatsessions.tsx       # Full sessions list
└── ...

utils/
└── chatService.ts         # Claude AI integration
```

## 🔧 Troubleshooting

### Common Issues

#### 1. "Claude API key not configured"
- Check your `.env` file has `EXPO_PUBLIC_CLAUDE_API_KEY`
- Restart development server after adding key
- Verify key starts with `sk-ant-`

#### 2. Database permission errors
- Manually run the SQL statements in Supabase dashboard
- Check RLS policies are enabled
- Verify user authentication is working

#### 3. Navigation errors
- Ensure all screens are properly exported
- Check navigation parameter passing
- Verify route names match navigation calls

#### 4. Messages not saving
- Check Supabase connection
- Verify user authentication
- Check browser console for errors

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Add Claude API key to production environment
- [ ] Verify Supabase production database is configured
- [ ] Test conversation creation and messaging
- [ ] Test session management and deletion
- [ ] Verify title generation is working
- [ ] Test on both iOS and Android
- [ ] Check performance with multiple conversations
- [ ] Verify RLS policies are working correctly

## 🎉 Usage Instructions

### For Users
1. **Open the Inbox tab** in the bottom navigation
2. **Tap the "+" button** to start a new conversation
3. **Type your message** and press send
4. **Wait for AI response** (see typing indicator)
5. **Continue the conversation** - context is preserved
6. **Return to inbox** to see all your conversations
7. **Tap any conversation** to resume it
8. **Long press and delete** conversations you no longer need

### For Developers
- All chat functionality is in `utils/chatService.ts`
- UI components follow the app's design system
- Database schema is documented in `utils/database.sql`
- Error handling includes user-friendly messages
- Performance optimized with React.memo and useCallback

## 📊 Future Enhancements

Potential improvements you could add:
- **Voice messages** with speech-to-text
- **File attachments** and image analysis
- **Conversation search** functionality
- **Export conversations** to text/PDF
- **AI personas** for different types of assistance
- **Conversation sharing** between team members
- **Analytics** on usage patterns

## 🔗 API References

- [Claude API Documentation](https://docs.anthropic.com/claude/reference/)
- [Supabase Documentation](https://supabase.com/docs)
- [Expo Router](https://expo.github.io/router/)

Your Claude AI chat system is now fully functional and ready for users! 🎉 