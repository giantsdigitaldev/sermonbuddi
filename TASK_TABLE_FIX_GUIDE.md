# Task Table Schema Fix Guide

## Problem
The tasks table is missing required columns: `assigned_to`, `created_by`, and `metadata`, causing 400 Bad Request errors when creating tasks.

## Solution: Manual Database Schema Update

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase dashboard
2. Navigate to "SQL Editor" in the left sidebar
3. Create a new query

### Step 2: Add Missing Columns
Run the following SQL commands one by one:

```sql
-- Add assigned_to column (array of user IDs)
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS assigned_to UUID[] DEFAULT '{}';

-- Add created_by column (reference to user who created the task)
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add metadata column (for storing additional task data)
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
```

### Step 3: Create Indexes for Performance
```sql
-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks USING GIN(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_metadata ON public.tasks USING GIN(metadata);
```

### Step 4: Update RLS Policies
```sql
-- Enable RLS if not already enabled
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Users can view assigned tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update assigned tasks" ON public.tasks;

-- Create policies for assigned tasks
CREATE POLICY "Users can view assigned tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = ANY(assigned_to));

CREATE POLICY "Users can update assigned tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = ANY(assigned_to));

-- Create policy for task creators
CREATE POLICY "Users can view created tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can update created tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = created_by);
```

### Step 5: Fix Notifications Table (Optional)
If you want to enable task assignment notifications:

```sql
-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_notifications_updated_at 
  BEFORE UPDATE ON public.notifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Verification

After running these commands, verify the changes:

### Check Table Structure
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tasks' AND table_schema = 'public'
ORDER BY ordinal_position;
```

### Test Task Creation
Try creating a new task in the app. The error should be resolved.

## Re-enable Notifications

After fixing the notifications table, you can re-enable notifications in `app/addnewtaskform.tsx` by uncommenting the notification code.

## Current Status

- ✅ Task interface updated with new fields
- ✅ Input cursor jumping issue fixed
- ✅ Notifications temporarily disabled
- ⏳ Database schema needs manual update
- ⏳ Notifications table needs RLS policy fix

## Next Steps

1. Run the SQL commands above in Supabase SQL Editor
2. Test task creation in the app
3. If successful, re-enable notifications by uncommenting the code
4. Test notification functionality 