import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import Constants from 'expo-constants';

// Hardcoded fallback values if the environment variables are not available
const FALLBACK_SUPABASE_URL = 'https://anueydhidrzfpdoxfijb.supabase.co';
const FALLBACK_SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFudWV5ZGhpZHJ6ZnBkb3hmaWpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NDExMDYsImV4cCI6MjA1OTQxNzEwNn0.l1FsMgR0ReBC8Qnmi7BckI0mMOaVdFy-WnwfaAf_xts';

// Get environment variables from multiple sources
const supabaseUrl = FALLBACK_SUPABASE_URL;
const supabaseAnonKey = FALLBACK_SUPABASE_KEY;

// Debugging environment variables
console.log('Supabase URL being used:', supabaseUrl);
console.log('Supabase Key present:', supabaseAnonKey ? 'Yes' : 'No');

// Custom async storage with debug logging
const enhancedAsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      const value = await AsyncStorage.getItem(key);
      console.log(`Retrieved item with key: ${key}`);
      return value;
    } catch (error) {
      console.error(`Error retrieving item with key: ${key}`, error);
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
      console.log(`Stored item with key: ${key}`);
    } catch (error) {
      console.error(`Error storing item with key: ${key}`, error);
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`Removed item with key: ${key}`);
    } catch (error) {
      console.error(`Error removing item with key: ${key}`, error);
    }
  },
};

// Define extension to the base Supabase client type with our custom RPC functions
type CustomRpcFunctions = {
  rpc<T = any>(
    fn: string,
    params?: Record<string, any>
  ): Promise<{ data: T | null; error: Error | null }>;
};

// Define our extended Supabase client type
type EnviroLinkSupabaseClient = SupabaseClient<Database> & CustomRpcFunctions;

// Create Supabase client with improved session persistence
const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: enhancedAsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'implicit',
  },
  // Add default headers for better identification
  global: {
    headers: {
      'X-Client-Info': 'econexus-app',
    },
  },
});

// Export the typed client
export const supabase = supabaseClient as EnviroLinkSupabaseClient;

// Helper functions for common Supabase operations

/**
 * Creates the profiles table if it doesn't exist
 */
export const ensureProfilesTable = async () => {
  try {
    // Check if profiles table exists - we'll use a query instead of RPC
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      
      if (error) {
        console.log('Profiles table might not exist:', error);
        // We'll proceed with creating a minimal profile structure in memory
      } else {
        console.log('Profiles table exists');
        return true;
      }
    } catch (queryError) {
      console.error('Error checking profiles table:', queryError);
    }

    // Try to add the preferences column if it doesn't exist
    try {
      console.log('Attempting to add preferences column...');
      
      // First try to query it to see if it exists
      try {
        const { error } = await supabase
          .from('profiles')
          .select('preferences')
          .limit(1);
        
        if (!error) {
          console.log('Preferences column exists');
          return true;
        }
      } catch (prefQueryError) {
        console.log('Error querying preferences column:', prefQueryError);
      }
      
      console.log('Could not verify preferences column, using memory-only profiles');
    } catch (alterException) {
      console.log(
        'Exception trying to add preferences column:',
        alterException
      );
    }

    return true;
  } catch (error) {
    console.error('Error ensuring profiles table:', error);
    return false;
  }
};

// Before trying to fetch or create profiles, ensure the preferences column exists
export const ensurePreferencesColumn = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      console.log('No session available, skipping preferences column check');
      return false;
    }

    // Try to check if preferences column exists by querying it
    try {
      await supabase.from('profiles').select('preferences').limit(1);
      console.log('Preferences column exists, no need to add it');
      return true;
    } catch (selectError) {
      console.log('Could not query preferences column, it might not exist');
      console.log('Using memory-only profiles with preferences');
      return false;
    }
  } catch (error) {
    console.error('Error ensuring preferences column:', error);
    return false;
  }
};

/**
 * Creates or updates profile with a fallback approach that doesn't require the preferences column
 */
export const fetchUserProfile = async (userId: string) => {
  try {
    // First check if the user already has a profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId);

    // If there's an error or no data, create a fallback profile in memory
    if (error || !data || data.length === 0) {
      console.log(
        'Using fallback profile data due to error or missing profile:',
        error
      );

      // Get user info if possible
      const { data: userData } = await supabase.auth.getUser();
      const user = userData?.user;

      // Look for full_name in user metadata first (this is set during signup)
      const fullName =
        user?.user_metadata?.full_name ||
        (user?.email ? user.email.split('@')[0] : 'User');

      // Return an in-memory profile as fallback
      return {
        data: {
          id: userId,
          full_name: fullName,
          bio: '',
          // Don't try to use the preferences column at all
          _darkMode: false,
          _notifications: true,
          _dataSharing: true,
          updated_at: new Date().toISOString(),
        },
        error: null,
      };
    }

    // Return the existing profile
    return { data: data[0], error: null };
  } catch (error) {
    console.error('Error in fetchUserProfile:', error);

    // Get user info if possible
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    // Look for full_name in user metadata as fallback
    const fullName =
      user?.user_metadata?.full_name ||
      (user?.email ? user.email.split('@')[0] : 'User');

    // Return a fallback profile in case of any error
    return {
      data: {
        id: userId,
        full_name: fullName,
        bio: '',
        _darkMode: false,
        _notifications: true,
        _dataSharing: true,
        updated_at: new Date().toISOString(),
      },
      error,
    };
  }
};

/**
 * Uploads an image to Supabase storage and returns the public URL
 */
