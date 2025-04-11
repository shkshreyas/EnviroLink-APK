import React, { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/context/auth';
import { View, Text, ActivityIndicator, Image } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { ThemeProvider, useTheme } from '@/context/theme';
import ChatbotModal from '@/components/ChatbotModal';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing
} from 'react-native-reanimated';

// Keep the splash screen visible until auth is ready
SplashScreen.preventAutoHideAsync().catch((err) =>
  console.warn('Error preventing splash screen auto hide:', err)
);

// Simplified splash component with minimal animations for better performance
function CustomSplash() {
  const opacity = useSharedValue(0);
  
  // Logo animation
  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });
  
  // Text animation
  const textOpacity = useSharedValue(0);
  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
    };
  });

  useEffect(() => {
    // Simple fade-in animations
    opacity.value = withTiming(1, { duration: 500 });
    textOpacity.value = withTiming(1, { duration: 500, easing: Easing.ease });
  }, []);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: '#0F172A',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Animated.View style={logoAnimatedStyle}>
        <View style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: '#10B981',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 20
        }}>
          <View style={{
            position: 'absolute',
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            top: 30,
            left: 30
          }} />
          <View style={{
            position: 'absolute',
            width: 45,
            height: 45,
            borderRadius: 25,
            backgroundColor: 'rgba(96, 165, 250, 0.8)',
            top: 25,
            left: 40
          }} />
          <View style={{
            position: 'absolute',
            width: 35,
            height: 35,
            borderRadius: 18,
            backgroundColor: 'rgba(16, 185, 129, 0.7)',
            top: 45,
            left: 42
          }} />
        </View>
      </Animated.View>
      <Animated.Text
        style={[
          {
            fontSize: 28,
            fontWeight: 'bold',
            color: 'white',
            marginBottom: 8,
          },
          textAnimatedStyle
        ]}
      >
        EnviroLink
      </Animated.Text>
      <Animated.Text
        style={[
          {
            fontSize: 16,
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: 24,
          },
          textAnimatedStyle
        ]}
      >
        SustainLab
      </Animated.Text>
      <ActivityIndicator size="large" color="#10B981" />
    </View>
  );
}

// Dynamic status bar that changes with theme
function ThemedStatusBar() {
  const { colors } = useTheme();
  return <StatusBar style={colors.statusBar} />;
}

// Route guard component to handle protected routes
function RootLayoutNav() {
  const { user, loading, isLoggedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [splashVisible, setSplashVisible] = useState(true);
  const [initialNavigationComplete, setInitialNavigationComplete] =
    useState(false);

  // Use a separate effect for hiding the splash screen
  useEffect(() => {
    if (!loading) {
      const hideSplash = async () => {
        try {
          await SplashScreen.hideAsync();
          console.log('Splash screen hidden');
          // Shorter delay for transition
          setTimeout(() => setSplashVisible(false), 50);
        } catch (e) {
          console.warn('Error hiding splash screen:', e);
          setSplashVisible(false);
        }
      };

      hideSplash();
    }
  }, [loading]);

  // Use a separate effect for navigation logic
  useEffect(() => {
    // Only run navigation logic if auth is loaded and splash is no longer visible
    if (loading || splashVisible || initialNavigationComplete) return;

    const inAuthGroup = segments[0] === 'auth';
    console.log('Auth state:', { isLoggedIn, inAuthGroup, segments });

    if (!isLoggedIn && !inAuthGroup) {
      // If not logged in, go to auth
      console.log('Not logged in, redirecting to auth');
      router.replace('/auth');
    } else if (isLoggedIn && inAuthGroup) {
      // If logged in and on auth screen, go to home
      console.log('Logged in, redirecting to home');
      router.replace('/');
    }

    setInitialNavigationComplete(true);
  }, [
    isLoggedIn,
    loading,
    segments,
    splashVisible,
    initialNavigationComplete,
    router,
  ]);

  // Always render the Slot regardless of auth state
  // The navigation logic above will handle redirects as needed
  if (loading || splashVisible) {
    return <CustomSplash />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Slot />
      {isLoggedIn && <ChatbotModal />}
    </View>
  );
}

export default function Layout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ThemedStatusBar />
        <RootLayoutNav />
      </ThemeProvider>
    </AuthProvider>
  );
}
