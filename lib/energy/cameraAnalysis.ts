import { GoogleGenerativeAI } from '@google/generative-ai';
import * as FileSystem from 'expo-file-system';

export const getApiKey = (): string => {
  // In a real app, you would securely retrieve the API key from environment variables
  // or a secure storage solution
  // For development, we're using a placeholder
  return process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
};

// System prompt for the sustainability image analysis
export const SUSTAINABILITY_IMAGE_PROMPT = `
You are a sustainability expert analyzing images of everyday objects and environments.
Your task is to provide insights on the sustainability aspects of what you see in the image.

For each image:
1. Identify the main objects or environments visible.
2. Assess their potential environmental impact.
3. Suggest more sustainable alternatives if applicable.
4. Provide practical tips for improving the sustainability of what's shown.

Keep your analysis concise, informative, and actionable. Focus on scientifically accurate 
information and avoid speculation. Your goal is to educate users on making more sustainable 
choices in their daily lives.

Do not include markdowns, headings, or bullet points in your response. Provide a continuous
paragraph of insights that is easy to read on a mobile device.
`;

/**
 * Converts an image file to base64 format
 * @param uri The local URI of the image file
 * @returns A promise that resolves to a base64 string
 */
export const imageToBase64 = async (uri: string): Promise<string> => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error('Failed to convert image');
  }
};

/**
 * Analyzes an image for sustainability aspects using the Gemini API
 * @param imageUri The local URI of the image to analyze
 * @returns A promise that resolves to a string containing the sustainability analysis
 */
export const analyzeSustainabilityImage = async (imageUri: string): Promise<string> => {
  try {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      console.warn('No API key found for Gemini');
      return generateFallbackImageAnalysis();
    }

    // Convert image to base64
    const base64Image = await imageToBase64(imageUri);
    
    // Initialize the Gemini API client
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    // Prepare the image data
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: 'image/jpeg',
      },
    };
    
    // Generate content with the image
    const result = await model.generateContent([
      SUSTAINABILITY_IMAGE_PROMPT,
      imagePart,
    ]);
    
    const response = result.response;
    const text = response.text();
    
    if (!text) {
      return generateFallbackImageAnalysis();
    }
    
    return text;
  } catch (error) {
    console.error('Error analyzing image:', error);
    return generateFallbackImageAnalysis();
  }
};

/**
 * Generates a fallback analysis when the API call fails
 * @returns A string containing a generic sustainability analysis
 */
const generateFallbackImageAnalysis = (): string => {
  const fallbackResponses = [
    "This appears to be a consumer product. Many everyday items contribute to environmental impact through their production, use, and disposal. Consider researching the brand's sustainability practices and looking for eco-friendly alternatives that are made with recycled materials, have minimal packaging, or are designed for longevity. When disposing of items, always check if they can be recycled or repurposed rather than sending them to landfill.",
    
    "I notice what looks like a household setting. Home environments often present many opportunities for sustainable improvements. Consider energy efficiency through LED lighting, water conservation with low-flow fixtures, and reducing standby power consumption by unplugging electronics when not in use. Small changes like using reusable alternatives to disposable products can have a significant positive impact over time.",
    
    "The image shows what appears to be everyday objects. When considering sustainability in our daily lives, it's important to assess the lifecycle of the products we use - from raw material extraction to manufacturing, distribution, use, and disposal. Look for products with environmental certifications, minimal packaging, and those made by companies with transparent sustainability commitments. Remember that the most sustainable product is often the one you already own and can continue to use.",
  ];
  
  // Return a random fallback response
  const randomIndex = Math.floor(Math.random() * fallbackResponses.length);
  return fallbackResponses[randomIndex];
}; 