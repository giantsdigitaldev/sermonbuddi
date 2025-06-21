import { useRouter } from 'expo-router';
import React, { ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { COLORS } from '../constants';
import { useAuth } from '../contexts/AuthContext';

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean; // true = require authentication, false = require no authentication
  redirectTo?: string;
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  redirectTo 
}: AuthGuardProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: COLORS.white 
      }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // If auth is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Redirect to login or specified route
    if (redirectTo) {
      router.replace(redirectTo as any);
    } else {
      router.replace('/login' as any);
    }
    return null;
  }

  // If no auth is required but user is authenticated (e.g., login/signup pages)
  if (!requireAuth && isAuthenticated) {
    // Redirect to main app or specified route
    if (redirectTo) {
      router.replace(redirectTo as any);
    } else {
      router.replace('/(tabs)' as any);
    }
    return null;
  }

  // User meets the authentication requirements
  return <>{children}</>;
}

// Convenience components
export function ProtectedRoute({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requireAuth={true} redirectTo="/login">
      {children}
    </AuthGuard>
  );
}

export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  return (
    <AuthGuard requireAuth={false} redirectTo="/(tabs)">
      {children}
    </AuthGuard>
  );
} 