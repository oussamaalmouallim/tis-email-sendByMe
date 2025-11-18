// ⚠️ IMPORTANT : dotenv EN PREMIER, avant tout le reste
require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const app = express();

// LOG des variables d'environnement pour debug
console.log('🔍 Variables d\'environnement chargées :');
console.log('   EMAIL_HOST:', process.env.EMAIL_HOST || '❌ NON DÉFINI');
console.log('   EMAIL_PORT:', process.env.EMAIL_PORT || '❌ NON DÉFINI');
console.log('   EMAIL_USER:', process.env.EMAIL_USER || '❌ NON DÉFINI');
console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✅ DÉFINI (' + process.env.EMAIL_PASS.length + ' caractères)' : '❌ NON DÉFINI');
console.log('   RECIPIENT_EMAIL:', process.env.RECIPIENT_EMAIL || '❌ NON DÉFINI');

// Configuration Email - UNE SEULE FOIS
const EMAIL_CONFIG = {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true pour 465, false pour 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000
};

const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL;

console.log('📧 Configuration email :');
console.log('   Host:', EMAIL_CONFIG.host);
console.log('   Port:', EMAIL_CONFIG.port);
console.log('   Secure:', EMAIL_CONFIG.secure);
console.log('   User:', EMAIL_CONFIG.auth.user);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Variables globales pour le système anti-veille
let lastEmailSent = null;
let emailSentToday = false;

// ⚠️ DÉCLARATION UNIQUE du transporteur - NE PAS DUPLIQUER
const transporter = nodemailer.createTransport(EMAIL_CONFIG);

// Test de connexion immédiat
console.log('🔌 Test de connexion SMTP...');
transporter.verify((error, success) => {
    if (error) {
        console.log('❌ Configuration email invalide');
        console.log('   Erreur:', error.message);
        console.log('   Code:', error.code);
    } else {
        console.log('✅ Configuration email valide - Serveur SMTP prêt');
    }
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

// Fonction d'envoi automatique du code quotidien
async function sendDailyCodeEmail() {
    try {
        const code = generateDailyCode();
        const currentDate = new Date();
        
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
    
    if (lastEmailSent && lastEmailSent !== today) {
        emailSentToday = false;
        lastEmailSent = null;
    }
    
    const shouldSend = hour >= 7 && hour < 23 && !emailSentToday;
    
    if (shouldSend) {
        console.log(`🚀 [SENDING EMAIL] at ${hour}h${minute.toString().padStart(2, '0')}`);
        
        sendDailyCodeEmail()
            .then(result => {
                if (result.success) {
                    emailSentToday = true;
                    lastEmailSent = today;
                    console.log('✅ Daily email sent automatically!');
                }
            })
            .catch(error => {
                console.error('❌ Error during send:', error.message);
            });
    }
}

// ROUTES

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
    
    console.log(`💓 Keepalive ping - ${casablancaTime}`);
    
    checkAndSendDailyEmail();
    
    res.status(200).json({ 
        status: 'alive',
        timestamp: new Date().toISOString(),
        casablancaTime: casablancaTime,
        hour: parseInt(hour),
        emailSentToday: emailSentToday,
        lastEmailSent: lastEmailSent
    });
});

app.get('/diagnostic', (req, res) => {
    res.json({
        status: 'operational',
        timestamp: new Date().toISOString(),
        environment: {
            EMAIL_HOST: process.env.EMAIL_HOST || 'NOT SET',
            EMAIL_PORT: process.env.EMAIL_PORT || 'NOT SET',
            EMAIL_USER: process.env.EMAIL_USER || 'NOT SET',
            EMAIL_PASS_SET: !!process.env.EMAIL_PASS,
            EMAIL_PASS_LENGTH: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0,
            RECIPIENT_EMAIL: process.env.RECIPIENT_EMAIL || 'NOT SET'
        },
        config: {
            host: EMAIL_CONFIG.host,
            port: EMAIL_CONFIG.port,
            secure: EMAIL_CONFIG.secure,
            user: EMAIL_CONFIG.auth.user
        },
        emailStatus: {
            lastEmailSent: lastEmailSent,
            emailSentToday: emailSentToday
        },
        currentCode: generateDailyCode()
    });
});

app.post('/send-email', async (req, res) => {
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

app.get('/test-email-config', async (req, res) => {
    try {
        await transporter.verify();
        res.json({
            success: true,
            message: 'Configuration email valide',
            host: EMAIL_CONFIG.host,
            port: EMAIL_CONFIG.port,
            user: EMAIL_CONFIG.auth.user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Configuration invalide',
            details: error.message,
            host: EMAIL_CONFIG.host,
            port: EMAIL_CONFIG.port
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

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.post('/auth/verify', (req, res) => {
    const { code } = req.body;
    const correctCode = process.env.ADMIN_CODE;
    
    if (code === correctCode) {
        res.json({ success: true, message: 'Authentification réussie' });
    } else {
        res.json({ success: false, message: 'Code d\'accès incorrect' });
    }
});

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

app.post('/reset-daily-flag', (req, res) => {
    emailSentToday = false;
    lastEmailSent = null;
    res.json({
        success: true,
        message: 'Flag réinitialisé'
    });
});

app.get('/', (req, res) => {
    res.redirect('/admin');
});

app.get('/public', (req, res) => {
    res.send(`
        <h1>🚀 Serveur TIS - Version Anti-Veille</h1>
        <p>Code actuel : <strong>${generateDailyCode()}</strong></p>
        <ul>
            <li><a href="/diagnostic">Diagnostic</a></li>
            <li><a href="/keepalive">Keep Alive</a></li>
            <li><a href="/api/code">API Code</a></li>
        </ul>
    `);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur TIS sur port ${PORT}`);
    console.log(`🔐 Code du jour : ${generateDailyCode()}`);
    console.log(`📧 Destinataire : ${RECIPIENT_EMAIL}`);
});