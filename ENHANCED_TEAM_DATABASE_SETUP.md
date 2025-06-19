# Enhanced Team Management Database Setup

This guide will help you set up the necessary database tables and functions for the enhanced team management functionality.

## Required Tables

### 1. Enhanced Team Members Table

```sql
-- Update the existing project_team_members table or create if it doesn't exist
CREATE TABLE IF NOT EXISTS project_team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_email TEXT,
    invited_phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'accepted', 'declined', 'active')),
    permissions JSONB DEFAULT '{
        "read": true,
        "write": false,
        "delete": false,
        "invite": false,
        "manage_members": false,
        "access_chat": false
    }'::jsonb,
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(project_id, user_id),
    UNIQUE(project_id, invited_email)
);
```

### 2. Team Invitations Table

```sql
CREATE TABLE IF NOT EXISTS team_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_email TEXT,
    invited_phone TEXT,
    inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    invitation_code TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
    message TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. Notifications Table

```sql
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    INDEX idx_notifications_user_id ON notifications(user_id),
    INDEX idx_notifications_read ON notifications(read),
    INDEX idx_notifications_created_at ON notifications(created_at)
);
```

### 4. Enhanced Profiles Table

```sql
-- Add additional fields to profiles table if they don't exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
```

## Database Functions

### 1. Get Project Team Members Function

```sql
CREATE OR REPLACE FUNCTION get_project_team_members(p_project_id UUID)
RETURNS TABLE(
    id UUID,
    project_id UUID,
    user_id UUID,
    invited_email TEXT,
    invited_phone TEXT,
    role TEXT,
    status TEXT,
    permissions JSONB,
    joined_at TIMESTAMPTZ,
    user_name TEXT,
    user_email TEXT,
    user_avatar TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ptm.id,
        ptm.project_id,
        ptm.user_id,
        ptm.invited_email,
        ptm.invited_phone,
        ptm.role,
        ptm.status,
        ptm.permissions,
        ptm.joined_at,
        COALESCE(p.full_name, p.username) as user_name,
        COALESCE(p.email, ptm.invited_email) as user_email,
        p.avatar_url as user_avatar,
        ptm.created_at,
        ptm.updated_at
    FROM project_team_members ptm
    LEFT JOIN profiles p ON ptm.user_id = p.id
    WHERE ptm.project_id = p_project_id
    ORDER BY ptm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2. Invite Team Member Function

```sql
CREATE OR REPLACE FUNCTION invite_team_member(
    p_project_id UUID,
    p_invited_email TEXT DEFAULT NULL,
    p_invited_phone TEXT DEFAULT NULL,
    p_role TEXT DEFAULT 'member',
    p_message TEXT DEFAULT NULL
)
RETURNS TABLE(invitation_id UUID, invitation_code TEXT) AS $$
DECLARE
    v_invitation_code TEXT;
    v_invitation_id UUID;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Generate unique invitation code
    v_invitation_code := encode(gen_random_bytes(8), 'hex');
    v_expires_at := NOW() + INTERVAL '7 days';
    
    -- Insert invitation
    INSERT INTO team_invitations (
        project_id,
        invited_email,
        invited_phone,
        inviter_id,
        invitation_code,
        role,
        message,
        expires_at
    ) VALUES (
        p_project_id,
        p_invited_email,
        p_invited_phone,
        auth.uid(),
        v_invitation_code,
        p_role,
        p_message,
        v_expires_at
    ) RETURNING id INTO v_invitation_id;
    
    RETURN QUERY SELECT v_invitation_id, v_invitation_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3. Accept Team Invitation Function

```sql
CREATE OR REPLACE FUNCTION accept_team_invitation(p_invitation_code TEXT)
RETURNS TABLE(
    success BOOLEAN,
    project_id UUID,
    project_name TEXT,
    role TEXT
) AS $$
DECLARE
    v_invitation RECORD;
    v_project_name TEXT;
BEGIN
    -- Get invitation details
    SELECT * INTO v_invitation
    FROM team_invitations
    WHERE invitation_code = p_invitation_code
    AND status = 'pending'
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;
    
    -- Get project name
    SELECT name INTO v_project_name
    FROM projects
    WHERE id = v_invitation.project_id;
    
    -- Check if user is already a member
    IF EXISTS (
        SELECT 1 FROM project_team_members
        WHERE project_id = v_invitation.project_id
        AND user_id = auth.uid()
    ) THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT, NULL::TEXT;
        RETURN;
    END IF;
    
    -- Add user to team
    INSERT INTO project_team_members (
        project_id,
        user_id,
        role,
        status,
        permissions,
        joined_at
    ) VALUES (
        v_invitation.project_id,
        auth.uid(),
        v_invitation.role,
        'active',
        CASE v_invitation.role
            WHEN 'admin' THEN '{"read": true, "write": true, "delete": true, "invite": true, "manage_members": true, "access_chat": true}'::jsonb
            WHEN 'member' THEN '{"read": true, "write": true, "delete": false, "invite": false, "manage_members": false, "access_chat": true}'::jsonb
            WHEN 'viewer' THEN '{"read": true, "write": false, "delete": false, "invite": false, "manage_members": false, "access_chat": true}'::jsonb
            ELSE '{"read": true, "write": false, "delete": false, "invite": false, "manage_members": false, "access_chat": false}'::jsonb
        END,
        NOW()
    );
    
    -- Update invitation status
    UPDATE team_invitations
    SET status = 'accepted', updated_at = NOW()
    WHERE id = v_invitation.id;
    
    RETURN QUERY SELECT TRUE, v_invitation.project_id, v_project_name, v_invitation.role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Row Level Security (RLS) Policies

### 1. Project Team Members Policies

```sql
-- Enable RLS
ALTER TABLE project_team_members ENABLE ROW LEVEL SECURITY;

-- Users can view team members of projects they have access to
CREATE POLICY "Users can view project team members" ON project_team_members
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM project_team_members ptm2
            WHERE ptm2.project_id = project_team_members.project_id
            AND ptm2.user_id = auth.uid()
            AND ptm2.status = 'active'
        ) OR
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_team_members.project_id
            AND p.user_id = auth.uid()
        )
    );

-- Project owners and admins can manage team members
CREATE POLICY "Project owners and admins can manage team members" ON project_team_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = project_team_members.project_id
            AND p.user_id = auth.uid()
        ) OR
        EXISTS (
            SELECT 1 FROM project_team_members ptm
            WHERE ptm.project_id = project_team_members.project_id
            AND ptm.user_id = auth.uid()
            AND ptm.role IN ('admin')
            AND ptm.status = 'active'
            AND (ptm.permissions->>'manage_members')::boolean = true
        )
    );
```

### 2. Team Invitations Policies

```sql
-- Enable RLS
ALTER TABLE team_invitations ENABLE ROW LEVEL SECURITY;

-- Users can view invitations sent to them
CREATE POLICY "Users can view their invitations" ON team_invitations
    FOR SELECT USING (
        invited_user_id = auth.uid() OR
        inviter_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM projects p
            WHERE p.id = team_invitations.project_id
            AND p.user_id = auth.uid()
        )
    );

-- Users can update invitations sent to them (for accepting/declining)
CREATE POLICY "Users can update their invitations" ON team_invitations
    FOR UPDATE USING (invited_user_id = auth.uid());
```

### 3. Notifications Policies

```sql
-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can only access their own notifications
CREATE POLICY "Users can access their own notifications" ON notifications
    FOR ALL USING (user_id = auth.uid());
```

## Indexes for Performance

```sql
-- Team members indexes
CREATE INDEX IF NOT EXISTS idx_project_team_members_project_id ON project_team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_user_id ON project_team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_project_team_members_status ON project_team_members(status);

-- Team invitations indexes
CREATE INDEX IF NOT EXISTS idx_team_invitations_project_id ON team_invitations(project_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_invited_user_id ON team_invitations(invited_user_id);
CREATE INDEX IF NOT EXISTS idx_team_invitations_invitation_code ON team_invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_team_invitations_status ON team_invitations(status);
CREATE INDEX IF NOT EXISTS idx_team_invitations_expires_at ON team_invitations(expires_at);

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
```

## Setup Script

Run this complete setup script in your Supabase SQL editor:

```sql
-- Run all the above SQL statements in order
-- 1. Create/update tables
-- 2. Create functions
-- 3. Set up RLS policies
-- 4. Create indexes
```

## Environment Variables

Make sure you have these environment variables set:

```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing the Setup

After running the setup, you can test the team functionality:

1. **Invite a user by ID**: Use the enhanced invite function
2. **Search users**: The search should exclude current team members
3. **Accept invitations**: Users should receive in-app notifications
4. **Access control**: Team members should only see projects they have access to
5. **Chat integration**: Team members should be able to access project conversations

## Next Steps

1. Run the database setup scripts
2. Test the invitation flow
3. Verify permissions are working correctly
4. Set up email notifications if needed
5. Configure push notifications for mobile apps 