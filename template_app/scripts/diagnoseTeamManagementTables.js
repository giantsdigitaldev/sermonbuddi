#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Use service role key for admin operations
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Team Management Tables Diagnostic');
console.log('Environment check:');
console.log('URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Service Key:', supabaseServiceKey ? 'Found' : 'Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName);
    
    return !error && data && data.length > 0;
  } catch (err) {
    return false;
  }
}

async function checkRLSEnabled(tableName) {
  try {
    const { data, error } = await supabase
      .from('pg_tables')
      .select('rowsecurity')
      .eq('schemaname', 'public')
      .eq('tablename', tableName);
    
    return !error && data && data.length > 0 ? data[0].rowsecurity : false;
  } catch (err) {
    return false;
  }
}

async function getPolicies(tableName) {
  try {
    const { data, error } = await supabase
      .from('pg_policies')
      .select('policyname, cmd, permissive')
      .eq('schemaname', 'public')
      .eq('tablename', tableName);
    
    return !error && data ? data : [];
  } catch (err) {
    return [];
  }
}

async function testTableAccess(tableName) {
  try {
    // Try to count rows (should work if policies allow it)
    const { data, error } = await supabase
      .from(tableName)
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      return { accessible: false, error: error.message };
    }
    return { accessible: true, count: data?.length || 0 };
  } catch (err) {
    return { accessible: false, error: err.message };
  }
}

async function diagnoseTeamManagement() {
  console.log('\n🔍 Diagnosing team management tables...\n');

  try {
    // Check project_team_members table
    console.log('📋 Checking project_team_members table:');
    const teamMembersExists = await checkTableExists('project_team_members');
    console.log(`   Table exists: ${teamMembersExists ? '✅ Yes' : '❌ No'}`);
    
    if (teamMembersExists) {
      const teamMembersRLS = await checkRLSEnabled('project_team_members');
      console.log(`   RLS enabled: ${teamMembersRLS ? '✅ Yes' : '❌ No'}`);
      
      const teamMembersPolicies = await getPolicies('project_team_members');
      console.log(`   Policies count: ${teamMembersPolicies.length}`);
      
      if (teamMembersPolicies.length > 0) {
        teamMembersPolicies.forEach(policy => {
          console.log(`     - ${policy.policyname} (${policy.cmd})`);
        });
      }
      
      const teamMembersAccess = await testTableAccess('project_team_members');
      console.log(`   Accessible: ${teamMembersAccess.accessible ? '✅ Yes' : '❌ No'}`);
      if (!teamMembersAccess.accessible) {
        console.log(`   Error: ${teamMembersAccess.error}`);
      }
    }

    console.log('\n📋 Checking team_invitations table:');
    const invitationsExists = await checkTableExists('team_invitations');
    console.log(`   Table exists: ${invitationsExists ? '✅ Yes' : '❌ No'}`);
    
    if (invitationsExists) {
      const invitationsRLS = await checkRLSEnabled('team_invitations');
      console.log(`   RLS enabled: ${invitationsRLS ? '✅ Yes' : '❌ No'}`);
      
      const invitationsPolicies = await getPolicies('team_invitations');
      console.log(`   Policies count: ${invitationsPolicies.length}`);
      
      if (invitationsPolicies.length > 0) {
        invitationsPolicies.forEach(policy => {
          console.log(`     - ${policy.policyname} (${policy.cmd})`);
        });
      }
      
      const invitationsAccess = await testTableAccess('team_invitations');
      console.log(`   Accessible: ${invitationsAccess.accessible ? '✅ Yes' : '❌ No'}`);
      if (!invitationsAccess.accessible) {
        console.log(`   Error: ${invitationsAccess.error}`);
      }
    }

    // Check projects table for reference
    console.log('\n📋 Checking projects table (reference):');
    const projectsExists = await checkTableExists('projects');
    console.log(`   Table exists: ${projectsExists ? '✅ Yes' : '❌ No'}`);
    
    if (projectsExists) {
      const projectsAccess = await testTableAccess('projects');
      console.log(`   Accessible: ${projectsAccess.accessible ? '✅ Yes' : '❌ No'}`);
    }

    // Summary and recommendations
    console.log('\n📊 DIAGNOSIS SUMMARY:');
    console.log('=' * 50);
    
    if (!teamMembersExists || !invitationsExists) {
      console.log('❌ ISSUE: Required tables are missing');
      console.log('🔧 SOLUTION: Run the SQL script in Supabase SQL Editor');
      console.log('   Copy contents of scripts/createTeamManagementSQL.sql');
      console.log('   Paste in Supabase Dashboard → SQL Editor → Run');
    } else if (teamMembersExists && invitationsExists) {
      const teamMembersAccessible = (await testTableAccess('project_team_members')).accessible;
      const invitationsAccessible = (await testTableAccess('team_invitations')).accessible;
      
      if (!teamMembersAccessible || !invitationsAccessible) {
        console.log('❌ ISSUE: Tables exist but RLS policies are blocking access');
        console.log('🔧 SOLUTION: Run the RLS policy fix script');
        console.log('   The tables exist but policies need to be updated');
      } else {
        console.log('✅ GOOD: Tables exist and are accessible');
        console.log('🤔 The 403 errors might be due to:');
        console.log('   - App cache (try: npx expo start --clear)');
        console.log('   - Different authentication context');
        console.log('   - Supabase client configuration');
      }
    }

  } catch (error) {
    console.error('❌ Diagnosis failed:', error);
  }
}

async function main() {
  await diagnoseTeamManagement();
}

if (require.main === module) {
  main().then(() => {
    console.log('\n🎉 Diagnosis completed!');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Diagnosis failed:', error);
    process.exit(1);
  });
}

module.exports = { diagnoseTeamManagement }; 