// server-test.js - Version Vercel Serverless
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const app = express();

// Configuration Email (à configurer dans les variables d'environnement Vercel)
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
                        <p style="margin: 0; opacity: 0.9;">Envoi automatique depuis Vercel</p>
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
                                <strong>🌐 Envoi depuis Vercel</strong><br>
                                🕰️ Heure d'envoi : ${formattedTime} (Casablanca)<br>
                                ☁️ Serveur cloud 24h/24<br>
                                🚀 Service automatique actif
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                            <p style="margin: 0; font-size: 12px; color: #999;">
                                Message envoyé automatiquement depuis Vercel<br>
                                Projet TIS - Version Cloud
                            </p>
                        </div>
                    </div>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        
        console.log(`✅ Email quotidien envoyé depuis Vercel`);
        console.log(`   📧 ID: ${info.messageId}`);
        console.log(`   🔐 Code: ${code}`);
        
        return { success: true, messageId: info.messageId, code: code };
        
    } catch (error) {
        console.error(`❌ Erreur envoi depuis Vercel:`, error.message);
        return { success: false, error: error.message };
    }
}

// Route pour envoyer Email (manuel)
app.post('/send-email', async (req, res) => {
    try {
        const code = generateDailyCode();
        const currentDate = new Date();
        
        const mailOptions = {
            from: EMAIL_CONFIG.auth.user,
            to: RECIPIENT_EMAIL,
            subject: '🔐 Code d\'accès TIS - Test Manuel',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 15px; text-align: center; color: white; margin-bottom: 20px;">
                        <h1 style="margin: 0; font-size: 2.5em;">🔐</h1>
                        <h2 style="margin: 10px 0;">Code d'accès TIS</h2>
                        <p style="margin: 0; opacity: 0.9;">Test Manuel depuis Vercel</p>
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
                                <strong>📧 Test d'envoi manuel réussi !</strong><br>
                                📅 Date : ${currentDate.toLocaleDateString('fr-FR')}<br>
                                🕐 Heure : ${currentDate.toLocaleTimeString('fr-FR')}<br>
                                ☁️ Envoyé depuis Vercel
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
            recipient: RECIPIENT_EMAIL,
            platform: 'Vercel'
        });

    } catch (error) {
        console.error('❌ Erreur envoi email:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            details: error.toString()
        });
    }
});

// Route pour forcer l'envoi du code quotidien
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

// Route pour tester la configuration email
app.get('/test-email-config', async (req, res) => {
    try {
        await transporter.verify();
        res.json({
            success: true,
            message: 'Configuration email valide',
            service: 'gmail',
            user: EMAIL_CONFIG.auth.user,
            platform: 'Vercel'
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
        timestamp: new Date().toISOString(),
        platform: 'Vercel'
    });
});

// Route racine pour servir l'interface
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Pour Vercel, on exporte l'app au lieu d'écouter sur un port
module.exports = app;

// Pour le développement local
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Serveur local sur http://localhost:${PORT}`);
        console.log(`🔐 Code du jour : ${generateDailyCode()}`);
    });
}