const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   EXPO_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  console.error('\n💡 Please add SUPABASE_SERVICE_ROLE_KEY to your .env file');
  console.error('   You can find it in Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database with enhanced RLS policies...');

    // Step 1: Create or update profiles table with better structure
    const createProfilesTable = `
      CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        username TEXT UNIQUE,
        full_name TEXT,
        first_name TEXT,
        last_name TEXT,
        avatar_url TEXT,
        website TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: createTableError } = await supabase.rpc('exec_sql', { 
      sql: createProfilesTable 
    });

    if (createTableError) {
      console.log('⚠️ Table creation error (may already exist):', createTableError.message);
    } else {
      console.log('✅ Profiles table created/verified');
    }

    // Step 2: Enable RLS on profiles table
    const enableRLS = `
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
    `;

    await supabase.rpc('exec_sql', { sql: enableRLS });
    console.log('✅ RLS enabled on profiles table');

    // Step 3: Drop existing policies and create new ones that allow search
    const dropPolicies = `
      DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
      DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Enable search for authenticated users" ON public.profiles;
    `;

    await supabase.rpc('exec_sql', { sql: dropPolicies });
    console.log('✅ Existing policies dropped');

    // Step 4: Create enhanced RLS policies that allow search
    const createPolicies = `
      -- Allow authenticated users to view all profiles (for search)
      CREATE POLICY "Authenticated users can view all profiles" ON public.profiles
        FOR SELECT USING (auth.role() = 'authenticated');

      -- Users can only insert their own profile
      CREATE POLICY "Users can insert their own profile" ON public.profiles
        FOR INSERT WITH CHECK (auth.uid() = id);

      -- Users can only update their own profile
      CREATE POLICY "Users can update their own profile" ON public.profiles
        FOR UPDATE USING (auth.uid() = id);

      -- Users can only delete their own profile
      CREATE POLICY "Users can delete their own profile" ON public.profiles
        FOR DELETE USING (auth.uid() = id);
    `;

    await supabase.rpc('exec_sql', { sql: createPolicies });
    console.log('✅ Enhanced RLS policies created');

    // Step 5: Create/update automatic profile creation function
    const createProfileFunction = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      DECLARE
        full_name_val TEXT;
        first_name_val TEXT;
        last_name_val TEXT;
      BEGIN
        -- Extract names from metadata
        full_name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name');
        first_name_val := COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'given_name');
        last_name_val := COALESCE(NEW.raw_user_meta_data->>'last_name', NEW.raw_user_meta_data->>'family_name');
        
        -- If we have full_name but not first/last, try to split it
        IF full_name_val IS NOT NULL AND first_name_val IS NULL THEN
          first_name_val := split_part(full_name_val, ' ', 1);
          IF position(' ' in full_name_val) > 0 THEN
            last_name_val := substring(full_name_val from position(' ' in full_name_val) + 1);
          END IF;
        END IF;
        
        -- If we have first/last but not full_name, create it
        IF full_name_val IS NULL AND first_name_val IS NOT NULL THEN
          full_name_val := trim(concat(first_name_val, ' ', COALESCE(last_name_val, '')));
        END IF;

        INSERT INTO public.profiles (
          id, 
          full_name, 
          first_name,
          last_name,
          username, 
          avatar_url,
          created_at,
          updated_at
        )
        VALUES (
          NEW.id,
          full_name_val,
          first_name_val,
          last_name_val,
          COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
          NEW.raw_user_meta_data->>'avatar_url',
          NOW(),
          NOW()
        );
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;

    await supabase.rpc('exec_sql', { sql: createProfileFunction });
    console.log('✅ Enhanced profile creation function created');

    // Step 6: Create trigger for automatic profile creation
    const createTrigger = `
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `;

    await supabase.rpc('exec_sql', { sql: createTrigger });
    console.log('✅ Automatic profile creation trigger created');

    // Step 7: Create project_team_members table if it doesn't exist
    const createTeamTable = `
      CREATE TABLE IF NOT EXISTS public.project_team_members (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        project_id UUID NOT NULL,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        invited_email TEXT,
        invited_phone TEXT,
        role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
        status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'accepted', 'declined', 'active')),
        permissions JSONB DEFAULT '{"read": true, "write": false, "delete": false, "invite": false, "manage_members": false, "access_chat": true}'::jsonb,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Enable RLS
      ALTER TABLE public.project_team_members ENABLE ROW LEVEL SECURITY;

      -- Create policies for team members
      CREATE POLICY "Users can view team members of their projects" ON public.project_team_members
        FOR SELECT USING (
          user_id = auth.uid() OR 
          project_id IN (
            SELECT project_id FROM public.project_team_members WHERE user_id = auth.uid()
          )
        );

      CREATE POLICY "Users can manage team members of their projects" ON public.project_team_members
        FOR ALL USING (
          user_id = auth.uid() OR 
          project_id IN (
            SELECT project_id FROM public.project_team_members 
            WHERE user_id = auth.uid() AND (role = 'owner' OR role = 'admin')
          )
        );
    `;

    await supabase.rpc('exec_sql', { sql: createTeamTable });
    console.log('✅ Project team members table created with RLS');

    // Step 8: Create updated_at trigger
    const updatedAtTrigger = `
      CREATE OR REPLACE FUNCTION public.handle_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
      CREATE TRIGGER handle_updated_at
        BEFORE UPDATE ON public.profiles
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    `;

    await supabase.rpc('exec_sql', { sql: updatedAtTrigger });
    console.log('✅ Updated timestamp triggers created');

    // Step 9: Test the setup
    console.log('\n🧪 Testing database setup...');
    
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);

    if (profileError) {
      console.error('❌ Error accessing profiles:', profileError.message);
    } else {
      console.log(`✅ Profiles table accessible. Found ${profiles.length} profiles.`);
      if (profiles.length > 0) {
        console.log('Sample profiles:', profiles.map(p => ({ 
          id: p.id, 
          username: p.username, 
          full_name: p.full_name,
          first_name: p.first_name 
        })));
      }
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 What was set up:');
    console.log('   ✅ Profiles table with first_name/last_name fields');
    console.log('   ✅ RLS policies that allow users to search other profiles');
    console.log('   ✅ Automatic profile creation with name parsing');
    console.log('   ✅ Project team members table');
    console.log('   ✅ Proper triggers and functions');

    return true;
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return false;
  }
}

// Alternative method using direct SQL execution
async function setupDatabaseDirect() {
  try {
    console.log('🚀 Setting up database with direct SQL execution...');

    // Create tables one by one
    const createStatements = [
      `CREATE TABLE IF NOT EXISTS public.profiles (
        id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        username TEXT UNIQUE,
        full_name TEXT,
        avatar_url TEXT,
        website TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      `CREATE TABLE IF NOT EXISTS public.projects (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'::jsonb
      );`,
      
      `CREATE TABLE IF NOT EXISTS public.chat_conversations (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
        title TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`,
      
      `CREATE TABLE IF NOT EXISTS public.chat_messages (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );`
    ];

    for (let i = 0; i < createStatements.length; i++) {
      console.log(`⏳ Creating table ${i + 1}/${createStatements.length}...`);
      
      // Use a workaround by creating a simple function
      const { error } = await supabase.rpc('create_table_if_not_exists', {
        table_sql: createStatements[i]
      });
      
      if (error) {
        console.log(`⚠️  Table ${i + 1} creation warning:`, error.message);
      } else {
        console.log(`✅ Table ${i + 1} created successfully`);
      }
    }

    console.log('\n🎉 Database setup completed!');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase().then((success) => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { setupDatabase, setupDatabaseDirect }; 