import React, { useMemo, useState } from "react";
import { View, Text, Pressable, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useRoute } from "@react-navigation/native";
import { Food, Meal, MealFood } from "../types/nutrition";
import { useNutritionStore } from "../state/nutritionStore";

export default function ConfirmFoodsScreen({ navigation }: any) {
  const route = useRoute<any>();
  const initialFoods: Food[] = route.params?.aiFoodsFromImage || [];
  const confidence: number | undefined = route.params?.aiConfidence;
  const targetDate: string | undefined = route.params?.targetDate;
  const imageUri: string | undefined = route.params?.imageUri;

  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(initialFoods.map((f) => [f.id, 1]))
  );
  const [mealType, setMealType] = useState<"breakfast" | "lunch" | "dinner" | "snack">("lunch");

  const { addMeal, addMealForDate } = useNutritionStore();

  const [scales, setScales] = useState<Record<string, number>>(
    Object.fromEntries(initialFoods.map((f) => [f.id, f.portionScale || 1]))
  );

  const totals = useMemo(() => {
    return initialFoods.reduce(
      (acc, f) => {
        const q = quantities[f.id] || 0;
        const s = scales[f.id] || 1;
        return {
          calories: acc.calories + f.calories * q * s,
          protein: acc.protein + f.protein * q * s,
          carbs: acc.carbs + f.carbs * q * s,
          fat: acc.fat + f.fat * q * s,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [initialFoods, quantities, scales]);

  const onAdjust = (id: string, delta: number) => {
    setQuantities((prev) => {
      const next = { ...prev, [id]: Math.max(0, (prev[id] || 0) + delta) };
      return next;
    });
  };

  const onAdd = () => {
    const selectedFoods = initialFoods.filter((f) => (quantities[f.id] || 0) > 0);
    if (selectedFoods.length === 0) {
      navigation.goBack();
      return;
    }
    // Apply scale to each selected food clone
    const adjusted: Food[] = selectedFoods.map((f) => {
      const s = scales[f.id] || 1;
      return {
        ...f,
        calories: f.calories * s,
        protein: f.protein * s,
        carbs: f.carbs * s,
        fat: f.fat * s,
        fiber: (f.fiber || 0) * s,
        sugar: (f.sugar || 0) * s,
        sodium: (f.sodium || 0) * s,
        portionScale: s,
      };
    });

    const mealFoods: MealFood[] = adjusted.map((f) => ({
      food: f,
      quantity: quantities[f.id] || 1,
      unit: "portion",
    }));

    const meal: Meal = {
      id: Date.now().toString(),
      name: `Scan - ${selectedFoods.map(f => f.name).join(', ')}`,
      foods: mealFoods,
      totalCalories: totals.calories,
      totalProtein: totals.protein,
      totalCarbs: totals.carbs,
      totalFat: totals.fat,
      timestamp: new Date(),
      mealType,
      imageUri,
    };
    if (targetDate) {
      addMealForDate(targetDate, meal);
    } else {
      addMeal(meal);
    }
    navigation.popToTop();
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 py-4 border-b border-gray-100 flex-row items-center justify-between">
        <Pressable onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color="#374151" />
        </Pressable>
        <Text className="text-lg font-semibold text-gray-800">Confirm foods</Text>
        <View className="w-6" />
      </View>

      {/* Photo du plat */}
      {imageUri && (
        <View className="mx-6 mt-4">
          <Text className="text-gray-800 font-semibold mb-2">Photo du plat</Text>
          <View className="rounded-xl overflow-hidden bg-gray-100">
            <Image 
              source={{ uri: imageUri }} 
              className="w-full h-48"
              resizeMode="cover"
            />
          </View>
        </View>
      )}

      {/* Confidence note */}
      {typeof confidence === "number" && (
        <View className="mx-6 mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-blue-700 text-sm">AI confidence: {Math.round(confidence * 100)}%</Text>
            <View className="flex-row items-center">
              <Ionicons name="scan" size={16} color="#1D4ED8" />
              <Text className="text-blue-700 text-xs ml-1 font-medium">AI Analyzed</Text>
            </View>
          </View>
        </View>
      )}

      {/* Detected foods header */}
      <View className="mx-6 mt-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-800 font-semibold">Aliments détectés</Text>
          <View className="flex-row items-center bg-green-50 px-2 py-1 rounded-full">
            <Ionicons name="camera" size={14} color="#16A34A" />
            <Text className="text-green-700 text-xs ml-1 font-medium">{initialFoods.length} aliment{initialFoods.length > 1 ? 's' : ''}</Text>
          </View>
        </View>
      </View>

      {/* Meal type */}
      <View className="mx-6 mt-4">
        <Text className="text-gray-800 font-semibold mb-2">Type de repas</Text>
        <View className="flex-row flex-wrap gap-2">
          {[
            { key: "breakfast", label: "Breakfast" },
            { key: "lunch", label: "Lunch" },
            { key: "dinner", label: "Dinner" },
            { key: "snack", label: "Snack" },
          ].map((t) => (
            <Pressable
              key={t.key}
              className={`px-4 py-2 rounded-xl ${mealType === (t.key as any) ? "bg-green-500" : "bg-gray-100"}`}
              onPress={() => setMealType(t.key as any)}
            >
              <Text className={`${mealType === (t.key as any) ? "text-white" : "text-gray-700"}`}>{t.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* List */}
      <ScrollView className="flex-1 mx-6 mt-4" showsVerticalScrollIndicator={false}>
        {initialFoods.length === 0 ? (
          <View className="items-center py-16">
            <Ionicons name="image" size={48} color="#9CA3AF" />
            <Text className="text-gray-500 mt-2">No foods detected</Text>
          </View>
          ) : (
          initialFoods.map((f) => (
            <View key={f.id} className="py-3 border-b border-gray-100">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <View className="flex-row items-center mb-1">
                    {!!f.brand && (
                      <View className={`px-2 py-0.5 rounded-full mr-2 ${f.brand.includes("USDA") ? "bg-green-50" : "bg-yellow-50"}`}>
                        <Text className={`${f.brand.includes("USDA") ? "text-green-700" : "text-yellow-700"} text-[10px] font-medium`}>{f.brand.includes("USDA") ? "USDA" : "AI estimate"}</Text>
                      </View>
                    )}
                  </View>
                  <Text className="font-medium text-gray-800 text-base">{f.name}</Text>
                  
                  {/* Détails nutritionnels complets */}
                  <View className="mt-2 bg-gray-50 p-3 rounded-lg">
                    <View className="flex-row justify-between items-center mb-2">
                      <Text className="font-medium text-gray-700">Valeurs nutritionnelles</Text>
                      <Text className="text-xs text-gray-500">{f.servingSize}</Text>
                    </View>
                    
                    {/* Calories principales */}
                    <View className="flex-row justify-between items-center py-1 border-b border-gray-200">
                      <Text className="text-gray-600">🔥 Calories</Text>
                      <Text className="font-semibold text-green-600">{(f.calories * (scales[f.id]||1)).toFixed(0)} kcal</Text>
                    </View>
                    
                    {/* Macronutriments */}
                    <View className="flex-row justify-between items-center py-1">
                      <Text className="text-gray-600">🥩 Protéines</Text>
                      <Text className="font-medium text-gray-800">{(f.protein * (scales[f.id]||1)).toFixed(1)}g</Text>
                    </View>
                    
                    <View className="flex-row justify-between items-center py-1">
                      <Text className="text-gray-600">🍞 Glucides</Text>
                      <Text className="font-medium text-gray-800">{(f.carbs * (scales[f.id]||1)).toFixed(1)}g</Text>
                    </View>
                    
                    <View className="flex-row justify-between items-center py-1">
                      <Text className="text-gray-600">🥑 Lipides</Text>
                      <Text className="font-medium text-gray-800">{(f.fat * (scales[f.id]||1)).toFixed(1)}g</Text>
                    </View>
                    
                    {/* Micronutriments (si disponibles) */}
                    {((f.fiber || 0) > 0 || (f.sugar || 0) > 0 || (f.sodium || 0) > 0) && (
                      <View className="mt-2 pt-2 border-t border-gray-200">
                        <Text className="text-xs text-gray-500 mb-1">Détails supplémentaires:</Text>
                        
                        {(f.fiber || 0) > 0 && (
                          <View className="flex-row justify-between items-center py-0.5">
                            <Text className="text-xs text-gray-500">🌾 Fibres</Text>
                            <Text className="text-xs text-gray-600">{((f.fiber || 0) * (scales[f.id]||1)).toFixed(1)}g</Text>
                          </View>
                        )}
                        
                        {(f.sugar || 0) > 0 && (
                          <View className="flex-row justify-between items-center py-0.5">
                            <Text className="text-xs text-gray-500">🍯 Sucres</Text>
                            <Text className="text-xs text-gray-600">{((f.sugar || 0) * (scales[f.id]||1)).toFixed(1)}g</Text>
                          </View>
                        )}
                        
                        {(f.sodium || 0) > 0 && (
                          <View className="flex-row justify-between items-center py-0.5">
                            <Text className="text-xs text-gray-500">🧂 Sodium</Text>
                            <Text className="text-xs text-gray-600">{((f.sodium || 0) * (scales[f.id]||1)).toFixed(0)}mg</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                  
                  {/* Scale reasoning */}
                  {f.scaleReasoning && (
                    <View className="mt-2 bg-orange-50 px-2 py-1 rounded">
                      <Text className="text-orange-700 text-xs">📏 {f.scaleReasoning}</Text>
                    </View>
                  )}
                  
                  {/* Scale chips */}
                  <View className="flex-row mt-2">
                    <Text className="text-xs text-gray-500 mr-2 self-center">Taille portion:</Text>
                    {[0.5, 1, 1.5, 2].map(val => (
                      <Pressable key={val} className={`px-3 py-1 rounded-full mr-2 ${((scales[f.id]||1) === val) ? "bg-green-600" : "bg-gray-100"}`} onPress={() => setScales(prev => ({ ...prev, [f.id]: val }))}>
                        <Text className={`text-xs ${((scales[f.id]||1) === val) ? "text-white" : "text-gray-700"}`}>x{val}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
                <View className="flex-row items-center">
                  <Pressable className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center" onPress={() => onAdjust(f.id, -1)}>
                    <Ionicons name="remove" size={16} color="#6B7280" />
                  </Pressable>
                  <Text className="mx-3 min-w-[24px] text-center font-medium text-gray-800">{quantities[f.id] || 0}</Text>
                  <Pressable className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center" onPress={() => onAdjust(f.id, 1)}>
                    <Ionicons name="add" size={16} color="#6B7280" />
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}


        {/* Résumé nutritionnel complet */}
        <View className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-gray-800">Résumé nutritionnel</Text>
            <View className="flex-row items-center bg-green-100 px-2 py-1 rounded-full">
              <Ionicons name="restaurant" size={16} color="#16A34A" />
              <Text className="text-green-700 text-xs ml-1 font-medium">{initialFoods.filter(f => (quantities[f.id] || 0) > 0).length} aliment{initialFoods.filter(f => (quantities[f.id] || 0) > 0).length > 1 ? 's' : ''}</Text>
            </View>
          </View>
          
          {/* Calories principales */}
          <View className="flex-row justify-between items-center py-2 border-b border-green-200 mb-3">
            <View className="flex-row items-center">
              <Text className="text-2xl mr-2">🔥</Text>
              <Text className="font-semibold text-gray-800 text-lg">Calories totales</Text>
            </View>
            <Text className="font-bold text-green-600 text-xl">{totals.calories.toFixed(0)} kcal</Text>
          </View>
          
          {/* Macronutriments détaillés */}
          <View className="space-y-2">
            <View className="flex-row justify-between items-center py-2 bg-white px-3 rounded-lg">
              <View className="flex-row items-center">
                <Text className="text-lg mr-2">🥩</Text>
                <View>
                  <Text className="font-medium text-gray-800">Protéines</Text>
                  <Text className="text-xs text-gray-500">4 kcal/g</Text>
                </View>
              </View>
              <View className="text-right">
                <Text className="font-semibold text-gray-800">{totals.protein.toFixed(1)}g</Text>
                <Text className="text-xs text-gray-500">{(totals.protein * 4).toFixed(0)} kcal</Text>
              </View>
            </View>
            
            <View className="flex-row justify-between items-center py-2 bg-white px-3 rounded-lg">
              <View className="flex-row items-center">
                <Text className="text-lg mr-2">🍞</Text>
                <View>
                  <Text className="font-medium text-gray-800">Glucides</Text>
                  <Text className="text-xs text-gray-500">4 kcal/g</Text>
                </View>
              </View>
              <View className="text-right">
                <Text className="font-semibold text-gray-800">{totals.carbs.toFixed(1)}g</Text>
                <Text className="text-xs text-gray-500">{(totals.carbs * 4).toFixed(0)} kcal</Text>
              </View>
            </View>
            
            <View className="flex-row justify-between items-center py-2 bg-white px-3 rounded-lg">
              <View className="flex-row items-center">
                <Text className="text-lg mr-2">🥑</Text>
                <View>
                  <Text className="font-medium text-gray-800">Lipides</Text>
                  <Text className="text-xs text-gray-500">9 kcal/g</Text>
                </View>
              </View>
              <View className="text-right">
                <Text className="font-semibold text-gray-800">{totals.fat.toFixed(1)}g</Text>
                <Text className="text-xs text-gray-500">{(totals.fat * 9).toFixed(0)} kcal</Text>
              </View>
            </View>
          </View>
          
          {/* Répartition calorique en pourcentages */}
          <View className="mt-3 pt-3 border-t border-green-200">
            <Text className="text-sm font-medium text-gray-700 mb-2">Répartition calorique:</Text>
            <View className="flex-row justify-between">
              <Text className="text-xs text-gray-600">
                Protéines: {((totals.protein * 4 / totals.calories) * 100).toFixed(0)}%
              </Text>
              <Text className="text-xs text-gray-600">
                Glucides: {((totals.carbs * 4 / totals.calories) * 100).toFixed(0)}%
              </Text>
              <Text className="text-xs text-gray-600">
                Lipides: {((totals.fat * 9 / totals.calories) * 100).toFixed(0)}%
              </Text>
            </View>
          </View>
        </View>

        <View className="h-24" />
      </ScrollView>

      {/* Confirm button */}
      <View className="px-6 pb-6">
        <Pressable className="bg-green-500 rounded-xl py-4 items-center flex-row justify-center" onPress={onAdd}>
          <Ionicons name="checkmark-circle" size={24} color="white" />
          <Text className="text-white font-semibold text-lg ml-2">Confirm</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
