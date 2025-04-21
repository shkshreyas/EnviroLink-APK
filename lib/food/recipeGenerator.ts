import Constants from 'expo-constants';

export interface RecipeSuggestion {
  title: string;
  ingredientsUsed: string[];  // Ingredients from user's inventory
  otherIngredients: string[]; // Additional ingredients needed
  instructions: string;
}

// Get the API key from environment variables
const getApiKey = () => {
  // Try all possible sources for the API key
  const apiKey =
    Constants.expoConfig?.extra?.geminiApiKey ||
    process.env.EXPO_PUBLIC_GEMINI_API_KEY;

  return apiKey;
};

// System prompt specifically for food waste reduction recipes
const RECIPE_SYSTEM_PROMPT = `
You are a creative chef specializing in reducing food waste. Your goal is to suggest recipes that use ingredients that are about to expire.

When suggesting recipes, you MUST:
- Create practical, easy-to-follow recipes using the provided ingredients
- Focus on using as many of the expiring ingredients as possible
- Keep the recipes simple, with clear instructions
- Suggest recipes that require minimal additional ingredients
- Ensure recipes are appealing and delicious, not just practical
- Format each recipe consistently with a title, ingredients used, other ingredients needed, and simple instructions

Your tone should be helpful and encouraging. Present recipes in a clear, structured format.
`;

/**
 * Generates recipe suggestions based on ingredients
 * @param {string[]} ingredients - Array of ingredients to use in recipes
 * @returns {Promise<RecipeSuggestion[]>} Recipe suggestions
 */
export async function generateRecipes(ingredients: string[]): Promise<RecipeSuggestion[]> {
  try {
    const apiKey = getApiKey();

    if (!apiKey) {
      console.warn('Gemini API key not found, using fallback recipes');
      return generateFallbackRecipes(ingredients);
    }

    console.log('Connecting to Gemini API for recipe suggestions...');

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
                { text: RECIPE_SYSTEM_PROMPT },
                { 
                  text: `I have the following ingredients that need to be used soon: ${ingredients.join(', ')}. 
                  Please suggest 3 recipes that use these ingredients. Format each recipe with title, ingredients from my list that are used, other ingredients I might need, and simple instructions.` 
                }
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 32,
            topP: 0.95,
            maxOutputTokens: 800,
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
      return generateFallbackRecipes(ingredients);
    }

    const result = await response.json();

    if (
      result.candidates &&
      result.candidates.length > 0 &&
      result.candidates[0].content &&
      result.candidates[0].content.parts &&
      result.candidates[0].content.parts.length > 0
    ) {
      // Parse the response into recipe suggestions
      const text = result.candidates[0].content.parts[0].text;
      return parseRecipesFromResponse(text, ingredients);
    } else {
      console.error('Unexpected Gemini API response format:', JSON.stringify(result, null, 2));
      return generateFallbackRecipes(ingredients);
    }
  } catch (error) {
    console.error('Error generating recipes:', error);
    return generateFallbackRecipes(ingredients);
  }
}

/**
 * Parse recipe suggestions from API response text
 */
