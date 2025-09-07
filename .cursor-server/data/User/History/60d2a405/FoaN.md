# 🍎 Feron Nutrition App

Application mobile de nutrition intelligente avec analyse d'images alimentaires utilisant l'IA.

## ✨ Fonctionnalités

### 📷 **Scan Intelligent**
- **Caméra intégrée** pour scanner les plats
- **Analyse IA** avec OpenAI GPT-4o pour identifier les aliments
- **Détection automatique** des portions et échelles
- **Base de données USDA** pour des données nutritionnelles précises

### 📊 **Suivi Nutritionnel**
- **Calories et macronutriments** détaillés
- **Graphiques et statistiques** avec Victory Native
- **Objectifs personnalisés** et suivi des progrès
- **Historique complet** des repas

### 💳 **Abonnements Premium**
- **Intégration Stripe** pour les paiements
- **Plans Basic et Pro** avec fonctionnalités avancées
- **Gestion des abonnements** et annulation

### 🔄 **Synchronisation Cloud**
- **Supabase** pour la synchronisation des données
- **Sauvegarde automatique** des repas et statistiques
- **Accès multi-appareils**

## 🛠️ Technologies

### **Frontend**
- **React Native** avec Expo
- **TypeScript** pour la sécurité de type
- **Tailwind CSS** (NativeWind) pour le design
- **React Navigation** pour la navigation
- **Zustand** pour la gestion d'état

### **IA et APIs**
- **OpenAI GPT-4o** pour l'analyse d'images
- **USDA Food Database** pour les données nutritionnelles
- **Expo Camera** pour la capture d'images
- **Image processing** avancé

### **Backend et Services**
- **Supabase** pour la base de données et auth
- **Stripe** pour les paiements
- **Expo Constants** pour la configuration

## 🚀 Installation

### Prérequis
- Node.js 18+
- Expo CLI
- Compte Expo
- Clés API (OpenAI, USDA, Stripe, Supabase)

### Configuration
1. **Cloner le repository**
```bash
git clone https://github.com/VOTRE-USERNAME/feron-nutrition-app.git
cd feron-nutrition-app
```

2. **Installer les dépendances**
```bash
npm install
```

3. **Configurer les clés API**
Modifiez `app.json` avec vos clés :
```json
{
  "expo": {
    "extra": {
      "EXPO_PUBLIC_VIBECODE_OPENAI_API_KEY": "votre-cle-openai",
      "EXPO_PUBLIC_VIBECODE_USDA_API_KEY": "votre-cle-usda",
      "EXPO_PUBLIC_VIBECODE_STRIPE_PUBLISHABLE_KEY": "votre-cle-stripe",
      "EXPO_PUBLIC_VIBECODE_SUPABASE_URL": "votre-url-supabase",
      "EXPO_PUBLIC_VIBECODE_SUPABASE_ANON_KEY": "votre-cle-supabase"
    }
  }
}
```

4. **Lancer l'application**
```bash
npm start
```

## 📱 Écrans Principaux

### 🏠 **Dashboard**
- Vue d'ensemble des calories du jour
- Calendrier avec dates d'activité
- Macronutriments avec barres de progression
- Accès rapide aux fonctionnalités

### 📷 **Scanner**
- Interface caméra intuitive
- Analyse en temps réel
- Feedback visuel et audio
- Import depuis la galerie

### ✅ **Confirmation**
- Détails nutritionnels complets
- Ajustement des portions
- Modification des quantités
- Résumé nutritionnel avancé

### 👤 **Profil**
- Objectifs personnels
- Statistiques détaillées
- Paramètres de l'application
- Gestion de l'abonnement

## 🔧 Architecture

### **Structure des dossiers**
```
src/
├── api/           # Services API
├── components/    # Composants réutilisables
├── screens/       # Écrans de l'application
├── state/         # Gestion d'état Zustand
├── types/         # Types TypeScript
├── utils/         # Utilitaires
└── navigation/    # Configuration navigation
```

### **Services API**
- `nutrition-ai.ts` - Analyse IA avec OpenAI + USDA
- `supabase.ts` - Synchronisation des données
- `stripe.ts` - Gestion des paiements
- `usda.ts` - Base de données nutritionnelle

## 🎨 Design

### **Couleurs principales**
- **Vert** : `#16A34A` (actions, succès)
- **Bleu** : `#3B82F6` (informations)
- **Orange** : `#F59E0B` (alertes)
- **Gris** : `#6B7280` (texte secondaire)

### **Typographie**
- **Titres** : Font-bold, text-lg/xl
- **Corps** : Font-medium, text-base
- **Détails** : Font-normal, text-sm/xs

## 🔐 Sécurité

- **Clés API** stockées dans `Constants.expoConfig.extra`
- **Authentification** via Supabase
- **Validation** des données côté client et serveur
- **HTTPS** pour toutes les communications

## 🚀 Déploiement

### **Build de production**
```bash
# Android
expo build:android

# iOS
expo build:ios
```

### **Publication sur les stores**
```bash
# Google Play Store
expo upload:android

# Apple App Store
expo upload:ios
```

## 📈 Roadmap

- [ ] **Mode hors ligne** avec synchronisation
- [ ] **Reconnaissance vocale** pour l'ajout rapide
- [ ] **Recommandations IA** personnalisées
- [ ] **Intégration wearables** (Apple Watch, etc.)
- [ ] **Partage social** et défis entre amis
- [ ] **Scanner de codes-barres** pour produits packagés

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez :
1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 License

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 📞 Contact

- **Email** : contact@feron-nutrition.com
- **GitHub** : [@votre-username](https://github.com/votre-username)

---

**Développé avec ❤️ pour une nutrition intelligente et accessible à tous.**
