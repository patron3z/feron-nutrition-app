#!/usr/bin/env node

/**
 * Test complet des APIs Gemini et USDA pour diagnostiquer les problèmes de scan
 */

console.log('🔍 Test complet des APIs Gemini et USDA...\n');

// Configuration des APIs
const GEMINI_API_KEY = "AIzaSyBhMHTw5u2PVzpCxtOwzhcjREsfuuikv4s";
const USDA_API_KEY = "3CdvPBMVe7v6dTUiY1vQaD9pARI9jumAeVYOeivo";

// Test 1: Gemini API
async function testGemini() {
  console.log('🤖 1. Test Gemini API...');
  
  try {
    const testPrompt = `Analyze this food description and provide detailed information about each visible food item:
"Grilled chicken breast with rice"

Respond in this format for each food:
FOOD_NAME | SCALE_FACTOR | SCALE_REASONING

Example:
Grilled chicken breast | 1.2 | Appears larger than standard 100g serving
Rice | 0.8 | About 3/4 cup visible

Be precise with scale factors based on the description.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: testPrompt
          }]
        }]
      })
    });

    console.log(`   Status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.log('   ❌ Erreur Gemini:', errorData);
      return false;
    }

    const data = await response.json();
    const generatedText = data.candidates[0]?.content?.parts[0]?.text;
    
    console.log('   ✅ Gemini fonctionne!');
    console.log('   📝 Réponse:', generatedText?.substring(0, 200) + '...');
    
    // Parser la réponse pour vérifier le format
    const lines = generatedText.split('\n')
      .map(l => l.trim())
      .filter(l => l && !/^example:|^format:|^respond/i.test(l));
    
    const foodLines = lines.filter(line => line.includes('|'));
    console.log(`   📊 Aliments détectés: ${foodLines.length}`);
    
    foodLines.forEach(line => {
      const parts = line.split('|').map(p => p.trim());
      const name = parts[0] || 'Unknown';
      const scale = parseFloat(parts[1]) || 1.0;
      const reasoning = parts[2] || 'No reasoning';
      console.log(`      • ${name}: ${scale}x (${reasoning})`);
    });
    
    return foodLines.length > 0;
    
  } catch (error) {
    console.log('   ❌ Erreur Gemini:', error.message);
    return false;
  }
}

