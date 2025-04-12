import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@/context/theme';
import { BarChart3, TrendingUp, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function EnergyScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1E3A8A', '#3B82F6'] : ['#3B82F6', '#60A5FA']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Energy Dashboard</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIconContainer}>
              <BarChart3 size={24} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Energy Usage</Text>
          </View>
          
          <Text style={[styles.cardDescription, { color: colors.secondaryText }]}>
            Track your energy consumption and get personalized insights to reduce your carbon footprint.
          </Text>
          
          <TouchableOpacity
            style={[styles.cardButton, { backgroundColor: colors.primary + '15' }]}
            onPress={() => router.push('/energy-details')}
          >
            <Text style={[styles.cardButtonText, { color: colors.primary }]}>
              View Details
            </Text>
            <ArrowRight size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
        
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIconContainer, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7' }]}>
              <TrendingUp size={24} color="#22C55E" />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Sustainability Score</Text>
          </View>
          
          <View style={styles.scoreContainer}>
            <View style={[styles.scoreCircle, { 
              borderColor: '#22C55E',
              backgroundColor: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)'
            }]}>
              <Text style={styles.scoreText}>85</Text>
            </View>
            <Text style={[styles.scoreLabel, { color: colors.secondaryText }]}>
              Your sustainability score is higher than 73% of users
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  content: {
    padding: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
    lineHeight: 20,
  },
  cardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  cardButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginRight: 8,
  },
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#22C55E',
  },
  scoreLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: '80%',
  },
}); 