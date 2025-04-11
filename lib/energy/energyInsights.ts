import Constants from 'expo-constants';
import { DailyEnergyData } from './api';

// Get the API key from environment variables
const getApiKey = () => {
  // Try all possible sources for the API key
  const apiKey =
    Constants.expoConfig?.extra?.geminiApiKey ||
    process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  return apiKey;
};

// System prompt specifically for energy analysis
const ENERGY_SYSTEM_PROMPT = `
You are an advanced energy analysis AI within the EnviroLink app.
Your purpose is to provide personalized, actionable insights about a user's energy consumption patterns.

When analyzing energy data, you MUST:
- Focus on practical energy-saving recommendations based on usage patterns
- Identify peak usage times and suggest ways to shift energy consumption to off-peak hours
- Highlight potential energy waste and opportunities for efficiency improvements
- Keep responses concise and direct (maximum 5 sentences total)
- Use simple language without technical jargon
- Avoid using headings, bullet points, or markdown formatting

Your tone should be helpful and informative. Present insights in simple paragraph form.
`;

/**
 * Generates energy insights using Gemini API
 * @param {DailyEnergyData[]} data - Array of daily energy data
 * @returns {Promise<string>} Energy insights text
 */
export async function generateEnergyInsights(data: DailyEnergyData[]): Promise<string> {
  try {
    const apiKey = getApiKey();

    if (!apiKey) {
      console.warn('Gemini API key not found, using fallback insights');
      return generateFallbackInsights(data);
    }

    console.log('Connecting to Gemini API for energy insights...');

    // Prepare the data for the API call
    // Format the data to be more concise while preserving key information
    const formattedData = formatDataForGemini(data);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: ENERGY_SYSTEM_PROMPT },
                { 
                  text: `Here is my energy consumption data for analysis: ${formattedData}. 
                  Based on this data, provide me with personalized energy insights and recommendations to reduce my energy usage and costs.` 
                }
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 300,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      return generateFallbackInsights(data);
    }

    const result = await response.json();

    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content &&
      result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0
    ) {
      return result.candidates[0].content.parts[0].text;
    } else {
      console.error('Unexpected Gemini API response format:', JSON.stringify(result, null, 2));
      return generateFallbackInsights(data);
    }
  } catch (error) {
    console.error('Error generating energy insights:', error);
    return generateFallbackInsights(data);
  }
}

/**
 * Format energy data into a concise string for the Gemini API
 */
function formatDataForGemini(data: DailyEnergyData[]): string {
  // Calculate some basic statistics
  const totalConsumption = data.reduce((sum, day) => sum + day.total_consumption, 0);
  const avgDailyConsumption = totalConsumption / data.length;
  
  // Find highest and lowest consumption days
  const sortedDays = [...data].sort((a, b) => b.total_consumption - a.total_consumption);
  const highestDay = sortedDays[0];
  const lowestDay = sortedDays[sortedDays.length - 1];
  
  // Get daily consumption summary
  const dailySummary = data.map(day => 
    `${new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}: ${day.total_consumption.toFixed(2)} kWh (peak: ${day.peak_time})`
  ).join('; ');
  
  // Find common patterns
  const morningUsage = data.reduce((sum, day) => 
    sum + day.hourly_readings.slice(6, 12).reduce((s, r) => s + r.value, 0), 0) / data.length;
  
  const afternoonUsage = data.reduce((sum, day) => 
    sum + day.hourly_readings.slice(12, 18).reduce((s, r) => s + r.value, 0), 0) / data.length;
  
  const eveningUsage = data.reduce((sum, day) => 
    sum + day.hourly_readings.slice(18, 24).reduce((s, r) => s + r.value, 0), 0) / data.length;
  
  const nightUsage = data.reduce((sum, day) => 
    sum + day.hourly_readings.slice(0, 6).reduce((s, r) => s + r.value, 0), 0) / data.length;
  
  return `
    Period: ${data.length} days
    Average daily usage: ${avgDailyConsumption.toFixed(2)} kWh
    Highest day: ${new Date(highestDay.date).toLocaleDateString('en-US', { weekday: 'long' })} (${highestDay.total_consumption.toFixed(2)} kWh)
    Lowest day: ${new Date(lowestDay.date).toLocaleDateString('en-US', { weekday: 'long' })} (${lowestDay.total_consumption.toFixed(2)} kWh)
    Morning usage (6am-12pm): ${morningUsage.toFixed(2)} kWh
    Afternoon usage (12pm-6pm): ${afternoonUsage.toFixed(2)} kWh
    Evening usage (6pm-12am): ${eveningUsage.toFixed(2)} kWh
    Night usage (12am-6am): ${nightUsage.toFixed(2)} kWh
    Daily summary: ${dailySummary}
  `;
}

/**
 * Generate fallback insights when the API is unavailable
 */
function generateFallbackInsights(data: DailyEnergyData[]): string {
  // Calculate some basic statistics
  const totalConsumption = data.reduce((sum, day) => sum + day.total_consumption, 0);
  const avgDailyConsumption = totalConsumption / data.length;
  
  // Find highest and lowest consumption days
  const sortedDays = [...data].sort((a, b) => b.total_consumption - a.total_consumption);
  const highestDay = sortedDays[0];
  const lowestDay = sortedDays[sortedDays.length - 1];
  
  // Check for patterns
  const morningHeavy = data.some(day => {
    const morningTotal = day.hourly_readings.slice(6, 12).reduce((sum, hr) => sum + hr.value, 0);
    const eveningTotal = day.hourly_readings.slice(17, 23).reduce((sum, hr) => sum + hr.value, 0);
    return morningTotal > eveningTotal * 1.25;
  });
  
  const eveningHeavy = data.some(day => {
    const morningTotal = day.hourly_readings.slice(6, 12).reduce((sum, hr) => sum + hr.value, 0);
    const eveningTotal = day.hourly_readings.slice(17, 23).reduce((sum, hr) => sum + hr.value, 0);
    return eveningTotal > morningTotal * 1.25;
  });
  
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
} 