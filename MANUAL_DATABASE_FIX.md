# Manual Database Schema Fix Guide

## 🚨 URGENT: Database Schema Fix Required

The tasks table is missing required columns, causing 400 Bad Request errors. Follow these steps to fix it manually.

## Step-by-Step Fix Instructions

### 1. Access Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: `zbyrviprrwnaxvjkzyys`

### 2. Open SQL Editor
1. In the left sidebar, click on **"SQL Editor"**
2. Click **"New query"** button

### 3. Add Missing Columns (Run Each Command Separately)

Copy and paste each SQL command below **one at a time** and click "Run":

#### Command 1: Add assigned_to column
```sql
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS assigned_to UUID[] DEFAULT '{}';
```

#### Command 2: Add created_by column
```sql
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
```

#### Command 3: Add metadata column
```sql
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
```

### 4. Create Performance Indexes
Run these commands to improve query performance:

```sql
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks USING GIN(assigned_to);
```

```sql
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
```

```sql
CREATE INDEX IF NOT EXISTS idx_tasks_metadata ON public.tasks USING GIN(metadata);
```

### 5. Update RLS Policies
Run these commands to allow proper access to the new columns:

```sql
-- Drop existing conflicting policies
DROP POLICY IF EXISTS "Users can view assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update assigned tasks" ON public.tasks;
```

```sql
-- Create policies for assigned tasks
CREATE POLICY "Users can view assigned tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = ANY(assigned_to));
```

```sql
CREATE POLICY "Users can update assigned tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = ANY(assigned_to));
```

```sql
-- Create policy for task creators
CREATE POLICY "Users can view created tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = created_by);
```

```sql
CREATE POLICY "Users can update created tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = created_by);
```

### 6. Verify Schema Changes
Run this command to check if the columns were added successfully:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tasks' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

You should see the new columns:
- `assigned_to` (ARRAY)
- `created_by` (uuid)
- `metadata` (jsonb)

### 7. Re-enable Full Task Creation
After successfully adding the columns:

1. Go back to your code editor
2. Open `app/addnewtaskform.tsx`
3. Find the commented out lines in the task creation section
4. Uncomment the following lines:

```typescript
// Uncomment these lines:
assigned_to: assignedUsers.map(u => u.id),
created_by: user?.id,
metadata: {
    subtasks: subtasks,
    initial_comment: comment.trim() || null,
    attachments: taskImage ? [taskImage] : [],
},
```

### 8. Test Task Creation
1. Save the file
2. Go back to your app
3. Try creating a new task
4. The 400 Bad Request error should be resolved

## Troubleshooting

### If Commands Fail:
1. Make sure you're using the **SQL Editor** in Supabase dashboard
2. Run commands **one at a time**, not all together
3. Check for any error messages and resolve them
4. Ensure you have proper permissions (you should as the project owner)

### If RLS Policies Fail:
1. You can skip the RLS policy updates initially
2. Focus on adding the columns first
3. Test task creation
4. Add policies later if needed

### If Still Getting Errors:
1. Check the browser console for specific error messages
2. Verify the columns exist using the verification query
3. Try refreshing the app/clearing cache
4. Contact support if issues persist

## Current Status After Fix

Once completed, you should have:
- ✅ Tasks table with all required columns
- ✅ Proper indexes for performance
- ✅ RLS policies for security
- ✅ Working task creation with assignments
- ✅ Metadata storage for subtasks and attachments

## Alternative: Temporary Workaround

If you can't access the Supabase dashboard right now, the app will continue to work with **mock task creation**. You'll see:
- Tasks created with IDs like `task-1750273154890`
- Assignment information logged to console
- Basic functionality maintained

But for full functionality, the database schema fix is required. 