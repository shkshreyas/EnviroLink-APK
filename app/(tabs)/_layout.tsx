import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Home, Book, User, BarChart3
} from 'lucide-react-native';
import { useTheme } from '@/context/theme';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withSpring,
  withSequence,
  Easing
} from 'react-native-reanimated';

// Custom animated tab bar icon
function AnimatedTabBarIcon({ isFocused, icon: Icon, color }) {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    };
  });
  
  // When tab is focused, animate the icon
  React.useEffect(() => {
    if (isFocused) {
      scale.value = withSequence(
        withTiming(1.2, { duration: 200 }),
        withTiming(1, { duration: 200 })
      );
    } else {
      scale.value = withTiming(1);
    }
  }, [isFocused]);
  
  return (
    <Animated.View style={animatedStyle}>
      <Icon size={22} color={color} />
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
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 10,
          elevation: 0,
          shadowOpacity: 0
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 2
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
        name="resources"
        options={{
          title: 'Resources',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabBarIcon isFocused={focused} icon={Book} color={color} />
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