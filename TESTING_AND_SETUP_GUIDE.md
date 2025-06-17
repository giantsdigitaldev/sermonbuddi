# 🧪 **Team Management System - Testing & Setup Guide**

## 📋 **Quick Start Checklist**

- [ ] ✅ SQL schema deployed to Supabase
- [ ] 🔧 TeamService functionality tested
- [ ] 🧭 Navigation updated
- [ ] 📧 Email service configured (optional)
- [ ] 🧪 End-to-end testing completed

---

## 🗄️ **Phase 1: Database Setup & Verification**

### Step 1.1: Deploy SQL Schema

1. **Open Supabase Dashboard**
   - Go to your project dashboard
   - Navigate to **SQL Editor**

2. **Run the Schema**
   ```sql
   -- Copy and paste the entire content of supabase_team_management_schema.sql
   -- Then click "Run" or press Ctrl+Enter
   ```

3. **Verify Tables Created**
   ```sql
   -- Run this verification query
   SELECT table_name, column_name, data_type 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
   AND table_name IN ('project_team_members', 'team_invitations', 'user_notifications')
   ORDER BY table_name, ordinal_position;
   ```

### Step 1.2: Test Database Functions

```sql
-- Test the helper functions
SELECT * FROM get_project_team_members('your-project-id-here');
SELECT * FROM get_project_team_stats('your-project-id-here');
```

---

## 🧪 **Phase 2: Test TeamService Functionality**

### Step 2.1: Access the Test Page

1. **Navigate to the test page in your app:**
   ```
   /teamservicetest
   ```

2. **Or add a button to your existing page:**
   ```typescript
   // Add this to any existing page for quick access
   <TouchableOpacity onPress={() => navigation.navigate('teamservicetest')}>
     <Text>Test TeamService</Text>
   </TouchableOpacity>
   ```

### Step 2.2: Get a Project ID

1. **From Supabase Dashboard:**
   ```sql
   SELECT id, name FROM projects LIMIT 5;
   ```

2. **Copy a project ID** and paste it into the test page

### Step 2.3: Run Tests

1. **Quick Health Check** - Tests basic connectivity
2. **Full Test Suite** - Tests all functionality
3. **Manual Page Testing** - Tests the UI pages

### Step 2.4: Console Testing (Alternative)

```typescript
// Add this to any component for quick testing
import { runTeamServiceTests, teamServiceHealthCheck } from '@/utils/teamServiceTest';

// In your component
const testTeamService = async () => {
  const projectId = 'your-project-id';
  
  // Quick test
  const isHealthy = await teamServiceHealthCheck(projectId);
  console.log('Health check:', isHealthy);
  
  // Full test
  await runTeamServiceTests(projectId, 'test@example.com');
};
```

---

## 🧭 **Phase 3: Navigation Setup**

### Step 3.1: Verify Routes Work

The team management pages are already in your `app/` directory:
- ✅ `app/projectdetailsteammenber.tsx`
- ✅ `app/projectdetailsaddteammenber.tsx`
- ✅ `app/teamservicetest.tsx`

### Step 3.2: Test Navigation

```typescript
// Test these navigation calls work:
navigation.navigate('projectdetailsteammenber', { projectId: 'your-id' });
navigation.navigate('projectdetailsaddteammenber', { projectId: 'your-id' });
navigation.navigate('teamservicetest');
```

### Step 3.3: Add Navigation Links (Optional)

Add team management links to your project details page:

```typescript
// In app/projectdetails.tsx, add these buttons:
<TouchableOpacity 
  onPress={() => navigation.navigate('projectdetailsteammenber', { projectId })}
  style={styles.teamButton}
>
  <Text>Manage Team</Text>
</TouchableOpacity>

<TouchableOpacity 
  onPress={() => navigation.navigate('projectdetailsaddteammenber', { projectId })}
  style={styles.addMemberButton}
>
  <Text>Add Member</Text>
</TouchableOpacity>
```

---

## 📧 **Phase 4: Email Service Configuration**

### Step 4.1: Choose Your Email Provider

#### Option A: SendGrid (Recommended)

