import { images } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileService } from '@/utils/profileService';
import { useCallback, useEffect, useState } from 'react';

export interface UserAvatarData {
  uri?: string;
  source: any; // For Image component source prop
  isLoading: boolean;
  error?: string;
  refresh: () => void; // Function to manually refresh the avatar
}

export const useUserAvatar = (): UserAvatarData => {
  const { user } = useAuth();
  const [avatarData, setAvatarData] = useState<{
    uri?: string;
    source: any;
    isLoading: boolean;
    error?: string;
  }>({
    source: images.user1, // Default fallback
    isLoading: true,
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    const loadUserAvatar = async () => {
      if (!user) {
        console.log('No user found, using fallback image');
        setAvatarData({
          source: images.user1,
          isLoading: false,
        });
        return;
      }

      try {
        setAvatarData(prev => ({ ...prev, isLoading: true }));

        console.log('Loading avatar for user:', user.id);

        // Try to get profile from database first
        const profileResponse = await ProfileService.getProfile(user.id);
        
        console.log('Profile response for avatar:', profileResponse);
        
        if (profileResponse.success && profileResponse.data?.avatar_url) {
          console.log('Using profile avatar_url:', profileResponse.data.avatar_url);
          
          // Verify the URL is accessible
          try {
            const testResponse = await fetch(profileResponse.data.avatar_url, { method: 'HEAD' });
            if (testResponse.ok) {
              setAvatarData({
                uri: profileResponse.data.avatar_url,
                source: { uri: profileResponse.data.avatar_url },
                isLoading: false,
              });
              return;
            } else {
              console.warn('Avatar URL not accessible:', profileResponse.data.avatar_url);
            }
          } catch (urlError) {
            console.warn('Error testing avatar URL:', urlError);
          }
        }

        // Fallback to user metadata avatar
        if (user.user_metadata?.avatar_url) {
          console.log('Using user metadata avatar_url:', user.user_metadata.avatar_url);
          setAvatarData({
            uri: user.user_metadata.avatar_url,
            source: { uri: user.user_metadata.avatar_url },
            isLoading: false,
          });
          return;
        }

        // Final fallback to static image
        console.log('Using fallback static image');
        setAvatarData({
          source: images.user1,
          isLoading: false,
        });

      } catch (error: any) {
        console.error('Error loading user avatar:', error);
        setAvatarData({
          source: images.user1,
          isLoading: false,
          error: error.message,
        });
      }
    };

    loadUserAvatar();
  }, [user, refreshTrigger]);

  return {
    ...avatarData,
    refresh,
  };
};

// Hook for getting any user's avatar by ID (for team members, etc.)
export const useUserAvatarById = (userId?: string): UserAvatarData => {
  const [avatarData, setAvatarData] = useState<{
    uri?: string;
    source: any;
    isLoading: boolean;
    error?: string;
  }>({
    source: images.user1, // Default fallback
    isLoading: true,
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  useEffect(() => {
    const loadUserAvatar = async () => {
      if (!userId) {
        setAvatarData({
          source: images.user1,
          isLoading: false,
        });
        return;
      }

      try {
        setAvatarData(prev => ({ ...prev, isLoading: true }));

        const profileResponse = await ProfileService.getProfile(userId);
        
        if (profileResponse.success && profileResponse.data?.avatar_url) {
          setAvatarData({
            uri: profileResponse.data.avatar_url,
            source: { uri: profileResponse.data.avatar_url },
            isLoading: false,
          });
        } else {
          setAvatarData({
            source: images.user1,
            isLoading: false,
          });
        }

      } catch (error: any) {
        console.error('Error loading user avatar by ID:', error);
        setAvatarData({
          source: images.user1,
          isLoading: false,
          error: error.message,
        });
      }
    };

    loadUserAvatar();
  }, [userId, refreshTrigger]);

  return {
    ...avatarData,
    refresh,
  };
}; 