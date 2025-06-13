import { Session, User } from '@supabase/supabase-js';
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
  // Sign up with email and password
  static async signUp({ email, password, fullName }: SignUpData): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || '',
          },
        },
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
        session: data.session,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'An unexpected error occurred',
      };
    }
  }

  // Sign in with email and password
  static async signIn({ email, password }: SignInData): Promise<AuthResponse> {
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
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<User | null> {
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

  // Update password
  static async updatePassword(newPassword: string): Promise<AuthResponse> {
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
    return supabase.auth.onAuthStateChange(callback);
  }

  // Social auth handlers (for future implementation)
  static async signInWithApple(): Promise<AuthResponse> {
    // TODO: Implement Apple Sign In
    return {
      success: false,
      error: 'Apple Sign In not yet implemented',
    };
  }

  static async signInWithGoogle(): Promise<AuthResponse> {
    // TODO: Implement Google Sign In
    return {
      success: false,
      error: 'Google Sign In not yet implemented',
    };
  }

  static async signInWithFacebook(): Promise<AuthResponse> {
    // TODO: Implement Facebook Sign In
    return {
      success: false,
      error: 'Facebook Sign In not yet implemented',
    };
  }
} 