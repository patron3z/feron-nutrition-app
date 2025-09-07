import { getOpenAITextResponse } from "./chat-service";
import { Food } from "../types/nutrition";

export interface NutritionAnalysisResult {
  foods: Food[];
  confidence: number;
  suggestions?: string[];
}

/**
 * Analyze food description and extract nutritional information using AI
 */
export const analyzeFood = async (description: string): Promise<NutritionAnalysisResult> => {
  const prompt = `Analyze this food description and provide detailed nutritional information: "${description}"

Please respond with a JSON object in this exact format:
{
  "foods": [
    {
      "id": "unique_id",
      "name": "Food Name",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "fiber": number,
      "sugar": number,
      "sodium": number,
      "servingSize": "100g"
    }
  ],
  "confidence": 0.95,
  "suggestions": ["Optional suggestions for the user"]
}

Rules:
- If multiple foods are mentioned, include all of them
- Use realistic nutritional values per 100g serving
- Confidence should be between 0.1 and 1.0
- Include fiber, sugar, and sodium when possible
- If unsure about exact values, use reasonable estimates
- Keep food names simple and clear`;

  try {
    const response = await getOpenAITextResponse([
      { role: "user", content: prompt }
    ]);

    // Try to parse the JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    const result = JSON.parse(jsonMatch[0]) as NutritionAnalysisResult;
    
    // Validate the result structure
    if (!result.foods || !Array.isArray(result.foods) || result.foods.length === 0) {
      throw new Error("Invalid response structure");
    }

    // Ensure each food has required properties
    result.foods = result.foods.map((food, index) => ({
      id: food.id || `ai_food_${Date.now()}_${index}`,
      name: food.name || "Unknown food",
      calories: Math.max(0, food.calories || 0),
      protein: Math.max(0, food.protein || 0),
      carbs: Math.max(0, food.carbs || 0),
      fat: Math.max(0, food.fat || 0),
      fiber: food.fiber || 0,
      sugar: food.sugar || 0,
      sodium: food.sodium || 0,
      servingSize: food.servingSize || "100g",
      brand: "AI analyzed",
    }));

    return {
      foods: result.foods,
      confidence: Math.min(1, Math.max(0.1, result.confidence || 0.8)),
      suggestions: result.suggestions || [],
    };

  } catch (error) {
    console.error("AI nutrition analysis error:", error);
    
    // Fallback: return a basic food item
    return {
      foods: [{
        id: `fallback_${Date.now()}`,
        name: description,
        calories: 100,
        protein: 2,
        carbs: 20,
        fat: 1,
        fiber: 2,
        sugar: 5,
        sodium: 50,
        servingSize: "100g",
        brand: "Estimate",
      }],
      confidence: 0.3,
      suggestions: ["Nutrition values are estimated. Please verify with reliable sources."],
    };
  }
};

/**
 * Enhanced food analysis using USDA + Gemini API with portion scale detection
 */