function parseRecipesFromResponse(text: string, userIngredients: string[]): RecipeSuggestion[] {
  // This is a simplified parser - in a real app, you'd want more robust parsing
  const recipes: RecipeSuggestion[] = [];
  
  // Split the text into recipe sections (assuming each recipe starts with a number or title)
  const recipeRegex = /(?:^|\n)(?:\d+\.\s*|Recipe\s*\d+:\s*|)([\w\s&'-]+)(?:\n|:)/gi;
  let match;
  let lastIndex = 0;
  
  while ((match = recipeRegex.exec(text)) !== null) {
    const title = match[1].trim();
    const startIndex = match.index;
    const endIndex = text.indexOf('\n\n', startIndex + title.length);
    const recipeText = text.substring(startIndex, endIndex > 0 ? endIndex : undefined);
    
    // Extract ingredients used from user's list
    const ingredientsUsed: string[] = [];
    userIngredients.forEach(ingredient => {
      if (recipeText.toLowerCase().includes(ingredient.toLowerCase())) {
        ingredientsUsed.push(ingredient);
      }
    });
    
    // Simple extraction of other ingredients and instructions (this is simplified)
    let otherIngredients: string[] = [];
    let instructions = "";
    
    const ingredientsMatch = recipeText.match(/(?:Other )?Ingredients(?:[:\n]|\s+needed:)([\s\S]*?)(?:Instructions|Directions|Steps|Method):/i);
    const instructionsMatch = recipeText.match(/(?:Instructions|Directions|Steps|Method):([^]*?)(?:$|\n\n\d+\.)/i);
    
    if (ingredientsMatch && ingredientsMatch[1]) {
      // Process ingredients, removing the ones from user's list
      const allIngredients = ingredientsMatch[1]
        .split('\n')
        .map(line => line.replace(/^[-•*]\s*/, '').trim())
        .filter(line => line.length > 0);
      
      otherIngredients = allIngredients.filter(ing => 
        !ingredientsUsed.some(used => ing.toLowerCase().includes(used.toLowerCase()))
      );
    }
    
    if (instructionsMatch && instructionsMatch[1]) {
      instructions = instructionsMatch[1]
        .split('\n')
        .map(line => line.replace(/^[-•*\d]\s*\.?\s*/, '').trim())
        .filter(line => line.length > 0)
        .join(' ');
    }
    
    recipes.push({
      title,
      ingredientsUsed,
      otherIngredients: otherIngredients.length > 0 ? otherIngredients : ["Salt and pepper to taste"],
      instructions: instructions || "Mix all ingredients and cook until done."
    });
    
    lastIndex = recipeRegex.lastIndex;
  }
  
  // If parsing failed, return at least one recipe with the ingredients
  if (recipes.length === 0) {
    const fallback = generateFallbackRecipes(userIngredients);
    return fallback;
  }
  
  return recipes;
}

/**
 * Generate fallback recipes when the API is unavailable
 */
function generateFallbackRecipes(ingredients: string[]): RecipeSuggestion[] {
  // Simple fallback recipes based on common ingredients
  const recipes: RecipeSuggestion[] = [];
  
  // Define some template recipes
  const templates = [
    {
      title: "Quick Stir Fry",
      baseIngredients: ["vegetables", "garlic", "onion"],
      otherIngredients: ["soy sauce", "olive oil", "salt", "pepper"],
      instructions: "Heat oil in a pan. Add garlic and onion, cook until fragrant. Add vegetables and stir fry until tender. Season with soy sauce, salt and pepper to taste."
    },
    {
      title: "Simple Pasta",
      baseIngredients: ["pasta", "tomato", "cheese"],
      otherIngredients: ["olive oil", "garlic", "salt", "pepper", "herbs"],
      instructions: "Cook pasta according to package instructions. In a separate pan, heat olive oil and sauté garlic. Add tomatoes and cook for 5 minutes. Toss with pasta, top with cheese, and season to taste."
    },
    {
      title: "Hearty Soup",
      baseIngredients: ["vegetables", "potato", "onion"],
      otherIngredients: ["vegetable broth", "salt", "pepper", "herbs"],
      instructions: "In a large pot, sauté onions until translucent. Add vegetables and potatoes, cook for 5 minutes. Add broth, bring to a boil, then simmer until vegetables are tender. Season with salt, pepper, and herbs."
    },
    {
      title: "Breakfast Scramble",
      baseIngredients: ["eggs", "cheese", "vegetables"],
      otherIngredients: ["butter", "salt", "pepper"],
      instructions: "Whisk eggs in a bowl. Heat butter in a pan, add vegetables and cook until tender. Pour in eggs, stir gently until scrambled. Top with cheese and season with salt and pepper."
    },
    {
      title: "Quick Salad",
      baseIngredients: ["lettuce", "vegetables", "cheese"],
      otherIngredients: ["olive oil", "vinegar", "salt", "pepper"],
      instructions: "Wash and chop lettuce and vegetables. Combine in a bowl. Make a simple dressing with olive oil, vinegar, salt and pepper. Toss salad with dressing and top with cheese."
    }
  ];
  
  // Categorize ingredients
  const categorizedIngredients = {
    vegetables: ["spinach", "lettuce", "tomato", "carrot", "cucumber", "bell pepper", "onion", "garlic", "potato", "broccoli", "zucchini"],
    proteins: ["chicken", "beef", "pork", "tofu", "eggs", "fish", "shrimp"],
    dairy: ["milk", "cheese", "yogurt", "butter", "cream"],
    grains: ["rice", "pasta", "bread", "quinoa", "oats"],
    fruits: ["apple", "banana", "orange", "berries", "lemon"]
  };
  
  // Find matching ingredients for each template
  templates.forEach(template => {
    const matchingUserIngredients: string[] = [];
    
    // Check if any user ingredients match the base ingredients or categories
    ingredients.forEach(userIngredient => {
      const lowerUserIngredient = userIngredient.toLowerCase();
      
      // Check direct match with base ingredients
      if (template.baseIngredients.some(baseIng => lowerUserIngredient.includes(baseIng))) {
        matchingUserIngredients.push(userIngredient);
      } else {
        // Check if ingredient belongs to a category used in this template
        for (const [category, items] of Object.entries(categorizedIngredients)) {
          if (items.some(item => lowerUserIngredient.includes(item)) && 
              template.baseIngredients.includes(category)) {
            matchingUserIngredients.push(userIngredient);
            break;
          }
        }
      }
    });
    
    // If we have enough matching ingredients, create a recipe
    if (matchingUserIngredients.length >= 2) {
      recipes.push({
        title: template.title,
        ingredientsUsed: matchingUserIngredients,
        otherIngredients: template.otherIngredients,
        instructions: template.instructions
      });
    }
  });
  
  // If no templates matched, create a generic recipe
  if (recipes.length === 0) {
    recipes.push({
      title: "Quick Save Recipe",
      ingredientsUsed: ingredients,
      otherIngredients: ["salt", "pepper", "olive oil"],
      instructions: "Combine all the ingredients in a suitable way based on their cooking requirements. Season with salt and pepper to taste. Optionally, add olive oil for more flavor."
    });
  }
  
  return recipes.slice(0, 3); // Return up to 3 recipes
} 