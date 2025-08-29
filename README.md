🎯 Aperçu du Projet
TIS Authentication System est une solution complète d'authentification basée sur des codes journaliers générés algorithmiquement et distribués automatiquement par email. Le système combine sécurité, automation et expérience utilisateur moderne.
🎪 Démo en Ligne

URL de Production : https://tis-email-server.onrender.com
Interface Admin : Accessible après authentification avec le code du jour

🔑 Fonctionnement

Génération : Un code unique est généré chaque jour à minuit (algorithme déterministe)
Distribution : Envoi automatique par email à 07h00 (fuseau Casablanca)
Authentification : Interface web moderne pour saisie et vérification
Administration : Panneau de contrôle pour tests et monitoring


✨ Fonctionnalités
🔐 Sécurité

✅ Codes journaliers uniques - Génération algorithmique basée sur la date
✅ Rotation automatique - Nouveaux codes générés à minuit
✅ Variables d'environnement - Credentials sécurisés
✅ Validation côté serveur - Vérification robuste des codes

📧 Système d'Email

✅ Envoi automatique quotidien - Programmé pour 07h00 (GMT+1)
✅ Templates HTML responsive - Emails élégants et professionnels
✅ Configuration Gmail - Support des mots de passe d'application
✅ Gestion d'erreurs - Logging détaillé et retry automatique

🌐 Interface Web

✅ Design moderne - UI/UX responsive avec animations
✅ Mode temps réel - Mise à jour automatique du statut
✅ Panneau administrateur - Outils de test et monitoring
✅ PWA Ready - Interface adaptée mobile/desktop

🚀 DevOps

✅ Déploiement Render - Production ready avec variables d'environnement
✅ Monitoring intégré - Logs structurés et métriques de santé
✅ API RESTful - Endpoints documentés et testables
✅ Timezone handling - Support du fuseau horaire Maroc


🛠 Technologies Utilisées
🔧 Backend

Node.js 18+ - Runtime JavaScript
Express.js 4.21+ - Framework web
Nodemailer 7.0+ - Service email
dotenv - Gestion variables d'environnement

🎨 Frontend

HTML5 - Structure sémantique
CSS3 - Styles modernes, animations
JavaScript ES6+ - Logique client
Responsive Design - Mobile-first

🚀 DevOps

Render - Plateforme de déploiement
GitHub - Contrôle de version
npm - Gestionnaire de paquets
Environment Variables - Configuration sécurisée


🔧 Composants Principaux
Code Generation Engine
javascript// Algorithme déterministe basé sur la date
function generateDailyCode() {
    const seed = "TIS" + dateString;
    const hash = hashFunction(seed);
    return "TIS" + generateFromHash(hash, 5);
}
Email Scheduler
javascript// Programmation automatique à 7h00 Casablanca
function scheduleDaily7AMEmail() {
    const casablancaTime = new Date().toLocaleString('en-US', {
        timeZone: 'Africa/Casablanca'
    });
    // Calcul et programmation...
}

🚀 Installation
📦 Prérequis
bashNode.js >= 18.0.0
npm >= 9.0.0
Compte Gmail avec mot de passe d'application
⚡ Installation Rapide
bash# Clone du repository
git clone https://github.com/oussamaalmouallim/tis-authentication-system.git
cd tis-authentication-system

Installation des dépendances
npm install

Configuration des variables d'environnement
cp .env.example .env
Éditer .env avec vos credentials

 Lancement en développement
npm run dev

 Lancement en production
npm start

🔧 Configuration
📧 Configuration Gmail

Activer l'authentification à 2 facteurs
Générer un mot de passe d'application :

Google Account → Sécurité → Mots de passe d'application
Sélectionner "Application" → "Autre"
Copier le mot de passe généré



🔐 Variables d'Environnement
bash# .env
EMAIL_USER=votre-email@gmail.com
EMAIL_PASS=votre-mot-de-passe-app
RECIPIENT_EMAIL=destinataire@gmail.com
PORT=3000
NODE_ENV=production
TZ=Africa/Casablanca

🎯 Configuration Render
Dans le dashboard Render, ajouter ces variables :
VariableValeurDescriptionEMAIL_USERvotre-email@gmail.comAdresse Gmail expéditriceEMAIL_PASSmot-de-passe-appMot de passe d'application GmailRECIPIENT_EMAILdestinataire@gmail.comAdresse de réceptionNODE_ENVproductionEnvironment de déploiement
