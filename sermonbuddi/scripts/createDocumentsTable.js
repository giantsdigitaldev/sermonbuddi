const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // This should be in your .env file

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   EXPO_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'MISSING');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDocumentsTable() {
  console.log('🚀 Creating documents table...');

  try {
    // Create the documents table
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create documents table for storing processed documents
        CREATE TABLE IF NOT EXISTS documents (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          original_filename TEXT NOT NULL,
          file_path TEXT,
          mime_type TEXT,
          raw_text TEXT,
          markdown_content TEXT,
          ocr_confidence DECIMAL(5,2),
          metadata JSONB DEFAULT '{}',
          status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
          error_message TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create indexes for better performance
        CREATE INDEX IF NOT EXISTS documents_user_id_idx ON documents(user_id);
        CREATE INDEX IF NOT EXISTS documents_status_idx ON documents(status);
        CREATE INDEX IF NOT EXISTS documents_created_at_idx ON documents(created_at DESC);
        CREATE INDEX IF NOT EXISTS documents_metadata_type_idx ON documents USING gin((metadata->>'type'));
        
        -- Create full-text search index on text content
        CREATE INDEX IF NOT EXISTS documents_text_search_idx ON documents 
        USING gin(to_tsvector('english', COALESCE(raw_text, '') || ' ' || COALESCE(markdown_content, '') || ' ' || COALESCE(original_filename, '')));

        -- Create RLS policies
        ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

        -- Policy: Users can only see their own documents
        DROP POLICY IF EXISTS "Users can view own documents" ON documents;
        CREATE POLICY "Users can view own documents" ON documents
          FOR SELECT USING (auth.uid() = user_id);

        -- Policy: Users can insert their own documents
        DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
        CREATE POLICY "Users can insert own documents" ON documents
          FOR INSERT WITH CHECK (auth.uid() = user_id);

        -- Policy: Users can update their own documents
        DROP POLICY IF EXISTS "Users can update own documents" ON documents;
        CREATE POLICY "Users can update own documents" ON documents
          FOR UPDATE USING (auth.uid() = user_id);

        -- Policy: Users can delete their own documents
        DROP POLICY IF EXISTS "Users can delete own documents" ON documents;
        CREATE POLICY "Users can delete own documents" ON documents
          FOR DELETE USING (auth.uid() = user_id);

        -- Create updated_at trigger
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
        CREATE TRIGGER update_documents_updated_at
            BEFORE UPDATE ON documents
            FOR EACH ROW
            EXECUTE PROCEDURE update_updated_at_column();
      `
    });

    if (tableError) {
      throw tableError;
    }

    // Create storage bucket for documents
    console.log('📁 Creating documents storage bucket...');
    
    const { error: bucketError } = await supabase.storage.createBucket('documents', {
      public: false,
      allowedMimeTypes: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/bmp',
        'image/tiff',
        'text/plain',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      fileSizeLimit: 10485760, // 10MB
    });

    // Ignore error if bucket already exists
    if (bucketError && !bucketError.message.includes('already exists')) {
      console.warn('⚠️ Storage bucket creation warning:', bucketError.message);
    }

    // Create storage policies
    const { error: storagePolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Storage policies for documents bucket
        DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
        CREATE POLICY "Users can upload own documents" ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = 'documents' AND 
            auth.uid()::text = (storage.foldername(name))[1]
          );

        DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
        CREATE POLICY "Users can view own documents" ON storage.objects
          FOR SELECT USING (
            bucket_id = 'documents' AND 
            auth.uid()::text = (storage.foldername(name))[1]
          );

        DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
        CREATE POLICY "Users can update own documents" ON storage.objects
          FOR UPDATE USING (
            bucket_id = 'documents' AND 
            auth.uid()::text = (storage.foldername(name))[1]
          );

        DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
        CREATE POLICY "Users can delete own documents" ON storage.objects
          FOR DELETE USING (
            bucket_id = 'documents' AND 
            auth.uid()::text = (storage.foldername(name))[1]
          );
      `
    });

    if (storagePolicyError) {
      console.warn('⚠️ Storage policy warning:', storagePolicyError.message);
    }

    console.log('✅ Documents table and storage bucket created successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   - documents table created with RLS policies');
    console.log('   - Full-text search index created');
    console.log('   - Storage bucket "documents" created');
    console.log('   - Storage policies configured');
    console.log('');
    console.log('🎉 Document processing system is ready!');

  } catch (error) {
    console.error('❌ Error creating documents table:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  createDocumentsTable()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { createDocumentsTable }; 