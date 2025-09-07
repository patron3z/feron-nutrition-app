import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { analyzeNutritionImage, estimateNutritionWithOpenAI } from '../api/replicate';

const OpenAITestComponent: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<string>('');

  const runConnectionTest = async () => {
    setIsLoading(true);
    setTestResults('🧪 Test de connexion OpenAI...\n');
    
    try {
      // Test simple avec une estimation
      await estimateNutritionWithOpenAI('apple');
      setTestResults(prev => prev + `✅ Connexion: Réussie\n`);
    } catch (error) {
      setTestResults(prev => prev + `❌ Erreur connexion: ${error}\n`);
    }
    
    setIsLoading(false);
  };

  const runNutritionEstimateTest = async () => {
    setIsLoading(true);
    setTestResults(prev => prev + '\n🧮 Test estimation nutritionnelle...\n');
    
    try {
      const result = await estimateNutritionWithOpenAI('chicken breast');
      setTestResults(prev => prev + `✅ Estimation poulet: ${JSON.stringify(result, null, 2)}\n`);
    } catch (error) {
      setTestResults(prev => prev + `❌ Erreur estimation: ${error}\n`);
    }
    
    setIsLoading(false);
  };

  const runImageAnalysisTest = async () => {
    setIsLoading(true);
    setTestResults(prev => prev + '\n🖼️ Test analyse d\'image...\n');
    
    try {
      // Test avec une image d'exemple
      const testImageUrl = 'https://replicate.delivery/pbxt/MvoFggJfmpSOBa0TiiQbvxLc0eS7u6CpH2WHaq30FZCVIvFa/test.jpg';
      const result = await analyzeNutritionImage(testImageUrl);
      setTestResults(prev => prev + `✅ Analyse image: ${result}\n`);
    } catch (error) {
      setTestResults(prev => prev + `❌ Erreur analyse: ${error}\n`);
    }
    
    setIsLoading(false);
  };

  const runFullTest = async () => {
    setTestResults('🚀 Début des tests complets OpenAI...\n');
    await runConnectionTest();
    await runNutritionEstimateTest();
    await runImageAnalysisTest();
    setTestResults(prev => prev + '\n🎉 Tests terminés!');
  };

  const clearResults = () => {
    setTestResults('');
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <Text className="text-xl font-bold text-gray-800 mb-4">Test OpenAI GPT-4o</Text>
      
      <View className="space-y-3 mb-4">
        <Pressable 
          className="bg-blue-500 rounded-lg py-3 px-4"
          onPress={runConnectionTest}
          disabled={isLoading}
        >
          <Text className="text-white font-semibold text-center">Test Connexion</Text>
        </Pressable>
        
        <Pressable 
          className="bg-green-500 rounded-lg py-3 px-4"
          onPress={runNutritionEstimateTest}
          disabled={isLoading}
        >
          <Text className="text-white font-semibold text-center">Test Estimation Nutritionnelle</Text>
        </Pressable>
        
        <Pressable 
          className="bg-purple-500 rounded-lg py-3 px-4"
          onPress={runImageAnalysisTest}
          disabled={isLoading}
        >
          <Text className="text-white font-semibold text-center">Test Analyse Image</Text>
        </Pressable>
        
        <Pressable 
          className="bg-orange-500 rounded-lg py-3 px-4"
          onPress={runFullTest}
          disabled={isLoading}
        >
          <Text className="text-white font-semibold text-center">Test Complet</Text>
        </Pressable>
        
        <Pressable 
          className="bg-gray-500 rounded-lg py-3 px-4"
          onPress={clearResults}
          disabled={isLoading}
        >
          <Text className="text-white font-semibold text-center">Effacer</Text>
        </Pressable>
      </View>
      
      {isLoading && (
        <View className="flex-row items-center justify-center py-4">
          <ActivityIndicator size="small" color="#3B82F6" />
          <Text className="ml-2 text-gray-600">Test en cours...</Text>
        </View>
      )}
      
      <View className="bg-gray-100 rounded-lg p-4 min-h-[200px]">
        <Text className="text-xs font-mono text-gray-800">
          {testResults || 'Aucun test exécuté. Cliquez sur un bouton pour commencer.'}
        </Text>
      </View>
    </ScrollView>
  );
};

export default OpenAITestComponent;
