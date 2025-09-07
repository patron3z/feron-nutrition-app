#!/bin/bash

echo "🔄 Synchronisation avec GitHub: patron3z/feron-nutrition-app"
echo "=========================================================="

# Configuration Git
echo "📝 Configuration Git..."
git config --global user.name "patron3z"
git config --global user.email "votre.email@example.com"

# Vérifier si c'est déjà un repository Git
if [ ! -d ".git" ]; then
    echo "🔧 Initialisation Git..."
    git init
fi

# Ajouter le remote origin s'il n'existe pas
if ! git remote get-url origin > /dev/null 2>&1; then
    echo "🔗 Ajout du remote origin..."
    git remote add origin https://github.com/patron3z/feron-nutrition-app.git
fi

# Récupérer les données du repository distant
echo "📥 Récupération des données distantes..."
git fetch origin

# Créer/basculer sur la branche main
echo "🌿 Configuration branche main..."
git branch -M main

# Fusionner avec le distant si nécessaire
if git show-ref --verify --quiet refs/remotes/origin/main; then
    echo "🔀 Fusion avec la branche distante..."
    git merge origin/main --allow-unrelated-histories -m "Merge remote repository"
fi

# Ajouter tous les fichiers
echo "📁 Ajout des fichiers..."
git add .

# Commit avec message détaillé
echo "💾 Commit des changements..."
git commit -m "Complete Feron Nutrition App with OpenAI GPT-4o

🍎 Feron Nutrition App - Application mobile de nutrition intelligente

✨ Fonctionnalités principales:
- 📷 Scan de nourriture avec caméra
- 🤖 Analyse IA avec OpenAI GPT-4o
- 📊 Base de données nutritionnelle USDA
- 📱 Interface React Native moderne
- 🔥 Suivi des calories et macronutriments
- 💳 Intégration Stripe pour abonnements premium
- 🗄️ Synchronisation Supabase
- 📋 Écran de confirmation détaillé
- 🎨 Design responsive avec Tailwind CSS

🛠️ Technologies:
- React Native + Expo + TypeScript
- OpenAI GPT-4o pour l'analyse d'images
- USDA Food Database
- Supabase pour la synchronisation
- Stripe pour les paiements
- Zustand pour l'état global
- NativeWind (Tailwind CSS)

📱 Écrans:
- Dashboard avec calendrier et statistiques
- Scanner avec analyse IA en temps réel
- Confirmation avec détails nutritionnels
- Profil et paramètres premium
- Pages légales (Privacy, Terms, Support)

🔐 Sécurité:
- Clés API sécurisées
- Authentification Supabase
- Validation des données
- .gitignore complet"

# Push vers GitHub
echo "🚀 Push vers GitHub..."
git push -u origin main

echo ""
echo "✅ Synchronisation terminée!"
echo "🌐 Votre app est maintenant sur: https://github.com/patron3z/feron-nutrition-app"
echo ""
echo "📋 Prochaines étapes recommandées:"
echo "1. Vérifiez le repository sur GitHub"
echo "2. Configurez les secrets pour les clés API"
echo "3. Activez GitHub Actions si nécessaire"
echo "4. Invitez des collaborateurs si besoin"
