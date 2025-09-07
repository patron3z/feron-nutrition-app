#!/bin/bash

echo "🚀 Configuration GitHub pour Feron Nutrition App"
echo "================================================"

# Configuration Git (modifiez avec vos informations)
echo "📝 Configuration Git..."
git config --global user.name "Votre Nom"
git config --global user.email "votre.email@example.com"

# Initialisation du repository
echo "🔧 Initialisation Git..."
git init

# Ajout de tous les fichiers
echo "📁 Ajout des fichiers..."
git add .

# Premier commit
echo "💾 Premier commit..."
git commit -m "Initial commit: Feron Nutrition App avec OpenAI GPT-4o integration

Fonctionnalités incluses:
- 📷 Scan de nourriture avec caméra
- 🤖 Analyse IA avec OpenAI GPT-4o
- 📊 Base de données nutritionnelle USDA
- 📱 Interface React Native moderne
- 🔥 Suivi des calories et macronutriments
- 💳 Intégration Stripe pour abonnements premium
- 🗄️ Synchronisation Supabase
- 📋 Écran de confirmation détaillé
- 🎨 Design responsive avec Tailwind CSS"

# Configuration de la branche principale
echo "🌿 Configuration branche main..."
git branch -M main

echo "✅ Configuration locale terminée!"
echo ""
echo "📋 ÉTAPES SUIVANTES:"
echo "1. Créez un repository sur https://github.com/new"
echo "2. Nommez-le: feron-nutrition-app"
echo "3. Exécutez ces commandes (remplacez VOTRE-USERNAME):"
echo ""
echo "   git remote add origin https://github.com/VOTRE-USERNAME/feron-nutrition-app.git"
echo "   git push -u origin main"
echo ""
echo "🎉 Votre projet sera alors sauvegardé sur GitHub!"
