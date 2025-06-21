# Database and Storage Setup

This directory contains scripts to set up your Supabase database and storage for the profile functionality.

## Issues Fixed

The profile edit functionality requires:
1. **Database RLS Policies** - So users can access their own profiles
2. **Storage Bucket** - For uploading profile images
3. **Proper Schema** - For storing profile data

## Quick Setup

### Option 1: Automated Setup (Recommended)

```bash
# Install dependencies (if not already installed)
npm install @supabase/supabase-js dotenv

# Run the setup script
node scripts/setup-project.js
```

### Option 2: Manual Setup

If the automated setup doesn't work, follow these manual steps:

#### 1. Database Setup

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `scripts/setup-database.sql`
4. Run the SQL commands

#### 2. Storage Setup

1. In your Supabase Dashboard, go to **Storage**
2. Create a new bucket called `user-content`
3. Set it as **Public**
4. Set file size limit to **5MB**
5. Allow MIME types: `image/png`, `image/jpg`, `image/jpeg`, `image/gif`, `image/webp`

## Files

- `setup-database.sql` - SQL commands to create profiles table and RLS policies
- `setup-project.js` - Automated setup script
- `createStorageBucket.js` - Storage bucket creation script (legacy)

## Troubleshooting

### Permission Denied Errors

If you see `403 Forbidden` or `permission denied` errors:

1. Make sure RLS policies are created (run the SQL setup)
2. Check that your user is authenticated
3. Verify the policies allow the current user to access their own data

### Storage Bucket Not Found

If you see `Bucket not found` errors:

1. Create the `user-content` bucket manually in Supabase dashboard
2. Set it as public
3. Configure the allowed file types and size limits

### Database Schema Issues

If you see column not found errors:

1. Run the database setup SQL to create the proper schema
2. Check that the `profiles` table exists with the correct columns
3. Verify the trigger for automatic profile creation is set up

## Testing

After setup, you can test by:

1. Logging into your app
2. Going to Edit Profile
3. Trying to upload a profile image
4. Saving profile changes

The errors should be resolved and profile functionality should work properly.

## What the Setup Does

### Database Schema
- Creates `profiles` table with proper columns
- Sets up Row Level Security (RLS) policies
- Creates trigger for automatic profile creation
- Grants necessary permissions

### Storage
- Creates `user-content` bucket for file uploads
- Sets public access for avatar images
- Configures file size and type restrictions
- Sets up storage policies for user access

### Result
- Users can view/edit their own profiles
- Profile images upload and persist properly
- Database permissions work correctly
- No more 403/404 errors 