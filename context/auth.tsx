import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

// Define the shape of our auth context data
type AuthContextData = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    name?: string
  ) => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isLoggedIn: boolean;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
};

// Create the auth context with a default undefined value
const AuthContext = createContext<AuthContextData | undefined>(undefined);

// Session persistence keys
const SESSION_KEY = 'supabase.auth.token';

// Props for the AuthProvider component
type AuthProviderProps = {
  children: ReactNode;
};

// Create the AuthProvider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Set up the auth state listener when the component mounts
  useEffect(() => {
    console.log('Auth provider initializing...');
    
    // Initialize WebBrowser for OAuth flows
    const initializeWebBrowser = async () => {
      try {
        await WebBrowser.warmUpAsync();
        console.log('WebBrowser warmed up successfully');
      } catch (error) {
        console.error('Error warming up WebBrowser:', error);
      }
    };
    
    initializeWebBrowser();

    // Check for stored session at startup
    const checkPersistedSession = async () => {
      try {
        const storedSession = await AsyncStorage.getItem(SESSION_KEY);
        console.log(
          'Stored session check:',
          storedSession ? 'Found' : 'Not found'
        );
      } catch (e) {
        console.error('Error checking stored session:', e);
      }
    };

    checkPersistedSession();

    // Test connectivity to Supabase when component mounts
    const testConnection = async () => {
      try {
        console.log('Testing connectivity to Supabase...');
        const { data, error } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);
        if (error) {
          console.error('Supabase connection test failed:', error.message);
        } else {
          console.log('Supabase connection test successful');
        }
      } catch (error) {
        console.error('Exception during Supabase connection test:', error);
      }
    };

    testConnection();

    // Get the current session
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        console.log(
          'Initial session check:',
          session ? 'Authenticated' : 'Not authenticated'
        );
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error getting session:', error);
        setLoading(false);
      });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(
        'Auth state changed:',
        _event,
        session ? 'Session exists' : 'No session'
      );
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Clean up the subscription and WebBrowser when the component unmounts
    return () => {
      subscription.unsubscribe();
      
      // Clean up WebBrowser resources
      WebBrowser.coolDownAsync().catch(error => {
        console.error('Error cooling down WebBrowser:', error);
      });
    };
  }, []);

  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting signIn with Supabase...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase auth error:', error.message);
        return { error };
      }

      console.log('Sign in successful, user:', data.user?.id);

      // Additional logging for session persistence
      const sessionCheck = await supabase.auth.getSession();
      console.log(
        'Session after sign in:',
        sessionCheck.data.session ? 'Present' : 'Missing'
      );

      return { error: null };
    } catch (error) {
      console.error('Exception during sign in:', error);
      // Check for network errors
      if (error instanceof Error) {
        if (
          error.message.includes('fetch') ||
          error.message.includes('network')
        ) {
          return {
            error: new Error(
              'Network connection failed. Please check your internet connection and try again.'
            ),
          };
        }
      }
      return { error: error as Error };
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string, name?: string) => {
    try {
      console.log('Attempting signUp with Supabase...');
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name || email.split('@')[0], // Use name if provided, otherwise use part before @ in email
          },
        },
      });

      if (error) {
        console.error('Supabase signup error:', error.message);
        return { error };
      }

      console.log('Sign up successful, user:', data.user?.id);

      // If signup was successful and we have user data and name, create a user profile
      if (data.user && name) {
        try {
          // Create or update profile in the profiles table
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              full_name: name,
              updated_at: new Date().toISOString(),
            });

          if (profileError) {
            console.error('Error creating profile:', profileError);
          } else {
            console.log('Profile created successfully');
          }
        } catch (profileError) {
          console.error('Exception creating profile:', profileError);
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Exception during sign up:', error);
      // Check for network errors
      if (error instanceof Error) {
        if (
          error.message.includes('fetch') ||
          error.message.includes('network')
        ) {
          return {
            error: new Error(
              'Network connection failed. Please check your internet connection and try again.'
            ),
          };
        }
      }
      return { error: error as Error };
    }
  };

  // Reset password (forgot password)
  const resetPassword = async (email: string) => {
    try {
      console.log('Attempting to reset password for:', email);
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'EnviroLink://reset-password',
      });

      if (error) {
        console.error('Password reset error:', error.message);
        return { error };
      }

      console.log('Password reset email sent successfully');
      return { error: null };
    } catch (error) {
      console.error('Exception during password reset:', error);
      // Check for network errors
      if (error instanceof Error) {
        if (
          error.message.includes('fetch') ||
          error.message.includes('network')
        ) {
          return {
            error: new Error(
              'Network connection failed. Please check your internet connection and try again.'
            ),
          };
        }
      }
      return { error: error as Error };
    }
  };

  // Sign out
  const signOut = async () => {
    console.log('Signing out...');
    try {
      await supabase.auth.signOut();
      console.log('Sign out successful');
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      console.log('Attempting Google sign in with Supabase...');
      
      // For Android, we need to use a different approach than iOS
      if (Platform.OS === 'android') {
        // Close any existing WebBrowser sessions
        await WebBrowser.maybeCompleteAuthSession();
      }
      
      // Construct the redirect URL based on platform
      const redirectUrl = Platform.OS === 'ios' 
        ? 'envirolink://'
        : 'com.envirolink.app://';
      
      console.log('Using redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true, // Important for mobile flow
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('Google auth error:', error.message);
        return { error };
      }
      
      if (data?.url) {
        console.log('Opening auth URL in browser:', data.url);
        
        // Open the URL in an in-app browser
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUrl
        );
        
        console.log('Auth session result:', result.type);
        
        // Handle the result
        if (result.type === 'success') {
          // The user was redirected back to our app
          // Supabase Auth will automatically handle the token exchange
          console.log('Successfully returned from auth redirect');
        } else {
          console.log('User canceled or failed to complete auth');
          return { error: new Error('Authentication was canceled') };
        }
      } else {
        console.error('No authentication URL returned from Supabase');
        return { error: new Error('Failed to initiate authentication') };
      }

      console.log('Google sign in process completed');
      return { error: null };
    } catch (error) {
      console.error('Exception during Google sign in:', error);
      // Check for network errors
      if (error instanceof Error) {
        if (
          error.message.includes('fetch') ||
          error.message.includes('network')
        ) {
          return {
            error: new Error(
              'Network connection failed. Please check your internet connection and try again.'
            ),
          };
        }
      }
      return { error: error as Error };
    }
  };

  // Determine if the user is logged in
  const isLoggedIn = user !== null;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        resetPassword,
        signOut,
        isLoggedIn,
        signInWithGoogle,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
