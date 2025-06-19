const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase clients
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Check environment variables
if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Missing environment variables:');
  console.error('   EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  console.error('   EXPO_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  console.error('\nPlease check your .env file or environment variables.');
  process.exit(1);
}

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
const userClient = createClient(supabaseUrl, supabaseAnonKey);

async function testCompleteInvitationSystem() {
  console.log('🧪 TESTING COMPLETE INVITATION SYSTEM');
  console.log('====================================');

  try {
    // Step 1: Sign in as project owner (Alex Smith)
    console.log('🔐 Step 1: Signing in as project owner...');
    const { data: authData, error: authError } = await userClient.auth.signInWithPassword({
      email: 'alex.smith@example.com',
      password: 'password123'
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return;
    }

    console.log('✅ Signed in as:', authData.user.email);

    // Step 2: Test database functions exist
    console.log('\n📊 Step 2: Testing database functions...');
    
    const functions = [
      'create_team_invitation',
      'get_user_invitations', 
      'accept_team_invitation',
      'get_project_team_with_invitations',
      'check_user_project_access'
    ];

    for (const funcName of functions) {
      const { data, error } = await serviceClient
        .from('information_schema.routines')
        .select('routine_name')
        .eq('routine_name', funcName)
        .single();

      if (error || !data) {
        console.log(`❌ Function ${funcName} not found`);
      } else {
        console.log(`✅ Function ${funcName} exists`);
      }
    }

    // Step 3: Test table access
    console.log('\n📋 Step 3: Testing table access...');
    
    const tables = ['project_team_members', 'team_invitations', 'notifications'];
    
    for (const tableName of tables) {
      try {
        const { error } = await userClient
          .from(tableName)
          .select('*')
          .limit(0);

        if (error) {
          console.log(`❌ ${tableName} access error:`, error.message);
        } else {
          console.log(`✅ ${tableName} accessible`);
        }
      } catch (err) {
        console.log(`❌ ${tableName} error:`, err.message);
      }
    }

    // Step 4: Get a project ID for testing
    console.log('\n🔍 Step 4: Finding test project...');
    const { data: projects, error: projectError } = await userClient
      .from('projects')
      .select('id, name')
      .limit(1);

    if (projectError || !projects || projects.length === 0) {
      console.log('❌ No projects found for testing');
      return;
    }

    const testProject = projects[0];
    console.log(`✅ Using project: ${testProject.name} (${testProject.id})`);

    // Step 5: Test invitation creation
    console.log('\n📤 Step 5: Testing invitation creation...');
    
    const { data: inviteResult, error: inviteError } = await userClient.rpc('create_team_invitation', {
      p_project_id: testProject.id,
      p_invited_email: 'raymond.jones@example.com',
      p_role: 'member',
      p_message: 'Join our awesome project!'
    });

    if (inviteError) {
      console.log('❌ Invitation creation error:', inviteError.message);
    } else if (inviteResult && inviteResult.length > 0) {
      const result = inviteResult[0];
      if (result.success) {
        console.log('✅ Invitation created successfully!');
        console.log('   Invitation ID:', result.invitation_id);
        console.log('   Invitation Code:', result.invitation_code);
        
        // Step 6: Test getting user invitations
        console.log('\n📨 Step 6: Testing get user invitations...');
        
        // Sign in as the invited user
        const { error: rayAuthError } = await userClient.auth.signInWithPassword({
          email: 'raymond.jones@example.com',
          password: 'password123'
        });

        if (rayAuthError) {
          console.log('❌ Raymond auth error:', rayAuthError.message);
        } else {
          console.log('✅ Signed in as Raymond');

          const { data: userInvites, error: invitesError } = await userClient.rpc('get_user_invitations');

          if (invitesError) {
            console.log('❌ Get invitations error:', invitesError.message);
          } else {
            console.log(`✅ Found ${userInvites?.length || 0} pending invitations`);
            if (userInvites && userInvites.length > 0) {
              console.log('   First invitation:', userInvites[0].project_name);
            }
          }

          // Step 7: Test invitation acceptance
          console.log('\n✅ Step 7: Testing invitation acceptance...');
          
          const { data: acceptResult, error: acceptError } = await userClient.rpc('accept_team_invitation', {
            invitation_code: result.invitation_code
          });

          if (acceptError) {
            console.log('❌ Accept invitation error:', acceptError.message);
          } else if (acceptResult && acceptResult.length > 0) {
            const acceptData = acceptResult[0];
            if (acceptData.success) {
              console.log('✅ Invitation accepted successfully!');
              console.log('   Project:', acceptData.project_name);
              console.log('   Role:', acceptData.role);
            } else {
              console.log('❌ Accept failed:', acceptData.error_message);
            }
          }
        }
      } else {
        console.log('❌ Invitation creation failed:', result.error_message);
      }
    }

    // Step 8: Test notifications
    console.log('\n🔔 Step 8: Testing notifications...');
    
    const { data: notifications, error: notifError } = await userClient
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (notifError) {
      console.log('❌ Notifications error:', notifError.message);
    } else {
      console.log(`✅ Found ${notifications?.length || 0} notifications`);
      if (notifications && notifications.length > 0) {
        console.log('   Latest notification:', notifications[0].title);
      }
    }

    // Step 9: Test project access check
    console.log('\n🔐 Step 9: Testing project access check...');
    
    const { data: accessResult, error: accessError } = await userClient.rpc('check_user_project_access', {
      p_project_id: testProject.id
    });

    if (accessError) {
      console.log('❌ Access check error:', accessError.message);
    } else if (accessResult && accessResult.length > 0) {
      const access = accessResult[0];
      console.log('✅ Access check completed');
      console.log('   Has access:', access.has_access);
      console.log('   Role:', access.role);
      console.log('   Is owner:', access.is_owner);
    }

    console.log('\n🎉 COMPLETE INVITATION SYSTEM TEST FINISHED!');
    console.log('==========================================');

  } catch (error) {
    console.error('❌ Test error:', error);
  }
}

// Run the test
testCompleteInvitationSystem().catch(console.error); 