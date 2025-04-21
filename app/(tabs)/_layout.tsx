import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Home, Book, User, BarChart3, Utensils
} from 'lucide-react-native';
import { useTheme } from '@/context/theme';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withSpring,
  withSequence,
  Easing,
  interpolateColor
} from 'react-native-reanimated';

// Custom animated tab bar icon with enhanced animations
function AnimatedTabBarIcon({ 
  isFocused, 
  icon: Icon, 
  color 
}: { 
  isFocused: boolean; 
  icon: React.ElementType; 
  color: string;
}) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0.8);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotateY: `${rotation.value}deg` }
      ],
      opacity: opacity.value,
    };
  });

  // Background glow animation
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.8);
  
  const glowStyle = useAnimatedStyle(() => {
    return {
      opacity: glowOpacity.value,
      transform: [{ scale: glowScale.value }],
      backgroundColor: isFocused ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
    };
  });
  
  // When tab is focused, animate the icon
  useEffect(() => {
    if (isFocused) {
      // Scale up and bounce effect
      scale.value = withSequence(
        withSpring(1.2, { damping: 10 }),
        withSpring(1, { damping: 15 })
      );
      
      // 3D rotation effect for a more dynamic feel
      rotation.value = withSequence(
        withTiming(180, { duration: 400, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
        withTiming(0, { duration: 0 })
      );
      
      // Full opacity
      opacity.value = withTiming(1, { duration: 200 });
      
      // Glow effect appears
      glowOpacity.value = withTiming(1, { duration: 300 });
      glowScale.value = withSpring(1.1, { damping: 10 });
    } else {
      // Reset animations when not focused
      scale.value = withTiming(1, { duration: 200 });
      opacity.value = withTiming(0.8, { duration: 200 });
      glowOpacity.value = withTiming(0, { duration: 200 });
      glowScale.value = withTiming(0.8, { duration: 200 });
    }
  }, [isFocused]);
  
  return (
    <Animated.View style={[
      {
        padding: 6,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
      },
      glowStyle
    ]}>
      <Animated.View style={animatedStyle}>
        <Icon size={22} color={color} strokeWidth={isFocused ? 2.5 : 1.8} />
      </Animated.View>
    </Animated.View>
  );
}

export default function TabLayout() {
  const { colors, isDark } = useTheme();
  
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarStyle: {
          backgroundColor: colors.tabBarBackground,
          borderTopColor: isDark ? 'rgba(51, 65, 85, 0.8)' : colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
          elevation: 0,
          shadowOpacity: 0,
          zIndex: 1,
          // Add blur effect for more modern look
          ...(Platform.OS === 'ios' && {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
          }),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 2,
          letterSpacing: 0.2,
        },
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        tabBarButton: (props) => (
          <Pressable
            {...props}
            android_ripple={{ color: colors.primary + '20', borderless: true }}
            style={(state) => [
              props.style,
              {
                opacity: state.pressed ? 0.85 : 1,
                position: 'relative',
              },
            ]}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabBarIcon isFocused={focused} icon={Home} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="energy"
        options={{
          title: 'Energy',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabBarIcon isFocused={focused} icon={BarChart3} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="food"
        options={{
          title: 'Food',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabBarIcon isFocused={focused} icon={Utensils} color={color} />
          ),
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabBarIcon isFocused={focused} icon={User} color={color} />
          ),
          headerShown: false,
        }}
      />
    </Tabs>
  );
}