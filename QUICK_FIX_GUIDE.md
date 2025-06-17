# 🚨 **Quick Fix: UUID Project ID Issue**

## **The Problem**
You're getting this error:
```
invalid input syntax for type uuid: "mock-project-1"
```

This happens because the database expects a **real UUID** (like `123e4567-e89b-12d3-a456-426614174000`), not a mock string.

---

## ⚡ **Quick Solution (5 minutes)**

### **Step 1: Run Test Data Setup**

1. **Open Supabase Dashboard** → **SQL Editor**

2. **Copy and paste this ENTIRE SQL block:**
```sql
-- AUTOMATIC Test Data Setup - Run this entire block at once
DO $$
DECLARE
    current_user_id UUID;
    new_project_id UUID;
BEGIN
    -- Get the current authenticated user's ID
    SELECT auth.uid() INTO current_user_id;
    
    -- If no authenticated user, get the first user from auth.users
    IF current_user_id IS NULL THEN
        SELECT id INTO current_user_id FROM auth.users LIMIT 1;
    END IF;
    
    -- Generate a new project ID
    new_project_id := gen_random_uuid();
    
    -- Create the test project
    INSERT INTO projects (id, user_id, name, description, status, created_at, updated_at)
    VALUES (
        new_project_id,
        current_user_id,
        'Test Project for Team Management',
        'This is a test project to demonstrate team management functionality',
        'active',
        NOW(),
        NOW()
    );
    
    -- Add the user as project owner in team members
    INSERT INTO project_team_members (project_id, user_id, role, status, permissions, joined_at, created_at, updated_at)
    VALUES (
        new_project_id,
        current_user_id,
        'owner',
        'active',
        '{"read": true, "write": true, "delete": true}'::jsonb,
        NOW(),
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'SUCCESS! Created project with ID: %', new_project_id;
END $$;

-- Get your project ID (copy this UUID!)
SELECT 
    id as "📋 COPY THIS PROJECT ID",
    name as project_name
FROM projects 
WHERE name = 'Test Project for Team Management'
ORDER BY created_at DESC 
LIMIT 1;
```

3. **Click "Run"** and **copy the UUID** from the "📋 COPY THIS PROJECT ID" column

### **Step 2: Use the Real UUID**

1. **Go to your app** → Navigate to `/teamservicetest`
2. **Paste the UUID** you copied (not "mock-project-1")
3. **Run the health check**

---

## 🎯 **Alternative: Use Existing Project**

If you already have projects in your database:

```sql
-- Get any existing project ID
SELECT id, name FROM projects LIMIT 5;
```

Copy any `id` from the results and use that in the test page.

---

## ✅ **Team Members Already Added!**

The automatic setup script already:
- ✅ Created the project with you as the owner
- ✅ Added you to the team_members table with 'owner' role
- ✅ Set up proper permissions

No manual steps needed! 🎉

---

## ✅ **Verification**

After setup, test with:
```sql
-- Check if team member was added
SELECT * FROM project_team_members WHERE project_id = 'YOUR_PROJECT_ID_HERE';

-- Test the function
SELECT * FROM get_project_team_members('YOUR_PROJECT_ID_HERE');
```

---

## 🎉 **You're Done!**

Now you should be able to:
- ✅ Run health checks without UUID errors
- ✅ See team members in the UI
- ✅ Add new team members
- ✅ Test all functionality

The key was using a **real UUID** instead of `"mock-project-1"`! 🚀 