import { Session, User } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { supabase } from './supabase';

export interface AuthResponse {
  success: boolean;
  data?: any;
  error?: string;
  user?: User | null;
  session?: Session | null;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
  firstName?: string;
  lastName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface ProfileData {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  website?: string;
}

export class AuthService {
  // Check if Supabase is properly configured
  private static hasValidConfig(): boolean {
    return !!(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  }

  // Sign up with email and password
  static async signUp({ email, password, fullName, firstName, lastName }: SignUpData): Promise<AuthResponse> {
    if (!this.hasValidConfig()) {
      return {
        success: false,
        error: 'Supabase not properly configured. Please check your environment variables.',
      };
    }

    try {
      console.log('AuthService.signUp called with:', { email, password, fullName, firstName, lastName });
      
      // Determine the correct redirect URL based on platform
      const redirectUrl = Platform.OS === 'web' 
        ? `${window.location.origin}/welcome-confirmed`
        : 'sermonbuddi://welcome-confirmed';
      
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName || '',
            first_name: firstName || '',
            last_name: lastName || '',
          },
          emailRedirectTo: redirectUrl,
        },
      });

      console.log('Supabase signUp response:', { data, error });

      if (error) {
        console.error('Supabase signUp error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      // Check if user was created but needs email confirmation
      if (data.user && !data.session) {
        console.log('✅ User created successfully, email confirmation required');
        return {
          success: true,
          data,
          user: data.user,
          session: null, // No session until email is confirmed
        };
      }

      // Check if user was created and session is available (email confirmation not required)
      if (data.user && data.session) {
        console.log('✅ User created and signed in successfully');
        return {
          success: true,
          data,
          user: data.user,
          session: data.session,
        };
      }

      console.log('AuthService.signUp success:', data);
      return {
        success: true,
        data,
        user: data.user,
        session: data.session,
      };
    } catch (error: any) {
      console.error('AuthService.signUp exception:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  // Sign in with email and password
  static async signIn({ email, password }: SignInData): Promise<AuthResponse> {
    if (!this.hasValidConfig()) {
      return {
        success: false,
        error: 'Supabase not properly configured. Please check your environment variables.',
      };
    }

    try {
      console.log('AuthService.signIn called with:', { email, password });
      console.log('Supabase client:', supabase);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('Supabase signInWithPassword response:', { data, error });

      if (error) {
        console.log('Supabase auth error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('Supabase auth success:', data);
      return {
        success: true,
        data,
        user: data.user,
        session: data.session,
      };
    } catch (error: any) {
      console.log('AuthService.signIn exception:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  // Sign out
  static async signOut(): Promise<AuthResponse> {
    if (!this.hasValidConfig()) {
      return {
        success: false,
        error: 'Supabase not properly configured. Please check your environment variables.',
      };
    }

    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  // Get current session
  static async getSession(): Promise<Session | null> {
    if (!this.hasValidConfig()) {
      console.log('⚠️  AuthService: Supabase not configured, returning null session');
      return null;
    }

    try {
      console.log('🔍 AuthService: Getting current session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ AuthService: Error getting session:', error);
        return null;
      }
      
      if (session) {
        console.log('✅ AuthService: Session found:', session.user?.email);
        // Verify session is still valid
        if (session.expires_at && session.expires_at * 1000 < Date.now()) {
          console.log('⚠️ AuthService: Session expired, attempting refresh...');
          const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('❌ AuthService: Session refresh failed:', refreshError);
            return null;
          }
          console.log('✅ AuthService: Session refreshed successfully');
          return refreshData.session;
        }
        return session;
      } else {
        console.log('❌ AuthService: No session found');
        return null;
      }
    } catch (error) {
      console.error('❌ AuthService: Exception getting session:', error);
      return null;
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    if (!this.hasValidConfig()) {
      return null;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  // Reset password
  static async resetPassword(email: string): Promise<AuthResponse> {
    if (!this.hasValidConfig()) {
      return {
        success: false,
        error: 'Supabase not properly configured. Please check your environment variables.',
      };
    }

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'your-app://reset-password',
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  // Resend confirmation email
  static async resendConfirmationEmail(email: string): Promise<AuthResponse> {
    if (!this.hasValidConfig()) {
      return {
        success: false,
        error: 'Supabase not properly configured. Please check your environment variables.',
      };
    }

    try {
      console.log('AuthService.resendConfirmationEmail called with:', { email });
      
      // Determine the correct redirect URL based on platform
      const redirectUrl = Platform.OS === 'web' 
        ? `${window.location.origin}/welcome-confirmed`
        : 'sermonbuddi://welcome-confirmed';
      
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      console.log('Supabase resend response:', { data, error });

      if (error) {
        console.error('Supabase resend error:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      console.log('✅ Confirmation email resent successfully');
      return {
        success: true,
        data,
      };
    } catch (error: any) {
      console.error('AuthService.resendConfirmationEmail exception:', error);
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  // Update password
  static async updatePassword(newPassword: string): Promise<AuthResponse> {
    if (!this.hasValidConfig()) {
      return {
        success: false,
        error: 'Supabase not properly configured. Please check your environment variables.',
      };
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
        user: data.user,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  // Update user metadata
  static async updateUser(updateData: { data: any }): Promise<any> {
    if (!this.hasValidConfig()) {
      return { error: 'Supabase not properly configured. Please check your environment variables.' };
    }

    try {
      const { data, error } = await supabase.auth.updateUser(updateData);

      if (error) {
        return { error: error.message };
      }

      return { data, error: null };
    } catch (error: any) {
      return { error: error.message || 'An unexpected error occurred' };
    }
  }

  // Update user profile
  static async updateProfile(profileData: ProfileData): Promise<AuthResponse> {
    if (!this.hasValidConfig()) {
      return {
        success: false,
        error: 'Supabase not properly configured. Please check your environment variables.',
      };
    }

    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return {
          success: false,
          error: 'No authenticated user found',
        };
      }

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          updated_at: new Date().toISOString(),
          ...profileData,
        })
        .select();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  // Get user profile
  static async getProfile(userId?: string): Promise<AuthResponse> {
    if (!this.hasValidConfig()) {
      return {
        success: false,
        error: 'Supabase not properly configured. Please check your environment variables.',
      };
    }

    try {
      const user = userId || (await this.getCurrentUser())?.id;
      if (!user) {
        return {
          success: false,
          error: 'No user ID provided',
        };
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user)
        .single();

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    if (!this.hasValidConfig()) {
      console.log('⚠️  AuthService: Supabase not configured, auth state change listener disabled');
      // Return a dummy subscription that does nothing
      return {
        data: {
          subscription: {
            unsubscribe: () => {}
          }
        }
      };
    }
    return supabase.auth.onAuthStateChange(callback);
  }

  // Social auth handlers (for future implementation)
  static async signInWithApple(): Promise<AuthResponse> {
    if (!this.hasValidConfig()) {
      return {
        success: false,
        error: 'Supabase not properly configured. Please check your environment variables.',
      };
    }
    // TODO: Implement Apple Sign In
    return {
      success: false,
      error: 'Apple Sign In not yet implemented',
    };
  }

  static async signInWithGoogle(): Promise<AuthResponse> {
    if (!this.hasValidConfig()) {
      return {
        success: false,
        error: 'Supabase not properly configured. Please check your environment variables.',
      };
    }
    // TODO: Implement Google Sign In
    return {
      success: false,
      error: 'Google Sign In not yet implemented',
    };
  }

  static async signInWithFacebook(): Promise<AuthResponse> {
    if (!this.hasValidConfig()) {
      return {
        success: false,
        error: 'Supabase not properly configured. Please check your environment variables.',
      };
    }
    // TODO: Implement Facebook Sign In
    return {
      success: false,
      error: 'Facebook Sign In not yet implemented',
    };
  }
} 