import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { useRouter } from 'expo-router';
import { BarChart } from 'react-native-chart-kit';
import {
  Leaf,
  MessageCircle,
  ThumbsUp,
  Home,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  ArrowUpRight,
  Zap,
  Book,
  User,
  UtensilsCrossed,
} from 'lucide-react-native';
import { supabase, fetchUserProfile } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat,
  withDelay,
  withSequence,
  Easing,
  interpolateColor
} from 'react-native-reanimated';
import { Image as ExpoImage } from 'expo-image';

const screenWidth = Dimensions.get('window').width;

// Animated gradient card component for reusability
const AnimatedCard = ({ 
  children, 
  style, 
  colors 
}: { 
  children: React.ReactNode; 
  style?: any; 
  colors: [string, string] | [string, string, string, ...string[]];
}) => {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0.98);
  
  // Animate the gradient rotation for a subtle effect
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
      ]
    };
  });
  
  // Start animations when component mounts
  useEffect(() => {
    rotation.value = withRepeat(
      withSequence(
        withTiming(2, { duration: 4000 }),
        withTiming(-2, { duration: 4000 })
      ),
      -1,
      true
    );
    
    scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500 }),
        withTiming(0.98, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);
  
  return (
    <Animated.View style={[styles.cardContainer, style, animatedStyle]}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.cardGradient, style]}
      >
        {children}
      </LinearGradient>
    </Animated.View>
  );
};

