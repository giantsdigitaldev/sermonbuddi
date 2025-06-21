const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugFileUploadIssue() {
    console.log('🔍 Debugging file upload issue...\n');

    const projectId = 'd2915722-dd4e-467d-ab0c-91e4c18b605c';

    try {
        // Check if project exists
        console.log('📋 Step 1: Checking if project exists...');
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

        if (projectError) {
            console.error('❌ Project error:', projectError);
            return;
        }

        if (project) {
            console.log('✅ Project exists:', project.name || 'Unnamed Project');
        } else {
            console.error('❌ Project not found');
            return;
        }

        // Check project team members
        console.log('\n👥 Step 2: Checking project team members...');
        const { data: teamMembers, error: teamError } = await supabase
            .from('project_team_members')
            .select('*')
            .eq('project_id', projectId);

        if (teamError) {
            console.error('❌ Team members error:', teamError);
            return;
        }

        console.log(`✅ Found ${teamMembers?.length || 0} team members`);
        if (teamMembers && teamMembers.length > 0) {
            teamMembers.forEach(member => {
                console.log(`  • User ID: ${member.user_id}`);
                console.log(`  • Role: ${member.role || 'member'}`);
                console.log(`  • Added: ${member.created_at}`);
                console.log('---');
            });
        }

        // Check storage bucket
        console.log('\n🗄️ Step 3: Checking storage bucket...');
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

        if (bucketsError) {
            console.error('❌ Buckets error:', bucketsError);
            return;
        }

        const projectFilesBucket = buckets?.find(bucket => bucket.name === 'project-files');
        if (projectFilesBucket) {
            console.log('✅ project-files bucket exists');
            console.log(`  • Public: ${projectFilesBucket.public}`);
            console.log(`  • Created: ${projectFilesBucket.created_at}`);
        } else {
            console.log('❌ project-files bucket does not exist');
        }

        // Check if project_files table exists and has correct structure
        console.log('\n📊 Step 4: Checking project_files table...');
        const { data: tableTest, error: tableError } = await supabase
            .from('project_files')
            .select('*')
            .limit(1);

        if (tableError) {
            console.error('❌ project_files table error:', tableError);
        } else {
            console.log('✅ project_files table exists and is accessible');
        }

        // Check storage policies
        console.log('\n🔒 Step 5: Checking storage policies...');
        const { data: storagePolicies, error: policiesError } = await supabase
            .rpc('get_storage_policies', { bucket_name: 'project-files' })
            .single();

        if (policiesError) {
            console.log('⚠️ Could not check storage policies (this is normal)');
        } else {
            console.log('✅ Storage policies found');
        }

        console.log('\n🎯 Summary:');
        console.log('To fix the upload issue, you need to:');
        console.log('1. Run the SETUP_PROJECT_FILES_TABLE_CORRECTED.sql script');
        console.log('2. Run the SETUP_STORAGE_BUCKET_POLICIES.sql script');
        console.log('3. Make sure the current user is added to the project team');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

debugFileUploadIssue(); 