export const analyzeFoodWithUSDAAndGemini = async (imageBase64?: string, description?: string): Promise<NutritionAnalysisResult> => {
  console.log('🔍 Analyse avancée avec USDA + Gemini + Scale...');
  
  try {
    // Step 1: Use Gemini to identify foods AND estimate portion scales
    const { generateContent } = await import("./gemini");
    
    let identificationPrompt = "";
    if (imageBase64) {
      identificationPrompt = `Analyze this food image and identify each visible food item with portion scales.

IMPORTANT: Respond ONLY with food lines in this EXACT format:
FOOD_NAME | SCALE_FACTOR | REASONING

Rules:
- Use simple food names (no asterisks, parentheses, or formatting)
- Scale: 0.5 = half portion, 1.0 = standard, 2.0 = double portion
- Do NOT include headers, separators, or explanatory text
- Maximum 6 foods per image

Examples:
Grilled chicken breast | 1.2 | Larger than standard portion
Rice | 0.8 | Small serving visible
Broccoli | 1.5 | Large portion on plate

Be precise with scale factors based on visual analysis.`;
    } else if (description) {
      identificationPrompt = `Identify foods in: "${description}"

IMPORTANT: Respond ONLY with food lines in this EXACT format:
FOOD_NAME | SCALE_FACTOR | REASONING

Rules:
- Use simple food names (no asterisks, parentheses, or formatting)
- Scale: 1.0 = standard serving (adjust based on description context)
- Do NOT include headers, separators, or explanatory text

Examples:
Chicken breast | 1.0 | Standard serving mentioned
Rice | 1.0 | Typical portion size`;
    } else {
      throw new Error("Either image or description is required");
    }

    const geminiResponseRaw = await generateContent(identificationPrompt);
    const geminiResponse = (geminiResponseRaw || "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/\r/g, "")
      .trim();
    console.log('🤖 Gemini identification avec scale:', geminiResponse);
    
    // Debug détaillé pour identifier les problèmes
    if (geminiResponse.toLowerCase().includes('no food') || 
        geminiResponse.toLowerCase().includes('pas de nourriture') ||
        geminiResponse.toLowerCase().includes('cannot identify')) {
      console.warn('⚠️ Gemini ne détecte pas de nourriture dans l\'image');
      console.log('💡 Suggestions: Essayez avec une image plus claire ou mieux éclairée');
    }

    // Step 2: Parse Gemini response to extract foods and scales
    const lines = geminiResponse.split('\n')
      .map((l: string) => l.trim())
      .filter((l: string) => l && !/^example:|^format:|^respond/i.test(l));

    let foodLines = lines.filter((line: string) => line.includes('|'));
    // If no pipe-delimited lines, try commas or single tokens as names with default scale
    if (foodLines.length === 0 && lines.length > 0) {
      foodLines = lines;
    }

    const foodsWithScales = foodLines.map((line: string) => {
      const parts = line.split('|').map((p: string) => p.trim());
      let name = (parts[0] || line).replace(/^[-*•]\s*/, "");
      
      // Nettoyer le nom d'aliment
      name = name
        .replace(/\*+/g, '') // Enlever tous les astérisques
        .replace(/\s*\([^)]*\)/g, '') // Enlever les (parenthèses)
        .replace(/^FOOD_NAME$/i, '') // Enlever les en-têtes de tableau
        .replace(/^-+$/, '') // Enlever les lignes de séparation
        .trim();
      
      const scale = parts.length >= 2 ? (parseFloat(parts[1]) || 1.0) : 1.0;
      const reasoning = parts.length >= 3 ? (parts[2] || "Default scale") : "Default scale";
      return { name, scale, reasoning };
    }).filter((f: any) => {
      // Filtrer les entrées vides, les en-têtes, les séparateurs et les messages "pas de nourriture"
      return !!f.name && 
             f.name.length > 0 && 
             !/^(food_name|scale_factor|reasoning|-+)$/i.test(f.name) &&
             !/^-+$/.test(f.name) &&
             !/no food|pas de nourriture|cannot identify|impossible d'identifier/i.test(f.name);
    });

    // If still empty, synthesize a single generic item
    const parsedFoods = foodsWithScales.length > 0 ? foodsWithScales : [{ name: description || "Aliment scanné", scale: 1.0, reasoning: "Default scale" }];

    console.log('📏 Aliments avec échelles détectées:', parsedFoods);

    // Step 3: Search USDA for each identified food
    const { searchFood } = await import("./usda");
    const nutritionResults: any[] = [];
    
    for (const foodWithScale of parsedFoods) {
      const currentFoodName = foodWithScale.name;
      const scale = Number.isFinite(foodWithScale.scale) ? Math.max(0.25, Math.min(4, foodWithScale.scale)) : 1.0;
      try {
        const foodName = currentFoodName;
        console.log(`🔍 Recherche USDA pour: ${foodName} (échelle: ${scale}x)`);
        const usdaResults = await searchFood(foodName, 3);
        
        if (Array.isArray(usdaResults) && usdaResults.length > 0) {
          const bestMatch = usdaResults[0];
          
          // Extract nutrition data (per 100g base)
          const baseNutrition: any = {
            id: `usda_${bestMatch.fdcId}_${scale}x`,
            name: bestMatch.description || foodName,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0,
            servingSize: `${(100 * scale).toFixed(0)}g (${scale}x scale)`,
            brand: bestMatch.brandOwner || "USDA Database",
            portionScale: scale,
            scaleReasoning: foodWithScale.reasoning
          };

          // Parse nutrition from USDA data and apply scale
          bestMatch.foodNutrients?.forEach(nutrient => {
            const nameLower = (nutrient.nutrientName || "").toLowerCase();
            const unitLower = (nutrient.unitName || "").toLowerCase();
            const baseValue = Number(nutrient.value) || 0;
            let value = baseValue;
            // Convert kJ to kcal if needed for energy
            if (nameLower.startsWith("energy") && unitLower.includes("kj")) {
              value = baseValue * 0.239;
            }
            const scaledValue = value * scale;
            switch (nameLower) {
              case 'energy':
              case 'energy (kcal)':
                baseNutrition.calories = scaledValue;
                break;
              case 'protein':
                baseNutrition.protein = scaledValue;
                break;
              case 'carbohydrate, by difference':
              case 'total carbohydrate':
              case 'carbohydrate':
              case 'carbohydrates':
                baseNutrition.carbs = scaledValue;
                break;
              case 'total lipid (fat)':
              case 'total fat':
              case 'fat':
                baseNutrition.fat = scaledValue;
                break;
              case 'fiber, total dietary':
              case 'dietary fiber':
                baseNutrition.fiber = scaledValue;
                break;
              case 'sugars, total including nlea':
              case 'total sugars':
              case 'sugars, total':
                baseNutrition.sugar = scaledValue;
                break;
              case 'sodium, na':
              case 'sodium':
                baseNutrition.sodium = scaledValue;
                break;
            }
          });

          nutritionResults.push(baseNutrition);
          console.log(`✅ USDA data avec échelle ${scale}x pour ${foodName}:`, {
            calories: Number(baseNutrition.calories || 0).toFixed(0),
            protein: Number(baseNutrition.protein || 0).toFixed(1),
            scale: scale,
            reasoning: foodWithScale.reasoning
          });
        } else {
          // Fallback to Gemini estimation with scale
          console.log(`⚠️ Pas de données USDA pour ${foodName}, utilisation Gemini avec échelle ${scale}x`);
          const estimatePrompt = `Provide nutritional information for "${foodName}" per 100g in JSON format: {"calories": number, "protein": number, "carbs": number, "fat": number, "fiber": number, "sugar": number, "sodium": number}`;
          
          const geminiNutrition = await generateContent(estimatePrompt);
          
          try {
            const jsonMatch = geminiNutrition.match(/\{[\s\S]*\}/);
            const nutritionData = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
            
            nutritionResults.push({
              id: `gemini_${Date.now()}_${foodName.replace(/\s+/g, '_')}_${scale}x`,
              name: foodName,
              calories: ((nutritionData.calories ?? 100) as number) * scale,
              protein: ((nutritionData.protein ?? 2) as number) * scale,
              carbs: ((nutritionData.carbs ?? 20) as number) * scale,
              fat: ((nutritionData.fat ?? 1) as number) * scale,
              fiber: ((nutritionData.fiber ?? 2) as number) * scale,
              sugar: ((nutritionData.sugar ?? 5) as number) * scale,
              sodium: ((nutritionData.sodium ?? 50) as number) * scale,
              servingSize: `${(100 * scale).toFixed(0)}g (${scale}x scale)`,
              brand: "Gemini AI Estimate",
              portionScale: scale,
              scaleReasoning: foodWithScale.reasoning
            });
            console.log(`✅ Gemini estimation avec échelle ${scale}x pour ${foodName}`);
          } catch (parseError) {
            console.warn('Erreur parsing Gemini nutrition, utilisation des valeurs par défaut:', parseError);
            nutritionResults.push({
              id: `fallback_${Date.now()}_${foodName.replace(/\s+/g, '_')}_${scale}x`,
              name: foodName,
              calories: 150 * scale,
              protein: 5 * scale,
              carbs: 25 * scale,
              fat: 3 * scale,
              fiber: 2 * scale,
              sugar: 8 * scale,
              sodium: 100 * scale,
              servingSize: `${(100 * scale).toFixed(0)}g (${scale}x scale)`,
              brand: "Estimation de base",
              portionScale: scale,
              scaleReasoning: foodWithScale.reasoning
            });
          }
        }
      } catch (foodError) {
        console.warn(`Erreur pour ${currentFoodName}:`, foodError);
      }
    }

    if (nutritionResults.length === 0) {
      // As-a-last resort: one generic fallback item
      return {
        foods: [{
          id: `fallback_${Date.now()}`,
          name: description || "Aliment scanné",
          calories: 150,
          protein: 5,
          carbs: 25,
          fat: 3,
          fiber: 2,
          sugar: 8,
          sodium: 100,
          servingSize: "estimation",
          brand: "Estimation de base",
          portionScale: 1,
          scaleReasoning: "Default scale"
        }],
        confidence: 0.3,
        suggestions: ["Données estimées - veuillez vérifier manuellement"]
      };
    }

    return {
      foods: nutritionResults,
      confidence: nutritionResults.some((f: any) => (f.brand || "").includes("USDA")) ? 0.9 : 0.7,
      suggestions: [
        "Données provenant de USDA et Gemini AI avec détection d'échelle",
        "Portions automatiquement ajustées selon l'analyse visuelle",
        "Vérifiez les échelles détectées et ajustez si nécessaire",
        ...nutritionResults.filter((f: any) => f.portionScale && f.portionScale !== 1.0)
          .map((f: any) => `${f.name}: ${f.portionScale}x - ${f.scaleReasoning}`)
      ]
    };

  } catch (error) {
    console.error('❌ Erreur analyse USDA + Gemini:', error);
    
    // Ultimate fallback
    return {
      foods: [{
        id: `fallback_${Date.now()}`,
        name: description || "Aliment scanné",
        calories: 150,
        protein: 5,
        carbs: 25,
        fat: 3,
        fiber: 2,
        sugar: 8,
        sodium: 100,
        servingSize: "estimation",
        brand: "Estimation de base"
      }],
      confidence: 0.3,
      suggestions: ["Données estimées - veuillez vérifier manuellement"]
    };
  }
};

