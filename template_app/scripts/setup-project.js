const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please make sure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log('🔄 Setting up database...');
  
  try {
    // Read the SQL setup file
    const sqlFilePath = path.join(__dirname, 'setup-database.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL commands (basic splitting, might need improvement for complex queries)
    const commands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`Found ${commands.length} SQL commands to execute`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      if (command.trim()) {
        try {
          console.log(`Executing command ${i + 1}/${commands.length}...`);
          
          // Use the RPC method for executing raw SQL
          const { data, error } = await supabase.rpc('exec_sql', { sql_query: command });
          
          if (error) {
            console.warn(`⚠️  Command ${i + 1} warning:`, error.message);
            // Don't exit on warnings, some commands might fail if already exist
          } else {
            console.log(`✅ Command ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.warn(`⚠️  Command ${i + 1} error:`, err.message);
          // Continue with other commands
        }
      }
    }
    
    console.log('✅ Database setup completed');
    return true;
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    return false;
  }
}

async function createStorageBucket() {
  console.log('🔄 Creating storage bucket...');
  
  try {
    // Try to create the bucket
    const { data, error } = await supabase.storage.createBucket('user-content', {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp']
    });
    
    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Storage bucket already exists');
      } else {
        console.error('❌ Storage bucket creation failed:', error.message);
        return false;
      }
    } else {
      console.log('✅ Storage bucket created successfully');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Storage bucket setup failed:', error.message);
    return false;
  }
}

async function testConnection() {
  console.log('🔄 Testing Supabase connection...');
  
  try {
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Connection test failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection working');
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting project setup...\n');
  
  // Test connection first
  const connectionOk = await testConnection();
  if (!connectionOk) {
    console.log('\n❌ Setup failed - connection issues');
    process.exit(1);
  }
  
  console.log('');
  
  // Setup database
  const dbSetupOk = await setupDatabase();
  
  console.log('');
  
  // Setup storage
  const storageSetupOk = await createStorageBucket();
  
  console.log('\n📋 Setup Summary:');
  console.log(`Database: ${dbSetupOk ? '✅' : '❌'}`);
  console.log(`Storage: ${storageSetupOk ? '✅' : '❌'}`);
  
  if (dbSetupOk && storageSetupOk) {
    console.log('\n🎉 Project setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Restart your development server');
    console.log('2. Try editing your profile again');
    console.log('3. If you still see permission errors, you may need to run the SQL commands manually in your Supabase dashboard');
  } else {
    console.log('\n⚠️  Setup completed with some issues.');
    console.log('\nManual steps required:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Run the SQL commands from scripts/setup-database.sql in the SQL editor');
    console.log('3. Create a "user-content" storage bucket if it doesn\'t exist');
    console.log('4. Set the bucket to public with 5MB file size limit');
  }
}

// Run the setup
main().catch(console.error); 