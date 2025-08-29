// server-test.js - Serveur simple pour test avec envoi d'email
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const app = express();

// Configuration Email
const EMAIL_CONFIG = {
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'oussamakanouni39@gmail.com',
        pass: process.env.EMAIL_PASS || 'urhu hygf gftt ycjl'
    }
};

const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL || 'oussamaknouni39@gmail.com';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
    service: EMAIL_CONFIG.service,
    auth: EMAIL_CONFIG.auth
});

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

// Route pour envoyer Email
app.post('/send-email', async (req, res) => {
    try {
        const code = generateDailyCode();
        const currentDate = new Date();
        
        const mailOptions = {
            from: EMAIL_CONFIG.auth.user,
            to: RECIPIENT_EMAIL,
            subject: '🔐 Code d\'accès TIS - Test Server',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; text-align: center; color: white; margin-bottom: 20px;">
                        <h1 style="margin: 0; font-size: 2.5em;">🔐</h1>
                        <h2 style="margin: 10px 0;">Code d'accès TIS</h2>
                        <p style="margin: 0; opacity: 0.9;">Test Server - Version Email</p>
                    </div>
                    
                    <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <div style="background: #f8f9fa; border: 2px dashed #007bff; border-radius: 15px; padding: 25px; margin: 20px 0;">
                                <h3 style="color: #007bff; font-size: 2.5em; margin-bottom: 10px; font-family: 'Courier New', monospace; letter-spacing: 2px;">${code}</h3>
                                <p style="color: #666; font-size: 14px; margin: 0;">Code valide jusqu'à demain</p>
                            </div>
                        </div>
                        
                        <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 5px;">
                            <p style="margin: 0; font-size: 14px; color: #1976d2;">
                                <strong>📧 Test d'envoi par email réussi !</strong><br>
                                📅 Date : ${currentDate.toLocaleDateString('fr-FR')}<br>
                                🕐 Heure : ${currentDate.toLocaleTimeString('fr-FR')}<br>
                                🚀 Serveur Node.js opérationnel
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="margin: 0; font-size: 12px; color: #999;">
                                Message envoyé via le serveur de test TIS<br>
                                Projet de test - Version Server 1.0
                            </p>
                        </div>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            messageId: info.messageId,
            code: code,
            timestamp: new Date().toISOString(),
            recipient: RECIPIENT_EMAIL
        });

        console.log('✅ Email envoyé avec succès:', info.messageId);

    } catch (error) {
        console.error('❌ Erreur envoi email:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.toString()
        });
    }
});

