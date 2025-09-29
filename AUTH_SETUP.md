# 🔐 Configuration Google Connect et Facebook Connect

## 📋 Prérequis

1. **Compte Google Cloud Console** pour Google OAuth
2. **Compte Facebook Developers** pour Facebook OAuth
3. **Variables d'environnement** configurées

## 🚀 Configuration Google OAuth

### 1. Créer un projet Google Cloud
1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créer un nouveau projet ou sélectionner un projet existant
3. Activer l'API Google+ (ou Google Identity)

### 2. Configurer OAuth 2.0
1. Aller dans **APIs & Services** > **Credentials**
2. Cliquer sur **Create Credentials** > **OAuth 2.0 Client IDs**
3. Choisir **Web application**
4. Configurer les URLs autorisées :
   - **Authorized JavaScript origins**: `http://localhost:3000`, `https://votre-domaine.com`
   - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`, `https://votre-domaine.com/api/auth/callback/google`

### 3. Récupérer les identifiants
- **Client ID** : Copier dans `GOOGLE_CLIENT_ID`
- **Client Secret** : Copier dans `GOOGLE_CLIENT_SECRET`

## 📘 Configuration Facebook OAuth

### 1. Créer une app Facebook
1. Aller sur [Facebook Developers](https://developers.facebook.com/)
2. Cliquer sur **My Apps** > **Create App**
3. Choisir **Consumer** ou **Business**
4. Remplir les informations de l'app

### 2. Configurer Facebook Login
1. Dans le dashboard de l'app, ajouter le produit **Facebook Login**
2. Aller dans **Facebook Login** > **Settings**
3. Configurer les URLs :
   - **Valid OAuth Redirect URIs**: `http://localhost:3000/api/auth/callback/facebook`, `https://votre-domaine.com/api/auth/callback/facebook`
   - **App Domains**: `localhost`, `votre-domaine.com`

### 3. Récupérer les identifiants
- **App ID** : Copier dans `FACEBOOK_CLIENT_ID`
- **App Secret** : Copier dans `FACEBOOK_CLIENT_SECRET`

## ⚙️ Configuration des variables d'environnement

Ajouter dans `.env.local` :

```env
# Configuration NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Facebook OAuth
FACEBOOK_CLIENT_ID=your-facebook-app-id
FACEBOOK_CLIENT_SECRET=your-facebook-app-secret
```

## 🔄 Utilisation

### Mode développement (simulation)
- Utilise `SocialAuth.tsx` (simulation)
- Pas besoin de vrais identifiants OAuth

### Mode production (vraie authentification)
- Utilise `SocialAuthNextAuth.tsx`
- Nécessite les vrais identifiants OAuth

## 🛠️ Migration vers la vraie authentification

1. **Configurer les providers OAuth** (Google + Facebook)
2. **Remplacer l'import** dans `QuoteForm.tsx` :
   ```tsx
   // Remplacer
   import SocialAuth from './SocialAuth';
   
   // Par
   import SocialAuth from './SocialAuthNextAuth';
   ```
3. **Tester en local** avec les vrais identifiants
4. **Déployer** avec les variables d'environnement

## 🔒 Sécurité

- **NEXTAUTH_SECRET** : Générer une clé forte (32+ caractères)
- **Variables d'environnement** : Ne jamais commiter dans Git
- **URLs de callback** : Vérifier que les domaines sont corrects
- **HTTPS** : Obligatoire en production

## 🐛 Dépannage

### Erreur "Invalid redirect URI"
- Vérifier les URLs dans les consoles OAuth
- S'assurer que les domaines correspondent

### Erreur "Invalid client"
- Vérifier les identifiants OAuth
- S'assurer que l'app est activée

### Erreur "Access denied"
- Vérifier les permissions demandées
- S'assurer que l'app est en mode développement/test
