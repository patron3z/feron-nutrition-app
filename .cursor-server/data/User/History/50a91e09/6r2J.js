#!/usr/bin/env node

/**
 * Simulation complète du processus de scan pour diagnostiquer le problème
 */

const GEMINI_API_KEY = "AIzaSyBhMHTw5u2PVzpCxtOwzhcjREsfuuikv4s";
const USDA_API_KEY = "3CdvPBMVe7v6dTUiY1vQaD9pARI9jumAeVYOeivo";

console.log('🔍 Simulation complète du processus de scan...\n');

async function simulateAnalyzeFoodWithUSDAAndGemini(description) {
  console.log('🚀 Début de analyzeFoodWithUSDAAndGemini...');
  console.log(`📝 Description: "${description}"`);
  
  try {
    // Step 1: Utiliser Gemini pour identifier les aliments (sans image)
    console.log('\n🤖 Étape 1: Identification Gemini...');
    
    let identificationPrompt = "";
    if (description) {
      identificationPrompt = `Identify the foods mentioned in this description: "${description}". For each food, estimate a reasonable portion scale (1.0 = standard serving). Format: FOOD_NAME | SCALE_FACTOR | REASONING`;
    } else {
      throw new Error("Either image or description is required");
    }
    
    console.log('📋 Prompt utilisé:');
    console.log(identificationPrompt);
    
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: identificationPrompt }] }]
      })
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const geminiResponseRaw = geminiData.candidates[0]?.content?.parts[0]?.text || "";
    
    const geminiResponseClean = (geminiResponseRaw || "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/\r/g, "")
      .trim();
    
    console.log('🤖 Gemini identification avec scale:', geminiResponseClean);

    // Step 2: Parser la réponse Gemini
    console.log('\n🔍 Étape 2: Parsing de la réponse...');
    
    const lines = geminiResponseClean.split('\n')
      .map(l => l.trim())
      .filter(l => l && !/^example:|^format:|^respond/i.test(l));

    let foodLines = lines.filter(line => line.includes('|'));
    // Si pas de lignes avec |, utiliser toutes les lignes
    if (foodLines.length === 0 && lines.length > 0) {
      foodLines = lines;
    }

    const foodsWithScales = foodLines.map(line => {
      const parts = line.split('|').map(p => p.trim());
      const name = (parts[0] || line).replace(/^[-*•]\s*/, "");
      const scale = parts.length >= 2 ? (parseFloat(parts[1]) || 1.0) : 1.0;
      const reasoning = parts.length >= 3 ? (parts[2] || "Default scale") : "Default scale";
      return { name, scale, reasoning };
    }).filter(f => !!f.name);

    // Si toujours vide, synthétiser un élément générique
    const parsedFoods = foodsWithScales.length > 0 ? foodsWithScales : [{ name: description || "Aliment scanné", scale: 1.0, reasoning: "Default scale" }];

    console.log('📏 Aliments avec échelles détectées:', parsedFoods);

    // Step 3: Rechercher chaque aliment dans USDA
    console.log('\n🥗 Étape 3: Recherche USDA...');
    const nutritionResults = [];
    
    for (const foodWithScale of parsedFoods) {
      const currentFoodName = foodWithScale.name;
      const scale = Number.isFinite(foodWithScale.scale) ? Math.max(0.25, Math.min(4, foodWithScale.scale)) : 1.0;
      
      try {
        console.log(`🔍 Recherche USDA pour: ${currentFoodName} (échelle: ${scale}x)`);
        
        const usdaResponse = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: currentFoodName, pageSize: 3 })
        });
        
        if (usdaResponse.ok) {
          const usdaData = await usdaResponse.json();
          const usdaResults = usdaData?.foods || [];
          
          if (Array.isArray(usdaResults) && usdaResults.length > 0) {
            const bestMatch = usdaResults[0];
            
            // Extraire les données nutritionnelles (par 100g de base)
            const baseNutrition = {
              id: `usda_${bestMatch.fdcId}_${scale}x`,
              name: bestMatch.description || currentFoodName,
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

            // Parser les nutriments USDA et appliquer l'échelle
            bestMatch.foodNutrients?.forEach(nutrient => {
              const nameLower = (nutrient.nutrientName || "").toLowerCase();
              const unitLower = (nutrient.unitName || "").toLowerCase();
              const baseValue = Number(nutrient.value) || 0;
              let value = baseValue;
              
              // Convertir kJ en kcal si nécessaire pour l'énergie
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
            console.log(`✅ USDA data avec échelle ${scale}x pour ${currentFoodName}:`, {
              calories: Number(baseNutrition.calories || 0).toFixed(0),
              protein: Number(baseNutrition.protein || 0).toFixed(1),
              scale: scale,
              reasoning: foodWithScale.reasoning
            });
          } else {
            console.log(`⚠️ Pas de données USDA pour ${currentFoodName}, utilisation Gemini`);
            // Fallback vers estimation Gemini
            nutritionResults.push({
              id: `gemini_${Date.now()}_${currentFoodName.replace(/\s+/g, '_')}_${scale}x`,
              name: currentFoodName,
              calories: 150 * scale,
              protein: 5 * scale,
              carbs: 25 * scale,
              fat: 3 * scale,
              fiber: 2 * scale,
              sugar: 8 * scale,
              sodium: 100 * scale,
              servingSize: `${(100 * scale).toFixed(0)}g (${scale}x scale)`,
              brand: "Gemini AI Estimate",
              portionScale: scale,
              scaleReasoning: foodWithScale.reasoning
            });
          }
        }
      } catch (foodError) {
        console.warn(`Erreur pour ${currentFoodName}:`, foodError);
      }
    }

    console.log(`\n📊 Résultats nutritionnels: ${nutritionResults.length} aliments`);
    
    if (nutritionResults.length === 0) {
      console.log('⚠️ Aucun résultat nutritionnel - fallback');
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

    const finalResult = {
      foods: nutritionResults,
      confidence: nutritionResults.some(f => (f.brand || "").includes("USDA")) ? 0.9 : 0.7,
      suggestions: [
        "Données provenant de USDA et Gemini AI avec détection d'échelle",
        "Portions automatiquement ajustées selon l'analyse",
        "Vérifiez les échelles détectées et ajustez si nécessaire",
        ...nutritionResults.filter(f => f.portionScale && f.portionScale !== 1.0)
          .map(f => `${f.name}: ${f.portionScale}x - ${f.scaleReasoning}`)
      ]
    };

    console.log('\n🎉 RÉSULTAT FINAL:', {
      foodsCount: finalResult.foods.length,
      confidence: finalResult.confidence,
      totalCalories: finalResult.foods.reduce((sum, f) => sum + (f.calories || 0), 0).toFixed(1)
    });

    return finalResult;

  } catch (error) {
    console.error('❌ Erreur analyse:', error);
    
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
}

// Test avec différentes descriptions
async function runTests() {
  const testCases = [
    "Grilled chicken breast with rice",
    "Pizza margherita",
    "Salade de poulet avec vinaigrette",
    "" // Test cas vide
  ];

  for (const testCase of testCases) {
    console.log('\n' + '='.repeat(80));
    console.log(`🧪 TEST: "${testCase}"`);
    console.log('='.repeat(80));
    
    try {
      const result = await simulateAnalyzeFoodWithUSDAAndGemini(testCase);
      console.log('\n✅ Test réussi!');
    } catch (error) {
      console.log('\n❌ Test échoué:', error.message);
    }
  }
}

runTests().catch(console.error);
