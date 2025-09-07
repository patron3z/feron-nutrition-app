#!/usr/bin/env node

/**
 * Debug du processus de scan complet dans l'app
 */

console.log('🔍 Debug du processus de scan dans l\'app...\n');

// Simuler exactement ce qui se passe dans CameraScreen.tsx
async function simulateScanProcess() {
  console.log('📸 1. Simulation prise de photo...');
  
  // Simuler une image base64 (pixel blanc 1x1 PNG)
  const mockBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
  const mockDate = "2025-01-02";
  const mockImageUri = "file:///mock/path/image.jpg";
  
  console.log('✅ Photo "prise" - démarrage analyse...');
  
  try {
    console.log('\n🤖 2. Test de la fonction analyzeFoodWithUSDAAndGemini...');
    
    // Reproduire exactement le code de nutrition-ai.ts
    const GEMINI_API_KEY = "AIzaSyBhMHTw5u2PVzpCxtOwzhcjREsfuuikv4s";
    const USDA_API_KEY = "3CdvPBMVe7v6dTUiY1vQaD9pARI9jumAeVYOeivo";
    
    // Step 1: Gemini identification (avec image)
    console.log('   🔍 Étape 1: Gemini identification...');
    
    const identificationPrompt = `Analyze this food image and identify each visible food item with portion scales.

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

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: identificationPrompt },
            {
              inline_data: {
                mime_type: "image/png",
                data: mockBase64
              }
            }
          ]
        }]
      })
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.log('   ❌ Erreur Gemini:', errorData);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const geminiResponseRaw = geminiData.candidates[0]?.content?.parts[0]?.text || "";
    
    const geminiResponseClean = (geminiResponseRaw || "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/\r/g, "")
      .trim();
    
    console.log('   🤖 Gemini réponse:', geminiResponseClean);

    // Step 2: Parse Gemini response
    console.log('\n   📋 Étape 2: Parsing de la réponse...');
    
    const lines = geminiResponseClean.split('\n')
      .map(l => l.trim())
      .filter(l => l && !/^example:|^format:|^respond/i.test(l));

    let foodLines = lines.filter(line => line.includes('|'));
    if (foodLines.length === 0 && lines.length > 0) {
      foodLines = lines;
    }

    console.log(`   📊 Lignes trouvées: ${lines.length}`);
    console.log(`   🍽️  Lignes avec '|': ${foodLines.length}`);

    const foodsWithScales = foodLines.map(line => {
      const parts = line.split('|').map(p => p.trim());
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
    }).filter(f => {
      // Filtrer les entrées vides, les en-têtes et les séparateurs
      return !!f.name && 
             f.name.length > 0 && 
             !/^(food_name|scale_factor|reasoning|-+)$/i.test(f.name) &&
             !/^-+$/.test(f.name);
    });

    const parsedFoods = foodsWithScales.length > 0 ? foodsWithScales : [{ name: "Aliment scanné", scale: 1.0, reasoning: "Default scale" }];

    console.log('   📏 Aliments parsés:', parsedFoods);

    if (parsedFoods.length === 0 || (parsedFoods.length === 1 && parsedFoods[0].name === "Aliment scanné")) {
      console.log('\n⚠️  PROBLÈME DÉTECTÉ: Aucun aliment réel détecté!');
      console.log('   Causes possibles:');
      console.log('   • Image trop simple (pixel blanc)');
      console.log('   • Parsing trop strict');
      console.log('   • Gemini ne voit pas de nourriture');
      return { foods: [], confidence: 0.3 };
    }

    // Step 3: USDA lookup (simulé)
    console.log('\n   🥗 Étape 3: Recherche USDA...');
    
    const nutritionResults = [];
    
    for (const foodWithScale of parsedFoods) {
      const currentFoodName = foodWithScale.name;
      const scale = Math.max(0.25, Math.min(4, foodWithScale.scale));
      
      console.log(`   🔍 Recherche: "${currentFoodName}" (échelle: ${scale}x)`);
      
      // Simuler une recherche USDA réussie
      nutritionResults.push({
        id: `usda_${Date.now()}_${currentFoodName.replace(/\s+/g, '_')}_${scale}x`,
        name: currentFoodName,
        calories: 150 * scale,
        protein: 5 * scale,
        carbs: 25 * scale,
        fat: 3 * scale,
        fiber: 2 * scale,
        sugar: 8 * scale,
        sodium: 100 * scale,
        servingSize: `${(100 * scale).toFixed(0)}g (${scale}x scale)`,
        brand: "USDA Database",
        portionScale: scale,
        scaleReasoning: foodWithScale.reasoning
      });
    }

    console.log(`   ✅ ${nutritionResults.length} aliments avec données nutritionnelles`);

    const finalResult = {
      foods: nutritionResults,
      confidence: nutritionResults.length > 0 ? 0.9 : 0.3,
      suggestions: ["Test simulation réussie"]
    };

    console.log('\n🎉 RÉSULTAT FINAL:');
    console.log(`   • Aliments: ${finalResult.foods.length}`);
    console.log(`   • Confiance: ${(finalResult.confidence * 100).toFixed(0)}%`);
    console.log(`   • Calories totales: ${finalResult.foods.reduce((sum, f) => sum + f.calories, 0).toFixed(0)}kcal`);

    return finalResult;

  } catch (error) {
    console.log('\n❌ ERREUR dans le processus de scan:', error.message);
    console.log('Stack:', error.stack);
    return null;
  }
}

// Test avec une description au lieu d'une image
async function testWithDescription() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TEST AVEC DESCRIPTION (pas d\'image)');
  console.log('='.repeat(60));
  
  try {
    const GEMINI_API_KEY = "AIzaSyBhMHTw5u2PVzpCxtOwzhcjREsfuuikv4s";
    const description = "Grilled chicken breast with rice and broccoli";
    
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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: identificationPrompt }] }]
      })
    });

    if (response.ok) {
      const data = await response.json();
      const text = data.candidates[0]?.content?.parts[0]?.text || "";
      console.log('✅ Description test réussi:', text);
      
      const foodLines = text.split('\n').filter(line => line.includes('|'));
      console.log(`📊 Aliments détectés: ${foodLines.length}`);
      
      return foodLines.length > 0;
    } else {
      console.log('❌ Description test échoué');
      return false;
    }
    
  } catch (error) {
    console.log('❌ Erreur description test:', error.message);
    return false;
  }
}

// Exécuter tous les tests
async function runDiagnostic() {
  const scanResult = await simulateScanProcess();
  const descriptionWorks = await testWithDescription();
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 DIAGNOSTIC FINAL');
  console.log('='.repeat(60));
  
  if (scanResult && scanResult.foods.length > 0) {
    console.log('✅ PROCESSUS DE SCAN FONCTIONNE');
    console.log('\n💡 Si ça ne marche pas dans votre app:');
    console.log('1. Vérifiez que l\'image arrive bien à Gemini');
    console.log('2. Contrôlez les logs dans la console mobile');
    console.log('3. Testez avec une vraie photo de nourriture');
    console.log('4. Vérifiez que Constants.expoConfig.extra contient la clé');
  } else {
    console.log('❌ PROBLÈME DANS LE PROCESSUS DE SCAN');
    console.log('\n🔧 SOLUTIONS:');
    console.log('1. Problème avec l\'image (trop simple pour test)');
    console.log('2. Parsing trop restrictif');
    console.log('3. Gemini ne détecte pas de nourriture');
  }
  
  if (descriptionWorks) {
    console.log('\n✅ Gemini fonctionne avec descriptions texte');
  } else {
    console.log('\n❌ Problème même avec descriptions texte');
  }
  
  console.log('\n🎯 PROCHAINES ÉTAPES:');
  console.log('1. Testez avec une vraie photo de nourriture dans l\'app');
  console.log('2. Vérifiez les logs console dans React Native');
  console.log('3. Ajoutez plus de logs dans CameraScreen.tsx');
  console.log('4. Testez la fonction processFoodAnalysis directement');
}

runDiagnostic().catch(console.error);
