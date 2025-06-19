# 🔧 Fix Profile Image Upload - Storage Bucket Setup

## ⚠️ Issue
Your app shows this error when trying to upload profile images:
```
hook.js:608 user-content bucket not found. Available buckets: []
hook.js:608 Image upload failed: Storage bucket "user-content" not found. Please run the database setup script to create the bucket.
```

## 🚀 Quick Fix - Manual Setup in Supabase Dashboard

### Step 1: Access Your Supabase Dashboard
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your CristOS project

### Step 2: Create the Storage Bucket
1. **Navigate to Storage**: Click on "Storage" in the left sidebar
2. **Create New Bucket**: Click the "New Bucket" button
3. **Configure the Bucket**:
   - **Name**: `user-content`
   - **Public bucket**: ✅ **ENABLED** (This is important!)
   - **File size limit**: `5 MB`
   - **Allowed MIME types**: 
     - `image/png`
     - `image/jpg` 
     - `image/jpeg`
     - `image/gif`
     - `image/webp`

### Step 3: Set Up Storage Policies
1. **Go to SQL Editor**: Click on "SQL Editor" in the left sidebar
2. **Create New Query**: Click "New Query"
3. **Copy and paste this SQL code**:

```sql
-- Create storage policies for profile images
DROP POLICY IF EXISTS "Give users access to own folder" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder insert" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder update" ON storage.objects;
DROP POLICY IF EXISTS "Give users access to own folder delete" ON storage.objects;
DROP POLICY IF EXISTS "Give public access to avatars" ON storage.objects;

-- Policy: Users can view their own files
CREATE POLICY "Give users access to own folder" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-content' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can upload to their own folder
CREATE POLICY "Give users access to own folder insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'user-content' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can update their own files
CREATE POLICY "Give users access to own folder update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'user-content' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Users can delete their own files
CREATE POLICY "Give users access to own folder delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'user-content' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Policy: Public access to avatar images (for profile pictures)
CREATE POLICY "Give public access to avatars" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'user-content' 
    AND (storage.foldername(name))[2] = 'avatars'
  );

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
```

4. **Run the Query**: Click the "Run" button

### Step 4: Verify Setup
1. **Go back to Storage**: Navigate to Storage in the sidebar
2. **Check Bucket**: You should see the "user-content" bucket listed
3. **Test Upload**: Try uploading a profile image in your app

## ✅ Expected Result
After completing these steps:
- The "user-content" bucket will be visible in your Storage tab
- Users can upload profile images without errors
- Images will be stored in the path: `user-content/{user_id}/avatars/avatar_timestamp.jpg`

## 🔧 Folder Structure
Your storage will be organized as:
```
user-content/
├── {user_id_1}/
│   └── avatars/
│       └── avatar_1234567890.jpg
├── {user_id_2}/
│   └── avatars/
│       └── avatar_1234567891.png
└── ...
```

## 📞 Support
If you encounter any issues:
1. Check that the bucket is set to **Public**
2. Verify all SQL policies were created successfully
3. Ensure the bucket name is exactly `user-content` (case-sensitive)

## 🎉 Success!
Once complete, profile image uploads should work perfectly in your CristOS app! 