1. **Sign up for SendGrid**
   - Go to [sendgrid.com](https://sendgrid.com)
   - Create a free account (100 emails/day free)

2. **Get API Key**
   - Dashboard → Settings → API Keys
   - Create API Key with "Mail Send" permissions

3. **Configure in your app**
   ```typescript
   // In your app initialization (App.tsx or similar)
   import { setupSendGrid } from '@/utils/emailService';
   
   // Configure SendGrid
   setupSendGrid(
     'your-sendgrid-api-key',
     'noreply@yourdomain.com',
     'Your App Name'
   );
   ```

#### Option B: Resend (Alternative)

1. **Sign up for Resend**
   - Go to [resend.com](https://resend.com)
   - Create account (3,000 emails/month free)

2. **Configure in your app**
   ```typescript
   import { setupResend } from '@/utils/emailService';
   
   setupResend(
     'your-resend-api-key',
     'noreply@yourdomain.com',
     'Your App Name'
   );
   ```

#### Option C: Development Mode (No Email Service)

```typescript
// For testing without email service
import { setupExpoMail } from '@/utils/emailService';

setupExpoMail('noreply@yourapp.com', 'Your App');
// This will show alerts instead of sending emails
```

### Step 4.2: Environment Variables

Add to your `.env` file:

```bash
# Email Configuration
EXPO_PUBLIC_EMAIL_PROVIDER=sendgrid
EXPO_PUBLIC_SENDGRID_API_KEY=your_api_key_here
EXPO_PUBLIC_FROM_EMAIL=noreply@yourdomain.com
EXPO_PUBLIC_FROM_NAME=Your App Name
```

### Step 4.3: Test Email Configuration

```typescript
// Test email service
import { EmailService } from '@/utils/emailService';

const testEmail = async () => {
  const success = await EmailService.testConfiguration();
  console.log('Email test result:', success);
};
```

---

## 🔄 **Phase 5: End-to-End Testing**

### Step 5.1: Complete User Flow Test

1. **Create a Project**
   - Verify owner is automatically added to team

2. **View Team Members**
   - Navigate to team member page
   - Verify owner appears in list

3. **Search for Users**
   - Go to add team member page
   - Test user search functionality

4. **Send Invitation**
   - Invite a user by email
   - Check console for email logs
   - Verify invitation appears in database

5. **Role Management**
   - Change a member's role
   - Verify permissions update

6. **Remove Member**
   - Remove a team member
   - Verify they're removed from database

### Step 5.2: Database Verification

After each action, verify in Supabase:

```sql
-- Check team members
SELECT * FROM project_team_members WHERE project_id = 'your-project-id';

-- Check invitations
SELECT * FROM team_invitations WHERE project_id = 'your-project-id';

-- Check notifications
SELECT * FROM user_notifications WHERE user_id = 'your-user-id';
```

### Step 5.3: Error Testing

Test error scenarios:
- [ ] Invalid project ID
- [ ] Network disconnection
- [ ] Duplicate invitations
- [ ] Expired invitations
- [ ] Permission denied scenarios

---

## 🐛 **Troubleshooting Guide**

### Common Issues & Solutions

#### 1. "Table doesn't exist" Error
```
❌ Error: relation "project_team_members" does not exist
```
**Solution:** Run the SQL schema in Supabase SQL Editor

#### 2. "Permission denied" Error
```
❌ Error: permission denied for table project_team_members
```
**Solution:** Check RLS policies are enabled and working

#### 3. "Function doesn't exist" Error
```
❌ Error: function get_project_team_members does not exist
```
**Solution:** Ensure all functions from the SQL schema were created

#### 4. Navigation Error
```
❌ Error: The action 'NAVIGATE' with payload {"name":"projectdetailsteammenber"} was not handled
```
**Solution:** Ensure the file exists in `app/` directory with correct name

#### 5. Email Service Error
```
❌ Error: Email service not configured
```
**Solution:** Configure email service or use development mode

### Debug Commands

```typescript
// Add these to your component for debugging
console.log('Current user:', await supabase.auth.getUser());
console.log('Project ID:', projectId);
console.log('Navigation state:', navigation.getState());

// Test database connection
const { data, error } = await supabase.from('projects').select('*').limit(1);
console.log('DB test:', { data, error });
```

---

## 📊 **Performance Testing**

### Load Testing

Test with multiple team members:

```sql
-- Create test data
INSERT INTO project_team_members (project_id, user_id, role, status)
SELECT 
  'your-project-id',
  gen_random_uuid(),
  'member',
  'active'
FROM generate_series(1, 50);
```

### Query Performance

```sql
-- Test query performance
EXPLAIN ANALYZE SELECT * FROM get_project_team_members('your-project-id');
```

---

## ✅ **Success Criteria**

Your team management system is working correctly when:

- [ ] ✅ Database schema deployed without errors
- [ ] ✅ TeamService health check passes
- [ ] ✅ All navigation routes work
- [ ] ✅ Team member page loads and displays data
- [ ] ✅ Add member page allows user search
- [ ] ✅ Email invitations send (or show fallback)
- [ ] ✅ Role management functions work
- [ ] ✅ Member removal works
- [ ] ✅ Real-time updates work (if implemented)
- [ ] ✅ Error handling works gracefully

---

## 🚀 **Next Steps After Testing**

1. **Production Deployment**
   - Deploy to production Supabase
   - Configure production email service
   - Set up monitoring

2. **Advanced Features**
   - Real-time notifications
   - Team analytics
   - Bulk operations
   - Advanced permissions

3. **User Training**
   - Create user documentation
   - Record demo videos
   - Train team leads

---

## 📞 **Support & Resources**

- **Supabase Docs:** [supabase.com/docs](https://supabase.com/docs)
- **Expo Router Docs:** [expo.dev/router](https://docs.expo.dev/router)
- **SendGrid Docs:** [sendgrid.com/docs](https://sendgrid.com/docs)
- **React Navigation:** [reactnavigation.org](https://reactnavigation.org)

**Need Help?** Check the console logs first, then verify your database schema and configuration. 