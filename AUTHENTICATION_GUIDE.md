# cristOS Authentication System

This document describes the complete authentication system implemented in cristOS using Supabase.

## Overview

The authentication system provides:
- ✅ Email/Password signup and signin
- ✅ Email verification
- ✅ Password reset functionality
- ✅ Persistent sessions with AsyncStorage
- ✅ Protected routes with AuthGuard
- ✅ Real-time auth state management
- ✅ User profile management
- ✅ Secure sign out
- 🔄 Social authentication (planned)

## Architecture

### Core Components

1. **Supabase Client** (`utils/supabase.ts`)
   - Configured with AsyncStorage for session persistence
   - Auto-refresh tokens enabled
   - URL polyfill for React Native compatibility

2. **Authentication Service** (`utils/auth.ts`)
   - Centralized auth operations
   - Comprehensive error handling
   - TypeScript interfaces for type safety

3. **Auth Context** (`contexts/AuthContext.tsx`)
   - React context for global auth state
   - Real-time auth state updates
   - Loading states management

4. **Auth Guards** (`components/AuthGuard.tsx`)
   - Route protection components
   - Automatic redirects based on auth state
   - Loading indicators during auth checks

## File Structure

```
├── utils/
│   ├── supabase.ts          # Supabase client configuration
│   └── auth.ts              # Authentication service methods
├── contexts/
│   └── AuthContext.tsx      # React context for auth state
├── components/
│   └── AuthGuard.tsx        # Route protection components
├── app/
│   ├── login.tsx            # Login screen with Supabase integration
│   ├── signup.tsx           # Signup screen with Supabase integration
│   ├── forgotpasswordemail.tsx # Password reset screen
│   ├── _layout.tsx          # Root layout with AuthProvider
│   └── (tabs)/
│       ├── _layout.tsx      # Protected tabs layout
│       └── profile.tsx      # Profile with sign out functionality
└── SUPABASE_SETUP.md        # Database setup guide
```

## Authentication Flow

### 1. User Registration
```typescript
// User fills signup form
const result = await signUp(email, password, fullName);

if (result.success) {
  // Show email verification message
  // Redirect to login
} else {
  // Show error message
}
```

### 2. Email Verification
- User receives email from Supabase
- Clicks verification link
- Account becomes active

### 3. User Login
```typescript
// User fills login form
const result = await signIn(email, password);

if (result.success) {
  // AuthGuard automatically redirects to protected routes
} else {
  // Show error message
}
```

### 4. Session Management
- Sessions are automatically persisted in AsyncStorage
- Auth state is restored on app restart
- Tokens are auto-refreshed before expiration

### 5. Password Reset
```typescript
// User requests password reset
const result = await resetPassword(email);

if (result.success) {
  // Show "check email" message
} else {
  // Show error message
}
```

### 6. Sign Out
```typescript
// User clicks sign out
const result = await signOut();

if (result.success) {
  // AuthGuard automatically redirects to login
} else {
  // Show error message
}
```

## Route Protection

### Protected Routes
Routes that require authentication:
- `/(tabs)/*` - Main app tabs
- `/editprofile` - Profile editing
- `/settings*` - Settings screens

### Public Routes
Routes available without authentication:
- `/login` - Login screen
- `/signup` - Registration screen
- `/forgotpasswordemail` - Password reset
- `/welcome` - Welcome/onboarding

### Implementation
```typescript
// Protect entire tab navigation
<ProtectedRoute>
  <Tabs>
    {/* Tab screens */}
  </Tabs>
</ProtectedRoute>

// Prevent authenticated users from accessing auth screens
<PublicOnlyRoute>
  <LoginScreen />
</PublicOnlyRoute>
```

## User Profile Management

### Profile Data Structure
```typescript
interface ProfileData {
  id: string;              // UUID from auth.users
  updated_at: string;      // Timestamp
  username?: string;       // Unique username
  full_name?: string;      // Display name
  avatar_url?: string;     // Profile picture URL
  website?: string;        // Personal website
}
```

### Profile Operations
```typescript
// Get user profile
const profile = await AuthService.getProfile();

// Update profile
const result = await AuthService.updateProfile({
  full_name: "New Name",
  username: "newusername"
});
```

## Error Handling

### Common Error Scenarios
1. **Invalid credentials**
   - Clear error messages
   - Form validation feedback

