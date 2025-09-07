// Using OpenAI instead of Replicate for better compatibility
import { getOpenAIClient } from './openai';

/**
 * Configuration for OpenAI-based analysis (replacing Replicate)
 */
const getAnalysisConfig = () => {
  return {
    model: 'gpt-4o',
    maxTokens: 2048,
    temperature: 0.7
  };
};

/**
 * Analyze an image with OpenAI GPT-4o (replacing Replicate)
 */
export const analyzeImageWithReplicate = async (
  imageUri: string, 
  prompt: string,
  systemPrompt: string = "You are a helpful nutrition assistant."
): Promise<string> => {
  try {
    console.log('🖼️ Analyse image avec OpenAI GPT-4o...');
    console.log('📝 Prompt:', prompt);
    
    const client = getOpenAIClient();
    const config = getAnalysisConfig();
    
    const response = await client.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: imageUri.startsWith('data:') ? imageUri : `data:image/jpeg;base64,${imageUri}`,
              },
            },
          ],
        },
      ],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    });

    const fullResponse = response.choices[0]?.message?.content || "";
    console.log('✅ Réponse OpenAI reçue:', fullResponse.substring(0, 200) + '...');
    return fullResponse;

  } catch (error) {
    console.error('❌ Erreur OpenAI:', error);
    
    // Messages d'erreur spécifiques
    if (error instanceof Error) {
      if (error.message.includes('authentication')) {
        throw new Error('Erreur d\'authentification OpenAI. Vérifiez votre token API.');
      }
      if (error.message.includes('rate limit')) {
        throw new Error('Limite de taux OpenAI atteinte. Réessayez dans quelques minutes.');
      }
      if (error.message.includes('model')) {
        throw new Error('Modèle GPT-4o non disponible via OpenAI.');
      }
    }
    
    throw new Error(`Erreur analyse image OpenAI: ${error}`);
  }
};

/**
 * Analyser le contenu nutritionnel d'une image
 */
export const analyzeNutritionImage = async (imageUri: string): Promise<string> => {
  const nutritionPrompt = `Analyze this food image and identify all food items visible. 
For each food item, provide:
1. Food name (simple, no formatting)
2. Estimated portion scale (0.5 = half portion, 1.0 = standard, 2.0 = double portion)
3. Brief reasoning for the scale estimate

Respond ONLY with food lines in this EXACT format:
FOOD_NAME | SCALE_FACTOR | REASONING

Rules:
- Use simple food names (no asterisks, parentheses, or formatting)
- Scale based on visual portion size compared to standard servings
- Do NOT include headers, separators, or explanatory text
- Maximum 6 foods per image
- If no food is visible, respond with "No food detected"`;

  const systemPrompt = "You are a professional nutritionist analyzing food images for portion estimation.";

  return analyzeImageWithReplicate(imageUri, nutritionPrompt, systemPrompt);
};

/**
 * Estimer les valeurs nutritionnelles avec OpenAI GPT-4o
 */
export const estimateNutritionWithReplicate = async (foodName: string): Promise<any> => {
  try {
    console.log('🧮 Estimation nutritionnelle OpenAI pour:', foodName);
    
    const client = getOpenAIClient();
    const config = getAnalysisConfig();
    
    const nutritionPrompt = `Provide realistic nutritional information for "${foodName}" per 100g in JSON format:
{
  "calories": number,
  "protein": number,
  "carbs": number,
  "fat": number,
  "fiber": number,
  "sugar": number,
  "sodium": number
}

Be accurate based on the food type. Respond ONLY with valid JSON, no explanations.`;

    const response = await client.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: "system",
          content: "You are a nutrition database providing accurate nutritional data."
        },
        {
          role: "user",
          content: nutritionPrompt
        }
      ],
      max_tokens: config.maxTokens,
      temperature: config.temperature,
    });

    const responseContent = response.choices[0]?.message?.content || "";

    // Parser la réponse JSON
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const nutritionData = JSON.parse(jsonMatch[0]);
      console.log('✅ Données nutritionnelles OpenAI:', nutritionData);
      return nutritionData;
    }

    throw new Error('Format de réponse invalide');

  } catch (error) {
    console.error('❌ Erreur estimation OpenAI:', error);
    
    // Fallback avec valeurs par défaut
    return {
      calories: 150,
      protein: 5,
      carbs: 20,
      fat: 5,
      fiber: 2,
      sugar: 3,
      sodium: 100
    };
  }
};

/**
 * Test de connexion OpenAI
 */
export const testReplicateConnection = async (): Promise<boolean> => {
  try {
    console.log('🧪 Test connexion OpenAI...');
    
    const testResponse = await analyzeImageWithReplicate(
      'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      'Describe this image briefly',
      'You are a helpful assistant.'
    );
    
    console.log('✅ Test OpenAI réussi:', testResponse.substring(0, 100));
    return true;
    
  } catch (error) {
    console.error('❌ Test OpenAI échoué:', error);
    return false;
  }
};

// Named exports for compatibility
export { analyzeNutritionImage, estimateNutritionWithReplicate as estimateNutritionWithOpenAI };

export default {
  analyzeImageWithReplicate,
  analyzeNutritionImage,
  estimateNutritionWithReplicate,
  testReplicateConnection,
  getAnalysisConfig: getAnalysisConfig
};