import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { generateContent } from '../api/gemini';

/**
 * Composant de test pour vérifier que Gemini fonctionne dans l'app
 * À utiliser temporairement pour déboguer
 */
export default function GeminiTestComponent() {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testBasicGemini = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('🧪 Test basique Gemini...');
      const response = await generateContent('Bonjour, peux-tu me répondre en français?');
      console.log('✅ Réponse Gemini:', response);
      setResult(`✅ SUCCESS: ${response}`);
      Alert.alert('Success', 'Gemini fonctionne!');
    } catch (error) {
      console.error('❌ Erreur Gemini:', error);
      setResult(`❌ ERROR: ${error.message}`);
      Alert.alert('Error', `Gemini ne fonctionne pas: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testFoodIdentification = async () => {
    setLoading(true);
    setResult('');
    
    try {
      console.log('🍽️ Test identification aliments...');
      const foodPrompt = `Identify foods in: "Pizza margherita with salad"

IMPORTANT: Respond ONLY with food lines in this EXACT format:
FOOD_NAME | SCALE_FACTOR | REASONING

Rules:
- Use simple food names (no asterisks, parentheses, or formatting)
- Scale: 1.0 = standard serving
- Do NOT include headers, separators, or explanatory text

Examples:
Pizza margherita | 1.0 | Standard serving
Salad | 1.0 | Side portion`;

      const response = await generateContent(foodPrompt);
      console.log('✅ Food identification:', response);
      
      // Parser comme dans nutrition-ai.ts
      const lines = response.split('\n')
        .map(l => l.trim())
        .filter(l => l && l.includes('|'));
      
      console.log('📊 Lignes parsées:', lines);
      setResult(`✅ FOOD IDENTIFICATION SUCCESS:\n${response}\n\nParsed lines: ${lines.length}`);
      Alert.alert('Success', `${lines.length} aliments détectés!`);
    } catch (error) {
      console.error('❌ Erreur food identification:', error);
      setResult(`❌ FOOD ERROR: ${error.message}`);
      Alert.alert('Error', `Food identification failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="p-4 bg-white border border-gray-200 rounded-lg m-4">
      <Text className="text-lg font-bold mb-4">🧪 Gemini Test Component</Text>
      
      <View className="flex-row gap-2 mb-4">
        <Pressable
          className="bg-blue-500 px-4 py-2 rounded flex-1"
          onPress={testBasicGemini}
          disabled={loading}
        >
          <Text className="text-white text-center font-medium">
            {loading ? 'Testing...' : 'Test Basic'}
          </Text>
        </Pressable>
        
        <Pressable
          className="bg-green-500 px-4 py-2 rounded flex-1"
          onPress={testFoodIdentification}
          disabled={loading}
        >
          <Text className="text-white text-center font-medium">
            {loading ? 'Testing...' : 'Test Food ID'}
          </Text>
        </Pressable>
      </View>

      {result && (
        <ScrollView className="bg-gray-100 p-3 rounded max-h-40">
          <Text className="text-xs font-mono">{result}</Text>
        </ScrollView>
      )}
      
      <Text className="text-xs text-gray-500 mt-2">
        Vérifiez la console pour les logs détaillés
      </Text>
    </View>
  );
}
