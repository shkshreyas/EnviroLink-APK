import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/theme';

export default function EnergyTab() {
  const router = useRouter();
  const { colors } = useTheme();

  // Redirect to the main energy details screen
  useEffect(() => {
    router.replace('/energy-details');
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
} 