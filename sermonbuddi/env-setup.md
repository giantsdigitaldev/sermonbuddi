# Environment Setup for SermonBuddi

## Required Environment Variables

Create a `.env` file in the `sermonbuddi` directory with the following variables:

```bash
# Supabase Configuration (Required)
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Optional: Service role key for admin operations (keep secret)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Claude AI API Configuration (Required for AI features)
CLAUDE_API_KEY=your_claude_api_key_here

# Social Media OAuth Configuration (Required for social media posting)
TWITTER_CLIENT_ID=your_twitter_client_id_here
TWITTER_CLIENT_SECRET=your_twitter_client_secret_here

FACEBOOK_CLIENT_ID=your_facebook_client_id_here
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret_here

INSTAGRAM_CLIENT_ID=your_instagram_client_id_here
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret_here
```

## How to Get These Values

### 1. Supabase Configuration
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy the "Project URL" and "anon public" key

### 2. Claude AI API Key
1. Go to [Anthropic Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Generate an API key
4. Copy the key

### 3. Social Media OAuth Keys
- **Twitter/X**: Create an app at [Twitter Developer Portal](https://developer.twitter.com/)
- **Facebook**: Create an app at [Facebook Developers](https://developers.facebook.com/)
- **Instagram**: Use the same Facebook app (Instagram is owned by Meta)

## Quick Setup Commands

```bash
# Navigate to sermonbuddi directory
cd sermonbuddi

# Create .env file (copy and paste the template above)
touch .env

# Edit the .env file with your actual values
# You can use any text editor or run:
# nano .env
# or
# code .env
```

## Testing the Setup

After creating the `.env` file, restart the development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart with:
npx expo start --web
```

The app should now load without the "Missing Supabase environment variables" error.

## Troubleshooting

- **Error persists**: Make sure the `.env` file is in the `sermonbuddi` directory (not the parent directory)
- **Values not loading**: Restart the development server after creating the `.env` file
- **Permission issues**: Make sure the `.env` file has read permissions
- **Wrong values**: Double-check that you copied the correct values from your Supabase dashboard 