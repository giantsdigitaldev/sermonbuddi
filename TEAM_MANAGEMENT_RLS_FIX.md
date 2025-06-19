# Team Management RLS Policy Fix

## Problem
When trying to add new team members to projects, you're getting these 403 (Forbidden) errors:

```
GET /rest/v1/project_team_members?select=id&project_id=eq.08cb9a5f-420f-4295-a513-dbf85c04c6b5&user_id=eq.92e561af-f929-4aa8-8705-e68bdc1a557d 403 (Forbidden)

POST /rest/v1/team_invitations?select=* 403 (Forbidden)
```

## Root Cause
The issue is caused by missing or overly restrictive Row Level Security (RLS) policies on the `project_team_members` and `team_invitations` tables in Supabase. When the app tries to:

1. Check if a user is already a team member (SELECT on `project_team_members`)
2. Create a new team invitation (INSERT on `team_invitations`)

The current RLS policies are blocking these operations, resulting in 403 Forbidden errors.

## Solution

### Method 1: Run SQL Script Directly (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to "SQL Editor"

2. **Run the Fix Script**
   - Copy the entire contents of `scripts/createTeamManagementSQL.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

3. **Verify Success**
   - The script will show a success message confirming tables and policies are created
   - You should see counts for tables and policies created

### Method 2: Run Node.js Script (Alternative)

If you prefer using the Node.js script, first create the `exec_sql` function in Supabase:

```bash
node scripts/fixTeamManagementRLS.js
```

## What the Fix Does

### 1. Creates Required Tables
- `project_team_members`: Stores team member information for each project
- `team_invitations`: Stores pending invitations and invitation codes

### 2. Enables Row Level Security
- Enables RLS on both tables to maintain security

### 3. Creates Permissive Policies
- **Temporary permissive policies** that allow authenticated users full access
- These can be tightened later once the functionality is working

### 4. Adds Performance Indexes
- Creates indexes on commonly queried columns for better performance

## Security Note

The current fix uses **permissive policies** that allow any authenticated user to access team management tables. This is intentionally broad to fix the immediate 403 errors. 

In production, you should implement more restrictive policies such as:
- Users can only view team members of projects they belong to
- Only project owners/admins can invite new members
- Users can only accept/decline their own invitations

## Testing the Fix

After running the SQL script:

1. **Refresh your app** (clear browser cache if needed)
2. **Try adding a team member** to a project
3. **Check browser console** - the 403 errors should be gone
4. **Verify functionality** - invitations should be created successfully

## Troubleshooting

If you still get 403 errors after running the fix:

1. **Check if tables exist:**
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_name IN ('project_team_members', 'team_invitations');
   ```

2. **Check if policies exist:**
   ```sql
   SELECT tablename, policyname FROM pg_policies 
   WHERE tablename IN ('project_team_members', 'team_invitations');
   ```

3. **Clear app cache:**
   ```bash
   rm -rf .expo
   npx expo start --clear
   ```

## Files Modified/Created

- `scripts/createTeamManagementSQL.sql` - SQL script to run in Supabase
- `scripts/fixTeamManagementRLS.js` - Node.js script (alternative method)
- `TEAM_MANAGEMENT_RLS_FIX.md` - This documentation

## Next Steps

1. Run the SQL script in Supabase SQL Editor
2. Test team member invitations in your app
3. Once working, consider implementing more restrictive RLS policies for production security
4. Monitor your app logs to ensure no other permission issues arise 