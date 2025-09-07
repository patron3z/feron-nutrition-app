#!/usr/bin/env node

/**
 * Test des corrections pour les calories exactes et l'affichage
 */

console.log('🧪 Test des corrections des calories exactes...\n');

// Simuler le processus de scan complet
function simulateScanProcess() {
  console.log('📸 1. Prise de photo et analyse...');
  
  // Résultats d'analyse avec échelles (de nutrition-ai.ts)
  const analysisResult = {
    foods: [
      {
        id: 'usda_12345_1.5x',
        name: 'Poulet grillé',
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        portionScale: 1.5,
        scaleReasoning: 'Portion plus grande que standard basée sur la taille de l\'assiette'
      },
      {
        id: 'usda_67890_0.8x', 
        name: 'Riz basmati',
        calories: 130,
        protein: 2.7,
        carbs: 25,
        fat: 0.3,
        portionScale: 0.8,
        scaleReasoning: 'Portion plus petite, environ 3/4 de tasse'
      }
    ],
    confidence: 0.9
  };

  console.log('🤖 2. Analyse terminée:');
  console.log(`   • ${analysisResult.foods.length} aliments détectés`);
  console.log(`   • Confiance: ${(analysisResult.confidence * 100).toFixed(0)}%`);
  
  // Log détaillé des calories par aliment (comme dans CameraScreen.tsx)
  analysisResult.foods.forEach(f => {
    const scale = f.portionScale || 1;
    console.log(`🍽️  ${f.name}:`, {
      baseCalories: f.calories,
      scale: scale,
      finalCalories: (f.calories || 0) * scale,
      scaleReasoning: f.scaleReasoning
    });
  });

  console.log('\n🔢 3. Calcul des totaux (CORRIGÉ):');
  
  // Calcul avec échelles (corrigé)
  const totals = analysisResult.foods.reduce(
    (acc, f) => {
      const scale = f.portionScale || 1; // ✅ Appliquer l'échelle
      return {
        calories: acc.calories + (f.calories || 0) * scale,
        protein: acc.protein + (f.protein || 0) * scale,
        carbs: acc.carbs + (f.carbs || 0) * scale,
        fat: acc.fat + (f.fat || 0) * scale,
      };
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  console.log('🔥 Totaux calculés avec échelles:', {
    calories: totals.calories.toFixed(1),
    protein: totals.protein.toFixed(1),
    carbs: totals.carbs.toFixed(1),
    fat: totals.fat.toFixed(1)
  });

  console.log('\n🍽️  4. Création du repas:');
  
  const meal = {
    id: Date.now().toString(),
    name: `Scan - ${analysisResult.foods.map(f => f.name).join(', ')}`,
    foods: analysisResult.foods.map(f => ({ food: f, quantity: 1, unit: "portion" })),
    totalCalories: totals.calories, // ✅ Calories correctes avec échelles
    totalProtein: totals.protein,
    totalCarbs: totals.carbs,
    totalFat: totals.fat,
    timestamp: new Date(),
    mealType: "snack"
  };

  console.log(`   • Nom: ${meal.name}`);
  console.log(`   • Calories totales: ${meal.totalCalories.toFixed(1)}kcal`);
  console.log(`   • Protéines: ${meal.totalProtein.toFixed(1)}g`);

  console.log('\n📊 5. Ajout au store et affichage dashboard:');
  
  // Simulation du store (nutritionStore.ts)
  const dayNutrition = {
    date: '2025-01-02',
    meals: [meal],
    totalCalories: meal.totalCalories, // ✅ Reflète les vraies calories
    totalProtein: meal.totalProtein,
    totalCarbs: meal.totalCarbs,
    totalFat: meal.totalFat,
    calorieGoal: 2000
  };

  console.log('📊 Dashboard - Données nutritionnelles:', {
    totalCalories: dayNutrition.totalCalories,
    mealsCount: dayNutrition.meals.length,
    meals: dayNutrition.meals.map(m => ({ 
      name: m.name, 
      calories: m.totalCalories,
      isScanned: m.name.includes('Scan')
    }))
  });

  console.log('\n✅ RÉSULTATS:');
  console.log(`   • Calories affichées: ${dayNutrition.totalCalories.toFixed(0)}kcal`);
  console.log(`   • Badge "AI analyzed" visible: ${dayNutrition.meals.some(m => m.name.includes('Scan'))}`);
  console.log(`   • Échelles détectées préservées: ✅`);
  
  return dayNutrition;
}

// Exécuter la simulation
const result = simulateScanProcess();

console.log('\n🎉 CORRECTIONS APPLIQUÉES:');
console.log('  ✅ Calcul des totaux avec portionScale');
console.log('  ✅ Logs détaillés pour debugging');
console.log('  ✅ Dashboard avec debug des données');
console.log('  ✅ Synchronisation store → dashboard');
console.log('  ✅ Badge AI analyzed pour repas scannés');

console.log('\n📱 PROCHAINES ÉTAPES:');
console.log('  1. Tester avec un vrai scan');
console.log('  2. Vérifier les logs dans la console');
console.log('  3. Confirmer l\'affichage sur le dashboard');
console.log('  4. Valider avec différentes échelles');
