#!/usr/bin/env node

/**
 * Test des corrections de parsing Gemini
 */

console.log('🧪 Test des corrections de parsing Gemini...\n');

// Exemples de réponses Gemini problématiques (tirées des tests précédents)
const problematicResponses = [
  {
    name: 'Avec en-têtes de tableau',
    response: `FOOD_NAME | SCALE_FACTOR | REASONING
------- | -------- | --------
Grilled Chicken Breast | 1.0 | A standard serving
Rice | 1.0 | Standard portion`
  },
  {
    name: 'Avec astérisques et parenthèses',
    response: `**Chicken (Poulet)** | 1.0 | Primary component
**Salad Greens (Salade)** | 1.5 | Larger volume
**Vinaigrette** | 0.5 | Dressing amount`
  },
  {
    name: 'Avec texte explicatif',
    response: `Here's a breakdown of the foods and portion scales:

* **Chicken** | 1.0 | Standard serving
* **Rice** | 0.8 | Smaller portion

Note that exact portions would depend on the recipe.`
  }
];

// Fonction de parsing corrigée (copiée de nutrition-ai.ts)
function parseGeminiResponse(geminiResponse) {
  console.log('📝 Réponse brute:', geminiResponse);
  
  const lines = geminiResponse.split('\n')
    .map(l => l.trim())
    .filter(l => l && !/^example:|^format:|^respond/i.test(l));

  let foodLines = lines.filter(line => line.includes('|'));
  if (foodLines.length === 0 && lines.length > 0) {
    foodLines = lines;
  }

  const foodsWithScales = foodLines.map(line => {
    const parts = line.split('|').map(p => p.trim());
    let name = (parts[0] || line).replace(/^[-*•]\s*/, "");
    
    // Nettoyer le nom d'aliment
    name = name
      .replace(/^\*\*(.*)\*\*$/, '$1') // Enlever les **astérisques**
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

  return foodsWithScales;
}

// Tester chaque réponse problématique
problematicResponses.forEach((testCase, i) => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🧪 TEST ${i + 1}: ${testCase.name}`);
  console.log('='.repeat(60));
  
  const parsedFoods = parseGeminiResponse(testCase.response);
  
  console.log(`\n📊 Résultats parsés: ${parsedFoods.length} aliments`);
  parsedFoods.forEach((food, j) => {
    console.log(`  ${j + 1}. "${food.name}" (${food.scale}x) - ${food.reasoning}`);
  });
  
  // Vérifier qu'il n'y a pas d'artefacts
  const hasArtifacts = parsedFoods.some(food => 
    food.name.includes('**') || 
    food.name.includes('FOOD_NAME') || 
    food.name.includes('---') ||
    food.name.length === 0
  );
  
  if (hasArtifacts) {
    console.log('❌ Artefacts détectés dans le parsing!');
  } else {
    console.log('✅ Parsing propre - aucun artefact détecté');
  }
});

console.log(`\n${'='.repeat(60)}`);
console.log('📋 RÉSUMÉ DES CORRECTIONS:');
console.log('='.repeat(60));
console.log('✅ Filtrage des en-têtes de tableau (FOOD_NAME, ---)');
console.log('✅ Suppression des **astérisques** de formatage');
console.log('✅ Suppression des (parenthèses) explicatives');
console.log('✅ Filtrage des lignes vides et des séparateurs');
console.log('✅ Validation robuste des noms d\'aliments');

console.log('\n🎯 IMPACT ATTENDU:');
console.log('  • Moins d\'erreurs "Aucun aliment détecté"');
console.log('  • Noms d\'aliments plus propres pour recherche USDA');
console.log('  • Parsing plus robuste face aux variations de format');
console.log('  • Meilleure détection des échelles de portion');

console.log('\n📱 PROCHAINES ÉTAPES:');
console.log('  1. Tester avec un vrai scan dans l\'app');
console.log('  2. Vérifier les logs de parsing dans la console');
console.log('  3. Confirmer l\'affichage des calories sur le dashboard');
console.log('  4. Valider les échelles de portion détectées');
