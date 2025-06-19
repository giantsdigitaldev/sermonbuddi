import { supabase } from './supabase';

export interface SearchUser {
  id: string;
  username: string;
  full_name?: string;
  email?: string;
  avatar_url?: string;
  status: 'online' | 'offline' | 'away';
  last_seen?: string;
  verified?: boolean;
}

export interface TeamMember {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  role: 'admin' | 'member' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  joined_at?: string;
  invitation_sent_at?: string;
  permissions?: {
    read: boolean;
    write: boolean;
    delete: boolean;
    invite: boolean;
    manage_members: boolean;
    access_chat: boolean;
  };
}

export interface TeamInvitation {
  id: string;
  project_id: string;
  project_name: string;
  inviter_name: string;
  role: string;
  message?: string;
  invitation_code: string;
  expires_at: string;
  created_at: string;
}

export interface InviteMemberRequest {
  projectId: string;
  userId?: string; // For registered users
  email?: string;
  phone?: string;
  role: 'admin' | 'member' | 'viewer';
  message?: string;
  sendNotification?: boolean;
}

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  data?: any;
}

export interface SearchResult {
  users: SearchUser[];
  error: string | null;
}

export class TeamService {
  // Get all team members for a project (using existing project metadata)
  static async getProjectTeamMembers(projectId: string): Promise<TeamMember[]> {
    try {
      console.log('👥 Getting project team members for:', projectId);

      // Import ProjectService to get project data
      const { ProjectService } = await import('./projectService');
      const project = await ProjectService.getProject(projectId);
      
      if (!project || !project.metadata) {
        console.log('✅ No project or metadata found');
        return [];
      }

      // Extract team members from project metadata
      const teamMembers = project.metadata.team_members || project.metadata.members || [];
      
      // Transform to expected format
      const formattedMembers: TeamMember[] = teamMembers.map((member: any, index: number) => ({
        id: member.id || `member-${index}`,
        user_id: member.user_id || member.id || `user-${index}`,
        user_name: member.user_name || member.full_name || member.name || 'Unknown User',
        user_email: member.user_email || member.email || '',
        role: member.role || 'member',
        status: member.status || 'active',
        joined_at: member.joined_at || project.created_at,
        permissions: member.permissions || this.getRolePermissions(member.role || 'member')
      }));

      console.log('✅ Team members retrieved from metadata:', formattedMembers);
      return formattedMembers;
    } catch (error) {
      console.error('❌ Get team members failed:', error);
      return [];
    }
  }

