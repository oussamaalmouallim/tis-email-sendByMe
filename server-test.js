// server-test.js - Version modifiée pour Render avec système anti-veille
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const app = express();
require('dotenv').config();

// Configuration Email
const EMAIL_CONFIG = {
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
};

const RECIPIENT_EMAIL = process.env.RECIPIENT_EMAIL;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Variables globales pour le système anti-veille
let lastEmailSent = null;
let emailSentToday = false;

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

// NOUVEAU SYSTÈME : Vérification automatique à chaque requête
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

// SOLUTION : Modifier le middleware et la route keepalive

// Middleware modifié - ENLEVER l'exclusion de /keepalive
app.use((req, res, next) => {
    // Déclencher sur TOUTES les routes sauf les assets statiques
    if (!req.path.includes('.css') && !req.path.includes('.js') && !req.path.includes('.ico')) {
        checkAndSendDailyEmail();
    }
    next();
});

// OU encore mieux : Route keepalive qui déclenche explicitement la vérification
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
    
    // DÉCLENCHER EXPLICITEMENT LA VÉRIFICATION D'ENVOI EMAIL
    checkAndSendDailyEmail();
    
    // Réponse immédiate pour UptimeRobot
    res.status(200).json({ 
        status: 'alive',
        timestamp: new Date().toISOString(),
        casablancaTime: casablancaTime,
        hour: parseInt(hour),
        emailSentToday: emailSentToday,
        lastEmailSent: lastEmailSent,
        server: 'Render',
        uptime: process.uptime(),
        message: 'Email check triggered'
    });
});

// Fonction checkAndSendDailyEmail améliorée avec plus de logs
function checkAndSendDailyEmail() {
    const now = new Date();
    const casablancaTime = new Date(now.toLocaleString('en-US', {
        timeZone: 'Africa/Casablanca'
    }));
    
    const today = casablancaTime.toDateString();
    const hour = casablancaTime.getHours();
    const minute = casablancaTime.getMinutes();
    
    // Log détaillé pour debugging
    console.log(`🔍 [VÉRIFICATION EMAIL] ${hour}h${minute.toString().padStart(2, '0')}`);
    console.log(`   📅 Aujourd'hui: ${today}`);
    console.log(`   📧 Email envoyé: ${emailSentToday}`);
    console.log(`   📝 Dernier envoi: ${lastEmailSent}`);
    
    // Réinitialiser le flag si on est un nouveau jour
    if (lastEmailSent && lastEmailSent !== today) {
        console.log('🗓️ NOUVEAU JOUR DÉTECTÉ - Réinitialisation du flag d\'envoi');
        emailSentToday = false;
        lastEmailSent = null;
    }
    
    // Conditions d'envoi
    const isAfter7AM = hour >= 7;
    const isBefore11PM = hour < 23;
    const notSentToday = !emailSentToday;
    
    console.log(`   ⏰ Après 7h: ${isAfter7AM}`);
    console.log(`   ⏰ Avant 23h: ${isBefore11PM}`);
    console.log(`   ✉️ Pas encore envoyé: ${notSentToday}`);
    
    if (isAfter7AM && isBefore11PM && notSentToday) {
        console.log(`🚀 [ENVOI EN COURS] Conditions remplies à ${hour}h${minute.toString().padStart(2, '0')}`);
        
        sendDailyCodeEmail()
            .then(result => {
                if (result.success) {
                    emailSentToday = true;
                    lastEmailSent = today;
                    console.log('✅ [SUCCÈS] Email quotidien envoyé automatiquement !');
                } else {
                    console.error('❌ [ÉCHEC] Erreur envoi:', result.error);
                }
            })
            .catch(error => {
                console.error('❌ [ERREUR] Exception lors de l\'envoi:', error.message);
            });
    } else {
        const reasons = [];
        if (!isAfter7AM) reasons.push(`trop tôt (${hour}h < 7h)`);
        if (!isBefore11PM) reasons.push(`trop tard (${hour}h >= 23h)`);
        if (!notSentToday) reasons.push('déjà envoyé aujourd\'hui');
        
        console.log(`⏭️ [PAS D'ENVOI] Raisons: ${reasons.join(', ')}`);
    }
}