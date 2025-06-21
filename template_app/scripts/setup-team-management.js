#!/usr/bin/env node

/**
 * Team Management Setup Script
 * 
 * This script helps you set up and test the team management system.
 * Run with: node scripts/setup-team-management.js
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Team Management System Setup');
console.log('================================\n');

// Check if required files exist
const requiredFiles = [
  'utils/teamService.ts',
  'utils/teamServiceTest.ts',
  'utils/emailService.ts',
  'app/projectdetailsteammenber.tsx',
  'app/projectdetailsaddteammenber.tsx',
  'app/teamservicetest.tsx',
  'supabase_team_management_schema.sql',
  'TEAM_MANAGEMENT_IMPLEMENTATION_GUIDE.md',
  'TESTING_AND_SETUP_GUIDE.md'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
  console.log('\n❌ Some required files are missing. Please ensure all files are created.');
  process.exit(1);
}

console.log('\n✅ All required files found!');

// Check package.json dependencies
console.log('\n📦 Checking dependencies...');
const packageJsonPath = 'package.json';

if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = [
    '@supabase/supabase-js',
    'expo-router',
    '@react-navigation/native',
    '@expo/vector-icons'
  ];
  
  requiredDeps.forEach(dep => {
    const exists = dependencies[dep];
    console.log(`${exists ? '✅' : '❌'} ${dep} ${exists ? `(${exists})` : '(missing)'}`);
  });
} else {
  console.log('❌ package.json not found');
}

// Generate environment template
console.log('\n🔧 Generating environment template...');
const envTemplate = `# Team Management Email Configuration
# Copy this to your .env file and fill in your values

# Email Service Provider (sendgrid, resend, or expo-mail for development)
EXPO_PUBLIC_EMAIL_PROVIDER=sendgrid

# SendGrid Configuration (if using SendGrid)
EXPO_PUBLIC_SENDGRID_API_KEY=your_sendgrid_api_key_here

# Resend Configuration (if using Resend)
EXPO_PUBLIC_RESEND_API_KEY=your_resend_api_key_here

# Email Settings
EXPO_PUBLIC_FROM_EMAIL=noreply@yourdomain.com
EXPO_PUBLIC_FROM_NAME=Your App Name

# App Configuration
EXPO_PUBLIC_APP_URL=https://your-app.com
`;

fs.writeFileSync('.env.team-management.template', envTemplate);
console.log('✅ Created .env.team-management.template');

// Generate quick test script
console.log('\n🧪 Generating test script...');
const testScript = `// Quick Team Management Test Script
// Add this to any component to test the system

import { runTeamServiceTests, teamServiceHealthCheck } from '@/utils/teamServiceTest';
import { EmailService } from '@/utils/emailService';

export const quickTeamTest = async (projectId: string) => {
  console.log('🧪 Starting Team Management Quick Test...');
  
  try {
    // 1. Test database connectivity
    console.log('1️⃣ Testing database connectivity...');
    const isHealthy = await teamServiceHealthCheck(projectId);
    console.log(\`Database health: \${isHealthy ? '✅ Healthy' : '❌ Issues'}\`);
    
    // 2. Test email service
    console.log('2️⃣ Testing email service...');
    const emailTest = await EmailService.testConfiguration();
    console.log(\`Email service: \${emailTest ? '✅ Working' : '❌ Issues'}\`);
    
    // 3. Run full test suite
    console.log('3️⃣ Running full test suite...');
    await runTeamServiceTests(projectId, 'test@example.com');
    
    console.log('🎉 Quick test completed! Check console for detailed results.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Usage:
// quickTeamTest('your-project-id-here');
`;

fs.writeFileSync('utils/quickTeamTest.ts', testScript);
console.log('✅ Created utils/quickTeamTest.ts');

// Generate setup checklist
console.log('\n📋 Generating setup checklist...');
const checklist = `# Team Management Setup Checklist

## Database Setup
- [ ] Run supabase_team_management_schema.sql in Supabase SQL Editor
- [ ] Verify tables created: project_team_members, team_invitations, user_notifications
- [ ] Test database functions work

## Code Integration
- [ ] Import TeamService in your components
- [ ] Add navigation links to team management pages
- [ ] Test navigation routes work

## Email Configuration (Optional)
- [ ] Choose email provider (SendGrid/Resend/Development mode)
- [ ] Get API key from provider
- [ ] Configure environment variables
- [ ] Test email service

## Testing
- [ ] Navigate to /teamservicetest page
- [ ] Run health check with valid project ID
- [ ] Run full test suite
- [ ] Test team management pages manually
- [ ] Verify database updates correctly

## Production Deployment
- [ ] Deploy schema to production Supabase
- [ ] Configure production email service
- [ ] Test in production environment
- [ ] Train users on new features

## Next Steps
- [ ] Add real-time updates (optional)
- [ ] Implement push notifications (optional)
- [ ] Add team analytics (optional)
- [ ] Create user documentation
`;

fs.writeFileSync('SETUP_CHECKLIST.md', checklist);
console.log('✅ Created SETUP_CHECKLIST.md');

// Final instructions
console.log('\n🎯 Setup Complete!');
console.log('==================');
console.log('');
console.log('Next steps:');
console.log('1. 📊 Run the SQL schema in Supabase');
console.log('2. 🧪 Navigate to /teamservicetest in your app');
console.log('3. 📧 Configure email service (optional)');
console.log('4. 🔄 Run end-to-end tests');
console.log('');
console.log('Files created:');
console.log('- .env.team-management.template (copy to .env)');
console.log('- utils/quickTeamTest.ts (quick test function)');
console.log('- SETUP_CHECKLIST.md (step-by-step checklist)');
console.log('');
console.log('📖 Read TESTING_AND_SETUP_GUIDE.md for detailed instructions');
console.log('');
console.log('🎉 Happy team managing!'); 