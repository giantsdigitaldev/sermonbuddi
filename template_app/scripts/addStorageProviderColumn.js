/**
 * Database Migration: Add storage_provider column to project_files table
 * This script adds the hybrid storage support to the existing project_files table
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addStorageProviderColumn() {
  try {
    console.log('🔧 Adding storage_provider column to project_files table...');

    // Add storage_provider column
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE project_files 
        ADD COLUMN IF NOT EXISTS storage_provider TEXT DEFAULT 'supabase' CHECK (storage_provider IN ('supabase', 'vps'));
      `
    });

    if (alterError) {
      console.error('❌ Error adding storage_provider column:', alterError);
      throw alterError;
    }

    console.log('✅ storage_provider column added successfully');

    // Add download_url column for VPS files
    const { error: downloadUrlError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE project_files 
        ADD COLUMN IF NOT EXISTS download_url TEXT;
      `
    });

    if (downloadUrlError) {
      console.error('❌ Error adding download_url column:', downloadUrlError);
      throw downloadUrlError;
    }

    console.log('✅ download_url column added successfully');

    // Update existing records to have 'supabase' as storage provider
    const { error: updateError } = await supabase
      .from('project_files')
      .update({ storage_provider: 'supabase' })
      .is('storage_provider', null);

    if (updateError) {
      console.error('❌ Error updating existing records:', updateError);
      throw updateError;
    }

    console.log('✅ Existing records updated with default storage provider');

    // Create index for better query performance
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_project_files_storage_provider 
        ON project_files(storage_provider);
      `
    });

    if (indexError) {
      console.error('❌ Error creating index:', indexError);
      throw indexError;
    }

    console.log('✅ Index created for storage_provider column');

    // Verify the changes
    const { data: tableInfo, error: verifyError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'project_files' 
        AND column_name IN ('storage_provider', 'download_url')
        ORDER BY column_name;
      `
    });

    if (verifyError) {
      console.error('❌ Error verifying changes:', verifyError);
      throw verifyError;
    }

    console.log('📊 Column verification:');
    console.table(tableInfo);

    console.log('🎉 Database migration completed successfully!');
    console.log('');
    console.log('📝 Summary of changes:');
    console.log('  - Added storage_provider column (supabase|vps)');
    console.log('  - Added download_url column for VPS files');
    console.log('  - Updated existing records to use "supabase" provider');
    console.log('  - Created performance index');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
addStorageProviderColumn(); 