// Test 2: USDA API
async function testUSDA() {
  console.log('\n🥗 2. Test USDA API...');
  
  try {
    const testQuery = "chicken breast grilled";
    const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: testQuery, pageSize: 3 })
    });

    console.log(`   Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('   ❌ Erreur USDA:', errorText.substring(0, 200));
      return false;
    }

    const data = await response.json();
    const foods = data?.foods || [];
    
    console.log('   ✅ USDA fonctionne!');
    console.log(`   📊 Résultats trouvés: ${foods.length}`);
    
    if (foods.length > 0) {
      const firstFood = foods[0];
      console.log(`   🍗 Premier résultat: ${firstFood.description}`);
      console.log(`   🏢 Marque: ${firstFood.brandOwner || 'USDA Database'}`);
      console.log(`   🔢 ID: ${firstFood.fdcId}`);
      
      // Vérifier les nutriments
      const nutrients = firstFood.foodNutrients || [];
      console.log(`   🧪 Nutriments disponibles: ${nutrients.length}`);
      
      const importantNutrients = ['Energy', 'Protein', 'Carbohydrate', 'Total lipid'];
      importantNutrients.forEach(nutrientType => {
        const nutrient = nutrients.find(n => n.nutrientName?.includes(nutrientType));
        if (nutrient) {
          console.log(`      • ${nutrient.nutrientName}: ${nutrient.value} ${nutrient.unitName}`);
        }
      });
    }
    
    return foods.length > 0;
    
  } catch (error) {
    console.log('   ❌ Erreur USDA:', error.message);
    return false;
  }
}

// Test 3: Intégration complète (comme dans nutrition-ai.ts)
async function testIntegration() {
  console.log('\n🔗 3. Test intégration Gemini + USDA...');
  
  try {
    // Étape 1: Identifier les aliments avec Gemini
    const identificationPrompt = `Analyze this food description and provide detailed information:
"Grilled chicken breast with steamed broccoli and brown rice"

Respond in this format for each food:
FOOD_NAME | SCALE_FACTOR | SCALE_REASONING

Be precise with scale factors.`;

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: identificationPrompt }] }]
      })
    });

    if (!geminiResponse.ok) {
      throw new Error('Gemini identification failed');
    }

    const geminiData = await geminiResponse.json();
    const geminiText = geminiData.candidates[0]?.content?.parts[0]?.text || "";
    
    // Parser les résultats Gemini
    const lines = geminiText.split('\n').map(l => l.trim()).filter(l => l);
    const foodLines = lines.filter(line => line.includes('|'));
    
    console.log(`   🤖 Gemini a identifié ${foodLines.length} aliments:`);
    
    const parsedFoods = foodLines.map(line => {
      const parts = line.split('|').map(p => p.trim());
      return {
        name: parts[0] || 'Unknown',
        scale: parseFloat(parts[1]) || 1.0,
        reasoning: parts[2] || 'Default scale'
      };
    });
    
    parsedFoods.forEach(food => {
      console.log(`      • ${food.name} (${food.scale}x): ${food.reasoning}`);
    });
    
    // Étape 2: Rechercher chaque aliment dans USDA
    const nutritionResults = [];
    
    for (const food of parsedFoods) {
      console.log(`   🔍 Recherche USDA pour: ${food.name}`);
      
      const usdaResponse = await fetch(`https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: food.name, pageSize: 3 })
      });
      
      if (usdaResponse.ok) {
        const usdaData = await usdaResponse.json();
        const usdaFoods = usdaData?.foods || [];
        
        if (usdaFoods.length > 0) {
          const bestMatch = usdaFoods[0];
          console.log(`      ✅ Trouvé: ${bestMatch.description}`);
          
          // Extraire les nutriments principaux
          const nutrients = bestMatch.foodNutrients || [];
          let calories = 0, protein = 0, carbs = 0, fat = 0;
          
          nutrients.forEach(nutrient => {
            const name = (nutrient.nutrientName || "").toLowerCase();
            const value = Number(nutrient.value) || 0;
            
            if (name.includes('energy') && !name.includes('kj')) {
              calories = value;
            } else if (name.includes('protein')) {
              protein = value;
            } else if (name.includes('carbohydrate')) {
              carbs = value;
            } else if (name.includes('lipid') || name.includes('fat')) {
              fat = value;
            }
          });
          
          // Appliquer l'échelle
          const scaledNutrition = {
            name: food.name,
            calories: calories * food.scale,
            protein: protein * food.scale,
            carbs: carbs * food.scale,
            fat: fat * food.scale,
            scale: food.scale,
            reasoning: food.reasoning
          };
          
          nutritionResults.push(scaledNutrition);
          
          console.log(`      📊 Nutrition (avec échelle ${food.scale}x):`, {
            calories: scaledNutrition.calories.toFixed(1),
            protein: scaledNutrition.protein.toFixed(1),
            carbs: scaledNutrition.carbs.toFixed(1),
            fat: scaledNutrition.fat.toFixed(1)
          });
        } else {
          console.log(`      ⚠️  Pas de données USDA pour ${food.name}`);
        }
      }
    }
    
    // Calculer les totaux
    const totals = nutritionResults.reduce(
      (acc, food) => ({
        calories: acc.calories + food.calories,
        protein: acc.protein + food.protein,
        carbs: acc.carbs + food.carbs,
        fat: acc.fat + food.fat
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
    
    console.log('\n   🔥 TOTAUX FINAUX:', {
      calories: totals.calories.toFixed(1) + 'kcal',
      protein: totals.protein.toFixed(1) + 'g',
      carbs: totals.carbs.toFixed(1) + 'g',
      fat: totals.fat.toFixed(1) + 'g'
    });
    
    return nutritionResults.length > 0;
    
  } catch (error) {
    console.log('   ❌ Erreur intégration:', error.message);
    return false;
  }
}

// Exécuter tous les tests
async function runAllTests() {
  const geminiWorks = await testGemini();
  const usdaWorks = await testUSDA();
  const integrationWorks = await testIntegration();
  
  console.log('\n📋 RÉSULTATS DES TESTS:');
  console.log(`   🤖 Gemini API: ${geminiWorks ? '✅ Fonctionne' : '❌ Problème'}`);
  console.log(`   🥗 USDA API: ${usdaWorks ? '✅ Fonctionne' : '❌ Problème'}`);
  console.log(`   🔗 Intégration: ${integrationWorks ? '✅ Fonctionne' : '❌ Problème'}`);
  
  if (geminiWorks && usdaWorks && integrationWorks) {
    console.log('\n🎉 TOUTES LES APIs FONCTIONNENT!');
    console.log('   Le problème de scan est ailleurs...');
    console.log('\n🔧 PROCHAINES ÉTAPES DE DEBUG:');
    console.log('   1. Vérifier les logs dans l\'app mobile');
    console.log('   2. Tester avec une vraie image');
    console.log('   3. Vérifier la navigation et le state management');
    console.log('   4. Contrôler la synchronisation Supabase');
  } else {
    console.log('\n❌ PROBLÈMES DÉTECTÉS:');
    if (!geminiWorks) console.log('   • Gemini API ne répond pas correctement');
    if (!usdaWorks) console.log('   • USDA API ne répond pas correctement');
    if (!integrationWorks) console.log('   • L\'intégration des deux APIs échoue');
  }
}

// Lancer les tests
runAllTests().catch(console.error);
