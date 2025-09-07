import Replicate from 'replicate';
import Constants from 'expo-constants';

/**
 * Configuration Replicate API
 */
const getReplicateConfig = () => {
  // Essayer plusieurs sources pour la clé API
  const apiToken = 
    Constants.expoConfig?.extra?.EXPO_PUBLIC_VIBECODE_REPLICATE_API_TOKEN ||
    Constants.manifest?.extra?.EXPO_PUBLIC_VIBECODE_REPLICATE_API_TOKEN ||
    process.env.EXPO_PUBLIC_VIBECODE_REPLICATE_API_TOKEN ||
    'r8_bVgJwwYprd6U4jZbu0SLw76R0m7DkAG0RK1Gf'; // Fallback hardcodé

  console.log('🔑 Replicate API Token:', apiToken ? `${apiToken.substring(0, 8)}...` : 'Non trouvé');

  return {
    apiToken,
    model: 'openai/gpt-4.1-mini'
  };
};

/**
 * Client Replicate configuré
 */
let replicateClient: Replicate | null = null;

const getReplicateClient = () => {
  if (!replicateClient) {
    const config = getReplicateConfig();
    replicateClient = new Replicate({
      auth: config.apiToken,
    });
  }
  return replicateClient;
};

/**
 * Analyser une image avec GPT-4.1-mini via Replicate
 */
export const analyzeImageWithReplicate = async (
  imageUri: string, 
  prompt: string,
  systemPrompt: string = "You are a helpful nutrition assistant."
): Promise<string> => {
  try {
    console.log('🖼️ Analyse image avec Replicate GPT-4.1-mini...');
    console.log('📝 Prompt:', prompt);
    
    const replicate = getReplicateClient();
    const config = getReplicateConfig();
    
    const input = {
      prompt,
      image_input: [imageUri],
      system_prompt: systemPrompt
    };

    console.log('📤 Envoi requête Replicate:', {
      model: config.model,
      imageUri: imageUri.substring(0, 50) + '...',
      promptLength: prompt.length
    });

    let fullResponse = '';
    
    // Utiliser le streaming API
    for await (const event of replicate.stream(config.model, { input })) {
      fullResponse += event;
    }

    console.log('✅ Réponse Replicate reçue:', fullResponse.substring(0, 200) + '...');
    return fullResponse;

  } catch (error) {
    console.error('❌ Erreur Replicate:', error);
    
    // Messages d'erreur spécifiques
    if (error instanceof Error) {
      if (error.message.includes('authentication')) {
        throw new Error('Erreur d\'authentification Replicate. Vérifiez votre token API.');
      }
      if (error.message.includes('rate limit')) {
        throw new Error('Limite de taux Replicate atteinte. Réessayez dans quelques minutes.');
      }
      if (error.message.includes('model')) {
        throw new Error('Modèle GPT-4.1-mini non disponible via Replicate.');
      }
    }
    
    throw new Error(`Erreur analyse image Replicate: ${error}`);
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
 * Estimer les valeurs nutritionnelles avec GPT-4.1-mini
 */
export const estimateNutritionWithReplicate = async (foodName: string): Promise<any> => {
  try {
    console.log('🧮 Estimation nutritionnelle Replicate pour:', foodName);
    
    const replicate = getReplicateClient();
    const config = getReplicateConfig();
    
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

    const input = {
      prompt: nutritionPrompt,
      system_prompt: "You are a nutrition database providing accurate nutritional data."
    };

    let response = '';
    for await (const event of replicate.stream(config.model, { input })) {
      response += event;
    }

    // Parser la réponse JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const nutritionData = JSON.parse(jsonMatch[0]);
      console.log('✅ Données nutritionnelles Replicate:', nutritionData);
      return nutritionData;
    }

    throw new Error('Format de réponse invalide');

  } catch (error) {
    console.error('❌ Erreur estimation Replicate:', error);
    
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
 * Test de connexion Replicate
 */
export const testReplicateConnection = async (): Promise<boolean> => {
  try {
    console.log('🧪 Test connexion Replicate...');
    
    const testResponse = await analyzeImageWithReplicate(
      'https://replicate.delivery/pbxt/MvoFggJfmpSOBa0TiiQbvxLc0eS7u6CpH2WHaq30FZCVIvFa/test.jpg',
      'Describe this image briefly',
      'You are a helpful assistant.'
    );
    
    console.log('✅ Test Replicate réussi:', testResponse.substring(0, 100));
    return true;
    
  } catch (error) {
    console.error('❌ Test Replicate échoué:', error);
    return false;
  }
};

export default {
  analyzeImageWithReplicate,
  analyzeNutritionImage,
  estimateNutritionWithReplicate,
  testReplicateConnection,
  getReplicateConfig
};
