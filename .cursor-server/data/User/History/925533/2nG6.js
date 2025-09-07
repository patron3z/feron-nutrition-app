#!/usr/bin/env node

/**
 * Test debug complet de l'API Gemini
 */

const GEMINI_API_KEY = "AIzaSyBhMHTw5u2PVzpCxtOwzhcjREsfuuikv4s";

console.log('🔍 Debug complet de l\'API Gemini...\n');

async function testGeminiBasic() {
  console.log('🧪 Test 1: Requête basique Gemini...');
  
  try {
    const testPrompt = "Bonjour, peux-tu me répondre en français?";
    
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
    console.log(`   Status Text: ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('   ❌ Erreur response:', errorText);
      return false;
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (generatedText) {
      console.log('   ✅ Gemini répond!');
      console.log(`   📝 Réponse: "${generatedText.substring(0, 100)}..."`);
      return true;
    } else {
      console.log('   ❌ Pas de texte généré');
      console.log('   📋 Response structure:', JSON.stringify(data, null, 2));
      return false;
    }
    
  } catch (error) {
    console.log('   ❌ Erreur:', error.message);
    return false;
  }
}

async function testGeminiFood() {
  console.log('\n🍽️  Test 2: Identification d\'aliments...');
  
  try {
    const foodPrompt = `Identify foods in: "Grilled chicken breast with rice"

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
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: foodPrompt
          }]
        }]
      })
    });

    console.log(`   Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('   ❌ Erreur food identification:', errorText);
      return false;
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (generatedText) {
      console.log('   ✅ Food identification fonctionne!');
      console.log(`   📝 Réponse: "${generatedText}"`);
      
      // Parser la réponse comme dans nutrition-ai.ts
      const lines = generatedText.split('\n')
        .map(l => l.trim())
        .filter(l => l && !/^example:|^format:|^respond/i.test(l));

      const foodLines = lines.filter(line => line.includes('|'));
      console.log(`   📊 Lignes avec '|': ${foodLines.length}`);
      
      foodLines.forEach((line, i) => {
        const parts = line.split('|').map(p => p.trim());
        let name = (parts[0] || line).replace(/^[-*•]\s*/, "");
        name = name.replace(/\*+/g, '').replace(/\s*\([^)]*\)/g, '').trim();
        const scale = parts.length >= 2 ? (parseFloat(parts[1]) || 1.0) : 1.0;
        const reasoning = parts.length >= 3 ? (parts[2] || "Default scale") : "Default scale";
        
        console.log(`      ${i + 1}. "${name}" (${scale}x) - ${reasoning}`);
      });
      
      return foodLines.length > 0;
    } else {
      console.log('   ❌ Pas de texte généré pour food identification');
      return false;
    }
    
  } catch (error) {
    console.log('   ❌ Erreur food identification:', error.message);
    return false;
  }
}

async function testGeminiWithImage() {
  console.log('\n📸 Test 3: Analyse d\'image (simulée)...');
  
  // Test avec une image base64 simple (pixel blanc 1x1)
  const simpleImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";
  
  try {
    const imagePrompt = `Analyze this food image and identify each visible food item with portion scales.

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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: imagePrompt },
            {
              inline_data: {
                mime_type: "image/png",
                data: simpleImage
              }
            }
          ]
        }]
      })
    });

    console.log(`   Status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('   ❌ Erreur image analysis:', errorText);
      return false;
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (generatedText) {
      console.log('   ✅ Image analysis fonctionne!');
      console.log(`   📝 Réponse: "${generatedText.substring(0, 200)}..."`);
      return true;
    } else {
      console.log('   ❌ Pas de texte généré pour image analysis');
      console.log('   📋 Response structure:', JSON.stringify(data, null, 2));
      return false;
    }
    
  } catch (error) {
    console.log('   ❌ Erreur image analysis:', error.message);
    return false;
  }
}

async function testAPIKey() {
  console.log('\n🔑 Test 4: Validation de la clé API...');
  
  // Test avec une clé invalide pour voir la différence
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=invalid_key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: "Test" }]
        }]
      })
    });

    const errorData = await response.text();
    console.log(`   Status avec clé invalide: ${response.status}`);
    console.log(`   Erreur attendue: ${errorData.substring(0, 100)}...`);
    
  } catch (error) {
    console.log('   Erreur avec clé invalide:', error.message);
  }
  
  // Test avec la vraie clé
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: "Test clé API" }]
        }]
      })
    });

    console.log(`   Status avec vraie clé: ${response.status}`);
    
    if (response.ok) {
      console.log('   ✅ Clé API valide');
      return true;
    } else {
      const errorData = await response.text();
      console.log('   ❌ Problème avec la clé API:', errorData);
      return false;
    }
    
  } catch (error) {
    console.log('   ❌ Erreur test clé API:', error.message);
    return false;
  }
}

// Exécuter tous les tests
async function runAllTests() {
  console.log('🚀 Démarrage des tests Gemini...\n');
  
  const results = {
    basic: await testGeminiBasic(),
    food: await testGeminiFood(),
    image: await testGeminiWithImage(),
    apiKey: await testAPIKey()
  };
  
  console.log('\n' + '='.repeat(60));
  console.log('📋 RÉSULTATS DES TESTS:');
  console.log('='.repeat(60));
  console.log(`🧪 Test basique: ${results.basic ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`🍽️  Identification aliments: ${results.food ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`📸 Analyse d'image: ${results.image ? '✅ OK' : '❌ ÉCHEC'}`);
  console.log(`🔑 Clé API: ${results.apiKey ? '✅ OK' : '❌ ÉCHEC'}`);
  
  const allPassed = Object.values(results).every(r => r);
  
  if (allPassed) {
    console.log('\n🎉 GEMINI FONCTIONNE PARFAITEMENT!');
    console.log('Le problème est ailleurs...');
    console.log('\n🔧 VÉRIFICATIONS SUPPLÉMENTAIRES:');
    console.log('1. Vérifier les logs dans l\'app mobile');
    console.log('2. Contrôler la configuration dans src/api/gemini.ts');
    console.log('3. Tester avec une vraie image dans l\'app');
    console.log('4. Vérifier le parsing dans nutrition-ai.ts');
  } else {
    console.log('\n❌ PROBLÈMES DÉTECTÉS AVEC GEMINI:');
    if (!results.basic) console.log('• API Gemini ne répond pas du tout');
    if (!results.food) console.log('• Identification d\'aliments échoue');
    if (!results.image) console.log('• Analyse d\'image échoue');
    if (!results.apiKey) console.log('• Clé API invalide ou expirée');
    
    console.log('\n💡 SOLUTIONS POSSIBLES:');
    console.log('• Vérifier la clé API Gemini');
    console.log('• Contrôler les quotas/limites de l\'API');
    console.log('• Tester avec une autre clé API');
    console.log('• Vérifier la connectivité réseau');
  }
}

runAllTests().catch(console.error);