/**
 * Analyze an image of food and extract nutritional information
 */
export const analyzeFoodImage = async (imageBase64: string): Promise<NutritionAnalysisResult> => {
  const prompt = `Analyze this food image and identify all visible foods with their estimated nutritional information.

Please respond with a JSON object in this exact format:
{
  "foods": [
    {
      "id": "unique_id",
      "name": "Food Name",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "fiber": number,
      "sugar": number,
      "sodium": number,
      "servingSize": "estimated portion size"
    }
  ],
  "confidence": 0.85,
  "suggestions": ["Suggestions based on what you see"]
}

Rules:
- Identify all visible foods in the image
- Estimate portion sizes based on visual cues
- Provide nutritional values for the estimated portions
- Be conservative with confidence if image quality is poor
- Include cooking methods in food names if relevant (grilled, fried, etc.)`;

  try {
    // Use OpenAI client directly for image analysis
    const { getOpenAIClient } = await import("./openai");
    const client = getOpenAIClient();

    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 2048,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content || "";

    // Parse response similar to text analysis
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No valid JSON found in response");
    }

    const result = JSON.parse(jsonMatch[0]) as NutritionAnalysisResult;
    
    if (!result.foods || !Array.isArray(result.foods) || result.foods.length === 0) {
      throw new Error("No foods identified in image");
    }

    // Process and validate foods
    result.foods = result.foods.map((food, index) => ({
      id: food.id || `ai_image_food_${Date.now()}_${index}`,
      name: food.name || "Unknown food",
      calories: Math.max(0, food.calories || 0),
      protein: Math.max(0, food.protein || 0),
      carbs: Math.max(0, food.carbs || 0),
      fat: Math.max(0, food.fat || 0),
      fiber: food.fiber || 0,
      sugar: food.sugar || 0,
      sodium: food.sodium || 0,
      servingSize: food.servingSize || "estimated portion",
      brand: "AI analyzed (image)",
    }));

    return {
      foods: result.foods,
      confidence: Math.min(1, Math.max(0.1, result.confidence || 0.7)),
      suggestions: result.suggestions || ["Please verify portions and adjust if needed."],
    };

  } catch (error) {
    console.error("AI image analysis error:", error);
    
    return {
      foods: [{
        id: `image_fallback_${Date.now()}`,
        name: "Unknown food",
        calories: 150,
        protein: 3,
        carbs: 25,
        fat: 2,
        fiber: 2,
        sugar: 8,
        sodium: 100,
        servingSize: "estimated portion",
        brand: "Estimate",
      }],
      confidence: 0.2,
      suggestions: ["Impossible d'analyser l'image. Ajoutez manuellement les informations."],
    };
  }
};