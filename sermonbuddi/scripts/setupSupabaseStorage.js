/**
 * Supabase Storage Setup Script
 * Sets up storage bucket and project_files table with proper RLS policies
 * Ensures team members can access project files securely
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure you have:');
  console.log('- EXPO_PUBLIC_SUPABASE_URL');
  console.log('- EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupSupabaseStorage() {
  try {
    console.log('🚀 Setting up Supabase storage for project files...\n');

    // Step 1: Create storage bucket
    console.log('📁 Step 1: Creating project-files storage bucket...');
    
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      throw listError;
    }

    const bucketExists = buckets.some(bucket => bucket.name === 'project-files');
    
    if (!bucketExists) {
      const { error: createBucketError } = await supabase.storage.createBucket('project-files', {
        public: false, // Private bucket for security
        allowedMimeTypes: [
          'image/*',
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/*',
          'application/zip',
          'application/x-zip-compressed',
          'video/*',
          'audio/*'
        ],
        fileSizeLimit: 10485760 // 10MB limit
      });

      if (createBucketError) {
        console.error('❌ Error creating bucket:', createBucketError);
        throw createBucketError;
      }
      
      console.log('✅ Storage bucket "project-files" created successfully');
    } else {
      console.log('✅ Storage bucket "project-files" already exists');
    }

    // Step 2: Create project_files table
    console.log('\n📊 Step 2: Creating project_files table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS project_files (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size BIGINT NOT NULL,
        file_type TEXT NOT NULL,
        storage_provider TEXT DEFAULT 'supabase' CHECK (storage_provider IN ('supabase', 'vps')),
        uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        description TEXT,
        download_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (tableError) {
      console.error('❌ Error creating table:', tableError);
      throw tableError;
    }

    console.log('✅ project_files table created/verified');

    // Step 3: Create indexes for performance
    console.log('\n🔍 Step 3: Creating performance indexes...');
    
    const indexesSQL = `
      CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
      CREATE INDEX IF NOT EXISTS idx_project_files_uploaded_by ON project_files(uploaded_by);
      CREATE INDEX IF NOT EXISTS idx_project_files_storage_provider ON project_files(storage_provider);
      CREATE INDEX IF NOT EXISTS idx_project_files_created_at ON project_files(created_at DESC);
    `;

    const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexesSQL });
    
    if (indexError) {
      console.error('❌ Error creating indexes:', indexError);
      throw indexError;
    }

    console.log('✅ Performance indexes created');

    // Step 4: Set up RLS policies for secure team access
    console.log('\n🔐 Step 4: Setting up Row Level Security policies...');
    
    // Enable RLS on project_files table
    const enableRLSSQL = `ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;`;
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: enableRLSSQL });
    
    if (rlsError) {
      console.error('❌ Error enabling RLS:', rlsError);
      throw rlsError;
    }

    console.log('✅ Row Level Security enabled');

    // Create RLS policies for team member access
    const policiesSQL = `
      -- Drop existing policies if they exist
      DROP POLICY IF EXISTS "Users can view project files they have access to" ON project_files;
      DROP POLICY IF EXISTS "Users can upload files to projects they have access to" ON project_files;
      DROP POLICY IF EXISTS "Users can update their own uploaded files" ON project_files;
      DROP POLICY IF EXISTS "Users can delete their own uploaded files" ON project_files;
      
      -- Policy 1: Users can view files from projects they are members of
      CREATE POLICY "Users can view project files they have access to" ON project_files
      FOR SELECT
      USING (
        project_id IN (
          SELECT p.id FROM projects p
          LEFT JOIN team_members tm ON tm.project_id = p.id
          WHERE p.created_by = auth.uid()
          OR tm.user_id = auth.uid()
        )
      );
      
      -- Policy 2: Users can upload files to projects they are members of
      CREATE POLICY "Users can upload files to projects they have access to" ON project_files
      FOR INSERT
      WITH CHECK (
        uploaded_by = auth.uid() AND
        project_id IN (
          SELECT p.id FROM projects p
          LEFT JOIN team_members tm ON tm.project_id = p.id
          WHERE p.created_by = auth.uid()
          OR tm.user_id = auth.uid()
        )
      );
      
      -- Policy 3: Users can update files they uploaded or in projects they own
      CREATE POLICY "Users can update their own uploaded files" ON project_files
      FOR UPDATE
      USING (
        uploaded_by = auth.uid() OR
        project_id IN (
          SELECT id FROM projects WHERE created_by = auth.uid()
        )
      );
      
      -- Policy 4: Users can delete files they uploaded or in projects they own
      CREATE POLICY "Users can delete their own uploaded files" ON project_files
      FOR DELETE
      USING (
        uploaded_by = auth.uid() OR
        project_id IN (
          SELECT id FROM projects WHERE created_by = auth.uid()
        )
      );
    `;

    const { error: policiesError } = await supabase.rpc('exec_sql', { sql: policiesSQL });
    
    if (policiesError) {
      console.error('❌ Error creating RLS policies:', policiesError);
      throw policiesError;
    }

    console.log('✅ RLS policies created for secure team access');

    console.log('\n🎉 Supabase Storage Setup Complete!\n');
    console.log('📋 Summary:');
    console.log('  ✅ Storage bucket "project-files" configured (private, 10MB limit)');
    console.log('  ✅ project_files table created with all necessary columns');
    console.log('  ✅ Performance indexes created');
    console.log('  ✅ Row Level Security enabled');
    console.log('  ✅ Team member access policies configured');
    console.log('\n🔐 Security Features:');
    console.log('  • Files are private by default');
    console.log('  • Team members can access project files');
    console.log('  • Users can only upload to projects they belong to');
    console.log('  • File creators and project owners can manage files');
    console.log('  • Signed URLs provide secure temporary access');
    console.log('\n🚀 Ready to use! Your file storage is now secure and team-accessible.');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
setupSupabaseStorage(); 