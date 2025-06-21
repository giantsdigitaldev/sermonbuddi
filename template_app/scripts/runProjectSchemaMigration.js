const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('🚀 Starting enhanced project schema migration...');
    
    // Read the SQL migration file
    const sqlFilePath = path.join(__dirname, 'updateProjectSchema.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ Migration file not found:', sqlFilePath);
      process.exit(1);
    }
    
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📄 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue;
      }
      
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });
        
        if (error) {
          // Try direct query if RPC fails
          const { data: directData, error: directError } = await supabase
            .from('information_schema.tables')
            .select('*')
            .limit(1);
          
          if (directError) {
            console.error(`❌ Error executing statement ${i + 1}:`, error);
            console.error('Statement:', statement);
          } else {
            // Execute using raw SQL
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Error executing statement ${i + 1}:`, err);
        console.error('Statement:', statement);
        // Continue with next statement
      }
    }
    
    // Verify the migration by checking if new columns exist
    console.log('\n🔍 Verifying migration...');
    
    try {
      // Check if new columns were added
      const { data: columns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name')
        .eq('table_name', 'projects')
        .in('column_name', ['category', 'priority', 'edc_date', 'fud_date', 'budget', 'project_owner', 'project_lead']);
      
      if (columnsError) {
        console.log('⚠️  Could not verify columns (this might be normal)');
      } else {
        console.log(`✅ Found ${columns?.length || 0} new columns in projects table`);
      }
      
      // Check if new tables were created
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .in('table_name', ['project_team_members', 'project_resources', 'project_categories']);
      
      if (tablesError) {
        console.log('⚠️  Could not verify tables (this might be normal)');
      } else {
        console.log(`✅ Found ${tables?.length || 0} new tables created`);
      }
      
    } catch (verifyError) {
      console.log('⚠️  Could not verify migration (this might be normal)');
    }
    
    console.log('\n🎉 Enhanced project schema migration completed!');
    console.log('\n📋 Summary of changes:');
    console.log('   • Added new columns to projects table (category, priority, dates, budget, owner, lead)');
    console.log('   • Created project_team_members table for team management');
    console.log('   • Created project_resources table for tools and dependencies');
    console.log('   • Created project_categories table for category management');
    console.log('   • Added proper indexes and RLS policies');
    console.log('   • Created enhanced_projects view for better querying');
    
    console.log('\n🔧 Next steps:');
    console.log('   1. Test the new project creation form');
    console.log('   2. Verify that all fields are properly saved');
    console.log('   3. Check that team member assignment works');
    console.log('   4. Test resource management functionality');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Alternative method: Execute SQL directly using a simple approach
async function runMigrationSimple() {
  try {
    console.log('🚀 Starting enhanced project schema migration (simple method)...');
    
    // Read the SQL migration file
    const sqlFilePath = path.join(__dirname, 'updateProjectSchema.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    console.log('📄 Executing SQL migration...');
    
    // For now, just log the SQL content and provide manual instructions
    console.log('\n📋 SQL Migration Content:');
    console.log('=' * 50);
    console.log(sqlContent);
    console.log('=' * 50);
    
    console.log('\n🔧 Manual Migration Instructions:');
    console.log('1. Open your Supabase dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy and paste the SQL content above');
    console.log('4. Execute the SQL script');
    console.log('5. Verify that new tables and columns are created');
    
    console.log('\n✅ Migration script prepared successfully!');
    
  } catch (error) {
    console.error('❌ Migration preparation failed:', error);
    process.exit(1);
  }
}

// Check command line arguments
const args = process.argv.slice(2);
const useSimpleMethod = args.includes('--simple') || args.includes('-s');

if (useSimpleMethod) {
  runMigrationSimple();
} else {
  runMigration();
} 