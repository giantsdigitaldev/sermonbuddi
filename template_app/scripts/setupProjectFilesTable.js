/**
 * Simple Project Files Table Setup
 * Creates the project_files table and basic RLS policies using direct SQL
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupProjectFilesTable() {
  console.log('🔧 Setting up project_files table...');

  try {
    // Create project_files table
    const { error: tableError } = await supabase.rpc('exec_sql_raw', {
      sql: `
      -- Create project_files table
      CREATE TABLE IF NOT EXISTS project_files (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        file_name TEXT NOT NULL,
        file_size BIGINT NOT NULL,
        file_type TEXT NOT NULL,
        storage_path TEXT NOT NULL,
        uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
      CREATE INDEX IF NOT EXISTS idx_project_files_uploaded_by ON project_files(uploaded_by);
      CREATE INDEX IF NOT EXISTS idx_project_files_uploaded_at ON project_files(uploaded_at DESC);

      -- Enable RLS
      ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;

      -- Create RLS policies
      -- Policy 1: Users can view files for projects they are members of
      CREATE POLICY "Users can view project files for their projects" ON project_files
        FOR SELECT USING (
          project_id IN (
            SELECT p.id FROM projects p
            JOIN project_team_members ptm ON p.id = ptm.project_id
            WHERE ptm.user_id = auth.uid()
          )
        );

      -- Policy 2: Users can upload files to projects they are members of
      CREATE POLICY "Users can upload files to their projects" ON project_files
        FOR INSERT WITH CHECK (
          uploaded_by = auth.uid() AND
          project_id IN (
            SELECT p.id FROM projects p
            JOIN project_team_members ptm ON p.id = ptm.project_id
            WHERE ptm.user_id = auth.uid()
          )
        );

      -- Policy 3: Users can delete their own uploaded files or project owners can delete any files
      CREATE POLICY "Users can delete project files they uploaded or own project" ON project_files
        FOR DELETE USING (
          uploaded_by = auth.uid() OR
          project_id IN (
            SELECT p.id FROM projects p
            WHERE p.created_by = auth.uid()
          )
        );

      -- Policy 4: Users can update files they uploaded
      CREATE POLICY "Users can update files they uploaded" ON project_files
        FOR UPDATE USING (uploaded_by = auth.uid());
      `
    });

    if (tableError) {
      console.error('❌ Error creating project_files table:', tableError);
      return false;
    }

    console.log('✅ project_files table created successfully');

    // Test the table
    const { data: testData, error: testError } = await supabase
      .from('project_files')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ Error testing project_files table:', testError);
      return false;
    }

    console.log('✅ project_files table test successful');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Alternative approach using direct SQL execution
async function setupProjectFilesTableDirect() {
  console.log('🔧 Setting up project_files table (direct approach)...');

  const sqlCommands = [
    `CREATE TABLE IF NOT EXISTS project_files (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      file_name TEXT NOT NULL,
      file_size BIGINT NOT NULL,
      file_type TEXT NOT NULL,
      storage_path TEXT NOT NULL,
      uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
      uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,
    
    `CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);`,
    `CREATE INDEX IF NOT EXISTS idx_project_files_uploaded_by ON project_files(uploaded_by);`,
    `CREATE INDEX IF NOT EXISTS idx_project_files_uploaded_at ON project_files(uploaded_at DESC);`,
    
    `ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;`,
    
    `CREATE POLICY "Users can view project files for their projects" ON project_files
      FOR SELECT USING (
        project_id IN (
          SELECT p.id FROM projects p
          JOIN project_team_members ptm ON p.id = ptm.project_id
          WHERE ptm.user_id = auth.uid()
        )
      );`,
      
    `CREATE POLICY "Users can upload files to their projects" ON project_files
      FOR INSERT WITH CHECK (
        uploaded_by = auth.uid() AND
        project_id IN (
          SELECT p.id FROM projects p
          JOIN project_team_members ptm ON p.id = ptm.project_id
          WHERE ptm.user_id = auth.uid()
        )
      );`,
      
    `CREATE POLICY "Users can delete project files they uploaded or own project" ON project_files
      FOR DELETE USING (
        uploaded_by = auth.uid() OR
        project_id IN (
          SELECT p.id FROM projects p
          WHERE p.created_by = auth.uid()
        )
      );`,
      
    `CREATE POLICY "Users can update files they uploaded" ON project_files
      FOR UPDATE USING (uploaded_by = auth.uid());`
  ];

  try {
    for (const sql of sqlCommands) {
      console.log('🔄 Executing SQL:', sql.substring(0, 50) + '...');
      
      const { error } = await supabase.rpc('exec_sql', { sql });
      
      if (error) {
        console.error('❌ SQL Error:', error);
        // Continue with next command
      } else {
        console.log('✅ SQL executed successfully');
      }
    }

    // Test the table
    const { data: testData, error: testError } = await supabase
      .from('project_files')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ Error testing project_files table:', testError);
      return false;
    }

    console.log('✅ project_files table setup complete');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting project_files table setup...');
  
  // Try the RPC approach first
  let success = await setupProjectFilesTable();
  
  // If that fails, try the direct approach
  if (!success) {
    console.log('⚠️ RPC approach failed, trying direct SQL execution...');
    success = await setupProjectFilesTableDirect();
  }
  
  if (success) {
    console.log('🎉 Project files table setup completed successfully!');
  } else {
    console.log('❌ Failed to set up project files table');
    process.exit(1);
  }
}

main().catch(console.error); 