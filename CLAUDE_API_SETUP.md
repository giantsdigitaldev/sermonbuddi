# Claude API Setup Instructions

## Quick Setup

To enable the AI chat functionality with Claude 3.5 Sonnet, you need to add your Claude API key to the environment variables.

### Step 1: Get Claude API Key
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key (starts with `sk-ant-`)

### Step 2: Add to Environment Variables
Add the following line to your `.env` file in the project root:

```bash
EXPO_PUBLIC_CLAUDE_API_KEY=sk-ant-your-actual-api-key-here
```

### Step 3: Restart Development Server
After adding the API key, restart your development server:

```bash
npx expo start --clear
```

## Features Implemented

✅ **Back Navigation**: Arrow button in top-left to navigate back to dashboard
✅ **Fixed Input Positioning**: Input field stays visible above navigation bar
✅ **Enter Key Support**: Press Enter to send messages
✅ **Claude 3.5 Sonnet Integration**: Full API connection with conversation persistence
✅ **Smooth Animations**: Input field animates with tab bar but stays visible
✅ **Error Handling**: Proper error messages for API failures
✅ **Loading States**: Visual feedback while AI is processing

## Troubleshooting

### "Claude API key not configured" Error
- Make sure your `.env` file contains `EXPO_PUBLIC_CLAUDE_API_KEY`
- Restart the development server after adding the key
- Check that the API key starts with `sk-ant-`

### Input Field Not Visible
- The input field is now positioned above the tab bar
- It animates with reduced movement to stay visible
- Uses `transform: translateY` with 0.8 multiplier

### Enter Key Not Working
- Make sure you're using the updated version of the component
- The Enter key functionality is implemented with `onKeyPress` and `onSubmitEditing`
- Works on both web and mobile platforms

## API Usage

The chat interface:
- Saves conversations to Supabase database
- Maintains conversation history
- Supports project-specific context
- Handles authentication automatically
- Provides error recovery

## Next Steps

1. Add your Claude API key to `.env`
2. Test the chat functionality
3. The AI assistant will help you create and plan projects
4. All conversations are automatically saved and can be resumed later 