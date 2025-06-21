const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProjectsTableStructure() {
    console.log('🔍 Checking projects table structure...\n');

    try {
        // Get a sample project to see the actual column names
        const { data: sampleProject, error: sampleError } = await supabase
            .from('projects')
            .select('*')
            .limit(1);

        if (sampleError) {
            console.error('❌ Error fetching sample project:', sampleError);
            return;
        }

        if (sampleProject && sampleProject.length > 0) {
            console.log('📋 Projects table columns:');
            const columns = Object.keys(sampleProject[0]);
            columns.forEach(column => {
                console.log(`  • ${column}`);
            });
            
            console.log('\n📊 Sample project data:');
            console.log(JSON.stringify(sampleProject[0], null, 2));
        } else {
            console.log('⚠️ No projects found in the database');
        }

    } catch (error) {
        console.error('❌ Error checking projects table:', error);
    }
}

checkProjectsTableStructure(); 