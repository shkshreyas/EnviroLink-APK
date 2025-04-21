import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Modal,
  Animated,
  Platform,
  SafeAreaView,
  StatusBar,
  useWindowDimensions,
  Image,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth';
import { useTheme } from '@/context/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Calendar, 
  TrendingDown, 
  TrendingUp, 
  Clock, 
  Zap, 
  ChevronRight,
  Lightbulb, 
  X,
  RefreshCw,
  BarChart3,
  PieChart,
  Camera,
  Leaf,
} from 'lucide-react-native';
import { 
  fetchDailyEnergyData, 
  fetchWeeklyEnergyData, 
  fetchEnergyBreakdown, 
  fetchRealTimeEnergy,
  getAIEnergyInsights,
  UsageBreakdown,
  DailyEnergyData
} from '@/lib/energy/api';
import { generateEnergyInsights } from '@/lib/energy/energyInsights';
import { CameraSustainabilityAnalysis } from '@/components/energy/CameraSustainabilityAnalysis';

// Use dynamic dimensions for better responsiveness
const initialDimensions = Dimensions.get('window');
const screenWidth = initialDimensions.width;
const screenHeight = initialDimensions.height;

// Generate daily consumption pattern is now replaced with our API

export default function EnergyDetailsScreen() {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('week');
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Animation values with enhanced effects
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  
  // Get current window dimensions for responsive design
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  
  // State for real-time data
  const [weeklyData, setWeeklyData] = useState<DailyEnergyData[]>([]);
  const [insightsModalVisible, setInsightsModalVisible] = useState(false);
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  
  // Current day's hourly data
  const [hourlyData, setHourlyData] = useState({
    labels: ['12am', '4am', '8am', '12pm', '4pm', '8pm'],
    datasets: [
      {
        data: [5, 10, 25, 35, 40, 30],
        color: (opacity = 1) => 'rgba(65, 105, 225, ' + opacity + ')',
      },
    ],
  });
  
  // Derived from the weekly data
  const [energyData, setEnergyData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        data: [30, 45, 28, 80, 99, 43, 50],
      },
    ],
  });
  
  const [usageBreakdown, setUsageBreakdown] = useState<UsageBreakdown[]>([
    { category: 'Lighting', percentage: 28, value: 28 * 0.1, color: '#22C55E' },
    { category: 'Heating', percentage: 35, value: 35 * 0.1, color: '#F59E0B' },
    { category: 'Appliances', percentage: 20, value: 20 * 0.1, color: '#3B82F6' },
    { category: 'Other', percentage: 17, value: 17 * 0.1, color: '#EC4899' }
  ]);
  
  const [statistics, setStatistics] = useState({
    averageDaily: 45,
    totalMonthly: 1350,
    peakTime: '6-8 PM',
    lowestTime: '2-4 AM',
    trend: -8,
    co2Saved: 120,
  });

  // Add animated CO2 counter simulation
  const [animatedCO2, setAnimatedCO2] = useState(statistics.co2Saved);
  const [realTimeUsage, setRealTimeUsage] = useState(0);
  
  // Get AI insights using Gemini API
  const handleGetInsights = async () => {
    if (weeklyData.length === 0) return;
    
    setInsightsLoading(true);
    setInsightsModalVisible(true);
    
    try {
      // Use the new Gemini API integration
      const insights = await generateEnergyInsights(weeklyData);
      setAiInsights(insights);
    } catch (error) {
      console.error('Error getting AI insights:', error);
      setAiInsights('Unable to generate insights at this time. Please try again later.');
    } finally {
      setInsightsLoading(false);
    }
  };

  // Process the current hourly data based on the current day's data
  const updateHourlyData = (todayData: DailyEnergyData) => {
    if (!todayData || !todayData.hourly_readings) return;
    
    // Create the 6-point display format from 24 hour data
    const hourReadings = todayData.hourly_readings;
    
    const condensedData = [
      hourReadings.slice(0, 4).reduce((a, b) => a + b.value, 0) / 4, // 12am-4am average
      hourReadings.slice(4, 8).reduce((a, b) => a + b.value, 0) / 4, // 4am-8am average
      hourReadings.slice(8, 12).reduce((a, b) => a + b.value, 0) / 4, // 8am-12pm average
      hourReadings.slice(12, 16).reduce((a, b) => a + b.value, 0) / 4, // 12pm-4pm average
      hourReadings.slice(16, 20).reduce((a, b) => a + b.value, 0) / 4, // 4pm-8pm average
      hourReadings.slice(20, 24).reduce((a, b) => a + b.value, 0) / 4, // 8pm-12am average
    ];
    
    setHourlyData({
      labels: ['12am', '4am', '8am', '12pm', '4pm', '8pm'],
      datasets: [
        {
          data: condensedData,
          color: (opacity = 1) => 'rgba(65, 105, 225, ' + opacity + ')',
        },
      ],
    });
  };
  
  // Process weekly data from API
  const updateWeeklyData = (weekData: DailyEnergyData[]) => {
    if (!weekData || weekData.length === 0) return;
    
    // Calculate daily totals
    const dailyTotals = weekData.map(day => day.total_consumption);
    
    // Determine appropriate labels
    const labels = weekData.map(day => {
      const date = new Date(day.date);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });
    
    setEnergyData({
      labels,
      datasets: [{ data: dailyTotals }],
    });
    
    // Update statistics based on the API data
    const totalConsumption = dailyTotals.reduce((total, daily) => total + daily, 0);
    const averageDaily = totalConsumption / weekData.length;
    const estimatedMonthly = averageDaily * 30;
    
    // Find peak time from the entire week
    const allPeakTimes = weekData.map(day => day.peak_time);
    const peakTimeFrequency = allPeakTimes.reduce((acc, time) => {
      acc[time] = (acc[time] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Get the most frequent peak time
    let mostFrequentPeakTime = allPeakTimes[0];
    let highestFrequency = 0;
    
    Object.entries(peakTimeFrequency).forEach(([time, frequency]) => {
      if (frequency > highestFrequency) {
        highestFrequency = frequency;
        mostFrequentPeakTime = time;
      }
    });
    
    setStatistics(prev => ({
      ...prev,
      averageDaily: Math.round(averageDaily),
      totalMonthly: Math.round(estimatedMonthly),
      peakTime: mostFrequentPeakTime,
      trend: Math.round((averageDaily - prev.averageDaily) / prev.averageDaily * 100) || 0,
    }));
  };
  
  useEffect(() => {
    // Simulate animated CO2 counter
    let direction = 1;
    const interval = setInterval(() => {
      setAnimatedCO2(prev => {
        const newValue = prev + (0.1 * direction);
        if (newValue >= statistics.co2Saved + 2) direction = -1;
        if (newValue <= statistics.co2Saved - 2) direction = 1;
        return parseFloat(newValue.toFixed(1));
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, [statistics.co2Saved]);

  useEffect(() => {
    // Update data visualizations when period changes
    loadEnergyData();
  }, [period]);

  // Effect for real-time updates
  useEffect(() => {
    // Fetch real-time usage every 10 seconds
    const interval = setInterval(async () => {
      try {
        const realTimeData = await fetchRealTimeEnergy();
        setRealTimeUsage(realTimeData.value);
      } catch (error) {
        console.error('Error fetching real-time energy:', error);
      }
    }, 10000);
    
    // Initial fetch
    fetchRealTimeEnergy()
      .then(data => setRealTimeUsage(data.value))
      .catch(err => console.error('Error fetching initial real-time energy:', err));
    
    return () => clearInterval(interval);
  }, []);

  // Load energy data from API
  const loadEnergyData = async () => {
    setLoading(true);
    try {
      // Get the appropriate start date for the selected period
      const today = new Date();
      let startDate = new Date();
      
      if (period === 'day') {
        // Just use today for 'day' view
        const todayData = await fetchDailyEnergyData(today);
        updateHourlyData(todayData);
        setWeeklyData([todayData]);
      } else if (period === 'week') {
        // Start from 6 days ago for 'week' view
        startDate.setDate(today.getDate() - 6);
        const weekData = await fetchWeeklyEnergyData(startDate);
        updateWeeklyData(weekData);
        // Use the last day (today) for hourly view
        if (weekData.length > 0) {
          updateHourlyData(weekData[weekData.length - 1]);
        }
        setWeeklyData(weekData);
      } else if (period === 'month') {
        // Start from 29 days ago for 'month' view
        startDate.setDate(today.getDate() - 29);
        // We'll use the weekly fetch but create multiple requests to get a month
        const weekData1 = await fetchWeeklyEnergyData(startDate);
        
        // Get second set (starting 3 weeks ago)
        startDate.setDate(today.getDate() - 21);
        const weekData2 = await fetchWeeklyEnergyData(startDate);
        
        // Get third set (starting 2 weeks ago)
        startDate.setDate(today.getDate() - 14);
        const weekData3 = await fetchWeeklyEnergyData(startDate);
        
        // Get fourth set (starting 1 week ago)
        startDate.setDate(today.getDate() - 7);
        const weekData4 = await fetchWeeklyEnergyData(startDate);
        
        // Combine and avoid duplicates (by date)
        const allData = [...weekData1, ...weekData2, ...weekData3, ...weekData4];
        const uniqueDates = new Set();
        const uniqueData = allData.filter(day => {
          if (uniqueDates.has(day.date)) return false;
          uniqueDates.add(day.date);
          return true;
        });
        
        // Use last 30 days
        const monthData = uniqueData.slice(-30);
        updateWeeklyData(monthData);
        
        // Use today for hourly view
        const todayData = monthData.find(day => day.date === today.toISOString().split('T')[0]);
        if (todayData) {
          updateHourlyData(todayData);
        }
        
        setWeeklyData(monthData);
      }
      
      // Get usage breakdown data
      const breakdownData = await fetchEnergyBreakdown();
      setUsageBreakdown(breakdownData);
      
    } catch (error) {
      console.error('Error loading energy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderBreakdownChart = () => {
    return (
      <View style={[styles.breakdownContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.breakdownTitle, { color: colors.text }]}>Usage Breakdown</Text>
        <View style={styles.breakdownChart}>
          {usageBreakdown.map((item, index) => (
            <View key={index} style={styles.breakdownItem}>
              <View style={styles.breakdownBarContainer}>
                <View 
                  style={[
                    styles.breakdownBar, 
                    { 
                      height: `${item.percentage}%`,
                      backgroundColor: item.color 
                    }
                  ]} 
                />
              </View>
              <Text style={[styles.breakdownPercentage, { color: colors.text }]}>{item.percentage}%</Text>
              <Text style={[styles.breakdownCategory, { color: colors.secondaryText }]}>{item.category}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const getBarColor = (value: number, maxValue: number) => {
    const percentage = value / maxValue;
    
    if (percentage > 0.7) return '#EF4444'; // Red for high usage
    if (percentage > 0.4) return '#F59E0B'; // Orange for medium usage
    return '#22C55E'; // Green for low usage
  };

  // Enhanced animations for a more futuristic feel
  useEffect(() => {
    // Pulse animation for real-time data with enhanced effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Staggered fade-in and slide animations for a more dynamic entry
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start();
    
    // Rotate animation for refresh icon
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Handle refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await loadEnergyData();
    setRefreshing(false);
  }, []);

  // Add camera modal handler
  const handleOpenCamera = () => {
    setCameraModalVisible(true);
  };
  
  const handleCloseCamera = () => {
    setCameraModalVisible(false);
  };

  if (!user) {
    router.replace('/auth');
    return null;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      
      {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Energy Usage</Text>
        <TouchableOpacity style={styles.cameraButton} onPress={handleOpenCamera}>
          <Camera size={24} color={colors.text} />
        </TouchableOpacity>
        </View>

      {/* Period Selector */}
      <View style={[styles.periodSelector, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(243, 244, 246, 0.8)' }]}>
          <TouchableOpacity
            style={[
              styles.periodButton, 
            period === 'day' && [styles.activePeriod, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]
            ]}
            onPress={() => setPeriod('day')}
          >
          <Text style={[
            styles.periodText, 
                { color: colors.secondaryText },
            period === 'day' && { color: colors.primary, fontWeight: '700' }
          ]}>
              Day
            </Text>
          </TouchableOpacity>
        
          <TouchableOpacity
            style={[
              styles.periodButton, 
            period === 'week' && [styles.activePeriod, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]
            ]}
            onPress={() => setPeriod('week')}
          >
          <Text style={[
            styles.periodText, 
                { color: colors.secondaryText },
            period === 'week' && { color: colors.primary, fontWeight: '700' }
          ]}>
              Week
            </Text>
          </TouchableOpacity>
        
          <TouchableOpacity
            style={[
              styles.periodButton, 
            period === 'month' && [styles.activePeriod, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]
            ]}
            onPress={() => setPeriod('month')}
          >
          <Text style={[
            styles.periodText, 
                { color: colors.secondaryText },
            period === 'month' && { color: colors.primary, fontWeight: '700' }
          ]}>
              Month
            </Text>
          </TouchableOpacity>
        </View>

      {/* Real-time usage display */}
      <Animated.View style={[
        styles.realTimeContainer,
        { transform: [{ scale: pulseAnim }] }
      ]}>
        <LinearGradient
          colors={isDark ? ['#1E293B', '#0F172A'] : ['#FFFFFF', '#F8FAFC']}
          style={styles.realTimeGradient}
        >
          <View style={styles.realTimeRow}>
            <View>
              <Text style={[styles.realTimeLabel, { color: colors.secondaryText }]}>
                Current Usage
          </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={[styles.realTimeValue, { color: colors.text }]}>
                  {realTimeUsage.toFixed(1)}
                </Text>
                <Text style={[styles.realTimeUnit, { color: colors.secondaryText }]}> kW</Text>
              </View>
              </View>
              
            <View style={[styles.liveBadge, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7' }]}>
              <View style={styles.liveBadgeDot} />
              <Text style={[styles.liveBadgeText, { color: isDark ? '#4ADE80' : '#065F46' }]}>
                LIVE
                        </Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor={colors.primary}
          />
        }
      >
        {/* Enhanced AI Insights Button with gradient */}
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }}>
          <TouchableOpacity 
            style={[styles.insightsButton]}
            onPress={handleGetInsights}
          >
            <LinearGradient
              colors={isDark ? ['#0F172A', '#1E293B'] : ['#FFFFFF', '#F8FAFC']}
              style={styles.insightsGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.insightsButtonContent}>
                <View style={[styles.insightsIconContainer, { 
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)' 
                }]}>
                  <Lightbulb size={22} color={colors.primary} />
                          </View>
                <View style={styles.insightsTextContainer}>
                  <Text style={[styles.insightsTitle, { color: colors.text }]}>
                    AI Energy Insights
                  </Text>
                  <Text style={[styles.insightsSubtitle, { color: colors.secondaryText }]}>
                    Get personalized recommendations
                  </Text>
                        </View>
                      </View>
              <View style={styles.insightsArrow}>
                <ChevronRight size={20} color={colors.primary} />
                    </View>
            </LinearGradient>
          </TouchableOpacity>
          
          {/* Camera Sustainability Analysis Button */}
          <TouchableOpacity 
            style={[styles.insightsButton, { marginTop: 12 }]}
            onPress={() => setCameraModalVisible(true)}
          >
            <LinearGradient
              colors={isDark ? ['#0F172A', '#1E293B'] : ['#FFFFFF', '#F8FAFC']}
              style={styles.insightsGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <View style={styles.insightsButtonContent}>
                <View style={[styles.insightsIconContainer, { 
                  backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7' 
                }]}>
                  <Camera size={22} color="#22C55E" />
              </View>
                <View style={styles.insightsTextContainer}>
                  <Text style={[styles.insightsTitle, { color: colors.text }]}>
                    Sustainability Scanner
                  </Text>
                  <Text style={[styles.insightsSubtitle, { color: colors.secondaryText }]}>
                    Analyze objects for sustainability
                  </Text>
            </View>
        </View>
              <View style={styles.insightsArrow}>
                <ChevronRight size={20} color="#22C55E" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Rest of your components... */}
        
        {/* Energy statistics cards */}
        <View style={styles.statsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Energy Statistics</Text>
          <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIconContainer, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7' }]}>
              <Calendar size={20} color="#22C55E" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{statistics.averageDaily} kWh</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Avg. Daily</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIconContainer, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7' }]}>
              <Zap size={20} color="#22C55E" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{statistics.totalMonthly} kWh</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Monthly Total</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIconContainer, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7' }]}>
              <Clock size={20} color="#22C55E" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{statistics.peakTime}</Text>
            <Text style={[styles.statLabel, { color: colors.secondaryText }]}>Peak Usage</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIconContainer, { backgroundColor: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7' }]}>
              {statistics.trend < 0 ? (
                <TrendingDown size={20} color="#22C55E" />
              ) : (
                <TrendingUp size={20} color="#EF4444" />
              )}
            </View>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {statistics.trend > 0 ? '+' : ''}{statistics.trend}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.secondaryText }]}>vs. Previous</Text>
            </View>
          </View>
        </View>
        
        {/* Energy usage chart */}
        <View style={[styles.chartContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>Energy Consumption</Text>
          
          <View style={styles.chartContent}>
            <View style={styles.barContainer}>
              {energyData.labels.map((label, index) => {
                const value = energyData.datasets[0].data[index];
                const maxValue = Math.max(...energyData.datasets[0].data);
                const heightPercentage = (value / maxValue) * 100;
                
                return (
                  <View key={index} style={styles.barColumn}>
                    <View style={styles.barAndValue}>
                      <Text style={[styles.valueLabel, { color: colors.text }]}>
                        {Math.round(value)}
                      </Text>
                      <View style={styles.barBackground}>
                        <View 
              style={[
                            styles.barFill, 
                            { 
                              height: `${heightPercentage}%`,
                              backgroundColor: getBarColor(value, maxValue),
                            }
                          ]} 
                        >
                          {period === 'day' && (
                            <View style={styles.liveIndicator} />
                          )}
                        </View>
                      </View>
                    </View>
                    <Text style={[styles.barLabel, { color: colors.secondaryText }]}>{label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Hourly usage chart */}
        <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
          <View style={styles.hourlyChartContainer}>
            <View style={styles.hourlyChartHeader}>
              <Text style={[styles.hourlyChartTitle, { color: colors.text }]}>Today's Usage by Hour</Text>
              <View style={styles.liveIndicatorContainer}>
                <View style={styles.liveDot} />
                <Text style={[styles.liveText, { color: colors.secondaryText }]}>Today</Text>
              </View>
            </View>
            
            <View style={styles.hourlyChartBody}>
              {hourlyData.datasets[0].data.map((value, index) => {
                const maxValue = Math.max(...hourlyData.datasets[0].data);
                const heightPercentage = (value / maxValue) * 100;
                return (
                  <View key={index} style={styles.hourlyBarColumn}>
                    <View style={styles.hourlyBarContainer}>
                      <Text style={[styles.hourlyValueLabel, { color: colors.text }]}>
                        {Math.round(value)} kWh
                      </Text>
                      <View style={[styles.hourlyBarBg, { backgroundColor: isDark ? 'rgba(75, 85, 99, 0.2)' : '#F3F4F6' }]}>
                        <View 
                          style={[
                            styles.hourlyBarFill, 
                            { 
                              height: `${heightPercentage}%`,
                              backgroundColor: '#3B82F6',
                            }
                          ]} 
                        >
                          <View style={styles.pulsingDot} />
                        </View>
                      </View>
                      <Text style={[styles.hourlyTimeLabel, { color: colors.secondaryText }]}>
                        {hourlyData.labels[index]}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Usage breakdown */}
        {renderBreakdownChart()}

        {/* Environmental impact section */}
        <View style={[styles.impactContainer, { backgroundColor: isDark ? '#064E3B' : '#ECFDF5' }]}>
          <Text style={[styles.impactTitle, { color: isDark ? '#FFFFFF' : '#065F46' }]}>
            Environmental Impact
            </Text>
          <Text style={[styles.impactDescription, { color: isDark ? '#D1FAE5' : '#047857' }]}>
            Your energy efficiency efforts have saved the equivalent of:
            </Text>
          
          <View style={styles.impactMetrics}>
            <View style={styles.impactMetric}>
              <Text style={[styles.impactValue, { color: isDark ? '#FFFFFF' : '#065F46' }]}>
                {animatedCO2.toFixed(1)} kg
              </Text>
              <Text style={[styles.impactLabel, { color: isDark ? '#D1FAE5' : '#047857' }]}>
                CO₂ Emissions
            </Text>
          </View>
          
            <View style={styles.impactMetric}>
              <Text style={[styles.impactValue, { color: isDark ? '#FFFFFF' : '#065F46' }]}>
                {Math.round(animatedCO2 / 20)} trees
            </Text>
              <Text style={[styles.impactLabel, { color: isDark ? '#D1FAE5' : '#047857' }]}>
                Monthly Absorption
              </Text>
              </View>
              </View>
            </View>
      </ScrollView>
      
      {/* Enhanced AI Insights Modal with gradient background */}
      <Modal
        visible={insightsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setInsightsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer]}>
          <LinearGradient
              colors={isDark ? ['#0F172A', '#1E293B'] : ['#FFFFFF', '#F8FAFC']}
              style={styles.modalGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>AI Energy Insights</Text>
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6' }]}
                  onPress={() => setInsightsModalVisible(false)}
                >
                  <X size={24} color={isDark ? '#FFFFFF' : colors.secondaryText} />
                </TouchableOpacity>
          </View>
              
              {insightsLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.secondaryText }]}>
                    Analyzing your energy usage patterns...
                  </Text>
            </View>
              ) : (
                <ScrollView style={styles.modalContent}>
                  <View style={styles.insightsTextContainer}>
                    <Text style={[styles.insightsText, { color: colors.text, lineHeight: 24 }]}>
                      {aiInsights}
                    </Text>
        </View>
      </ScrollView>
              )}
          </LinearGradient>
    </View>
        </View>
      </Modal>

      {/* Camera Analysis Modal */}
      {cameraModalVisible && (
        <CameraSustainabilityAnalysis
          visible={cameraModalVisible}
          onClose={handleCloseCamera}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
    marginRight: 40, // Balance the back button
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(243, 244, 246, 0.8)',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  activePeriod: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios: {
    shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
    elevation: 2,
  },
    }),
  },
  periodText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  realTimeContainer: {
    borderRadius: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
    shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  realTimeGradient: {
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  realTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  realTimeLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  realTimeValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  realTimeUnit: {
    fontSize: 16,
    color: '#6B7280',
  },
  liveBadge: {
    flexDirection: 'row',
    backgroundColor: '#DCFCE7',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveBadgeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  liveBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  scrollView: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  statsContainer: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
    shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
    shadowRadius: 8,
  },
      android: {
        elevation: 4,
      },
    }),
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
    shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  chartContainer: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
    shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 20,
    textAlign: 'center',
  },
  chartContent: {
    flexDirection: 'row',
    height: 200,
    alignItems: 'flex-end',
  },
  barContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  barColumn: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    flex: 1,
  },
  barAndValue: {
    height: 180,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  valueLabel: {
    fontSize: 10,
    marginBottom: 2,
    fontWeight: '500',
  },
  barBackground: {
    width: 16,
    height: '100%',
    backgroundColor: 'rgba(229, 231, 235, 0.3)',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    marginTop: 6,
    textAlign: 'center',
  },
  liveIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
    opacity: 0.8,
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  hourlyChartContainer: {
    padding: 10,
  },
  hourlyChartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  hourlyChartTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  liveIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '500',
  },
  hourlyChartBody: {
    flexDirection: 'row',
    height: 180,
    justifyContent: 'space-around',
  },
  hourlyBarColumn: {
    flex: 1,
    alignItems: 'center',
  },
  hourlyBarContainer: {
    height: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: 40,
  },
  hourlyValueLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginBottom: 4,
  },
  hourlyBarBg: {
    width: 20,
    height: '80%',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  hourlyBarFill: {
    width: '100%',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  hourlyTimeLabel: {
    fontSize: 10,
    marginTop: 8,
  },
  pulsingDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    opacity: 0.7,
  },
  breakdownContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 2,
  },
  breakdownTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  breakdownChart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 200,
    alignItems: 'flex-end',
  },
  breakdownItem: {
    alignItems: 'center',
    width: '22%',
  },
  breakdownBarContainer: {
    height: 140,
    width: '50%',
    justifyContent: 'flex-end',
  },
  breakdownBar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  breakdownPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
  },
  breakdownCategory: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  insightsButton: {
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  insightsGradient: {
    padding: 20,
    borderRadius: 16,
  },
  insightsButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  insightsIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  insightsTextContainer: {
    flex: 1,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  insightsSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  insightsArrow: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    borderRadius: 20,
    width: '90%',
    maxWidth: 500,
    maxHeight: '85%',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  modalGradient: {
    padding: 24,
    borderRadius: 20,
    height: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
  },
  insightsText: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    paddingBottom: 20,
  },
  impactContainer: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  impactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  impactDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  impactMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  impactMetric: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    minWidth: '40%',
  },
  impactValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  impactLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  cameraButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 