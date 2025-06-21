const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🧪 TESTING TEAM INVITATION SYSTEM');
console.log('====================================');

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testTeamInvitationSystem() {
  try {
    // Step 1: Sign in as project owner
    console.log('🔐 Step 1: Signing in as project owner...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'alex.smith@example.com',
      password: 'password123'
    });
    
    if (authError) {
      console.log('❌ Auth failed:', authError.message);
      return;
    }
    
    console.log('✅ Signed in as:', authData.user.email);
    
    // Step 2: Check if tables exist
    console.log('\n📊 Step 2: Checking database tables...');
    
    const { data: teamMembers, error: teamError } = await supabase
      .from('project_team_members')
      .select('*')
      .limit(1);
    
    if (teamError) {
      console.log('❌ project_team_members table error:', teamError.message);
    } else {
      console.log('✅ project_team_members table accessible');
    }
    
    const { data: invitations, error: inviteError } = await supabase
      .from('team_invitations')
      .select('*')
      .limit(1);
    
    if (inviteError) {
      console.log('❌ team_invitations table error:', inviteError.message);
    } else {
      console.log('✅ team_invitations table accessible');
    }
    
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('*')
      .limit(1);
    
    if (notifError) {
      console.log('❌ notifications table error:', notifError.message);
    } else {
      console.log('✅ notifications table accessible');
    }
    
    // Step 3: Create a test invitation
    console.log('\n📤 Step 3: Creating test invitation...');
    
    // First, get a target user to invite
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .neq('id', authData.user.id)
      .limit(1);
    
    if (!targetUser || targetUser.length === 0) {
      console.log('❌ No target user found for invitation');
      return;
    }
    
    console.log('🎯 Target user for invitation:', targetUser[0].full_name);
    
    // Create test invitation
    const { data: invitation, error: createError } = await supabase
      .from('team_invitations')
      .insert({
        project_id: '550e8400-e29b-41d4-a716-446655440000', // Test project ID
        invited_user_id: targetUser[0].id,
        inviter_id: authData.user.id,
        inviter_name: 'Alex Smith',
        role: 'member',
        message: 'Join our test project!',
        project_name: 'Test Project'
      })
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Failed to create invitation:', createError.message);
    } else {
      console.log('✅ Invitation created successfully!');
      console.log('   Invitation Code:', invitation.invitation_code);
      console.log('   Expires:', invitation.expires_at);
    }
    
    // Step 4: Test invitation acceptance (simulate different user)
    console.log('\n✅ Step 4: Testing invitation acceptance...');
    
    // Sign out current user
    await supabase.auth.signOut();
    
    // Sign in as target user
    const { data: targetAuth, error: targetAuthError } = await supabase.auth.signInWithPassword({
      email: 'raymond.jones@example.com',
      password: 'password123'
    });
    
    if (targetAuthError) {
      console.log('❌ Target user auth failed:', targetAuthError.message);
    } else {
      console.log('✅ Signed in as target user:', targetAuth.user.email);
      
      // Try to accept invitation using the function
      if (invitation?.invitation_code) {
        const { data: acceptResult, error: acceptError } = await supabase
          .rpc('accept_team_invitation', {
            invitation_code: invitation.invitation_code
          });
        
        if (acceptError) {
          console.log('❌ Failed to accept invitation:', acceptError.message);
        } else {
          console.log('✅ Invitation accepted successfully!');
          console.log('   Result:', acceptResult);
        }
      }
    }
    
    // Step 5: Verify team membership
    console.log('\n👥 Step 5: Verifying team membership...');
    
    const { data: teamMemberCheck, error: memberError } = await supabase
      .from('project_team_members')
      .select('*')
      .eq('project_id', '550e8400-e29b-41d4-a716-446655440000');
    
    if (memberError) {
      console.log('❌ Failed to check team members:', memberError.message);
    } else {
      console.log('✅ Team members found:', teamMemberCheck.length);
      teamMemberCheck.forEach(member => {
        console.log(`   - ${member.user_name || 'Unknown'} (${member.role})`);
      });
    }
    
    // Step 6: Test notification system
    console.log('\n🔔 Step 6: Checking notifications...');
    
    const { data: userNotifications, error: notificationError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', targetAuth?.user?.id)
      .order('created_at', { ascending: false });
    
    if (notificationError) {
      console.log('❌ Failed to get notifications:', notificationError.message);
    } else {
      console.log('✅ Notifications found:', userNotifications.length);
      userNotifications.forEach(notif => {
        console.log(`   - ${notif.title}: ${notif.message}`);
      });
    }
    
    console.log('\n🎉 TEAM INVITATION SYSTEM TEST COMPLETE!');
    console.log('==========================================');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  } finally {
    await supabase.auth.signOut();
  }
}

testTeamInvitationSystem(); 