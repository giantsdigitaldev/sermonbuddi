# Database Setup Instructions

## 🚀 **Current Status: Mock Data Mode**

The app is currently running in **mock data mode** and works perfectly without any database setup. All project and task data is simulated using realistic mock data.

### **Why Mock Data Mode?**
- **Immediate functionality**: App works instantly without any setup
- **No permissions needed**: Avoids database permission errors  
- **Perfect for testing**: All features work with realistic data
- **Easy development**: No database configuration required

## 🔄 **Enabling Real Database (Optional)**

If you want to persist real data and enable multi-user functionality, follow these steps:

## 1. Supabase Project Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully initialized
3. Go to Settings > API to get your project URL and anon key
4. Update your `.env` file with these values

## 2. Database Tables Creation

Copy and paste this SQL into your Supabase SQL Editor (Settings > SQL Editor):

```sql
-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived', 'on_hold')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'blocked')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- Enable Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Allow all operations on projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all operations on tasks" ON tasks FOR ALL USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## 3. Insert Sample Data (Optional)

If you want to start with some sample data in your database:

```sql
-- Insert sample projects
INSERT INTO projects (id, name, description, status, metadata) VALUES
(
  'db-project-1',
  'Real Database Project',
  'This project is stored in your actual Supabase database',
  'active',
  '{
    "image": "project_image.png",
    "logo": "logo1.png",
    "members": ["user1.jpeg", "user2.jpeg"],
    "end_date": "2024-12-31T23:59:59.000Z",
    "category_id": "1",
    "owner": "Database User",
    "team_members": ["Alice", "Bob"],
    "budget": 50000,
    "tools_needed": ["React", "Node.js"],
    "priority": "high",
    "progress": 25,
    "total_tasks": 10,
    "completed_tasks": 2
  }'::jsonb
);

-- Insert sample tasks
INSERT INTO tasks (project_id, title, description, status, priority, metadata) VALUES
(
  'db-project-1',
  'Setup Database Schema',
  'Create all necessary database tables and relationships',
  'completed',
  'high',
  '{
    "assignee": "Alice",
    "estimated_hours": 8,
    "actual_hours": 6
  }'::jsonb
),
(
  'db-project-1',
  'Implement API Endpoints',
  'Create REST API endpoints for CRUD operations',
  'in_progress',
  'high',
  '{
    "assignee": "Bob",
    "estimated_hours": 16,
    "actual_hours": 8
  }'::jsonb
);
```

## 4. Environment Variables

Make sure your `.env` file contains:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 5. Testing the Connection

1. Restart your Expo development server: `npx expo start --clear`
2. The app will automatically try to connect to your database
3. If successful, you'll see real data alongside mock data
4. If connection fails, the app gracefully falls back to mock data

## Current App Behavior

- **Without Database**: App works perfectly with comprehensive mock data
- **With Database**: App combines real database data with mock data for demonstration
- **Database Errors**: App gracefully handles errors and shows mock data
- **No Authentication Required**: Current setup allows public access (adjust RLS policies for production)

## Security Notes

The current setup uses permissive RLS policies for development. For production:

1. Implement proper authentication
2. Add user-specific RLS policies
3. Restrict public access
4. Add proper data validation

## Troubleshooting

1. **Connection Errors**: Check your environment variables
2. **Permission Errors**: Verify RLS policies are set correctly
3. **Table Not Found**: Ensure all SQL scripts ran successfully
4. **Mock Data Only**: This is normal behavior when database isn't set up

The app is designed to work seamlessly in all scenarios! 