
require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const app = express();

// ===== WORKAROUND : Nettoyage automatique des guillemets =====
function cleanEnvVar(varName) {
    if (process.env[varName]) {
        let value = process.env[varName];
        
        // Supprimer les guillemets au début et à la fin
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
            console.log(`🧹 [${varName}] Guillemets supprimés automatiquement`);
        } else if (value.startsWith("'") && value.endsWith("'")) {
            value = value.slice(1, -1);
            console.log(`🧹 [${varName}] Apostrophes supprimées automatiquement`);
        }
        
        process.env[varName] = value;
        return value;
    }
    return null;
}

// Nettoyer toutes les variables qui pourraient avoir des guillemets
cleanEnvVar('EMAIL_PASS');
cleanEnvVar('EMAIL_HOST');
cleanEnvVar('EMAIL_USER');
cleanEnvVar('RECIPIENT_EMAIL');
cleanEnvVar('ADMIN_CODE');


console.log('🔍 Variables après nettoyage:');
console.log('   EMAIL_HOST:', process.env.EMAIL_HOST);
console.log('   EMAIL_PORT:', process.env.EMAIL_PORT);
console.log('   EMAIL_USER:', process.env.EMAIL_USER);
console.log('   EMAIL_PASS longueur:', process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0);
console.log('   EMAIL_PASS premier char:', process.env.EMAIL_PASS ? `"${process.env.EMAIL_PASS[0]}"` : 'N/A');
console.log('   RECIPIENT_EMAIL:', process.env.RECIPIENT_EMAIL);


// Configuration Email CORRIGÉE pour Render
const EMAIL_CONFIG = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true pour port 465, false pour 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false // Nécessaire sur certains hébergeurs
    }
};

console.log('📧 Configuration SMTP:');
console.log('   Host:', EMAIL_CONFIG.host);
console.log('   Port:', EMAIL_CONFIG.port);
console.log('   User:', EMAIL_CONFIG.auth.user);
console.log('   Pass length:', EMAIL_CONFIG.auth.pass ? EMAIL_CONFIG.auth.pass.length : 0);

const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL;



app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Variables globales pour le système anti-veille
let lastEmailSent = null;
let emailSentToday = false;

// Configuration du transporteur email
const transporter = nodemailer.createTransport(EMAIL_CONFIG);

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
                        <p style="margin: 0; opacity: 0.9;">Envoi automatique - Render Server</p>
                    </div>
                    
                    <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 5px 15px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h3 style="color: #333; margin-bottom: 20px;">🗓️ ${formattedDate}</h3>
                            
                            <div style="background: #f8f9fa; border: 2px dashed #007bff; border-radius: 15px; padding: 25px; margin: 20px 0;">
                                <h3 style="color: #007bff; font-size: 2.5em; margin-bottom: 10px; font-family: 'Courier New', monospace; letter-spacing: 2px;">${code}</h3>
                                <p style="color: #666; font-size: 14px; margin: 0;">Code valide jusqu'à demain</p>
                            </div>
                        </div>
                        
                        <div style="background: #e8f5e8; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px;">
                            <p style="margin: 0; font-size: 14px; color: #155724;">
                                <strong>📧 Envoi automatique quotidien</strong><br>
                                🕰️ Heure d'envoi : ${formattedTime} (Casablanca)<br>
                                🔄 Prochain envoi : Demain<br>
                                🚀 Serveur TIS opérationnel
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="margin: 0; font-size: 12px; color: #999;">
                                Message envoyé automatiquement par le serveur TIS<br>
                                Hébergé sur Render - Version anti-veille
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
        
        // Marquer l'email comme envoyé aujourd'hui
        const today = new Date().toDateString();
        lastEmailSent = today;
        emailSentToday = true;
        
        return { success: true, messageId: info.messageId, code: code };
        
    } catch (error) {
        const casablancaTime = new Date().toLocaleString('fr-FR', {
            timeZone: 'Africa/Casablanca'
        });
        console.error(`❌ [${casablancaTime}] Erreur envoi automatique:`, error.message);
        return { success: false, error: error.message };
    }
}

