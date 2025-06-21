const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
const userClient = createClient(supabaseUrl, supabaseAnonKey);

async function testRealInvitationFlow() {
  console.log('🎯 TESTING REAL INVITATION FLOW');
  console.log('===============================');

  try {
    // Step 1: Sign in as project owner
    console.log('\n🔐 Step 1: Signing in as project owner...');
    const { data: authData, error: authError } = await userClient.auth.signInWithPassword({
      email: 'alex.smith@example.com',
      password: 'password123'
    });

    if (authError) {
      console.log('❌ Auth failed:', authError.message);
      return;
    }
    console.log('✅ Signed in as:', authData.user.email);

    // Step 2: Get or create a project
    console.log('\n📊 Step 2: Getting project...');
    let { data: projects, error: projectError } = await userClient
      .from('projects')
      .select('id, name')
      .limit(1);

    if (projectError) {
      console.log('❌ Error getting projects:', projectError.message);
      return;
    }

    let testProject;
    if (!projects || projects.length === 0) {
      console.log('📝 No projects found, creating test project...');
      const { data: newProject, error: createError } = await userClient
        .from('projects')
        .insert({
          name: 'Test Invitation Project',
          description: 'A project for testing team invitations',
          status: 'active'
        })
        .select()
        .single();

      if (createError) {
        console.log('❌ Error creating project:', createError.message);
        return;
      }
      testProject = newProject;
      console.log('✅ Created test project:', testProject.name);
    } else {
      testProject = projects[0];
      console.log('✅ Using existing project:', testProject.name);
    }

    // Step 3: Test invitation creation
    console.log('\n📤 Step 3: Creating invitation...');
    const { data: inviteResult, error: inviteError } = await userClient.rpc('create_team_invitation', {
      p_project_id: testProject.id,
      p_invited_email: 'raymond.jones@example.com',
      p_role: 'member',
      p_message: 'Join our awesome project team!'
    });

    if (inviteError) {
      console.log('❌ Invitation creation failed:', inviteError.message);
      return;
    }

    if (inviteResult && inviteResult.length > 0) {
      const result = inviteResult[0];
      if (result.success) {
        console.log('✅ Invitation created successfully!');
        console.log('   Invitation ID:', result.invitation_id);
        console.log('   Invitation Code:', result.invitation_code);

        // Step 4: Check notifications were created
        console.log('\n🔔 Step 4: Checking notifications...');
        const { data: notifications, error: notifError } = await userClient
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);

        if (notifError) {
          console.log('❌ Error getting notifications:', notifError.message);
        } else {
          console.log(`✅ Found ${notifications?.length || 0} recent notifications`);
          notifications?.forEach((notif, index) => {
            console.log(`   ${index + 1}. ${notif.title}: ${notif.message}`);
          });
        }

        // Step 5: Sign in as invited user and check invitations
        console.log('\n👤 Step 5: Testing invited user perspective...');
        const { error: rayAuthError } = await userClient.auth.signInWithPassword({
          email: 'raymond.jones@example.com',
          password: 'password123'
        });

        if (rayAuthError) {
          console.log('❌ Raymond auth failed:', rayAuthError.message);
        } else {
          console.log('✅ Signed in as Raymond');

          // Get user's invitations
          const { data: userInvites, error: invitesError } = await userClient.rpc('get_user_invitations');

          if (invitesError) {
            console.log('❌ Error getting user invitations:', invitesError.message);
          } else {
            console.log(`✅ Raymond has ${userInvites?.length || 0} pending invitations`);
            if (userInvites && userInvites.length > 0) {
              userInvites.forEach((invite, index) => {
                console.log(`   ${index + 1}. ${invite.project_name} (${invite.role}) from ${invite.inviter_name}`);
              });

              // Step 6: Accept the invitation
              console.log('\n✅ Step 6: Accepting invitation...');
              const { data: acceptResult, error: acceptError } = await userClient.rpc('accept_team_invitation', {
                invitation_code: result.invitation_code
              });

              if (acceptError) {
                console.log('❌ Accept invitation failed:', acceptError.message);
              } else if (acceptResult && acceptResult.length > 0) {
                const acceptData = acceptResult[0];
                if (acceptData.success) {
                  console.log('✅ Invitation accepted successfully!');
                  console.log('   Project:', acceptData.project_name);
                  console.log('   Role:', acceptData.role);

                  // Step 7: Verify team membership
                  console.log('\n👥 Step 7: Verifying team membership...');
                  const { data: teamMembers, error: teamError } = await userClient.rpc('get_project_team_with_invitations', {
                    p_project_id: testProject.id
                  });

                  if (teamError) {
                    console.log('❌ Error getting team members:', teamError.message);
                  } else {
                    console.log(`✅ Project has ${teamMembers?.length || 0} team members:`);
                    teamMembers?.forEach((member, index) => {
                      const status = member.joined_at ? 'Active' : 'Pending';
                      const date = member.joined_at || member.invitation_sent_at;
                      console.log(`   ${index + 1}. ${member.user_name} (${member.role}) - ${status} since ${new Date(date).toLocaleDateString()}`);
                    });
                  }
                } else {
                  console.log('❌ Accept failed:', acceptData.error_message);
                }
              }
            }
          }
        }
      } else {
        console.log('❌ Invitation creation failed:', result.error_message);
      }
    }

    console.log('\n🎉 REAL INVITATION FLOW TEST COMPLETE!');
    console.log('=====================================');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

testRealInvitationFlow().catch(console.error); 