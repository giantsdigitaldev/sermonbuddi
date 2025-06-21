const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase URL or Service Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createStorageBucket() {
  try {
    console.log('Creating user-content storage bucket...');
    
    // Try to create the bucket
    const { data, error } = await supabase.storage.createBucket('user-content', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpg', 'image/jpeg', 'image/gif', 'image/webp'],
      fileSizeLimit: 5242880, // 5MB
    });

    if (error) {
      if (error.message.includes('already exists')) {
        console.log('✅ Bucket already exists');
        return { success: true };
      } else {
        console.error('❌ Error creating bucket:', error.message);
        return { success: false, error: error.message };
      }
    }

    console.log('✅ Bucket created successfully:', data);
    return { success: true, data };

  } catch (error) {
    console.error('❌ Failed to create bucket:', error.message);
    return { success: false, error: error.message };
  }
}

async function testBucketAccess() {
  try {
    console.log('Testing bucket access...');
    
    // List buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      return false;
    }
    
    console.log('📦 Available buckets:', buckets.map(b => b.name));
    
    // Check if user-content bucket exists
    const userContentBucket = buckets.find(bucket => bucket.name === 'user-content');
    
    if (!userContentBucket) {
      console.log('❌ user-content bucket not found');
      return false;
    }
    
    // Try to list files in the bucket
    const { data: files, error: filesError } = await supabase.storage
      .from('user-content')
      .list('avatars', { limit: 1 });
      
    if (filesError && !filesError.message.includes('not found')) {
      console.error('❌ Error accessing bucket contents:', filesError.message);
      return false;
    }
    
    console.log('✅ Bucket access test successful');
    return true;
    
  } catch (error) {
    console.error('❌ Bucket access test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Setting up Supabase storage for profile images...\n');
  
  // Test current access
  const accessTest = await testBucketAccess();
  
  if (!accessTest) {
    console.log('\n📝 Creating bucket...');
    const createResult = await createStorageBucket();
    
    if (createResult.success) {
      console.log('✅ Storage setup complete!');
    } else {
      console.error('❌ Storage setup failed:', createResult.error);
      console.log('\n💡 Manual steps needed:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to Storage');
      console.log('3. Create a new bucket named "user-content"');
      console.log('4. Set it to public');
      console.log('5. Configure allowed file types: image/png, image/jpg, image/jpeg, image/gif, image/webp');
      console.log('6. Set file size limit to 5MB');
    }
  } else {
    console.log('✅ Storage is already configured correctly!');
  }
}

main().catch(console.error); 