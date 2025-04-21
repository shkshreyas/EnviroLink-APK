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
  withRepeat,
  withDelay,
  withSequence,
  Easing
} from 'react-native-reanimated';

// Keep the splash screen visible until auth is ready
SplashScreen.preventAutoHideAsync().catch((err) =>
  console.warn('Error preventing splash screen auto hide:', err)
);

// Enhanced splash component with more reliable animations for better persistence
function CustomSplash() {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.95);
  const rotation = useSharedValue(0);
  const glow = useSharedValue(0);
  
  // Particle animation values
  const particle1Opacity = useSharedValue(0);
  const particle2Opacity = useSharedValue(0);
  const particle3Opacity = useSharedValue(0);
  const particle1Position = useSharedValue(-20);
  const particle2Position = useSharedValue(-15);
  const particle3Position = useSharedValue(-10);
  
  // Logo animation
  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` }
      ],
      shadowColor: '#3B82F6',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: glow.value,
      shadowRadius: 20 * glow.value
    };
  });
  
  // Particle animations
  const particle1Style = useAnimatedStyle(() => ({
    opacity: particle1Opacity.value,
    transform: [
      { translateY: particle1Position.value },
      { translateX: particle1Position.value * 0.5 },
      { scale: 0.8 + (particle1Opacity.value * 0.4) }
    ]
  }));
  
  const particle2Style = useAnimatedStyle(() => ({
    opacity: particle2Opacity.value,
    transform: [
      { translateY: particle2Position.value * 1.2 },
      { translateX: -particle2Position.value * 0.3 },
      { scale: 0.7 + (particle2Opacity.value * 0.5) }
    ]
  }));
  
  const particle3Style = useAnimatedStyle(() => ({
    opacity: particle3Opacity.value,
    transform: [
      { translateY: particle3Position.value * 0.8 },
      { translateX: particle3Position.value * 0.8 },
      { scale: 0.6 + (particle3Opacity.value * 0.6) }
    ]
  }));
  
  // Text animation
  const textOpacity = useSharedValue(0);
  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
      transform: [
        { translateY: (1 - textOpacity.value) * 20 }
      ]
    };
  });

  useEffect(() => {
    // Enhanced animations with sequencing for a more dynamic feel
    opacity.value = withTiming(1, { duration: 800 });
    
    // Pulsing scale effect
    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1, // infinite
      true // reverse
    );
    
    // Gentle rotation
    rotation.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 2000 }),
        withTiming(3, { duration: 2000 }),
      ), 
      -1, // infinite
      true // reverse
    );
    
    // Glowing effect
    glow.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 1500 }),
        withTiming(0.8, { duration: 1500 })
      ),
      -1,
      true
    );
    
    // Particle animations - delayed and staggered for a cosmic effect
    setTimeout(() => {
      particle1Opacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1200 }),
          withTiming(0.3, { duration: 800 })
        ),
        -1,
        true
      );
      
      particle1Position.value = withRepeat(
        withSequence(
          withTiming(-35, { duration: 1500 }),
          withTiming(-20, { duration: 1500 })
        ),
        -1,
        true
      );
    }, 200);
    
    setTimeout(() => {
      particle2Opacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 900 }),
          withTiming(0.2, { duration: 1100 })
        ),
        -1,
        true
      );
      
      particle2Position.value = withRepeat(
        withSequence(
          withTiming(-30, { duration: 1800 }),
          withTiming(-15, { duration: 1800 })
        ),
        -1,
        true
      );
    }, 400);
    
    setTimeout(() => {
      particle3Opacity.value = withRepeat(
        withSequence(
          withTiming(0.9, { duration: 1300 }),
          withTiming(0.4, { duration: 700 })
        ),
        -1,
        true
      );
      
      particle3Position.value = withRepeat(
        withSequence(
          withTiming(-25, { duration: 1300 }),
          withTiming(-10, { duration: 1300 })
        ),
        -1,
        true
      );
    }, 600);
    
    // Delayed text fade in with slight upward movement
    textOpacity.value = withDelay(800, withTiming(1, { 
      duration: 1000, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    }));
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
      <Animated.View style={[{
        position: 'absolute',
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
      }, particle1Style]} />
      
      <Animated.View style={[{
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
      }, particle2Style]} />
      
      <Animated.View style={[{
        position: 'absolute',
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
      }, particle3Style]} />
      
      <Animated.View style={logoAnimatedStyle}>
        <View style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: '#3B82F6',
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 4,
          borderColor: '#60A5FA',
          shadowColor: '#3B82F6',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 10,
          elevation: 8,
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
            backgroundColor: 'rgba(59, 130, 246, 0.7)',
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
            color: '#F8FAFC',
            marginBottom: 8,
            textShadowColor: '#3B82F6',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 10,
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
            color: '#94A3B8',
            marginBottom: 24,
          },
          textAnimatedStyle
        ]}
      >
        SustainLab
      </Animated.Text>
      <ActivityIndicator size="large" color="#3B82F6" />
    </View>
  );
}

// Dynamic status bar that changes with theme
function ThemedStatusBar() {
  const { colors } = useTheme();
  return <StatusBar style={colors.statusBar as 'light' | 'dark' | 'auto'} />;
}

// Route guard component to handle protected routes
function RootLayoutNav() {
  const { user, loading, isLoggedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [splashVisible, setSplashVisible] = useState(true);
  const [initialNavigationComplete, setInitialNavigationComplete] = useState(false);

  // Use a separate effect for hiding the splash screen
  useEffect(() => {
    if (!loading) {
      const hideSplash = async () => {
        try {
          await SplashScreen.hideAsync();
          console.log('Splash screen hidden');
          // Longer delay for transition to ensure animations complete
          setTimeout(() => setSplashVisible(false), 500);
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
      {/* Separate the ChatbotModal from the main navigation flow */}
      {isLoggedIn && <ChatbotModal />}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ThemedStatusBar />
        <RootLayoutNav />
      </ThemeProvider>
    </AuthProvider>
  );
}
