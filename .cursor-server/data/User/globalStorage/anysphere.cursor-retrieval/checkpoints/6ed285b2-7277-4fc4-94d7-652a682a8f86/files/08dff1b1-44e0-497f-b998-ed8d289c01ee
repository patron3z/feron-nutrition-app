import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "../state/authStore";
import { useNutritionStore } from "../state/nutritionStore";
import * as ImagePicker from "expo-image-picker";

import { useActionSheet } from "@expo/react-native-action-sheet";
import CalorieRing from "../components/CalorieRing";
import DateStrip from "../components/DateStrip";
import Card from "../components/Card";
import Chip from "../components/Chip";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import { Meal, MealFood, Food } from "../types/nutrition";
import { saveScanImage } from "../utils/imageUtils";
// Supabase sync is imported dynamically when needed
import { formatWeekdayEN, getTodayISO } from "../utils/dateUtils";

export default function DashboardScreen({ navigation }: any) {
  const { showActionSheetWithOptions } = useActionSheet();
  const user = useAuthStore(state => state.user);
  const addMealForDate = useNutritionStore(state => state.addMealForDate);
  const addPendingScan = useNutritionStore(state => state.addPendingScan);
  const clearPendingScan = useNutritionStore(state => state.clearPendingScan);
  const dailyNutrition = useNutritionStore(state => state.dailyNutrition);
  const pendingScans = useNutritionStore(state => state.pendingScans);

  // Get today's date in ISO format for comparison and initialization

  
  const [selectedDate, setSelectedDate] = useState(() => getTodayISO());
  const dayNutrition = React.useMemo(() => {
    return dailyNutrition.find(d => d.date === selectedDate) || null;
  }, [dailyNutrition, selectedDate]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scaleModalOpen, setScaleModalOpen] = useState(false);

  // Debug: Log des changements de données nutritionnelles
  useEffect(() => {
    if (dayNutrition) {
      console.log('📊 Dashboard - Données nutritionnelles pour', selectedDate, ':', {
        totalCalories: dayNutrition.totalCalories,
        mealsCount: dayNutrition.meals.length,
        meals: dayNutrition.meals.map(m => ({ 
          name: m.name, 
          calories: m.totalCalories,
          isScanned: m.name.includes('Scan')
        }))
      });
    } else {
      console.log('📊 Dashboard - Aucune donnée nutritionnelle pour', selectedDate);
    }
  }, [dayNutrition, selectedDate]);

  const route = useRoute<any>();
  useFocusEffect(React.useCallback(() => {
    const err = (route as any)?.params?.error;
    if (err) {
      setErrorMessage(err);
      // Clear the param so it does not re-trigger
      navigation.setParams({ error: undefined });
    }
  }, [route, navigation]));

  const handleImportFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        setErrorMessage("Photos permission required to import a meal.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        base64: true,
        quality: 0.8,
        allowsEditing: true,
      });
      if (!result.canceled && result.assets[0].base64) {
        // Optimistic pending bump for gallery - estimation dynamique
        addPendingScan(selectedDate, 300);
        try {
          const imageUri = await saveScanImage(result.assets[0].base64);
          const { analyzeFoodWithUSDAAndGemini } = await import("../api/nutrition-ai");
          const analysis = await analyzeFoodWithUSDAAndGemini(result.assets[0].base64);
          const foods: Food[] = analysis.foods || [];
          const confidence = typeof analysis.confidence === "number" ? analysis.confidence : 0.7;
          if (confidence < 0.8) {
            clearPendingScan(selectedDate);
            navigation.navigate("ConfirmFoods", {
              aiFoodsFromImage: foods,
              aiConfidence: confidence,
              targetDate: selectedDate,
              imageUri,
            });
          } else {
            const totals = foods.reduce(
              (acc, f) => ({
                calories: acc.calories + (f.calories || 0),
                protein: acc.protein + (f.protein || 0),
                carbs: acc.carbs + (f.carbs || 0),
                fat: acc.fat + (f.fat || 0),
              }),
              { calories: 0, protein: 0, carbs: 0, fat: 0 }
            );
            const mealFoods: MealFood[] = foods.map((f) => ({ food: f, quantity: 1, unit: "portion" }));
            const meal: Meal = {
              id: Date.now().toString(),
              name: foods.length ? `Scan - ${foods.map(f => f.name).join(', ')}` : "Scan",
              foods: mealFoods,
              totalCalories: totals.calories,
              totalProtein: totals.protein,
              totalCarbs: totals.carbs,
              totalFat: totals.fat,
              timestamp: new Date(),
              mealType: "snack",
              imageUri,
            };
            addMealForDate(selectedDate, meal);
            clearPendingScan(selectedDate);
          }
        } catch (error) {
          clearPendingScan(selectedDate);
          setErrorMessage("Analysis unavailable. Try again or add manually.");
        }
      }
    } catch (e) {
      setErrorMessage("Analysis unavailable. Try again or add manually.");
    }
  };

  const datesWithDataSet = React.useMemo(() => new Set(dailyNutrition.map(d => d.date)), [dailyNutrition]);
  const pendingDatesSet = React.useMemo(() => new Set(Object.keys(pendingScans).filter(k => (pendingScans[k] || 0) > 0)), [pendingScans]);



  // Add pending scan calories for optimistic updates
  const pendingCaloriesForDate = pendingScans[selectedDate] || 0;
  const baseCalories = dayNutrition?.totalCalories || 0;
  const caloriesConsumed = baseCalories + pendingCaloriesForDate;
  const calorieGoal = user?.dailyCalorieGoal || 2000;

  // Macro goals and progress (for level bars)
  const proteinConsumed = dayNutrition?.totalProtein || 0;
  const carbsConsumed = dayNutrition?.totalCarbs || 0;
  const fatConsumed = dayNutrition?.totalFat || 0;

  const proteinGoal = Math.round((calorieGoal * 0.25) / 4);
  const carbsGoal = Math.round((calorieGoal * 0.45) / 4);
  const fatGoal = Math.round((calorieGoal * 0.30) / 9);

  const proteinPct = Math.min(100, (proteinConsumed / Math.max(1, proteinGoal)) * 100);
  const carbsPct = Math.min(100, (carbsConsumed / Math.max(1, carbsGoal)) * 100);
  const fatPct = Math.min(100, (fatConsumed / Math.max(1, fatGoal)) * 100);


  // Foods with portion scales for the selected day
  const scaledFoods = React.useMemo(() => {
    if (!dayNutrition) return [] as { name: string; scale: number; reasoning?: string }[];
    const items: { name: string; scale: number; reasoning?: string }[] = [];
    for (const meal of dayNutrition.meals) {
      for (const mf of meal.foods) {
        const f = mf.food;
        if (typeof f.portionScale === "number" && f.portionScale !== 1) {
          items.push({ name: f.name, scale: f.portionScale, reasoning: f.scaleReasoning });
        }
      }
    }
    return items;
  }, [dayNutrition]);

  const tabBarHeight = useBottomTabBarHeight();
  const insets = useSafeAreaInsets();
  const fabBottom = Math.max(0, tabBarHeight + 6);


  // Sync nutrition data to Supabase when it changes
  useEffect(() => {
    const syncData = async () => {
      if (!user?.id || !dayNutrition) return;
      
      try {
        console.log('🔄 Synchronisation avec Supabase...');
        
        // Sync current day data
        const { syncNutritionData } = await import("../api/supabase");
        await syncNutritionData(user.id, [dayNutrition]);
        console.log('✅ Données synchronisées avec Supabase');
      } catch (error) {
        console.error('❌ Erreur sync:', error);
        // Don't show error to user for background sync failures
      }
    };

    // Debounce sync to avoid too many calls
    const timeoutId = setTimeout(syncData, 3000);
    return () => clearTimeout(timeoutId);
    }, [dayNutrition, user?.id]);

  // Log scan results for debugging
  useEffect(() => {
    if (dayNutrition?.meals.some(meal => meal.name.includes('Scan'))) {
      const scanMeals = dayNutrition.meals.filter(meal => meal.name.includes('Scan'));
      console.log('🔍 Repas scannés:', scanMeals.map(meal => ({
        name: meal.name,
        calories: meal.totalCalories,
        confidence: meal.foods.some(f => f.food.brand?.includes('USDA')) ? 'High (USDA)' : 'Medium (AI)'
      })));
    }
  }, [dayNutrition]);



  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
        {/* Header */}
        <View className="bg-white px-6 py-6 border-b border-gray-100">
          <View className="flex-row items-start justify-start">
            <View className="flex-1 pr-4">
              <View
                className="self-start rounded-full bg-green-500 px-3 py-1"
                accessibilityLabel={`Selected day: ${formatWeekdayEN(selectedDate)}`}
              >
                <Text className="text-white font-medium">{formatWeekdayEN(selectedDate)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Error banner */}
        {errorMessage && (
          <View className="bg-red-50 border border-red-100 mx-4 mt-3 rounded-xl px-4 py-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-red-700 flex-1">{errorMessage}</Text>
              <Pressable className="ml-3" onPress={() => setErrorMessage(null)}>
                <Ionicons name="close" size={18} color="#B91C1C" />
              </Pressable>
            </View>
            <View className="flex-row mt-3">
              <Pressable className="px-3 py-1 rounded-full bg-red-100 mr-2" onPress={() => navigation.navigate("Camera", { targetDate: selectedDate })}>
                <Text className="text-red-700 text-xs font-medium">Open camera</Text>
              </Pressable>
              <Pressable className="px-3 py-1 rounded-full bg-red-100" onPress={handleImportFromGallery}>
                <Text className="text-red-700 text-xs font-medium">Import photo</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Date strip */}
        <DateStrip
          selectedDate={selectedDate}
          onChange={setSelectedDate}
          datesWithData={datesWithDataSet}
          pendingDates={pendingDatesSet}
          pastDays={14}
          futureDays={7}
        />

        {/* Calorie Summary Card */}
        <Card className="mx-6 mt-6">
          <View className="items-center">
              <View className="flex-row items-center justify-between w-full mb-3">
                <Text className="text-gray-600">Calories consumed</Text>
                {dayNutrition?.meals.some(meal => meal.name.includes('Scan')) && (
                  <View className="flex-row items-center bg-blue-50 px-2 py-1 rounded-full">
                    <View className="w-2 h-2 bg-blue-500 rounded-full mr-1" />
                    <Text className="text-blue-600 text-xs font-medium">AI analyzed</Text>
                  </View>
                )}
              </View>
              <CalorieRing consumed={caloriesConsumed} goal={calorieGoal} size={220} strokeWidth={16} />
              <Text className="text-gray-500 mt-3">
                {caloriesConsumed.toLocaleString()} of {calorieGoal.toLocaleString()} calories
              </Text>

            {pendingCaloriesForDate > 0 && (
              <View className="flex-row items-center justify-center mt-2">
                <View className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
                <Text className="text-orange-600 text-sm">+{pendingCaloriesForDate} cal processing</Text>
              </View>
            )}

            {/* Portion scale summary */}
              {/* Macro level bars */}
              <View className="w-full mt-4" accessible accessibilityLabel="Macro levels">
                {/* Protein */}
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-xs text-gray-600">Protein</Text>
                  <Text className="text-xs text-gray-500">{proteinConsumed.toFixed(0)}g of {proteinGoal}g</Text>
                </View>
                <View className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                  <View className="h-2 bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, proteinPct)}%` }} />
                </View>
                {/* Carbs */}
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-xs text-gray-600">Carbs</Text>
                  <Text className="text-xs text-gray-500">{carbsConsumed.toFixed(0)}g of {carbsGoal}g</Text>
                </View>
                <View className="h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
                  <View className="h-2 bg-teal-500 rounded-full" style={{ width: `${Math.min(100, carbsPct)}%` }} />
                </View>
                {/* Fat */}
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-xs text-gray-600">Fat</Text>
                  <Text className="text-xs text-gray-500">{fatConsumed.toFixed(0)}g of {fatGoal}g</Text>
                </View>
                <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <View className="h-2 bg-lime-500 rounded-full" style={{ width: `${Math.min(100, fatPct)}%` }} />
                </View>
              </View>

              {scaledFoods.length > 0 && (
                <View className="w-full mt-4">

                <View className="flex-row items-center justify-between mb-2">
                  <View className="flex-row items-center">
                    <Ionicons name="resize" size={14} color="#8B5CF6" />
                    <Text className="text-xs text-purple-700 font-medium ml-1">Portion scale</Text>
                  </View>
                  <Pressable onPress={() => setScaleModalOpen(true)} className="px-2 py-1 rounded-full bg-purple-50">
                    <Text className="text-xs text-purple-700">View details</Text>
                  </Pressable>
                </View>
                <View className="flex-row flex-wrap">
                  {scaledFoods.slice(0, 3).map((sf, idx) => (
                    <Chip key={idx} variant="purple" label={`x${sf.scale.toFixed(1)}`} className="mr-2 mb-2" />
                  ))}
                </View>
              </View>
            )}

            {!dayNutrition || dayNutrition.meals.length === 0 ? (
              <Text className="text-sm text-gray-500 mt-2">No meals logged for this day</Text>
            ) : (
              <View className="mt-2">
                <View className="flex-row items-center justify-center">
                    <Text className="text-sm text-gray-500">
                      {dayNutrition.meals.length} meals logged
                    </Text>
                  {dayNutrition.meals.some(meal => meal.name.includes('USDA')) && (
                    <View className="ml-2 bg-green-50 px-2 py-0.5 rounded">
                      <Text className="text-green-600 text-xs font-medium">USDA verified</Text>
                    </View>
                  )}
                </View>
                
              </View>
            )}
          </View>
        </Card>
 
        {/* Quick spacing after actions */}
        <View className="h-2" />


      </ScrollView>

      <View pointerEvents="none" className="absolute left-0 right-0 bottom-0 h-3 bg-white" />
 
       {/* Floating + button */}
      <Pressable
        accessibilityLabel="Add meal"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        className="absolute w-16 h-16 rounded-full bg-green-500 items-center justify-center border-4 border-white"
        onPress={async () => {
          showActionSheetWithOptions(
            {
              options: ["Camera", "Gallery", "Cancel"],
              cancelButtonIndex: 2,
            },
            async (index) => {
              if (index === 0) {
                navigation.navigate("Camera", { targetDate: selectedDate });
              } else if (index === 1) {
                await handleImportFromGallery();
              }
            }
          );
        }}
        style={{ bottom: fabBottom, right: insets.right + 16, zIndex: 20, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 6 }}
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
      {/* Scale details modal */}
      {scaleModalOpen && (
        <View className="absolute inset-0 z-20 bg-black/50">
          <SafeAreaView className="flex-1 justify-end">
            <View className="bg-white rounded-t-2xl p-4 max-h-[70%]">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-base font-semibold text-gray-800">Portion scale details</Text>
                <Pressable onPress={() => setScaleModalOpen(false)} className="px-3 py-1 rounded-full bg-gray-100">
                  <Text className="text-gray-700 text-sm">Close</Text>
                </Pressable>
              </View>
              <ScrollView className="max-h-[60%]">
                {scaledFoods
                  .sort((a, b) => b.scale - a.scale)
                  .map((sf, idx) => (
                    <View key={idx} className="flex-row items-start justify-between py-2 border-b border-gray-100">
                      <View className="flex-1 pr-2">
                        <Text className="text-gray-800 text-sm" numberOfLines={2}>{sf.name}</Text>
                        {!!sf.reasoning && (
                          <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={3}>{sf.reasoning}</Text>
                        )}
                      </View>
                      <View className="ml-2 bg-purple-100 px-2 py-1 rounded-full self-start">
                        <Text className="text-purple-700 text-xs font-semibold">x{sf.scale.toFixed(1)}</Text>
                      </View>
                    </View>
                  ))}
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      )}
    </SafeAreaView>
  );
}