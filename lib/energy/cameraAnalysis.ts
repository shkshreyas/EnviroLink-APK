import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';

// Get the API key from environment variables
const getApiKey = () => {
  const apiKey =
    Constants.expoConfig?.extra?.geminiApiKey ||
    process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  return apiKey;
};

// System prompt specifically for sustainability image analysis
const SUSTAINABILITY_IMAGE_PROMPT = `
You are an advanced sustainability analysis AI within the EnviroLink app.
Your purpose is to analyze images and provide sustainability insights and recommendations.

When analyzing an image, you MUST:
- Focus on environmental and social sustainability aspects visible in the image
- Identify potential sustainability issues, improvements, or positive practices
- Provide practical, actionable recommendations for improving sustainability
- Keep responses concise and direct (maximum 5 sentences total)
- Use simple language without technical jargon
- Avoid using headings, bullet points, or markdown formatting

Your tone should be helpful and informative. Present insights in simple paragraph form.
If you can't clearly analyze the image, be honest and suggest taking another photo.
`;

/**
 * Converts an image to base64
 */
export const imageToBase64 = async (uri: string): Promise<string> => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

/**
 * Analyzes an image for sustainability aspects using Gemini API
 */
export const analyzeSustainabilityImage = async (
  imageUri: string
): Promise<string> => {
  try {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      console.warn('Gemini API key not found');
      return 'Unable to analyze image. API key not available.';
    }
    
    console.log('Converting image to base64...');
    const base64Image = await imageToBase64(imageUri);
    
    console.log('Connecting to Gemini API for image analysis...');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro-vision:generateContent?key=${apiKey}`,
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
                { text: SUSTAINABILITY_IMAGE_PROMPT },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: base64Image
                  }
                },
                { 
                  text: "Analyze this image for sustainability aspects and provide actionable insights. Focus on both environmental and social well-being factors." 
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
      return 'Failed to analyze the image. Please try again later.';
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
      return 'Unable to analyze the image. Please try again with a clearer photo.';
    }
  } catch (error) {
    console.error('Error analyzing image:', error);
    return 'An error occurred while analyzing the image. Please try again.';
  }
}; 