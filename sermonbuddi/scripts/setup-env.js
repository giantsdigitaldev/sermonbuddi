#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 SermonBuddi Environment Setup');
console.log('================================\n');

const envPath = path.join(__dirname, '..', '.env');

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists!');
  console.log('   If you want to recreate it, delete the existing file first.\n');
  process.exit(0);
}

// Create .env template
const envTemplate = `# Supabase Configuration (Required)
# Get these from your Supabase project dashboard: Settings → API
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Optional: Service role key for admin operations (keep secret)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Claude AI API Configuration (Required for AI features)
# Get this from: https://console.anthropic.com/
CLAUDE_API_KEY=your_claude_api_key_here

# Social Media OAuth Configuration (Required for social media posting)
# Twitter/X: https://developer.twitter.com/
TWITTER_CLIENT_ID=your_twitter_client_id_here
TWITTER_CLIENT_SECRET=your_twitter_client_secret_here

# Facebook: https://developers.facebook.com/
FACEBOOK_CLIENT_ID=your_facebook_client_id_here
FACEBOOK_CLIENT_SECRET=your_facebook_client_secret_here

# Instagram: Use the same Facebook app (Instagram is owned by Meta)
INSTAGRAM_CLIENT_ID=your_instagram_client_id_here
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret_here
`;

try {
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Created .env file successfully!');
  console.log('');
  console.log('📝 Next steps:');
  console.log('   1. Edit the .env file with your actual values');
  console.log('   2. Get your Supabase URL and key from: https://supabase.com/dashboard');
  console.log('   3. Get your Claude API key from: https://console.anthropic.com/');
  console.log('   4. Set up social media OAuth apps for posting features');
  console.log('');
  console.log('💡 You can edit the file with:');
  console.log('   nano .env');
  console.log('   or');
  console.log('   code .env');
  console.log('');
  console.log('🔄 After editing, restart your development server:');
  console.log('   npx expo start --web');
} catch (error) {
  console.error('❌ Error creating .env file:', error.message);
  console.log('');
  console.log('💡 You can create the file manually:');
  console.log('   touch .env');
  console.log('   Then copy the template from env-setup.md');
} 