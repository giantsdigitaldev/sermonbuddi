import { decode } from 'base64-arraybuffer';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import { supabase } from './supabase';

// Platform-specific file system imports
let FileSystem: any;
if (Platform.OS !== 'web') {
  FileSystem = require('expo-file-system');
}

export interface ProfileData {
  id?: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  website?: string;
  created_at?: string;
  updated_at?: string;
  // Extended fields stored in metadata for web compatibility
  phone_number?: string;
  date_of_birth?: string;
  gender?: string;
  occupation?: string;
  bio?: string;
  location?: string;
}

export interface ProfileResponse {
  success: boolean;
  data?: ProfileData;
  error?: string;
}

export class ProfileService {
  // Web-compatible file to base64 conversion
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get just the base64 data
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  // Upload image to Supabase Storage (Web and Mobile compatible)
  static async uploadProfileImage(imageUri: string, userId: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      console.log('Starting image upload for user:', userId, 'Platform:', Platform.OS);
      
      let arrayBuffer: ArrayBuffer;
      let fileExt = 'jpg';

      if (Platform.OS === 'web') {
        // Web handling
        try {
          // For web, imageUri might be a blob URL or data URL
          if (imageUri.startsWith('data:')) {
            // Data URL
            const base64Data = imageUri.split(',')[1];
            arrayBuffer = decode(base64Data);
            const mimeType = imageUri.split(';')[0].split(':')[1];
            fileExt = mimeType.split('/')[1] || 'jpg';
          } else {
            // Blob URL - fetch and convert
            const response = await fetch(imageUri);
            arrayBuffer = await response.arrayBuffer();
            fileExt = 'jpg'; // Default for blob URLs
          }
        } catch (error) {
          console.error('Web file processing error:', error);
          return { success: false, error: 'Failed to process image on web' };
        }
      } else {
        // Mobile handling with expo-file-system
        if (!FileSystem) {
          return { success: false, error: 'FileSystem not available' };
        }

        const fileInfo = await FileSystem.getInfoAsync(imageUri);
        if (!fileInfo.exists) {
          return { success: false, error: 'File does not exist' };
        }

        // Read file as base64
        const base64 = await FileSystem.readAsStringAsync(imageUri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Convert base64 to ArrayBuffer
        arrayBuffer = decode(base64);
        fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
      }

      // Generate unique filename
      const fileName = `profile-${userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      console.log('Uploading file:', filePath);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('user-content')
        .upload(filePath, arrayBuffer, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (error) {
        console.error('Storage upload error:', error);
        return { success: false, error: error.message };
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('user-content')
        .getPublicUrl(filePath);

      console.log('Image uploaded successfully:', publicUrlData.publicUrl);
      
      return { 
        success: true, 
        url: publicUrlData.publicUrl 
      };
    } catch (error: any) {
      console.error('Image upload error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to upload image' 
      };
    }
  }

  // Get user profile
  static async getProfile(userId?: string): Promise<ProfileResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;

      if (!targetUserId) {
        return { success: false, error: 'No user ID provided' };
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        data: data || null 
      };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to fetch profile' 
      };
    }
  }

  // Update or create user profile (only using existing database columns)
  static async updateProfile(profileData: Partial<ProfileData>, imageUri?: string): Promise<ProfileResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'No authenticated user' };
      }

      let avatarUrl = profileData.avatar_url;

      // Upload image if provided
      if (imageUri && imageUri !== profileData.avatar_url) {
        const uploadResult = await this.uploadProfileImage(imageUri, user.id);
        if (uploadResult.success) {
          avatarUrl = uploadResult.url;
        } else {
          console.warn('Image upload failed:', uploadResult.error);
          // Continue without image upload - don't fail the entire update
        }
      }

      // Prepare profile data (only fields that exist in the database)
      const updateData = {
        id: user.id,
        full_name: profileData.full_name || null,
        username: profileData.username || null,
        avatar_url: avatarUrl || null,
        website: profileData.website || null,
        updated_at: new Date().toISOString(),
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key as keyof typeof updateData] === undefined) {
          delete updateData[key as keyof typeof updateData];
        }
      });

      console.log('Updating profile with data:', updateData);

      // Upsert profile data
      const { data, error } = await supabase
        .from('profiles')
        .upsert(updateData, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('Profile update error:', error);
        return { success: false, error: error.message };
      }

      // Update auth user metadata if name changed
      if (profileData.full_name) {
        const { error: authError } = await supabase.auth.updateUser({
          data: { 
            full_name: profileData.full_name,
            // Store extended fields in user metadata
            phone_number: profileData.phone_number,
            date_of_birth: profileData.date_of_birth,
            gender: profileData.gender,
            occupation: profileData.occupation,
          }
        });
        
        if (authError) {
          console.warn('Auth metadata update failed:', authError.message);
          // Don't fail the entire operation for this
        }
      }

      console.log('Profile updated successfully:', data);
      
      return { 
        success: true, 
        data: data 
      };
    } catch (error: any) {
      console.error('Profile update error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to update profile' 
      };
    }
  }

  // Delete profile image
  static async deleteProfileImage(imageUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Extract file path from URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      const filePath = pathParts.slice(-2).join('/'); // Get last two parts (bucket/filename)

      const { error } = await supabase.storage
        .from('user-content')
        .remove([filePath]);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to delete image' 
      };
    }
  }

  // Get profile image picker options
  static async getImagePickerOptions(): Promise<ImagePicker.ImagePickerOptions> {
    return {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: false,
    };
  }

  // Pick and upload profile image
  static async pickAndUploadProfileImage(userId: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return { success: false, error: 'Permission to access camera roll is required' };
      }

      // Pick image
      const result = await ImagePicker.launchImageLibraryAsync(
        await this.getImagePickerOptions()
      );

      if (result.canceled || !result.assets?.[0]) {
        return { success: false, error: 'Image selection cancelled' };
      }

      const imageUri = result.assets[0].uri;
      
      // Upload image
      return await this.uploadProfileImage(imageUri, userId);
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Failed to pick and upload image' 
      };
    }
  }

  // Validate profile data
  static validateProfileData(data: Partial<ProfileData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (data.full_name && data.full_name.trim().length < 2) {
      errors.push('Full name must be at least 2 characters long');
    }

    if (data.username && data.username.trim().length < 3) {
      errors.push('Username must be at least 3 characters long');
    }

    if (data.username && !/^[a-zA-Z0-9_]+$/.test(data.username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }

    if (data.phone_number && data.phone_number.length > 0) {
      const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
      if (!phoneRegex.test(data.phone_number)) {
        errors.push('Please enter a valid phone number');
      }
    }

    if (data.website && data.website.length > 0) {
      const urlRegex = /^https?:\/\/.+\..+/;
      if (!urlRegex.test(data.website)) {
        errors.push('Please enter a valid website URL');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
} 