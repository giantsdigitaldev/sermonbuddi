import { Session, User } from '@supabase/supabase-js';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { AuthService } from '../utils/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string, firstName?: string, lastName?: string) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: boolean;
  refreshUser: () => Promise<void>;
  refreshAvatar: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarRefreshTrigger, setAvatarRefreshTrigger] = useState(0);

  const refreshAvatar = useCallback(() => {
    setAvatarRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const session = await AuthService.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string, firstName?: string, lastName?: string) => {
    try {
      setLoading(true);
      const result = await AuthService.signUp({ email, password, fullName, firstName, lastName });
      
      if (result.success) {
        // Note: User might need to verify email before they can sign in
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Sign up failed' };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthContext signIn called with:', { email, password });
      setLoading(true);
      const result = await AuthService.signIn({ email, password });
      console.log('AuthService.signIn result:', result);
      
      if (result.success) {
        console.log('Sign in successful, user:', result.user);
        return { success: true };
      } else {
        console.log('Sign in failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.log('Sign in exception:', error);
      return { success: false, error: error.message || 'Sign in failed' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const result = await AuthService.signOut();
      
      if (result.success) {
        // Clear state immediately
        setUser(null);
        setSession(null);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Sign out failed' };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const result = await AuthService.resetPassword(email);
      
      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Password reset failed' };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const result = await AuthService.updatePassword(newPassword);
      
      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      return { success: false, error: error.message || 'Password update failed' };
    }
  };

  const refreshUser = async () => {
    try {
      const session = await AuthService.getSession();
      setSession(session);
      setUser(session?.user ?? null);
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    isAuthenticated: !!user,
    refreshUser,
    refreshAvatar,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    console.error('useAuth hook called outside of AuthProvider context');
    console.error('Make sure the component calling useAuth is wrapped with AuthProvider');
    
    // Return a default state instead of throwing to prevent app crashes
    return {
      user: null,
      session: null,
      loading: true,
      signUp: async () => ({ success: false, error: 'Auth not initialized' }),
      signIn: async () => ({ success: false, error: 'Auth not initialized' }),
      signOut: async () => ({ success: false, error: 'Auth not initialized' }),
      resetPassword: async () => ({ success: false, error: 'Auth not initialized' }),
      updatePassword: async () => ({ success: false, error: 'Auth not initialized' }),
      isAuthenticated: false,
      refreshUser: async () => {},
      refreshAvatar: () => {},
    };
  }
  return context;
} 