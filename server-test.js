// server-test.js - Serveur simple pour test
const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

// Configuration
const WHATSAPP_TOKEN = 'EAAPSeW1gAioBPCezPMcRg5DQNaFxhppG79pH3oaR5qIMD5OvoHM378kxUZAvBXnJZBwZCm4ZCBCV5pDRVzUI4phwCVaukogXy9WCHjqH1smLryZCjiTJvhf2TvYijvoXRBq7eGYWDxb4yIgMOxsD5tgB6qBO0dRZBntsNqZAgIr4g5DU1Q4OnPaZAw6UOgZCHtaQf8QzCdWTloZAnCWMS4QHrZBQDIvkCkHzB4v8LNXxrmI5wL9hAZDZD';
const WHATSAPP_PHONE_NUMBER_ID = '1075843898016298';
const RECIPIENT_NUMBER = '212661053971';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Fonction de génération du code
function generateDailyCode() {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const seed = "TIS" + dateStr;
    
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash = hash & hash;
    }
    
    const alphaNum = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'TIS';
    const hashAbs = Math.abs(hash);
    for (let i = 0; i < 5; i++) {
        code += alphaNum.charAt(hashAbs % alphaNum.length);
        hash = Math.floor(hash / alphaNum.length);
    }
    
    return code;
}

// Route pour envoyer WhatsApp (contourne CORS)
app.post('/send-whatsapp', async (req, res) => {
    try {
        const code = generateDailyCode();
        const message = `🔐 *Code d'accès TIS - Test Server*

📅 Date : ${new Date().toLocaleDateString('fr-FR')}
🕐 Heure : ${new Date().toLocaleTimeString('fr-FR')}
🔑 Code : *${code}*

✅ Test d'envoi depuis serveur Node.js réussi !
🚀 CORS contourné avec succès

_Message envoyé via le serveur de test_`;

        const response = await axios.post(
            `https://graph.facebook.com/v18.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                to: RECIPIENT_NUMBER,
                type: 'text',
                text: { body: message }
            },
            {
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        res.json({
            success: true,
            messageId: response.data.messages[0].id,
            code: code,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Erreur WhatsApp:', error.response?.data || error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.response?.data
        });
    }
});

// Route pour obtenir le code du jour
app.get('/api/code', (req, res) => {
    res.json({
        code: generateDailyCode(),
        date: new Date().toLocaleDateString('fr-FR'),
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur de test TIS sur http://localhost:${PORT}`);
    console.log(`🔐 Code du jour : ${generateDailyCode()}`);
});

/*
STRUCTURE DU PROJET :
tis-whatsapp-test/
├── server-test.js          (ce fichier)
├── public/
│   └── index.html         (l'interface HTML)
├── package.json
└── README.md

COMMANDES :
npm init -y
npm install express axios
node server-test.js
*/