interface Alert {
  id: number;
  created_at: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  user_id: string | null;
  is_read: boolean;
  metadata: any;
}

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [energyData, setEnergyData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [30, 45, 28, 80, 99, 43, 50],
      },
    ],
  });
  const [tips, setTips] = useState([
    {
      id: 1,
      title: 'Reduce Standby Power',
      description:
        'Unplug devices or use power strips to reduce standby power consumption.',
      likes: 24,
      comments: 7,
      color: '#3B82F6',
    },
    {
      id: 2,
      title: 'Use LED Lighting',
      description:
        'Replace traditional bulbs with LED lights to save up to 80% energy.',
      likes: 42,
      comments: 13,
      color: '#8B5CF6',
    },
    {
      id: 3,
      title: 'Optimize Heating & Cooling',
      description:
        'Set your thermostat 2 degrees lower in winter and higher in summer.',
      likes: 18,
      comments: 5,
      color: '#10B981',
    },
  ]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  // Animation values
  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-20);
  const chartsOpacity = useSharedValue(0);
  const chartsTranslateY = useSharedValue(30);
  const cardsOpacity = useSharedValue(0);
  const cardsTranslateY = useSharedValue(30);
  const tipsOpacity = useSharedValue(0);
  const tipsScale = useSharedValue(0.95);

  // Define animated styles
  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
      transform: [{ translateY: headerTranslateY.value }],
    };
  });
  
  const chartsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: chartsOpacity.value,
      transform: [{ translateY: chartsTranslateY.value }],
    };
  });
  
  const cardsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: cardsOpacity.value,
      transform: [{ translateY: cardsTranslateY.value }],
    };
  });
  
  const tipsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: tipsOpacity.value,
      transform: [{ scale: tipsScale.value }],
    };
  });

  useEffect(() => {
    // Trigger animations when component mounts
    headerOpacity.value = withTiming(1, { duration: 800 });
    headerTranslateY.value = withTiming(0, { duration: 800 });
    
    // Staggered animations for a more dynamic entry
    chartsOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    chartsTranslateY.value = withDelay(300, withTiming(0, { duration: 800 }));
    
    cardsOpacity.value = withDelay(500, withTiming(1, { duration: 800 }));
    cardsTranslateY.value = withDelay(500, withTiming(0, { duration: 800 }));
    
    tipsOpacity.value = withDelay(700, withTiming(1, { duration: 800 }));
    tipsScale.value = withDelay(700, withTiming(1, { 
      duration: 800, 
      easing: Easing.bezier(0.25, 0.1, 0.25, 1) 
    }));
  }, []);

  // Add state for avatar URL
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchUserData();
    
    // Add an event listener for app becoming active to refresh data
    const refreshInterval = setInterval(() => {
      if (!refreshing) {
        console.log('Refreshing profile data periodically');
        fetchUserData();
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      if (!user) return;

      const { data, error } = await fetchUserProfile(user.id);
      if (error) throw error;
      
      if (data) {
        setProfile(data);
        // Use optional chaining and type assertion to safely access avatar_url
        const profileData = data as any;
        setAvatarUrl(profileData?.avatar_url || null);
      }

      try {
        // Fetch energy readings data from Supabase
        const { data: energyReadings, error: energyError } = await supabase
          .from('energy_readings')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(7);

        if (energyError) throw energyError;

        if (energyReadings && energyReadings.length > 0) {
          const labels = energyReadings.map((reading) => {
            const date = new Date(reading.timestamp);
            return date.toLocaleDateString('en-US', { weekday: 'short' });
          });

          const data = energyReadings.map((reading) => reading.value);

          setEnergyData({
            labels,
            datasets: [{ data }],
          });
        }
      } catch (dbError) {
        // If the table doesn't exist, we'll use the mock data already set in state
        console.log('Using mock energy data:', dbError);
      }

      try {
        // Fetch alerts
        const { data: alertsData, error: alertsError } = await supabase
          .from('alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        if (alertsError) throw alertsError;

        if (alertsData) {
          setAlerts(alertsData);
        }
      } catch (dbError) {
        // If the table doesn't exist, we'll keep the empty alerts array
        console.log('Using mock alerts data:', dbError);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserData();
  };

  const handleLike = (tipId: number) => {
    setTips((prevTips) =>
      prevTips.map((tip) =>
        tip.id === tipId ? { ...tip, likes: tip.likes + 1 } : tip
      )
    );
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={styles.loader}
        />
      </View>
    );
  }

  // Get display name in order of preference: full name, email username
  const displayName =
    profile?.full_name ||
    (user.email ? user.email.split('@')[0].replace(/[^a-zA-Z]/g, '') : 'User');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* Animated Welcome Header */}
        <Animated.View style={[styles.headerContainer, headerAnimatedStyle]}>
          <LinearGradient
            colors={isDark ? ['#1E40AF', '#3B82F6'] : ['#3B82F6', '#60A5FA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerGradient}
          >
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.nameText}>{displayName}</Text>
              </View>
              <TouchableOpacity 
                style={styles.avatarContainer}
                onPress={() => router.push('/profile')}
              >
                {avatarUrl ? (
                  <ExpoImage
                    source={{ uri: avatarUrl }}
                    style={styles.avatarImage}
                    contentFit="cover"
                    transition={300}
                  />
                ) : (
                  <Text style={styles.avatarText}>
                    {displayName.charAt(0).toUpperCase()}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            <View style={styles.headerStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>85</Text>
                <Text style={styles.statLabel}>Sustainability Score</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>32%</Text>
                <Text style={styles.statLabel}>Reduction</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Energy usage chart section */}
        <Animated.View style={[styles.sectionContainer, chartsAnimatedStyle]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Energy Usage
            </Text>
            <TouchableOpacity 
              style={styles.detailsButton}
              onPress={() => router.push('/energy-details')}
            >
              <Text style={[styles.detailsText, { color: colors.primary }]}>View Details</Text>
              <ArrowUpRight size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Futuristic Chart Card */}
          <AnimatedCard 
            colors={isDark ? ['#1E293B', '#0F172A'] : ['#FFFFFF', '#F8FAFC']}
            style={styles.chartCard}
          >
            <BarChart
              data={energyData}
              width={screenWidth - 48}
              height={200}
              yAxisLabel=""
              yAxisSuffix=" kWh"
              chartConfig={{
                backgroundColor: 'transparent',
                backgroundGradientFrom: 'transparent',
                backgroundGradientTo: 'transparent',
                decimalPlaces: 0,
                color: (opacity = 1) => isDark 
                  ? `rgba(59, 130, 246, ${opacity})` 
                  : `rgba(59, 130, 246, ${opacity})`,
                labelColor: () => colors.secondaryText,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                },
                propsForBackgroundLines: {
                  strokeDasharray: '',
                  stroke: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                },
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16,
              }}
              withInnerLines={false}
              fromZero
            />
          </AnimatedCard>
        </Animated.View>

        {/* Quick Actions Section */}
        <Animated.View style={[styles.sectionContainer, cardsAnimatedStyle]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Quick Actions
            </Text>
          </View>

          <View style={styles.quickActionsGrid}>
            {/* Energy Monitor Card */}
            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: colors.card }]}
              onPress={() => router.push('/energy-details')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <BarChart3 size={22} color="#3B82F6" />
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Energy Monitor</Text>
              <Text style={[styles.actionDescription, { color: colors.secondaryText }]}>Track usage patterns</Text>
            </TouchableOpacity>
            
            {/* Resources Card */}
            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: colors.card }]}
              onPress={() => router.push('/resources')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <Book size={22} color="#8B5CF6" />
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Resources</Text>
              <Text style={[styles.actionDescription, { color: colors.secondaryText }]}>Explore guides</Text>
            </TouchableOpacity>
            
            {/* Smart Home Card */}
            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: colors.card }]}
              onPress={() => router.push('/food')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                <UtensilsCrossed size={22} color="#10B981" />
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Food Waste</Text>
              <Text style={[styles.actionDescription, { color: colors.secondaryText }]}>Reduce waste</Text>
            </TouchableOpacity>
            
            {/* Profile Card */}
            <TouchableOpacity 
              style={[styles.quickActionCard, { backgroundColor: colors.card }]}
              onPress={() => router.push('/profile')}
            >
              <View style={[styles.actionIconContainer, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                <User size={22} color="#EF4444" />
              </View>
              <Text style={[styles.actionTitle, { color: colors.text }]}>Profile</Text>
              <Text style={[styles.actionDescription, { color: colors.secondaryText }]}>View settings</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Sustainability Tips Section */}
        <Animated.View style={[styles.sectionContainer, tipsAnimatedStyle]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Sustainability Tips
            </Text>
          </View>

          {/* Tips Cards with enhanced UI */}
          {tips.map((tip) => (
            <AnimatedCard
              key={tip.id}
              colors={isDark 
                ? [colors.card, colors.card]
                : [colors.card, colors.card]
              }
              style={styles.tipCard}
            >
              <View style={styles.tipHeader}>
                <View style={[styles.tipIconContainer, { backgroundColor: `${tip.color}20` }]}>
                  <Leaf size={18} color={tip.color} />
                </View>
                <Text style={[styles.tipTitle, { color: colors.text }]}>
                  {tip.title}
                </Text>
              </View>
              <Text style={[styles.tipDescription, { color: colors.secondaryText }]}>
                {tip.description}
              </Text>
              <View style={styles.tipActions}>
                <TouchableOpacity
                  style={styles.tipAction}
                  onPress={() => handleLike(tip.id)}
                >
                  <ThumbsUp size={16} color={colors.primary} />
                  <Text style={[styles.tipActionText, { color: colors.primary }]}>
                    {tip.likes}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.tipAction}>
                  <MessageCircle size={16} color={colors.secondaryText} />
                  <Text style={[styles.tipActionText, { color: colors.secondaryText }]}>
                    {tip.comments}
                  </Text>
                </TouchableOpacity>
              </View>
            </AnimatedCard>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loader: {
    flex: 1,
  },
  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 16,
  },
  headerContainer: {
    marginBottom: 24,
    borderRadius: 0,
    overflow: 'hidden',
  },
  headerGradient: {
    padding: 20,
    paddingTop: 60,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerStats: {
    flexDirection: 'row',
    marginTop: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  sectionContainer: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  detailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  chartCard: {
    padding: 10,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
  },
  tipCard: {
    marginBottom: 16,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  tipIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  tipDescription: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  tipActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    paddingTop: 12,
  },
  tipAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  tipActionText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
});
