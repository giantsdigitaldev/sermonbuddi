import { supabase } from './supabase';

export interface SearchUser {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  email?: string;
}

export interface TeamMember {
  id: string;
  project_id: string;
  user_id?: string;
  invited_email?: string;
  invited_phone?: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'pending' | 'accepted' | 'declined' | 'active';
  permissions: {
    read: boolean;
    write: boolean;
    delete: boolean;
  };
  joined_at?: string;
  user_name?: string;
  user_email?: string;
  user_avatar?: string;
  created_at: string;
  updated_at: string;
}

export interface TeamInvitation {
  id: string;
  project_id: string;
  invited_email?: string;
  invited_phone?: string;
  invitation_code: string;
  role: 'admin' | 'member' | 'viewer';
  message?: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
}

export interface InviteMemberRequest {
  projectId: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'member' | 'viewer';
  message?: string;
}

export class TeamService {
  // Get all team members for a project
  static async getProjectTeamMembers(projectId: string): Promise<TeamMember[]> {
    try {
      const { data, error } = await supabase.rpc('get_project_team_members', {
        p_project_id: projectId
      });
      
      if (error) {
        console.error('Error fetching team members:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Team members fetch error:', error);
      return [];
    }
  }

  // Search for users by email/username for invitation
  static async searchUsers(query: string): Promise<SearchUser[]> {
    try {
      // Search in profiles table for registered users
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          username,
          full_name,
          avatar_url
        `)
        .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
        .limit(10);
      
      if (error) {
        console.error('Error searching users:', error);
        return [];
      }
      
      // Transform the data to match our SearchUser interface
      const searchUsers: SearchUser[] = (data || []).map(user => ({
        id: user.id,
        username: user.username,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        email: user.username ? `${user.username}@example.com` : undefined // Placeholder
      }));
      
      return searchUsers;
    } catch (error) {
      console.error('User search error:', error);
      return [];
    }
  }

  // Invite a team member
  static async inviteTeamMember(request: InviteMemberRequest): Promise<{
    success: boolean;
    invitationId?: string;
    invitationCode?: string;
    error?: string;
  }> {
    try {
      // First check if it's a registered user by email or username
      if (request.email) {
        // Try to find user by username first (assuming email format might be username@domain)
        const username = request.email.split('@')[0];
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id, username')
          .or(`username.eq.${username}`)
          .single();
        
        if (existingUser) {
          // Add registered user directly to team
          const { error: teamError } = await supabase
            .from('project_team_members')
            .insert({
              project_id: request.projectId,
              user_id: existingUser.id,
              role: request.role,
              status: 'active',
              joined_at: new Date().toISOString()
            });
          
          if (teamError) {
            return { success: false, error: teamError.message };
          }
          
          return { success: true };
        }
      }
      
      // Create invitation for non-registered user
      const { data, error } = await supabase.rpc('invite_team_member', {
        p_project_id: request.projectId,
        p_invited_email: request.email || null,
        p_invited_phone: request.phone || null,
        p_role: request.role,
        p_message: request.message || null
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      const invitation = data[0];
      return {
        success: true,
        invitationId: invitation.invitation_id,
        invitationCode: invitation.invitation_code
      };
    } catch (error) {
      console.error('Invitation error:', error);
      return { success: false, error: 'Failed to send invitation' };
    }
  }

  // Remove team member
  static async removeTeamMember(projectId: string, memberId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('project_team_members')
        .delete()
        .eq('project_id', projectId)
        .eq('id', memberId);
      
      if (error) {
        console.error('Error removing team member:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Remove team member error:', error);
      return false;
    }
  }

  // Update team member role
  static async updateMemberRole(
    projectId: string, 
    memberId: string, 
    newRole: TeamMember['role']
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('project_team_members')
        .update({ role: newRole })
        .eq('project_id', projectId)
        .eq('id', memberId);
      
      if (error) {
        console.error('Error updating member role:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Update member role error:', error);
      return false;
    }
  }

  // Accept team invitation
  static async acceptInvitation(invitationCode: string): Promise<{
    success: boolean;
    projectId?: string;
    projectName?: string;
    role?: string;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.rpc('accept_team_invitation', {
        p_invitation_code: invitationCode
      });
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      const result = data[0];
      if (!result.success) {
        return { success: false, error: 'Invalid or expired invitation' };
      }
      
      return {
        success: true,
        projectId: result.project_id,
        projectName: result.project_name,
        role: result.role
      };
    } catch (error) {
      console.error('Accept invitation error:', error);
      return { success: false, error: 'Failed to accept invitation' };
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
}