  // Enhanced user search with better filtering and pagination
  static async searchUsers(query: string, limit: number = 20): Promise<SearchResult> {
    try {
      if (!query.trim()) {
        return { users: [], error: null };
      }

      console.log('🔍 TeamService.searchUsers called with:', { query, limit });

      // Get current user to exclude from results
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        console.log('❌ No authenticated user found');
        return { users: [], error: 'User not authenticated' };
      }

      console.log('✅ Current user:', currentUser.id);

      // Search profiles using only existing columns
      const searchQuery = supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, created_at, updated_at')
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .neq('id', currentUser.id) // Exclude current user
        .range(0, limit - 1);

      console.log('🔍 Executing search query...');
      const { data: profiles, error } = await searchQuery;

      if (error) {
        console.error('❌ Search query failed:', error);
        
        // Check if it's an RLS permission error
        if (error.message?.includes('permission denied') || error.message?.includes('RLS')) {
          return { 
            users: [], 
            error: 'Permission denied. Make sure you are signed in and RLS policies allow profile access.' 
          };
        }
        
        return { users: [], error: error.message };
      }

      console.log(`✅ Search successful. Found ${profiles?.length || 0} profiles`);

      if (!profiles || profiles.length === 0) {
        return { users: [], error: null };
      }

             // Transform profiles to match expected user format
       const users: SearchUser[] = profiles.map(profile => ({
         id: profile.id,
         username: profile.username || '',
         full_name: profile.full_name || '',
         email: undefined,
         avatar_url: profile.avatar_url || undefined,
         status: 'offline' as const,
         last_seen: undefined,
         verified: false,
         created_at: profile.created_at || new Date().toISOString()
       }));

      console.log('✅ Transformed users:', users.map(u => ({ id: u.id, full_name: u.full_name })));

      return { users, error: null };

    } catch (error) {
      console.error('❌ TeamService.searchUsers error:', error);
      return { 
        users: [], 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  // Get suggested users (recent collaborators, frequent contacts)
  static async getSuggestedUsers(limit: number = 10): Promise<SearchUser[]> {
    // Temporarily disabled due to RLS restrictions on project_team_members table
    console.log('⚠️ Suggested users disabled due to RLS restrictions');
    return [];
  }

  // Enhanced invitation with project metadata update
  static async inviteTeamMember(request: InviteMemberRequest): Promise<{
    success: boolean;
    invitationId?: string;
    invitationCode?: string;
    error?: string;
  }> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      if (!currentUser.user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get project to update metadata
      const { ProjectService } = await import('./projectService');
      const project = await ProjectService.getProject(request.projectId);
      
      if (!project) {
        return { success: false, error: 'Project not found' };
      }

      // Check if user is already a team member
      const existingMembers = project.metadata?.team_members || project.metadata?.members || [];
      const isAlreadyMember = existingMembers.some((member: any) => 
        member.user_id === request.userId || member.id === request.userId
      );

      if (isAlreadyMember) {
        return { success: false, error: 'User is already a team member' };
      }

             // Add new member to project metadata
       const newMember: any = {
         id: request.userId,
         user_id: request.userId,
         role: request.role,
         status: 'active',
         joined_at: new Date().toISOString(),
         permissions: this.getRolePermissions(request.role)
       };

       // If we have userId, get user details
       if (request.userId) {
         const { data: userProfile } = await supabase
           .from('profiles')
           .select('username, full_name, avatar_url')
           .eq('id', request.userId)
           .single();

         if (userProfile) {
           newMember.user_name = userProfile.full_name || userProfile.username;
           newMember.user_email = ''; // We don't store email in profiles
           newMember.avatar_url = userProfile.avatar_url;
         }
       }

      // Update project metadata
      const updatedMetadata = {
        ...project.metadata,
        team_members: [...existingMembers, newMember]
      };

      // Update the project
      const updatedProject = await ProjectService.updateProject(request.projectId, {
        metadata: updatedMetadata
      });

      if (!updatedProject) {
        return { success: false, error: 'Failed to update project' };
      }

      return {
        success: true,
        invitationId: newMember.id,
        invitationCode: 'added-directly' // Since we're adding directly to metadata
      };
    } catch (error) {
      console.error('Invitation error:', error);
      return { success: false, error: 'Failed to add team member' };
    }
  }

  // Send in-app notification
  static async sendInAppNotification(
    userId: string,
    notification: {
      type: string;
      title: string;
      message: string;
      data: any;
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          data: notification.data,
          read: false
        });

      if (error) {
        console.error('Failed to send in-app notification:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('In-app notification error:', error);
      return false;
    }
  }

  // Get user notifications
  static async getUserNotifications(userId?: string): Promise<NotificationData[]> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      const targetUserId = userId || currentUser.user?.id;
      
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Notifications fetch error:', error);
      return [];
    }
  }

  // Mark notification as read
  static async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      return !error;
    } catch (error) {
      console.error('Mark notification read error:', error);
      return false;
    }
  }

  // Enhanced invitation acceptance (metadata approach)
  static async acceptInvitation(invitationCode: string): Promise<{
    success: boolean;
    projectId?: string;
    projectName?: string;
    role?: string;
    error?: string;
  }> {
    // Since we're using metadata approach, invitations are handled differently
    // For now, return success but note that this needs a different flow
    return { 
      success: false, 
      error: 'Invitation system moved to direct team member addition via metadata' 
    };
  }

  // Helper to get role permissions
  private static getRolePermissions(role: string): TeamMember['permissions'] {
    switch (role) {
      case 'owner':
        return {
          read: true,
          write: true,
          delete: true,
          invite: true,
          manage_members: true,
          access_chat: true
        };
      case 'admin':
        return {
          read: true,
          write: true,
          delete: true,
          invite: true,
          manage_members: true,
          access_chat: true
        };
      case 'member':
        return {
          read: true,
          write: true,
          delete: false,
          invite: false,
          manage_members: false,
          access_chat: true
        };
      case 'viewer':
        return {
          read: true,
          write: false,
          delete: false,
          invite: false,
          manage_members: false,
          access_chat: true
        };
      default:
        return {
          read: true,
          write: false,
          delete: false,
          invite: false,
          manage_members: false,
          access_chat: false
        };
    }
  }

  // Check if user has access to project
  static async checkProjectAccess(
    projectId: string, 
    userId?: string,
    requiredPermission?: keyof TeamMember['permissions']
  ): Promise<{
    hasAccess: boolean;
    role?: string;
    permissions?: TeamMember['permissions'];
  }> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      const targetUserId = userId || currentUser.user?.id;
      
      if (!targetUserId) return { hasAccess: false };

      // Check if user is project owner
      const { data: project } = await supabase
        .from('projects')
        .select('user_id')
        .eq('id', projectId)
        .single();

      if (project?.user_id === targetUserId) {
        const ownerPermissions = this.getRolePermissions('owner');
        return { 
          hasAccess: true, 
          role: 'owner', 
          permissions: ownerPermissions 
        };
      }

      // Check team membership
      const { data: member } = await supabase
        .from('project_team_members')
        .select('role, permissions, status')
        .eq('project_id', projectId)
        .eq('user_id', targetUserId)
        .eq('status', 'active')
        .single();

      if (!member) return { hasAccess: false };

      const hasRequiredPermission = !requiredPermission || 
        member.permissions?.[requiredPermission] === true;

      return {
        hasAccess: hasRequiredPermission,
        role: member.role,
        permissions: member.permissions
      };
    } catch (error) {
      console.error('Check project access error:', error);
      return { hasAccess: false };
    }
  }

  // Get user's accessible projects
  static async getUserAccessibleProjects(userId?: string): Promise<{
    ownedProjects: any[];
    memberProjects: any[];
  }> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      const targetUserId = userId || currentUser.user?.id;
      
      if (!targetUserId) return { ownedProjects: [], memberProjects: [] };

      // Get owned projects
      const { data: ownedProjects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', targetUserId);

      // Get projects where user is a team member
      const { data: memberProjects } = await supabase
        .from('project_team_members')
        .select(`
          role,
          permissions,
          joined_at,
          project:projects(*)
        `)
        .eq('user_id', targetUserId)
        .eq('status', 'active');

      return {
        ownedProjects: ownedProjects || [],
        memberProjects: (memberProjects || []).map(m => ({
          ...m.project,
          team_role: m.role,
          team_permissions: m.permissions,
          joined_at: m.joined_at
        }))
      };
    } catch (error) {
      console.error('Get accessible projects error:', error);
      return { ownedProjects: [], memberProjects: [] };
    }
  }

  // Remove team member (metadata approach)
  static async removeTeamMember(projectId: string, memberId: string): Promise<boolean> {
    try {
      const { ProjectService } = await import('./projectService');
      const project = await ProjectService.getProject(projectId);
      
      if (!project || !project.metadata) {
        return false;
      }

      const existingMembers = project.metadata.team_members || project.metadata.members || [];
      const updatedMembers = existingMembers.filter((member: any) => 
        member.id !== memberId && member.user_id !== memberId
      );

      const updatedMetadata = {
        ...project.metadata,
        team_members: updatedMembers
      };

      const updatedProject = await ProjectService.updateProject(projectId, {
        metadata: updatedMetadata
      });

      return !!updatedProject;
    } catch (error) {
      console.error('Remove team member error:', error);
      return false;
    }
  }

  // Update team member role (metadata approach)
  static async updateMemberRole(
    projectId: string, 
    memberId: string, 
    newRole: TeamMember['role']
  ): Promise<boolean> {
    try {
      const { ProjectService } = await import('./projectService');
      const project = await ProjectService.getProject(projectId);
      
      if (!project || !project.metadata) {
        return false;
      }

      const existingMembers = project.metadata.team_members || project.metadata.members || [];
      const updatedMembers = existingMembers.map((member: any) => {
        if (member.id === memberId || member.user_id === memberId) {
          return {
            ...member,
            role: newRole,
            permissions: this.getRolePermissions(newRole)
          };
        }
        return member;
      });

      const updatedMetadata = {
        ...project.metadata,
        team_members: updatedMembers
      };

      const updatedProject = await ProjectService.updateProject(projectId, {
        metadata: updatedMetadata
      });

      return !!updatedProject;
    } catch (error) {
      console.error('Update member role error:', error);
      return false;
    }
  }

  // Get user's team invitations
  static async getUserInvitations(): Promise<TeamInvitation[]> {
    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select(`
          *,
          project:projects(name, description),
          inviter:profiles(full_name, username)
        `)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching invitations:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Invitations fetch error:', error);
      return [];
    }
  }

  // Send invitation via email/SMS
  static async sendInvitationNotification(
    invitationCode: string,
    email?: string,
    phone?: string,
    projectName?: string,
    inviterName?: string,
    role?: string,
    message?: string
  ): Promise<boolean> {
    try {
      if (email) {
        // Import EmailService dynamically to avoid circular dependencies
        const { EmailService } = await import('./emailService');
        
        const success = await EmailService.sendTeamInvitation(
          email,
          invitationCode,
          projectName || 'Project',
          inviterName || 'Team Member',
          role || 'member',
          message
        );
        
        if (success) {
          console.log(`✅ Email invitation sent to ${email}`);
        } else {
          console.log(`❌ Failed to send email invitation to ${email}`);
        }
        
        return success;
      }
      
      if (phone) {
        // TODO: Integrate with SMS service (Twilio, etc.)
        const inviteLink = `https://your-app.com/invite/${invitationCode}`;
        console.log(`📱 SMS invitation to ${phone}: ${inviteLink}`);
        // For now, return true as SMS is not implemented
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Notification send error:', error);
      return false;
    }
  }

  // Debug method to help troubleshoot user discovery issues
  static async debugUserDiscovery(): Promise<{
    currentUser: any;
    allProfiles: any[];
    profilesTableAccess: boolean;
    authUsersAccess: boolean;
    rlsPolicies: string[];
  }> {
    try {
      const { data: currentUser } = await supabase.auth.getUser();
      
      // Test profiles table access
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(10);

      // Try to check auth.users table (may not work due to RLS)
      const { data: authUsers, error: authError } = await supabase
        .from('auth.users')
        .select('id, email, created_at')
        .limit(5);

      console.log('🔍 User Discovery Debug Report:');
      console.log('Current User:', currentUser.user?.id);
      console.log('Profiles found:', profiles?.length || 0);
      console.log('Profiles error:', profilesError?.message);
      console.log('Auth users error:', authError?.message);
      console.log('Sample profiles:', profiles?.map(p => ({ 
        id: p.id, 
        username: p.username, 
        full_name: p.full_name 
      })));

      return {
        currentUser: currentUser.user,
        allProfiles: profiles || [],
        profilesTableAccess: !profilesError,
        authUsersAccess: !authError,
        rlsPolicies: [] // Could be expanded to check policies
      };
    } catch (error: any) {
      console.error('Debug discovery error:', error);
      return {
        currentUser: null,
        allProfiles: [],
        profilesTableAccess: false,
        authUsersAccess: false,
        rlsPolicies: []
      };
    }
  }

  // Helper method to create a profile for a user (for testing)
  static async createTestProfile(userId: string, userData: { username: string; full_name: string }): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          username: userData.username,
          full_name: userData.full_name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        console.error('Error creating test profile:', error);
        return false;
      }

      console.log('✅ Test profile created:', data);
      return true;
    } catch (error) {
      console.error('Create test profile error:', error);
      return false;
    }
  }

  // Get user by ID for task assignment info
  static async getUserById(userId: string): Promise<SearchUser | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, created_at, updated_at')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user by ID:', error);
        return null;
      }

      if (!profile) {
        return null;
      }

      return {
        id: profile.id,
        username: profile.username || '',
        full_name: profile.full_name || '',
        email: undefined,
        avatar_url: profile.avatar_url || undefined,
        status: 'offline' as const,
        last_seen: undefined,
        verified: false
      };
    } catch (error) {
      console.error('Get user by ID error:', error);
      return null;
    }
  }
}