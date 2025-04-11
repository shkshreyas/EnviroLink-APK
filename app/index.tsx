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
  Animated,
  Platform,
} from 'react-native';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { useRouter } from 'expo-router';
import { BarChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Leaf,
  MessageCircle,
  ThumbsUp,
  Home,
  BarChart3,
  Settings,
  LogOut,
  Camera,
  Scan,
  Zap,
  Star,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import { supabase, fetchUserProfile } from '@/lib/supabase';
import { BlurView } from 'expo-blur';
import CameraSustainabilityAnalysis from '@/components/energy/CameraSustainabilityAnalysis';

const screenWidth = Dimensions.get('window').width;

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
    },
    {
      id: 2,
      title: 'Use LED Lighting',
      description:
        'Replace traditional bulbs with LED lights to save up to 80% energy.',
      likes: 42,
      comments: 13,
    },
    {
      id: 3,
      title: 'Optimize Heating & Cooling',
      description:
        'Set your thermostat 2 degrees lower in winter and higher in summer.',
      likes: 18,
      comments: 5,
    },
  ]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const tipRefs = useRef<Animated.Value[]>([]);

  useEffect(() => {
    fetchUserData();
  }, []);

  useEffect(() => {
    // Pulse animation for camera button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (tips.length > 0 && !tipRefs.current.length) {
      tipRefs.current = tips.map(() => new Animated.Value(0));
      
      // Create staggered animation
      Animated.stagger(
        150,
        tipRefs.current.map((anim) =>
          Animated.timing(anim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          })
        )
      ).start();
    }
  }, [tips]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      if (user) {
        // Fetch the user's profile
        const { data: profileData, error: profileError } =
          await fetchUserProfile(user.id);
        if (!profileError && profileData) {
          setProfile(profileData);
        } else {
          console.log(
            'Error loading profile or no profile found:',
            profileError
          );
          // Set default profile with username from email
          setProfile({
            full_name: user.email?.split('@')[0],
          });
        }
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
          />
        }
      >
        <View style={styles.header}>
          <View>
            <View style={styles.greetingRow}>
              <View style={styles.activeDot} />
              <Text style={[styles.greeting, { color: colors.text }]}>
                Welcome, {displayName}
              </Text>
            </View>
            <Text style={[styles.subGreeting, { color: colors.secondaryText }]}>
              Dashboard Overview
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/profile')}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={styles.profileIcon}
            >
              <Text style={styles.profileInitial}>
                {displayName[0].toUpperCase()}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Energy Usage Tracker */}
        <View style={[styles.card]}>
          <LinearGradient
            colors={isDark ? ['#1E293B', '#0F172A'] : ['#F8FAFC', '#F1F5F9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Energy Usage Tracker
              </Text>
              <TouchableOpacity
                style={[
                  styles.viewMoreButton,
                  { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)' }
                ]}
                onPress={() => router.push('/energy-details')}
              >
                <Text style={[styles.viewMoreText, { color: colors.primary }]}>
                  View More
                </Text>
                <ChevronRight size={16} color={colors.primary} style={{marginLeft: 4}} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <ActivityIndicator
                size="large"
                color={colors.primary}
                style={styles.loader}
              />
            ) : (
              <>
                <Text
                  style={[styles.chartTitle, { color: colors.secondaryText }]}
                >
                  Weekly Energy Consumption (kWh)
                </Text>
                <BarChart
                  data={energyData}
                  width={screenWidth - 50}
                  height={220}
                  yAxisSuffix=" kWh"
                  yAxisLabel=""
                  chartConfig={{
                    backgroundColor: colors.card,
                    backgroundGradientFrom: colors.card,
                    backgroundGradientTo: colors.card,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
                    labelColor: (opacity = 1) =>
                      isDark
                        ? `rgba(255, 255, 255, ${opacity})`
                        : `rgba(71, 85, 105, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    barPercentage: 0.7,
                  }}
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                />

                <View style={styles.energyMetrics}>
                  <View style={styles.energyMetric}>
                    <Text style={[styles.energyValue, { color: colors.text }]}>
                      375
                    </Text>
                    <Text
                      style={[
                        styles.energyLabel,
                        { color: colors.secondaryText },
                      ]}
                    >
                      kWh Total
                    </Text>
                  </View>
                  <View style={styles.energyMetric}>
                    <Text style={[styles.energyValue, { color: colors.text }]}>
                      54
                    </Text>
                    <Text
                      style={[
                        styles.energyLabel,
                        { color: colors.secondaryText },
                      ]}
                    >
                      kWh Avg
                    </Text>
                  </View>
                  <View style={styles.energyMetric}>
                    <Text style={[styles.energyTrend, { color: colors.success }]}>
                      -12%
                    </Text>
                    <Text
                      style={[
                        styles.energyLabel,
                        { color: colors.secondaryText },
                      ]}
                    >
                      vs. Last Week
                    </Text>
                  </View>
                </View>
              </>
            )}
          </LinearGradient>
        </View>

        {/* Drone Prototype Section */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Drone Prototype
            </Text>
            <TouchableOpacity
              style={styles.viewMoreButton}
              onPress={() => router.push('/drone')}
            >
              <Text style={[styles.viewMoreText, { color: colors.primary }]}>
                View
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.dronePromoContainer,
              { backgroundColor: isDark ? colors.elevated : '#F9FAFB' },
            ]}
            onPress={() => router.push('/drone')}
          >
            <View style={styles.dronePromoContent}>
              <View style={styles.droneBetaTag}>
                <Text style={styles.droneBetaText}>PROTOTYPE</Text>
              </View>
              <Text style={[styles.dronePromoTitle, { color: colors.text }]}>
                EnviroLink Forestry Drone
              </Text>
              <Text
                style={[
                  styles.dronePromoDescription,
                  { color: colors.secondaryText },
                ]}
              >
                Preview our upcoming drone monitoring system for forest
                conservation
              </Text>
            </View>
            <Image
              source={require('@/assets/images/drone.png')}
              style={styles.dronePromoImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        </View>

        {/* Sustainability Tips */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Sustainability Tips
        </Text>
        {tips.map((tip, index) => (
          <Animated.View
            key={tip.id}
            style={[
              styles.tipCard, 
              { 
                backgroundColor: colors.card,
                opacity: tipRefs.current[index] || 1,
                transform: [
                  {
                    translateY: tipRefs.current[index]
                      ? tipRefs.current[index].interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        })
                      : 0,
                  },
                ],
              }
            ]}
          >
            <Text style={[styles.tipTitle, { color: colors.text }]}>
              {tip.title}
            </Text>
            <Text
              style={[styles.tipDescription, { color: colors.secondaryText }]}
            >
              {tip.description}
            </Text>
            <View style={styles.tipActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleLike(tip.id)}
              >
                <ThumbsUp size={18} color={colors.primary} />
                <Text
                  style={[styles.actionText, { color: colors.secondaryText }]}
                >
                  {tip.likes}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <MessageCircle size={18} color={colors.primary} />
                <Text
                  style={[styles.actionText, { color: colors.secondaryText }]}
                >
                  {tip.comments}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        ))}

        {/* Resources Section */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Sustainable Development Resources
        </Text>
        <View style={styles.resourcesContainer}>
          {[
            {
              icon: <Leaf size={24} color="#0EA5E9" />,
              title: "Green Living Guide",
              route: '/resources/green-living' as const,
              gradientColors: isDark ? ['rgba(14, 165, 233, 0.2)', 'rgba(14, 165, 233, 0.1)'] : ['#E0F2FE', '#BFDBFE']
            },
            {
              icon: <BarChart3 size={24} color="#F59E0B" />,
              title: "Energy Saving Tips",
              route: '/resources/energy-saving' as const,
              gradientColors: isDark ? ['rgba(245, 158, 11, 0.2)', 'rgba(245, 158, 11, 0.1)'] : ['#FEF3C7', '#FDE68A']
            },
            {
              icon: <Settings size={24} color="#22C55E" />,
              title: "Carbon Calculator",
              route: '/resources/carbon-calculator' as const,
              gradientColors: isDark ? ['rgba(34, 197, 94, 0.2)', 'rgba(34, 197, 94, 0.1)'] : ['#DCFCE7', '#BBF7D0']
            }
          ].map((resource, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.resourceCard, { backgroundColor: colors.card }]}
              onPress={() => router.push(resource.route)}
            >
              <LinearGradient
                colors={resource.gradientColors as [string, string]}
                style={styles.resourceIcon}
              >
                {resource.icon}
              </LinearGradient>
              <Text style={[styles.resourceTitle, { color: colors.text }]}>
                {resource.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Recent Alerts */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Recent Alerts
        </Text>
        {alerts && alerts.length > 0 ? (
          alerts.map((alert, index) => (
            <View
              key={index}
              style={[styles.alertCard, { backgroundColor: colors.card }]}
            >
              <View
                style={[
                  styles.alertIndicator,
                  {
                    backgroundColor:
                      alert.severity === 'high'
                        ? colors.error
                        : alert.severity === 'medium'
                        ? colors.warning
                        : colors.success,
                  },
                ]}
              />
              <View style={styles.alertContent}>
                <Text style={[styles.alertTitle, { color: colors.text }]}>
                  {alert.title}
                </Text>
                <Text
                  style={[
                    styles.alertDescription,
                    { color: colors.secondaryText },
                  ]}
                >
                  {alert.description}
                </Text>
                <Text
                  style={[styles.alertTime, { color: colors.secondaryText }]}
                >
                  {new Date(alert.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Text
              style={[styles.emptyStateText, { color: colors.secondaryText }]}
            >
              No recent alerts
            </Text>
          </View>
        )}

        {/* Floating AI Camera Button */}
        <View style={styles.cameraButtonContainer}>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={() => setCameraModalVisible(true)}
          >
            <LinearGradient
              colors={isDark ? ['#3B82F6', '#2563EB'] : ['#3B82F6', '#1D4ED8']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cameraGradient}
            >
              <Animated.View
                style={[
                  styles.cameraIconPulse,
                  {
                    transform: [{ scale: pulseAnim }],
                  },
                ]}
              >
                <Camera size={28} color="#FFFFFF" />
              </Animated.View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Camera Sustainability Analysis Modal */}
        <CameraSustainabilityAnalysis
          visible={cameraModalVisible}
          onClose={() => setCameraModalVisible(false)}
        />
      </ScrollView>

      {/* Bottom Navigation */}
      <View
        style={[
          styles.bottomNav,
          {
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          },
        ]}
      >
        <TouchableOpacity style={styles.navItem}>
          <Home size={24} color={colors.primary} />
          <Text
            style={[
              styles.navText,
              styles.activeNavText,
              { color: colors.primary },
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/energy-details')}
        >
          <BarChart3 size={24} color={colors.secondaryText} />
          <Text style={[styles.navText, { color: colors.secondaryText }]}>
            Energy
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/(tabs)/resources')}
        >
          <Leaf size={24} color={colors.secondaryText} />
          <Text style={[styles.navText, { color: colors.secondaryText }]}>
            Resources
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push('/profile')}
        >
          <Settings size={24} color={colors.secondaryText} />
          <Text style={[styles.navText, { color: colors.secondaryText }]}>
            Settings
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  loader: {
    marginVertical: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 40,
    paddingHorizontal: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.1)',
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Helvetica Neue' : 'sans-serif',
    letterSpacing: -0.5,
  },
  subGreeting: {
    fontSize: 16,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewMoreButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
  },
  viewMoreText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chartTitle: {
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  energyMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  energyMetric: {
    alignItems: 'center',
  },
  energyValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(59, 130, 246, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  energyTrend: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    textShadowColor: 'rgba(34, 197, 94, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  energyLabel: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tipCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tipDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  tipActions: {
    flexDirection: 'row',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    marginLeft: 6,
    fontSize: 14,
  },
  alertCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
  alertIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  alertTime: {
    fontSize: 12,
  },
  emptyState: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 16,
  },
  resourcesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  resourceCard: {
    borderRadius: 16,
    padding: 16,
    width: '31%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(8px)',
  },
  resourceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  resourceTitle: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  navItem: {
    alignItems: 'center',
  },
  navText: {
    fontSize: 12,
    marginTop: 4,
  },
  activeNavText: {
    fontWeight: '500',
  },
  betaText: {
    color: '#92400E',
    fontSize: 10,
    fontWeight: 'bold',
  },
  droneBetaTag: {
    backgroundColor: '#FCD34D',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  droneBetaText: {
    color: '#92400E',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dronePromoContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    height: 120,
  },
  dronePromoContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  dronePromoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  dronePromoDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  dronePromoImage: {
    width: 120,
    height: 120,
  },
  cameraButtonContainer: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
    zIndex: 999,
  },
  cameraButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
  },
  cameraGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 30,
  },
  cameraIconPulse: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardGradient: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
  },
});
