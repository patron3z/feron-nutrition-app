#!/usr/bin/env node

/**
 * Debug du parsing des réponses Gemini
 */

console.log('🐛 Debug du parsing Gemini...\n');

// Exemple de réponse Gemini réelle (du test précédent)
const geminiResponse = `The description "Grilled chicken breast with rice" lacks visual information. Therefore, it's impossible to provide accurate scale factors. We can only offer estimations based on typical serving size.

Grilled chicken breast | 1.0 | Assumed to be a standard serving size (approximately 100-150g), as no other information is provided.
Rice | 1.0 | Assumed to be a standard serving size (approximately 1/2 cup to 1 cup cooked rice), as no other information is provided.`;

console.log('📝 Réponse Gemini brute:');
console.log(geminiResponse);
console.log('\n' + '='.repeat(80));

// Parsing actuel (comme dans nutrition-ai.ts)
console.log('\n🔍 Parsing actuel:');

const lines = geminiResponse.split('\n')
  .map(l => l.trim())
  .filter(l => l && !/^example:|^format:|^respond/i.test(l));

console.log('📋 Toutes les lignes filtrées:');
lines.forEach((line, i) => {
  console.log(`  ${i}: "${line}"`);
});

let foodLines = lines.filter(line => line.includes('|'));
console.log(`\n🍽️  Lignes avec '|': ${foodLines.length}`);
foodLines.forEach((line, i) => {
  console.log(`  ${i}: "${line}"`);
});

// Si pas de lignes avec |, essayer d'autres méthodes
if (foodLines.length === 0) {
  console.log('\n⚠️  Aucune ligne avec |, essai fallback...');
  foodLines = lines;
  console.log(`📋 Utilisation de toutes les lignes: ${foodLines.length}`);
}

console.log('\n🔧 Parsing des aliments:');
const foodsWithScales = foodLines.map((line, i) => {
  const parts = line.split('|').map(p => p.trim());
  const name = (parts[0] || line).replace(/^[-*•]\s*/, "");
  const scale = parts.length >= 2 ? (parseFloat(parts[1]) || 1.0) : 1.0;
  const reasoning = parts.length >= 3 ? (parts[2] || "Default scale") : "Default scale";
  
  console.log(`  ${i}: "${line}"`);
  console.log(`     Parts: [${parts.map(p => `"${p}"`).join(', ')}]`);
  console.log(`     Name: "${name}"`);
  console.log(`     Scale: ${scale}`);
  console.log(`     Reasoning: "${reasoning}"`);
  console.log('');
  
  return { name, scale, reasoning };
}).filter(f => !!f.name);

console.log(`📊 Aliments parsés: ${foodsWithScales.length}`);
foodsWithScales.forEach((food, i) => {
  console.log(`  ${i}: ${food.name} (${food.scale}x) - ${food.reasoning}`);
});

// Test avec un prompt amélioré
console.log('\n' + '='.repeat(80));
console.log('🔧 TEST AVEC PROMPT AMÉLIORÉ:');

const improvedPrompt = `Identify the foods in this description and estimate portion scales:
"Grilled chicken breast with rice"

IMPORTANT: Respond ONLY with food lines in this EXACT format:
FOOD_NAME | SCALE_FACTOR | REASONING

Examples:
Chicken breast | 1.2 | Standard portion
Rice | 0.8 | Small serving

Do NOT include any other text or explanations.`;

console.log('📝 Prompt amélioré:');
console.log(improvedPrompt);

console.log('\n💡 SOLUTIONS POSSIBLES:');
console.log('1. Améliorer le prompt pour forcer le format exact');
console.log('2. Améliorer le parsing pour gérer les réponses variées');
console.log('3. Ajouter une validation de format');
console.log('4. Implémenter un fallback plus robuste');