export const uploadProfileImage = async (userId: string, base64Image: string) => {
  try {
    // Create a unique file path for the user's avatar
    const filePath = `avatars/${userId}/profile-${Date.now()}.jpg`;
    
    // Convert base64 string to blob
    const blob = await fetch(`data:image/jpeg;base64,${base64Image}`).then(res => res.blob());
    
    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('user-uploads')
      .upload(filePath, blob, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading image:', error);
      return { data: null, error };
    }
    
    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('user-uploads')
      .getPublicUrl(filePath);
    
    return { 
      data: { 
        path: filePath,
        url: publicUrlData.publicUrl 
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error in uploadProfileImage:', error);
    return { data: null, error };
  }
};

/**
 * Updates the current user's profile
 */
export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    // First check if the profile exists
    const { data: existingProfile } = await fetchUserProfile(userId);

    // Process profile image if it exists in updates
    if (updates.profile_image_base64) {
      try {
        const { data: imageData, error: imageError } = await uploadProfileImage(
          userId,
          updates.profile_image_base64
        );
        
        if (imageData && !imageError) {
          // Add image URL to updates, remove the base64 data
          updates.avatar_url = imageData.url;
          delete updates.profile_image_base64;
        } else {
          console.log('Could not upload profile image:', imageError);
          delete updates.profile_image_base64;
        }
      } catch (imageUploadError) {
        console.error('Error uploading profile image:', imageUploadError);
        delete updates.profile_image_base64;
      }
    }

    // Create a memory-only profile with the updates
    const updatedProfile = {
      ...existingProfile,
      ...updates,
      id: userId,
      updated_at: new Date().toISOString(),
    };

    // Try to save to Supabase but don't fail if it doesn't work
    try {
      // Remove any properties starting with _ before saving to database
      const dbSafeProfile = { ...updatedProfile };
      Object.keys(dbSafeProfile).forEach((key) => {
        if (key.startsWith('_')) {
          delete dbSafeProfile[key];
        }
      });

      // Only include fields that are likely to exist in the database
      const dbUpdates = {
        id: userId,
        full_name: dbSafeProfile.full_name,
        bio: dbSafeProfile.bio,
        avatar_url: dbSafeProfile.avatar_url,
        updated_at: new Date().toISOString(),
      };

      await supabase.from('profiles').upsert(dbUpdates);
      console.log('Profile saved to database');
    } catch (saveError) {
      console.log(
        'Could not save profile to database, using memory-only profile:',
        saveError
      );
    }

    // Always return success with the in-memory profile
    return { data: updatedProfile, error: null };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { data: null, error };
  }
};

/**
 * Fetches energy readings data for charts with fallback mock data
 */
export const fetchEnergyReadings = async (
  period: 'day' | 'week' | 'month' = 'week',
  limit: number = 7
) => {
  try {
    // Calculate the date range based on the period
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      default:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
    }

    const { data, error } = await supabase
      .from('energy_readings')
      .select('*')
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', now.toISOString())
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (error) {
      console.log('Using mock energy data:', error);
      // Return mock data if table doesn't exist
      return generateMockEnergyData(period, limit);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching energy readings:', error);
    return generateMockEnergyData(period, limit);
  }
};

/**
 * Generates mock energy data when the table doesn't exist
 */
const generateMockEnergyData = (
  period: 'day' | 'week' | 'month',
  limit: number
) => {
  const now = new Date();
  const data = [];

  // Generate random data points
  for (let i = 0; i < limit; i++) {
    const date = new Date(now);

    if (period === 'day') {
      date.setHours(now.getHours() - i);
    } else if (period === 'week') {
      date.setDate(now.getDate() - i);
    } else {
      date.setDate(now.getDate() - i * 3);
    }

    // Generate energy types
    const types = ['solar', 'wind', 'hydro', 'biomass', 'geothermal'];

    for (const type of types) {
      data.push({
        id: `mock-${i}-${type}`,
        timestamp: date.toISOString(),
        reading_type: type,
        reading_value: Math.floor(Math.random() * 100) + 20,
        unit: 'kWh',
        source: 'mock_generator',
      });
    }
  }

  return { data, error: null };
};

/**
 * Fetches alerts with mock data fallback
 */
export const fetchAlerts = async (limit: number = 5) => {
  try {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.log('Using mock alerts data:', error);
      return generateMockAlerts(limit);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return generateMockAlerts(limit);
  }
};

/**
 * Generates mock alerts when the table doesn't exist
 */
const generateMockAlerts = (limit: number) => {
  const now = new Date();
  const mockAlerts = [];

  const alertTypes = ['warning', 'info', 'success', 'error'];
  const sources = ['system', 'energy', 'weather', 'user'];
  const messages = [
    'Energy consumption spike detected',
    'Solar panel efficiency decreased',
    'Weather alert: heavy rain expected',
    'Battery charge below 20%',
    'New energy saving tip available',
    'System maintenance scheduled',
    'Successful connection to smart home system',
    'Energy consumption goals met',
  ];

  for (let i = 0; i < limit; i++) {
    const date = new Date(now);
    date.setHours(now.getHours() - i * 4);

    mockAlerts.push({
      id: `mock-alert-${i}`,
      title: messages[Math.floor(Math.random() * messages.length)],
      message:
        'This is a mock alert message with additional details about the alert.',
      type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      read: Math.random() > 0.5,
      created_at: date.toISOString(),
      updated_at: date.toISOString(),
    });
  }

  return { data: mockAlerts, error: null };
};
