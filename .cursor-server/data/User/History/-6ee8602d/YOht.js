#!/usr/bin/env node

/**
 * Debug du problème de calories fixes (200/150) et descriptions
 */

const GEMINI_API_KEY = "AIzaSyBhMHTw5u2PVzpCxtOwzhcjREsfuuikv4s";
const USDA_API_KEY = "3CdvPBMVe7v6dTUiY1vQaD9pARI9jumAeVYOeivo";

console.log('🐛 Debug des calories fixes et descriptions...\n');

async function testWithDescription(description) {
  console.log(`📝 Test avec description: "${description}"`);
  
  try {
    // Reproduire exactement le code de nutrition-ai.ts pour les descriptions
    const identificationPrompt = `Identify foods in: "${description}"

IMPORTANT: Respond ONLY with food lines in this EXACT format:
FOOD_NAME | SCALE_FACTOR | REASONING

Rules:
- Use simple food names (no asterisks, parentheses, or formatting)
- Scale: 1.0 = standard serving (adjust based on description context)
- Do NOT include headers, separators, or explanatory text

Examples:
Chicken breast | 1.0 | Standard serving mentioned
Rice | 1.0 | Typical portion size`;

    console.log('📋 Prompt envoyé à Gemini...');
    
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: identificationPrompt }] }]
      })
    });

    if (!geminiResponse.ok) {
      throw new Error(`Gemini error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const geminiResponseRaw = geminiData.candidates[0]?.content?.parts[0]?.text || "";
    
    const geminiResponseClean = (geminiResponseRaw || "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/\r/g, "")
      .trim();
    
    console.log('🤖 Réponse Gemini brute:', geminiResponseClean);
    
    // Reproduire le parsing exact de nutrition-ai.ts
    const lines = geminiResponseClean.split('\n')
      .map(l => l.trim())
      .filter(l => l && !/^example:|^format:|^respond/i.test(l));

    let foodLines = lines.filter(line => line.includes('|'));
    if (foodLines.length === 0 && lines.length > 0) {
      foodLines = lines;
    }

    console.log(`📊 Lignes trouvées: ${lines.length}`);
    console.log(`🍽️  Lignes avec '|': ${foodLines.length}`);
    
    const foodsWithScales = foodLines.map(line => {
      const parts = line.split('|').map(p => p.trim());
      let name = (parts[0] || line).replace(/^[-*•]\s*/, "");
      
      // Nettoyer le nom d'aliment (code exact de nutrition-ai.ts)
      name = name
        .replace(/\*+/g, '') // Enlever tous les astérisques
        .replace(/\s*\([^)]*\)/g, '') // Enlever les (parenthèses)
        .replace(/^FOOD_NAME$/i, '') // Enlever les en-têtes de tableau
        .replace(/^-+$/, '') // Enlever les lignes de séparation
        .trim();
      
      const scale = parts.length >= 2 ? (parseFloat(parts[1]) || 1.0) : 1.0;
      const reasoning = parts.length >= 3 ? (parts[2] || "Default scale") : "Default scale";
      return { name, scale, reasoning };
    }).filter(f => {
      // Filtrage exact de nutrition-ai.ts
      return !!f.name && 
             f.name.length > 0 && 
             !/^(food_name|scale_factor|reasoning|-+)$/i.test(f.name) &&
             !/^-+$/.test(f.name) &&
             !/no food|pas de nourriture|cannot identify|impossible d'identifier/i.test(f.name);
    });

    console.log('📏 Aliments parsés:', foodsWithScales);

    // Si pas d'aliments parsés, utiliser le fallback
    const parsedFoods = foodsWithScales.length > 0 ? foodsWithScales : [{ name: description || "Aliment scanné", scale: 1.0, reasoning: "Default scale" }];

    console.log('🎯 Aliments finaux:', parsedFoods);

    // Simuler la recherche USDA pour chaque aliment
    const nutritionResults = [];
    
    for (const foodWithScale of parsedFoods) {
      const currentFoodName = foodWithScale.name;
      const scale = Number.isFinite(foodWithScale.scale) ? Math.max(0.25, Math.min(4, foodWithScale.scale)) : 1.0;
      
      console.log(`\n🔍 Recherche USDA pour: "${currentFoodName}" (échelle: ${scale}x)`);
      
      try {
        const usdaResponse = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: currentFoodName, pageSize: 3 })
        });
        
        if (usdaResponse.ok) {
          const usdaData = await usdaResponse.json();
          const usdaResults = usdaData?.foods || [];
          
          if (usdaResults.length > 0) {
            const bestMatch = usdaResults[0];
            console.log(`   ✅ USDA trouvé: ${bestMatch.description}`);
            
            // Extraire les calories de base
            let baseCalories = 0;
            let baseProtein = 0;
            let baseCarbs = 0;
            let baseFat = 0;
            
            bestMatch.foodNutrients?.forEach(nutrient => {
              const nameLower = (nutrient.nutrientName || "").toLowerCase();
              const value = Number(nutrient.value) || 0;
              
              if (nameLower.includes('energy') && !nameLower.includes('kj')) {
                baseCalories = value;
              } else if (nameLower.includes('protein')) {
                baseProtein = value;
              } else if (nameLower.includes('carbohydrate')) {
                baseCarbs = value;
              } else if (nameLower.includes('lipid') || nameLower.includes('fat')) {
                baseFat = value;
              }
            });
            
            console.log(`   📊 Données USDA de base (100g): ${baseCalories}kcal, ${baseProtein}g protein`);
            console.log(`   🔢 Avec échelle ${scale}x: ${(baseCalories * scale).toFixed(0)}kcal`);
            
            nutritionResults.push({
              id: `usda_${bestMatch.fdcId}_${scale}x`,
              name: bestMatch.description || currentFoodName,
              calories: baseCalories * scale,
              protein: baseProtein * scale,
              carbs: baseCarbs * scale,
              fat: baseFat * scale,
              portionScale: scale,
              brand: "USDA Database"
            });
            
          } else {
            console.log(`   ⚠️  Pas de données USDA, fallback Gemini`);
            
            // ❌ PROBLÈME POTENTIEL: Valeurs fallback fixes
            nutritionResults.push({
              id: `gemini_${Date.now()}_${currentFoodName.replace(/\s+/g, '_')}_${scale}x`,
              name: currentFoodName,
              calories: 150 * scale, // ← PROBLÈME: 150 calories fixes
              protein: 5 * scale,
              carbs: 25 * scale,
              fat: 3 * scale,
              portionScale: scale,
              brand: "Gemini AI Estimate"
            });
          }
        }
      } catch (error) {
        console.log(`   ❌ Erreur recherche: ${error.message}`);
        
        // ❌ PROBLÈME: Fallback avec valeurs fixes
        nutritionResults.push({
          id: `fallback_${Date.now()}_${currentFoodName.replace(/\s+/g, '_')}_${scale}x`,
          name: currentFoodName,
          calories: 150 * scale, // ← PROBLÈME: 150 calories fixes
          protein: 5 * scale,
          carbs: 25 * scale,
          fat: 3 * scale,
          portionScale: scale,
          brand: "Estimation de base"
        });
      }
    }

    const totalCalories = nutritionResults.reduce((sum, food) => sum + food.calories, 0);
    
    console.log(`\n🔥 RÉSULTAT FINAL:`);
    console.log(`   • Aliments détectés: ${nutritionResults.length}`);
    console.log(`   • Calories totales: ${totalCalories.toFixed(0)}kcal`);
    console.log(`   • Détail des calories:`);
    
    nutritionResults.forEach((food, i) => {
      console.log(`     ${i + 1}. ${food.name}: ${food.calories.toFixed(0)}kcal (${food.portionScale}x) [${food.brand}]`);
    });
    
    return { nutritionResults, totalCalories };
    
  } catch (error) {
    console.error('❌ Erreur test description:', error.message);
    return null;
  }
}

// Test avec plusieurs descriptions
async function runTests() {
  const testCases = [
    "Pizza margherita",
    "Grilled chicken with rice and vegetables", 
    "Salade césar avec poulet",
    "Burger avec frites",
    "Pâtes carbonara"
  ];

  console.log('🧪 TESTS AVEC DESCRIPTIONS:');
  console.log('='.repeat(80));
  
  for (const testCase of testCases) {
    console.log(`\n${'─'.repeat(60)}`);
    const result = await testWithDescription(testCase);
    
    if (result && result.totalCalories === 150) {
      console.log('🚨 PROBLÈME DÉTECTÉ: Calories fixes à 150!');
    } else if (result && result.totalCalories === 200) {
      console.log('🚨 PROBLÈME DÉTECTÉ: Calories fixes à 200!');
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000)); // Pause entre requêtes
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('📋 PROBLÈMES IDENTIFIÉS:');
  console.log('='.repeat(80));
  console.log('1. 🚨 200 calories: addPendingScan(selectedDate, 200) dans DashboardScreen.tsx');
  console.log('2. 🚨 150 calories: Valeurs fallback fixes dans nutrition-ai.ts');
  console.log('3. 🚨 Parsing peut échouer et utiliser les fallbacks');
  console.log('4. 🚨 USDA peut ne pas trouver d\'aliments et utiliser les fallbacks');
  
  console.log('\n💡 SOLUTIONS:');
  console.log('1. Remplacer 200 par une estimation dynamique');
  console.log('2. Améliorer les valeurs fallback avec Gemini');
  console.log('3. Améliorer le parsing pour détecter plus d\'aliments');
  console.log('4. Ajouter plus de logs pour déboguer');
}

runTests().catch(console.error);