// Vérification automatique à chaque requête
function checkAndSendDailyEmail() {
    const now = new Date();
    const casablancaTime = new Date(now.toLocaleString('en-US', {
        timeZone: 'Africa/Casablanca'
    }));
    
    const today = casablancaTime.toDateString();
    const hour = casablancaTime.getHours();
    const minute = casablancaTime.getMinutes();
    
    // Réinitialiser le flag si on est un nouveau jour
    if (lastEmailSent !== today) {
        emailSentToday = false;
    }
    
    // Envoyer l'email si :
    // 1. Il est après 7h00 (heure de Casablanca)
    // 2. On n'a pas encore envoyé d'email aujourd'hui
    // 3. Il est avant 23h00 (pour éviter les envois tardifs)
    if (hour >= 7 && hour < 23 && !emailSentToday) {
        console.log(`🔄 Tentative d'envoi automatique à ${hour}h${minute.toString().padStart(2, '0')}`);
        sendDailyCodeEmail()
            .then(result => {
                if (result.success) {
                    emailSentToday = true;
                }
            })
            .catch(error => {
                console.error('Erreur lors de l\'envoi automatique:', error);
            });
    }
}

// Route de keepalive pour UptimeRobot

app.get('/keepalive', (req, res) => {
    const casablancaTime = new Date().toLocaleString('fr-FR', {
        timeZone: 'Africa/Casablanca',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    const hour = new Date().toLocaleString('en-US', {
        timeZone: 'Africa/Casablanca',
        hour: 'numeric',
        hour12: false
    });
    
    console.log(`💓 Keepalive ping - ${casablancaTime} - Heure: ${hour}h`);
    
    // Vérification et envoi de l'email si nécessaire
    checkAndSendDailyEmail();
    
    // Réponse pour UptimeRobot
    res.status(200).json({ 
        status: 'alive',
        timestamp: new Date().toISOString(),
        casablancaTime: casablancaTime,
        hour: parseInt(hour),
        emailSentToday: emailSentToday,
        lastEmailSent: lastEmailSent,
        server: 'Render',
        uptime: process.uptime(),
        message: 'Email check triggered' // ← Ce message devrait apparaître
    });
});

// Fonction de vérification et d'envoi de l'email quotidien

function checkAndSendDailyEmail() {
    const now = new Date();
    const casablancaTime = new Date(now.toLocaleString('en-US', {
        timeZone: 'Africa/Casablanca'
    }));
    
    const today = casablancaTime.toDateString();
    const hour = casablancaTime.getHours();
    const minute = casablancaTime.getMinutes();
    
    // LOGS DÉTAILLÉS pour debugging
    console.log(`🔍 [EMAIL CHECK] ${hour}h${minute.toString().padStart(2, '0')}`);
    console.log(`   📅 Today: ${today}`);
    console.log(`   📧 Email sent today: ${emailSentToday}`);
    console.log(`   📝 Last email sent: ${lastEmailSent}`);
    
    // Réinitialiser si nouveau jour
    if (lastEmailSent && lastEmailSent !== today) {
        console.log('🗓️ NEW DAY - Resetting email flag');
        emailSentToday = false;
        lastEmailSent = null;
    }
    
    // Conditions
    const isAfter7AM = hour >= 7;
    const isBefore11PM = hour < 23;
    const notSentToday = !emailSentToday;
    
    console.log(`   ⏰ After 7AM: ${isAfter7AM} (current: ${hour}h)`);
    console.log(`   ⏰ Before 11PM: ${isBefore11PM}`);
    console.log(`   ✉️ Not sent today: ${notSentToday}`);
    
    const shouldSend = isAfter7AM && isBefore11PM && notSentToday;
    
    if (shouldSend) {
        console.log(`🚀 [SENDING EMAIL] Conditions met at ${hour}h${minute.toString().padStart(2, '0')}`);
        
        sendDailyCodeEmail()
            .then(result => {
                if (result.success) {
                    emailSentToday = true;
                    lastEmailSent = today;
                    console.log('✅ [SUCCESS] Daily email sent automatically!');
                } else {
                    console.error('❌ [FAILED] Send error:', result.error);
                }
            })
            .catch(error => {
                console.error('❌ [ERROR] Exception during send:', error.message);
            });
    } else {
        const reasons = [];
        if (!isAfter7AM) reasons.push(`too early (${hour}h < 7h)`);
        if (!isBefore11PM) reasons.push(`too late (${hour}h >= 23h)`);
        if (!notSentToday) reasons.push('already sent today');
        
        console.log(`⏭️ [NO SEND] Reasons: ${reasons.join(', ')}`);
    }
}

// Route pour forcer l'envoi (pour tests)
app.post('/send-daily-code', async (req, res) => {
    try {
        const result = await sendDailyCodeEmail();
        if (result.success) {
            emailSentToday = true;
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Route pour réinitialiser le flag (pour tests)
app.post('/reset-daily-flag', (req, res) => {
    emailSentToday = false;
    lastEmailSent = null;
    res.json({
        success: true,
        message: 'Flag d\'envoi quotidien réinitialisé'
    });
});


// Middleware pour servir les fichiers statiques
app.use(express.static(path.join(__dirname, 'public')));

// Exemple route d'accueil
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// AJOUTEZ CES ROUTES À VOTRE SERVEUR EXISTANT

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Dans ton fichier Node.js, ajoute cette route :
app.post('/auth/verify', (req, res) => {
    const { code } = req.body;
    const correctCode = process.env.ADMIN_CODE;
    
    console.log('Tentative de connexion avec code:', code);
    
    if (code === correctCode) {
        console.log('✅ Authentification réussie');
        res.json({ 
            success: true, 
            message: 'Authentification réussie' 
        });
    } else {
        console.log('❌ Code incorrect');
        res.json({ 
            success: false, 
            message: 'Code d\'accès incorrect' 
        });
    }
});

// MODIFIEZ VOTRE ROUTE "/" EXISTANTE POUR REDIRIGER VERS LE LOGIN
app.get('/', (req, res) => {
    // Redirection automatique vers la page d'admin
    res.redirect('/admin');
});

// OPTIONNEL: Route pour accès direct au diagnostic (gardez votre code existant)
app.get('/public', (req, res) => {
    res.send(`
        <h1>🚀 Serveur TIS - Version Anti-Veille</h1>
        <p>Serveur opérationnel sur Render</p>
        <ul>
            <li><a href="/diagnostic">Diagnostic complet</a></li>
            <li><a href="/keepalive">Keep Alive (pour UptimeRobot)</a></li>
            <li><a href="/api/code">Code du jour</a></li>
        </ul>
        <p>Code actuel : <strong>${generateDailyCode()}</strong></p>
    `);
});


// Route de test d'envoi email manuel
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
                                🚀 Serveur Node.js opérationnel sur Render
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="margin: 0; font-size: 12px; color: #999;">
                                Message envoyé via le serveur de test TIS<br>
                                Hébergé sur Render
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

        console.log('✅ Email de test envoyé avec succès:', info.messageId);

    } catch (error) {
        console.error('❌ Erreur envoi email:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.toString()
        });
    }
});

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

app.get('/api/code', (req, res) => {
    res.json({
        code: generateDailyCode(),
        date: new Date().toLocaleDateString('fr-FR'),
        timestamp: new Date().toISOString()
    });
});

// Page d'accueil
app.get('/', (req, res) => {
    res.send(`
        <h1>🚀 Serveur TIS - Version Anti-Veille</h1>
        <p>Serveur opérationnel sur Render</p>
        <ul>
            <li><a href="/diagnostic">Diagnostic complet</a></li>
            <li><a href="/keepalive">Keep Alive (pour UptimeRobot)</a></li>
            <li><a href="/api/code">Code du jour</a></li>
        </ul>
        <p>Code actuel : <strong>${generateDailyCode()}</strong></p>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur TIS anti-veille sur http://localhost:${PORT}`);
    console.log(`🔐 Code du jour : ${generateDailyCode()}`);
    console.log(`📧 Email destinataire : ${RECIPIENT_EMAIL}`);
    
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
            console.log('📧 Système d\'envoi automatique activé (déclenchement sur requête)');
            console.log('💡 Configurez UptimeRobot sur /keepalive pour maintenir le serveur éveillé');
        }
    });
});