// Route pour tester la configuration email
app.get('/test-email-config', async (req, res) => {
    try {
        await transporter.verify();
        res.json({
            success: true,
            message: 'Configuration email valide',
            service: EMAIL_CONFIG.service,
            user: EMAIL_CONFIG.auth.user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Configuration email invalide',
            details: error.message
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

// Fonction d'envoi automatique du code quotidien
async function sendDailyCodeEmail() {
    try {
        const code = generateDailyCode();
        const currentDate = new Date();
        
        // Formatage de la date en français (Maroc)
        const dateOptions = { 
            timeZone: 'Africa/Casablanca',
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        const timeOptions = {
            timeZone: 'Africa/Casablanca',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        
        const formattedDate = currentDate.toLocaleDateString('fr-FR', dateOptions);
        const formattedTime = currentDate.toLocaleTimeString('fr-FR', timeOptions);
        
        const mailOptions = {
            from: EMAIL_CONFIG.auth.user,
            to: RECIPIENT_EMAIL,
            subject: `🔐 Code TIS quotidien - ${formattedDate}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; text-align: center; color: white; margin-bottom: 20px;">
                        <h1 style="margin: 0; font-size: 2.5em;">🌅</h1>
                        <h2 style="margin: 10px 0;">Code TIS Quotidien</h2>
                        <p style="margin: 0; opacity: 0.9;">Envoi automatique - 07h00 Casablanca</p>
                    </div>
                    
                    <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h3 style="color: #333; margin-bottom: 20px;">🗓️ ${formattedDate}</h3>
                            
                            <div style="background: #f8f9fa; border: 2px dashed #007bff; border-radius: 15px; padding: 25px; margin: 20px 0;">
                                <h3 style="color: #007bff; font-size: 2.5em; margin-bottom: 10px; font-family: 'Courier New', monospace; letter-spacing: 2px;">${code}</h3>
                                <p style="color: #666; font-size: 14px; margin: 0;">Code valide jusqu'à demain 07h00</p>
                            </div>
                        </div>
                        
                        <div style="background: #e8f5e8; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px;">
                            <p style="margin: 0; font-size: 14px; color: #155724;">
                                <strong>📧 Envoi automatique quotidien</strong><br>
                                🕰️ Heure d'envoi : ${formattedTime} (Casablanca)<br>
                                🔄 Prochain envoi : Demain à 07h00<br>
                                🚀 Serveur TIS opérationnel
                            </p>
                        </div>
                        
                        <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px;">
                            <p style="margin: 0; font-size: 13px; color: #856404;">
                                <strong>ℹ️ Informations importantes :</strong><br>
                                • Le code est généré automatiquement chaque jour à minuit<br>
                                • Cet email est envoyé automatiquement à 07h00 (heure du Maroc)<br>
                                • Vous pouvez aussi générer le code manuellement depuis l'interface web
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="margin: 0; font-size: 12px; color: #999;">
                                Message envoyé automatiquement par le serveur TIS<br>
                                Projet de test - Version Email avec envoi automatique
                            </p>
                        </div>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        
        const casablancaTime = new Date().toLocaleString('fr-FR', {
            timeZone: 'Africa/Casablanca',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        console.log(`✅ [${casablancaTime}] Email quotidien envoyé automatiquement`);
        console.log(`   📧 ID: ${info.messageId}`);
        console.log(`   🔐 Code: ${code}`);
        console.log(`   📬 Destinataire: ${RECIPIENT_EMAIL}`);
        
        return { success: true, messageId: info.messageId, code: code };
        
    } catch (error) {
        const casablancaTime = new Date().toLocaleString('fr-FR', {
            timeZone: 'Africa/Casablanca'
        });
        console.error(`❌ [${casablancaTime}] Erreur envoi automatique:`, error.message);
        return { success: false, error: error.message };
    }
}

// Fonction pour programmer l'envoi quotidien à 7h00 (Casablanca)
function scheduleDaily7AMEmail() {
    const casablancaTime = new Date().toLocaleString('en-US', {
        timeZone: 'Africa/Casablanca'
    });
    const now = new Date(casablancaTime);
    
    // Calculer la prochaine occurrence de 7h00
    const next7AM = new Date(now);
    next7AM.setHours(7, 0, 0, 0);
    
    // Si on a déjà passé 7h00 aujourd'hui, programmer pour demain
    if (now.getTime() >= next7AM.getTime()) {
        next7AM.setDate(next7AM.getDate() + 1);
    }
    
    // Convertir en temps UTC pour setTimeout
    const nowUTC = new Date();
    const next7AMUTC = new Date(next7AM.toLocaleString('en-US', {
        timeZone: 'UTC'
    }));
    
    const timeUntilNext7AM = next7AMUTC.getTime() - nowUTC.getTime();
    
    console.log(`📅 Prochain envoi automatique programmé pour: ${next7AM.toLocaleString('fr-FR', {
        timeZone: 'Africa/Casablanca',
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })} (Casablanca)`);
    
    setTimeout(async () => {
        // Envoyer l'email quotidien
        await sendDailyCodeEmail();
        
        // Programmer le prochain envoi (dans 24h)
        scheduleDaily7AMEmail();
    }, timeUntilNext7AM);
}

// Route pour forcer l'envoi du code quotidien (pour tests)
app.post('/send-daily-code', async (req, res) => {
    try {
        const result = await sendDailyCodeEmail();
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur de test TIS sur http://localhost:${PORT}`);
    console.log(`🔐 Code du jour : ${generateDailyCode()}`);
    console.log(`📧 Email destinataire : ${RECIPIENT_EMAIL}`);
    
    // Afficher l'heure actuelle au Maroc
    const casablancaTime = new Date().toLocaleString('fr-FR', {
        timeZone: 'Africa/Casablanca',
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    console.log(`🕐 Heure actuelle (Casablanca) : ${casablancaTime}`);
    
    // Test de la configuration email au démarrage
    transporter.verify((error, success) => {
        if (error) {
            console.log('❌ Configuration email invalide:', error.message);
        } else {
            console.log('✅ Configuration email valide');
            
            // Programmer l'envoi quotidien à 7h00
            scheduleDaily7AMEmail();
        }
    });
});

/*
STRUCTURE DU PROJET :
tis-email-test/
├── server-test.js          (ce fichier)
├── public/
│   └── index.html         (l'interface HTML)
├── package.json
└── README.md

COMMANDES :
npm init -y
npm install express nodemailer
node server-test.js

CONFIGURATION EMAIL :
1. Pour Gmail, activez l'authentification à 2 facteurs
2. Générez un "mot de passe d'application" dans les paramètres de sécurité Google
3. Remplacez EMAIL_CONFIG avec vos informations
4. Remplacez RECIPIENT_EMAIL avec l'email de destination

AUTRES FOURNISSEURS :
- Outlook: service: 'hotmail'
- Yahoo: service: 'yahoo'
- Ou configuration SMTP personnalisée
*/