2. **Network errors**
   - Retry mechanisms
   - Offline state handling

3. **Email verification required**
   - Clear instructions
   - Resend verification option

4. **Rate limiting**
   - Appropriate error messages
   - Retry after cooldown

### Error Response Format
```typescript
interface AuthResponse {
  success: boolean;
  data?: any;
  error?: string;
  user?: User | null;
  session?: Session | null;
}
```

## Security Features

### Row Level Security (RLS)
- Enabled on all user tables
- Users can only access their own data
- Public profiles viewable by everyone

### Data Validation
- Client-side form validation
- Server-side constraints
- Input sanitization

### Session Security
- Secure token storage
- Automatic token refresh
- Secure sign out (server-side)

## Testing the Authentication System

### Manual Testing Checklist

1. **Registration Flow**
   - [ ] Sign up with valid email/password
   - [ ] Receive verification email
   - [ ] Handle duplicate email error
   - [ ] Validate form inputs

2. **Login Flow**
   - [ ] Sign in with verified account
   - [ ] Handle invalid credentials
   - [ ] Handle unverified account
   - [ ] Remember me functionality

3. **Password Reset**
   - [ ] Request password reset
   - [ ] Receive reset email
   - [ ] Complete password reset
   - [ ] Sign in with new password

4. **Session Management**
   - [ ] Session persists after app restart
   - [ ] Auto-redirect when authenticated
   - [ ] Auto-redirect when not authenticated

5. **Sign Out**
   - [ ] Sign out clears session
   - [ ] Redirects to login screen
   - [ ] Cannot access protected routes

### Automated Testing
```typescript
// Example test structure
describe('Authentication', () => {
  test('should sign up new user', async () => {
    const result = await AuthService.signUp({
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User'
    });
    expect(result.success).toBe(true);
  });

  test('should sign in existing user', async () => {
    const result = await AuthService.signIn({
      email: 'test@example.com',
      password: 'password123'
    });
    expect(result.success).toBe(true);
  });
});
```

## Performance Considerations

### Optimizations Implemented
1. **Memoized Components**
   - Auth context values memoized
   - Screen components use React.memo
   - Callback functions memoized

2. **Efficient State Updates**
   - Minimal re-renders
   - Batched state updates
   - Optimistic UI updates

3. **Lazy Loading**
   - Auth screens loaded on demand
   - Profile data fetched when needed

### Bundle Size Impact
- Supabase client: ~50KB gzipped
- AsyncStorage: ~15KB gzipped
- Total auth system: ~65KB gzipped

## Future Enhancements

### Planned Features
1. **Social Authentication**
   - Google Sign-In
   - Apple Sign-In
   - Facebook Login

2. **Multi-Factor Authentication**
   - SMS verification
   - TOTP (Time-based OTP)
   - Biometric authentication

3. **Advanced Profile Features**
   - Avatar upload to Supabase Storage
   - Profile completion tracking
   - Social profile links

4. **Enhanced Security**
   - Device fingerprinting
   - Suspicious activity detection
   - Account lockout policies

### Implementation Roadmap
1. **Phase 1** (Current) - Basic email/password auth ✅
2. **Phase 2** - Social authentication
3. **Phase 3** - Multi-factor authentication
4. **Phase 4** - Advanced security features

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   ```bash
   # Restart Expo development server
   npm start --clear
   ```

2. **Session Not Persisting**
   - Check AsyncStorage permissions
   - Verify Supabase client configuration

3. **Email Verification Not Working**
   - Check Supabase email settings
   - Verify site URL configuration

4. **RLS Policies Blocking Access**
   - Review database policies
   - Check user authentication state

### Debug Tools
- Supabase dashboard logs
- React Native Debugger
- Network request inspection
- Console logging in auth service

## Support and Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Expo Authentication Guide](https://docs.expo.dev/guides/authentication/)
- [React Navigation Auth Flow](https://reactnavigation.org/docs/auth-flow/)
- [AsyncStorage Documentation](https://react-native-async-storage.github.io/async-storage/)

## Contributing

When contributing to the authentication system:

1. Follow TypeScript best practices
2. Add comprehensive error handling
3. Include unit tests for new features
4. Update documentation
5. Test on both iOS and Android
6. Verify web compatibility 