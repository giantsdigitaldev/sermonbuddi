import { Session, User } from '@supabase/supabase-js';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
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
  hasValidConfig: boolean;
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
  const sessionInitializedRef = useRef(false);

  // Check if Supabase is properly configured
  const hasValidConfig = !!(process.env.EXPO_PUBLIC_SUPABASE_URL && process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

  const refreshAvatar = useCallback(() => {
    setAvatarRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    let mounted = true;
    
    // If Supabase is not properly configured, skip auth initialization
    if (!hasValidConfig) {
      console.log('⚠️  AuthContext: Supabase not properly configured, skipping auth initialization');
      setLoading(false);
      return;
    }
    
    // Get initial session with retry logic
    const getInitialSession = async () => {
      try {
        console.log('🔍 AuthContext: Getting initial session...');
        const session = await AuthService.getSession();
        
        if (mounted) {
          if (session) {
            console.log('✅ AuthContext: Initial session found:', session.user?.email);
            setSession(session);
            setUser(session.user);
          } else {
            console.log('❌ AuthContext: No initial session found');
            setSession(null);
            setUser(null);
          }
          sessionInitializedRef.current = true;
          setLoading(false);
        }
      } catch (error) {
        console.error('❌ AuthContext: Error getting initial session:', error);
        if (mounted) {
          setSession(null);
          setUser(null);
          sessionInitializedRef.current = true;
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes with improved handling
    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 AuthContext: Auth state changed:', event, session ? `User: ${session.user?.email}` : 'No user');
        
        if (!mounted) return;
        
        // Handle different auth events
        switch (event) {
          case 'INITIAL_SESSION':
            // Only update if we haven't initialized yet
            if (!sessionInitializedRef.current) {
              setSession(session);
              setUser(session?.user ?? null);
              sessionInitializedRef.current = true;
              setLoading(false);
            }
            break;
            
          case 'SIGNED_IN':
            console.log('✅ AuthContext: User signed in');
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
            break;
            
          case 'SIGNED_OUT':
            console.log('👋 AuthContext: User signed out');
            setSession(null);
            setUser(null);
            setLoading(false);
            break;
            
          case 'TOKEN_REFRESHED':
            console.log('🔄 AuthContext: Token refreshed');
            setSession(session);
            setUser(session?.user ?? null);
            break;
            
          default:
            // For any other events, update the session
            setSession(session);
            setUser(session?.user ?? null);
            if (sessionInitializedRef.current) {
              setLoading(false);
            }
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [hasValidConfig]);

  const signUp = async (email: string, password: string, fullName?: string, firstName?: string, lastName?: string) => {
    if (!hasValidConfig) {
      return { success: false, error: 'Supabase not properly configured. Please check your environment variables.' };
    }
    
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
    if (!hasValidConfig) {
      return { success: false, error: 'Supabase not properly configured. Please check your environment variables.' };
    }
    
    try {
      console.log('🔐 AuthContext signIn called with:', { email });
      setLoading(true);
      const result = await AuthService.signIn({ email, password });
      console.log('🔐 AuthService.signIn result:', result.success ? 'Success' : `Failed: ${result.error}`);
      
      if (result.success && result.session) {
        // Immediately update context state
        setSession(result.session);
        setUser(result.session.user);
        console.log('✅ AuthContext: Session updated immediately after sign in');
        return { success: true };
      } else {
        console.log('❌ AuthContext: Sign in failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error: any) {
      console.log('❌ AuthContext: Sign in exception:', error);
      return { success: false, error: error.message || 'Sign in failed' };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (!hasValidConfig) {
      return { success: false, error: 'Supabase not properly configured. Please check your environment variables.' };
    }
    
    try {
      setLoading(true);
      const result = await AuthService.signOut();
      
      if (result.success) {
        // Clear state immediately
        setUser(null);
        setSession(null);
        console.log('✅ AuthContext: State cleared after sign out');
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
    if (!hasValidConfig) {
      return { success: false, error: 'Supabase not properly configured. Please check your environment variables.' };
    }
    
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
    if (!hasValidConfig) {
      return { success: false, error: 'Supabase not properly configured. Please check your environment variables.' };
    }
    
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
    if (!hasValidConfig) {
      return;
    }
    
    try {
      console.log('🔄 AuthContext: Refreshing user session...');
      const session = await AuthService.getSession();
      if (session) {
        setSession(session);
        setUser(session.user);
        console.log('✅ AuthContext: User session refreshed');
      } else {
        console.log('❌ AuthContext: No session found during refresh');
        setSession(null);
        setUser(null);
      }
    } catch (error) {
      console.error('❌ AuthContext: Error refreshing user:', error);
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
    isAuthenticated: !!user && !!session,
    refreshUser,
    refreshAvatar,
    hasValidConfig,
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
      hasValidConfig: false,
    };
  }
  return context;
} 