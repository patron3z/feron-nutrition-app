#!/usr/bin/env node

/**
 * Debug du problème de calories inexactes
 */

console.log('🐛 Debug du problème de calories...\n');

// Simuler des aliments avec échelles détectées par Gemini
const foods = [
  {
    name: 'Poulet grillé',
    calories: 165, // Base: 100g
    protein: 31,
    carbs: 0,
    fat: 3.6,
    portionScale: 1.5, // 150g détecté
    scaleReasoning: 'Portion plus grande que standard basée sur la taille de l\'assiette'
  },
  {
    name: 'Riz basmati',
    calories: 130, // Base: 100g
    protein: 2.7,
    carbs: 25,
    fat: 0.3,
    portionScale: 0.8, // 80g détecté
    scaleReasoning: 'Portion plus petite, environ 3/4 de tasse'
  }
];

console.log('🍽️  Aliments détectés avec échelles:');
foods.forEach(food => {
  console.log(`  • ${food.name}: ${food.calories}kcal (échelle: ${food.portionScale}x)`);
  console.log(`    Raison: ${food.scaleReasoning}`);
});

console.log('\n❌ PROBLÈME ACTUEL:');
// Calcul actuel (sans échelle)
const wrongTotals = foods.reduce(
  (acc, f) => ({
    calories: acc.calories + (f.calories || 0), // ❌ Pas d'échelle appliquée
    protein: acc.protein + (f.protein || 0),
    carbs: acc.carbs + (f.carbs || 0),
    fat: acc.fat + (f.fat || 0),
  }),
  { calories: 0, protein: 0, carbs: 0, fat: 0 }
);

console.log(`Calories calculées (INCORRECTES): ${wrongTotals.calories}kcal`);
console.log('  - Poulet: 165kcal (devrait être 165 × 1.5 = 248kcal)');
console.log('  - Riz: 130kcal (devrait être 130 × 0.8 = 104kcal)');

console.log('\n✅ SOLUTION:');
// Calcul correct (avec échelle)
const correctTotals = foods.reduce(
  (acc, f) => {
    const scale = f.portionScale || 1;
    return {
      calories: acc.calories + (f.calories || 0) * scale, // ✅ Échelle appliquée
      protein: acc.protein + (f.protein || 0) * scale,
      carbs: acc.carbs + (f.carbs || 0) * scale,
      fat: acc.fat + (f.fat || 0) * scale,
    };
  },
  { calories: 0, protein: 0, carbs: 0, fat: 0 }
);

console.log(`Calories calculées (CORRECTES): ${correctTotals.calories.toFixed(0)}kcal`);
console.log(`  - Poulet: ${(165 * 1.5).toFixed(0)}kcal (${foods[0].portionScale}x)`);
console.log(`  - Riz: ${(130 * 0.8).toFixed(0)}kcal (${foods[1].portionScale}x)`);

console.log(`\n📊 Différence: ${(correctTotals.calories - wrongTotals.calories).toFixed(0)}kcal`);
console.log(`   Écart: ${(((correctTotals.calories - wrongTotals.calories) / wrongTotals.calories) * 100).toFixed(1)}%`);

console.log('\n🔧 Corrections nécessaires:');
console.log('  1. Appliquer portionScale dans le calcul des totaux');
console.log('  2. Vérifier que les données USDA incluent bien les échelles');
console.log('  3. Tester l\'affichage sur le dashboard');
console.log('  4. Ajouter des logs pour déboguer les valeurs');
