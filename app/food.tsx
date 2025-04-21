import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/context/theme';
import FoodWasteReducer from '@/components/food/FoodWasteReducer';

export default function FoodScreen() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FoodWasteReducer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 