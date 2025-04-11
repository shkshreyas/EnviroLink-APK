import Constants from 'expo-constants';

// Get the API key from environment variables
const ENERGY_API_KEY = Constants.expoConfig?.extra?.energyApiKey || 
                       process.env.EXPO_PUBLIC_ENERGY_API_KEY || '';

// Energy API base URL - using a free mock API service                     
const API_BASE_URL = 'https://api.energydata.info/v1';

// Type definitions
export interface EnergyReading {
  timestamp: string;
  value: number;
  unit: string;
}

export interface DailyEnergyData {
  date: string;
  hourly_readings: EnergyReading[];
  total_consumption: number;
  average_consumption: number;
  peak_time: string;
  peak_value: number;
}

export interface UsageBreakdown {
  category: string;
  percentage: number;
  value: number;
  color: string;
}

export interface EnergyInsight {
  id: string;
  type: 'tip' | 'alert' | 'achievement';
  title: string;
  description: string;
  impact: number;
  priority: 'low' | 'medium' | 'high';
}

// Helper function for API calls
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 8000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${ENERGY_API_KEY}`,
        'Content-Type': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Generate realistic mock data when API is unavailable
const generateMockHourlyData = (date: Date = new Date()): EnergyReading[] => {
  const hourlyReadings: EnergyReading[] = [];
  
  // Base consumption patterns
  const morningBase = 2 + Math.random() * 3; // 2-5 kWh
  const middayBase = 4 + Math.random() * 3;  // 4-7 kWh
  const eveningPeak = 6 + Math.random() * 4; // 6-10 kWh
  const nightBase = 1 + Math.random() * 2;   // 1-3 kWh
  
  for (let hour = 0; hour < 24; hour++) {
    const timestamp = new Date(date);
    timestamp.setHours(hour, 0, 0, 0);
    
    let value: number;
    
    // Early morning (midnight to 6am)
    if (hour < 6) {
      value = nightBase * (0.8 + Math.random() * 0.4);
    }
    // Morning (6am to 11am)
    else if (hour < 11) {
      value = morningBase * (0.9 + Math.random() * 0.6);
    }
    // Midday (11am to 5pm)
    else if (hour < 17) {
      value = middayBase * (0.9 + Math.random() * 0.3);
    }
    // Evening peak (5pm to 10pm)
    else if (hour < 22) {
      value = eveningPeak * (0.9 + Math.random() * 0.2);
    }
    // Late night (10pm to midnight)
    else {
      value = nightBase * (1 + Math.random() * 0.5);
    }
    
    hourlyReadings.push({
      timestamp: timestamp.toISOString(),
      value: parseFloat(value.toFixed(2)),
      unit: 'kWh'
    });
  }
  
  return hourlyReadings;
};

// Generate realistic usage breakdown data
const generateMockUsageBreakdown = (): UsageBreakdown[] => {
  // Base percentages that roughly add up to 100%
  const lighting = 20 + Math.floor(Math.random() * 10);
  const heating = 25 + Math.floor(Math.random() * 15);
  const appliances = 15 + Math.floor(Math.random() * 10);
  const electronics = 10 + Math.floor(Math.random() * 10);
  
  // Calculate 'other' to make sure the total is 100%
  const other = 100 - (lighting + heating + appliances + electronics);
  
  return [
    { category: 'Lighting', percentage: lighting, value: lighting * 0.1, color: '#22C55E' },
    { category: 'Heating', percentage: heating, value: heating * 0.1, color: '#F59E0B' },
    { category: 'Appliances', percentage: appliances, value: appliances * 0.1, color: '#3B82F6' },
    { category: 'Electronics', percentage: electronics, value: electronics * 0.1, color: '#8B5CF6' },
    { category: 'Other', percentage: other, value: other * 0.1, color: '#EC4899' }
  ];
};

// Generate realistic energy insights
const generateMockInsights = (): EnergyInsight[] => {
  const insights: EnergyInsight[] = [
    {
      id: 'ins-1',
      type: 'tip',
      title: 'Reduce Standby Power',
      description: 'Your electronics use 12% more power in standby mode than average. Consider using power strips to completely turn off devices.',
      impact: 5.2,
      priority: 'medium'
    },
    {
      id: 'ins-2',
      type: 'alert',
      title: 'Unusual Consumption Pattern',
      description: 'Yesterday\'s evening consumption was 28% higher than your weekly average. Check if any appliances were left running.',
      impact: 3.8,
      priority: 'high'
    },
    {
      id: 'ins-3',
      type: 'achievement',
      title: 'Weekly Goal Reached',
      description: 'You\'ve reached your energy reduction goal for this week! You\'ve saved 7.5 kWh compared to last week.',
      impact: 7.5,
      priority: 'low'
    },
    {
      id: 'ins-4',
      type: 'tip',
      title: 'Optimal AC Temperature',
      description: 'Setting your AC to 78°F instead of 72°F could save up to 18% on cooling costs.',
      impact: 8.3,
      priority: 'medium'
    }
  ];
  
  // Randomly return 2-3 insights
  return insights.sort(() => 0.5 - Math.random()).slice(0, 2 + Math.floor(Math.random() * 2));
};

/**
 * Fetches daily energy consumption data for a specific date
 */
export const fetchDailyEnergyData = async (date: Date = new Date()): Promise<DailyEnergyData> => {
  const dateString = date.toISOString().split('T')[0];
  
  try {
    // In a real app, this would fetch from the actual API
    // const url = `${API_BASE_URL}/energy/daily?date=${dateString}`;
    // const data = await fetchWithTimeout(url);
    // return data;
    
    // For this demo, generate mock data
    const hourlyReadings = generateMockHourlyData(date);
    const totalConsumption = hourlyReadings.reduce((sum, reading) => sum + reading.value, 0);
    const avgConsumption = totalConsumption / 24;
    
    // Find peak time
    const peakReading = hourlyReadings.reduce((max, reading) => 
      reading.value > max.value ? reading : max, hourlyReadings[0]);
    const peakHour = new Date(peakReading.timestamp).getHours();
    const peakTime = `${peakHour}:00-${peakHour+1}:00`;
    
    return {
      date: dateString,
      hourly_readings: hourlyReadings,
      total_consumption: parseFloat(totalConsumption.toFixed(2)),
      average_consumption: parseFloat(avgConsumption.toFixed(2)),
      peak_time: peakTime,
      peak_value: peakReading.value
    };
  } catch (error) {
    console.error('Error fetching daily energy data:', error);
    throw error;
  }
};

/**
 * Fetches energy data for a week
 */
export const fetchWeeklyEnergyData = async (startDate: Date = new Date()): Promise<DailyEnergyData[]> => {
  try {
    // In a real app, this would fetch from the actual API
    // const endDate = new Date(startDate);
    // endDate.setDate(endDate.getDate() + 6);
    // const startStr = startDate.toISOString().split('T')[0];
    // const endStr = endDate.toISOString().split('T')[0];
    // const url = `${API_BASE_URL}/energy/range?start=${startStr}&end=${endStr}`;
    // const data = await fetchWithTimeout(url);
    // return data;
    
    // For this demo, generate mock data for a week
    const weekData: DailyEnergyData[] = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 7; i++) {
      currentDate.setDate(startDate.getDate() + i);
      weekData.push(await fetchDailyEnergyData(new Date(currentDate)));
    }
    
    return weekData;
  } catch (error) {
    console.error('Error fetching weekly energy data:', error);
    throw error;
  }
};

/**
 * Fetches energy usage breakdown by category
 */
export const fetchEnergyBreakdown = async (): Promise<UsageBreakdown[]> => {
  try {
    // In a real app, this would fetch from the actual API
    // const url = `${API_BASE_URL}/energy/breakdown`;
    // const data = await fetchWithTimeout(url);
    // return data;
    
    // For this demo, generate mock data
    return generateMockUsageBreakdown();
  } catch (error) {
    console.error('Error fetching energy breakdown:', error);
    throw error;
  }
};

/**
 * Fetches personalized insights and recommendations
 */
export const fetchEnergyInsights = async (): Promise<EnergyInsight[]> => {
  try {
    // In a real app, this would fetch from the actual API
    // const url = `${API_BASE_URL}/energy/insights`;
    // const data = await fetchWithTimeout(url);
    // return data;
    
    // For this demo, generate mock insights
    return generateMockInsights();
  } catch (error) {
    console.error('Error fetching energy insights:', error);
    throw error;
  }
};

/**
 * Fetches real-time energy consumption (current hour)
 */
export const fetchRealTimeEnergy = async (): Promise<EnergyReading> => {
  try {
    // In a real app, this would fetch from the actual API
    // const url = `${API_BASE_URL}/energy/realtime`;
    // const data = await fetchWithTimeout(url);
    // return data;
    
    // For this demo, generate mock real-time data
    const now = new Date();
    const hour = now.getHours();
    
    // Base value depends on time of day
    let baseValue = 2; // Default base
    
    if (hour >= 6 && hour < 11) {
      baseValue = 3 + Math.random() * 2; // Morning
    } else if (hour >= 11 && hour < 17) {
      baseValue = 4 + Math.random() * 3; // Midday
    } else if (hour >= 17 && hour < 22) {
      baseValue = 5 + Math.random() * 4; // Evening
    } else {
      baseValue = 1 + Math.random() * 1.5; // Night
    }
    
    // Add some real-time fluctuation
    const fluctuation = (Math.random() > 0.5 ? 1 : -1) * Math.random() * 0.5;
    const value = Math.max(0.1, baseValue + fluctuation);
    
    return {
      timestamp: now.toISOString(),
      value: parseFloat(value.toFixed(2)),
      unit: 'kWh'
    };
  } catch (error) {
    console.error('Error fetching real-time energy data:', error);
    throw error;
  }
};

/**
 * Gets AI-generated insights on energy usage patterns
 */
export const getAIEnergyInsights = async (data: DailyEnergyData[]): Promise<string> => {
  try {
    // In a real app, this would use the Gemini API or similar
    // For this demo, return canned insights based on patterns in the data
    
    // Calculate some basic statistics
    const totalConsumption = data.reduce((sum, day) => sum + day.total_consumption, 0);
    const avgDailyConsumption = totalConsumption / data.length;
    
    // Find highest and lowest consumption days
    const sortedDays = [...data].sort((a, b) => b.total_consumption - a.total_consumption);
    const highestDay = sortedDays[0];
    const lowestDay = sortedDays[sortedDays.length - 1];
    
    // Check for patterns
    const morningHeavy = data.some(day => 
      day.hourly_readings.slice(6, 11).reduce((sum, hr) => sum + hr.value, 0) > 
      day.hourly_readings.slice(17, 22).reduce((sum, hr) => sum + hr.value, 0) * 1.3
    );
    
    const eveningHeavy = data.some(day => 
      day.hourly_readings.slice(17, 22).reduce((sum, hr) => sum + hr.value, 0) > 
      day.hourly_readings.slice(6, 11).reduce((sum, hr) => sum + hr.value, 0) * 1.3
    );
    
    // Generate insights
    let insights = `Your average daily energy consumption is ${avgDailyConsumption.toFixed(2)} kWh. `;
    
    insights += `Your highest usage was on ${new Date(highestDay.date).toLocaleDateString('en-US', { weekday: 'long' })} at ${highestDay.total_consumption.toFixed(2)} kWh, while your lowest was on ${new Date(lowestDay.date).toLocaleDateString('en-US', { weekday: 'long' })} at ${lowestDay.total_consumption.toFixed(2)} kWh. `;
    
    if (morningHeavy) {
      insights += `You tend to use more energy in the mornings. Consider using energy-intensive appliances during off-peak hours to reduce costs. `;
    }
    
    if (eveningHeavy) {
      insights += `Your evening energy usage is substantially higher than other times. Try to distribute your energy usage throughout the day to avoid peak rates. `;
    }
    
    insights += `Based on your patterns, you could save approximately ${(totalConsumption * 0.15).toFixed(2)} kWh per week by optimizing your usage times and unplugging devices when not in use.`;
    
    return insights;
  } catch (error) {
    console.error('Error getting AI energy insights:', error);
    return 'Unable to generate energy insights at this time. Please try again later.';
  }
}; 