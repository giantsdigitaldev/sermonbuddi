# Supabase Authentication Setup Guide

This guide will help you set up Supabase authentication for the cristOS app.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Click "New Project"
3. Choose your organization and enter project details:
   - Name: `cristos-app` (or your preferred name)
   - Database Password: Generate a strong password
   - Region: Choose the closest to your users
4. Wait for the project to be created (2-3 minutes)

## 2. Get Your Project Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## 3. Configure Environment Variables

Create a `.env` file in your project root with the following content:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important:** Replace the placeholder values with your actual Supabase project URL and anon key.

## 4. Set Up Database Schema

Run the following SQL in your Supabase SQL Editor (**SQL Editor** → **New Query**):

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  username TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  website TEXT,
  
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile." ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at column
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

## 5. Configure Authentication Settings

1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Configure the following settings:

### Site URL
- Set your site URL to: `exp://localhost:8081` (for development)
- For production, add your actual app URL

### Email Templates (Optional)
You can customize the email templates for:
- Confirm signup
- Reset password
- Magic link

### Auth Providers (Optional)
Enable social authentication providers if needed:
- Google
- Apple
- Facebook
- GitHub

## 6. Test the Setup

1. Start your Expo development server:
   ```bash
   npm start
   ```

2. Test the authentication flow:
   - Sign up with a new email
   - Check your email for verification
   - Sign in with your credentials
   - Test password reset functionality
   - Test sign out

## 7. Production Configuration

For production deployment:

1. **Update Environment Variables:**
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
   ```

2. **Update Site URL:**
   - Add your production app URL to Supabase Auth settings
   - Update redirect URLs for password reset

3. **Configure Email Settings:**
   - Set up custom SMTP in Supabase (optional)
   - Customize email templates with your branding

## 8. Security Best Practices

1. **Row Level Security (RLS):**
   - Always enable RLS on your tables
   - Create appropriate policies for data access

2. **Environment Variables:**
   - Never commit `.env` files to version control
   - Use different keys for development and production

3. **User Data:**
   - Validate all user inputs
   - Sanitize data before storing
   - Implement proper error handling

## 9. Troubleshooting

### Common Issues:

1. **"Invalid API key" error:**
   - Check that your environment variables are correctly set
   - Ensure you're using the anon key, not the service role key

2. **Email verification not working:**
   - Check your Supabase email settings
   - Verify your site URL is correctly configured

3. **RLS policies blocking access:**
   - Review your RLS policies
   - Check that users are properly authenticated

4. **Profile creation failing:**
   - Ensure the trigger function is created
   - Check the profiles table structure

### Debug Steps:

1. Check Supabase logs in the dashboard
2. Use browser developer tools to inspect network requests
3. Add console.log statements to debug authentication flow
4. Test with different email addresses

## 10. Additional Features

You can extend the authentication system with:

- **Social Authentication:** Google, Apple, Facebook sign-in
- **Multi-factor Authentication:** SMS or TOTP
- **Custom Claims:** Role-based access control
- **Webhooks:** Custom logic on auth events
- **Analytics:** Track user authentication metrics

## Support

If you encounter issues:
1. Check the [Supabase documentation](https://supabase.com/docs)
2. Visit the [Supabase community](https://github.com/supabase/supabase/discussions)
3. Review the authentication logs in your Supabase dashboard 