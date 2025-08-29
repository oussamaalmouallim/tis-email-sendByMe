    // Variables globales
        let currentCode = '';
        let attempts = 0;
        let isLoggedIn = false;
        let serverAvailable = false;

        // Fonction de génération du code côté client (pour vérification)
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

        // verification si le serveur est disponible
        async function checkServerStatus() {
            try {
                const response = await fetch('/api/code');
                if (response.ok) {
                    serverAvailable = true;
                    document.getElementById('serverStatus').innerHTML = '✅ Serveur connecté';
                    return true;
                }
            } catch (error) {
                console.log('Mode serveur non disponible, utilisation du mode client');
            }
            
            serverAvailable = false;
            document.getElementById('serverStatus').innerHTML = '⚠️ Mode client (serveur non disponible)';
            return false;
        }

        // Test de  la config email
        async function testEmailConfig() {
            try {
                const response = await fetch('/test-email-config');
                const data = await response.json();
                
                if (data.success) {
                    document.getElementById('emailConfigStatus').innerHTML = 
                        `✅ Configuration valide<br>Service: ${data.service}<br>Utilisateur: ${data.user}`;
                    showMessage('✅ Configuration email valide !', 'success');
                } else {
                    throw new Error(data.details);
                }
            } catch (error) {
                document.getElementById('emailConfigStatus').innerHTML = 
                    `❌ Configuration invalide<br>${error.message}`;
                showMessage(`❌ Erreur de configuration: ${error.message}`, 'error');
            }
        }

        // code depuis le serveur ou générer côté client
        async function getCurrentCode() {
            if (serverAvailable) {
                try {
                    const response = await fetch('/api/code');
                    if (response.ok) {
                        const data = await response.json();
                        return data.code;
                    }
                } catch (error) {
                    console.log('Erreur serveur, utilisation du code client');
                }
            }
            
            return generateDailyCode();
        }

        // Vérification du code
        async function verifyCode() {
            const inputCode = document.getElementById('codeInput').value.trim().toUpperCase();
            const todayCode = await getCurrentCode();
            
            attempts++;
            document.getElementById('attempts').textContent = attempts;

            if (inputCode === todayCode) {
                showMessage('✅ Code correct ! Accès autorisé.', 'success');
                document.getElementById('adminPanel').classList.remove('hidden');
                document.getElementById('codeInput').disabled = true;
                isLoggedIn = true;
                
                // Test de la configuration email une fois connecté
                testEmailConfig();
                
                // Animation de succès
                document.querySelector('.container').classList.add('pulse');
                setTimeout(() => {
                    document.querySelector('.container').classList.remove('pulse');
                }, 500);
            } else {
                showMessage('❌ Code incorrect. Veuillez réessayer.', 'error');
                document.getElementById('codeInput').value = '';
                document.getElementById('codeInput').focus();
            }
        }

        // Affichage d'un message de statut
        function showMessage(text, type) {
            const messageDiv = document.getElementById('statusMessage');
            messageDiv.textContent = text;
            messageDiv.className = `status-message status-${type}`;
            messageDiv.classList.remove('hidden');
            
            // Masque du message après 7 secondes
            setTimeout(() => {
                messageDiv.classList.add('hidden');
            }, 7000);
        }

        // Envoie du code par email via le serveur
        async function sendEmailViaServer() {
            const btn = event.target;
            const originalText = btn.innerHTML;
            
            // Animation de chargement
            btn.innerHTML = '<span class="loading"></span>Envoi en cours...';
            btn.disabled = true;

            try {
                const response = await fetch('/send-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        test: true,
                        source: 'admin-panel'
                    })
                });

                const data = await response.json();

                if (data.success) {
                    showMessage(`✅ Email envoyé avec succès ! ID: ${data.messageId.substring(0, 8)}...`, 'success');
                    console.log('✅ Email envoyé via serveur:', data);
                    
                    // Afficher les détails dans la console
                    console.log('📧 Détails de l\'envoi:');
                    console.log('   - ID du message:', data.messageId);
                    console.log('   - Code envoyé:', data.code);
                    console.log('   - Destinataire:', data.recipient);
                    console.log('   - Timestamp:', data.timestamp);
                } else {
                    throw new Error(data.error || 'Erreur serveur inconnue');
                }

            } catch (error) {
                console.error('❌ Erreur envoi email:', error);
                showMessage(`❌ Erreur lors de l'envoi: ${error.message}`, 'error');
            } finally {
                // Restaurer le bouton
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }

        // Actualiser le code
        async function refreshCode() {
            const newCode = await getCurrentCode();
            document.getElementById('todayCode').textContent = newCode;
            document.getElementById('currentCode').textContent = newCode;
            showMessage('🔄 Code actualisé !', 'info');
        }

        // Test d'envoi automatique quotidien
        async function testDailyEmail() {
            const btn = event.target;
            const originalText = btn.innerHTML;
            
            // Animation de chargement
            btn.innerHTML = '<span class="loading"></span>Test en cours...';
            btn.disabled = true;

            try {
                const response = await fetch('/send-daily-code', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();

                if (data.success) {
                    showMessage(`✅ Test envoi quotidien réussi ! Format email 7h00 envoyé.`, 'success');
                    console.log('✅ Test envoi quotidien via serveur:', data);
                } else {
                    throw new Error(data.error || 'Erreur test envoi quotidien');
                }

            } catch (error) {
                console.error('❌ Erreur test envoi quotidien:', error);
                showMessage(`❌ Erreur test: ${error.message}`, 'error');
            } finally {
                // Restaurer le bouton
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        }

        // Gestion de l'appui sur Entrée
        document.getElementById('codeInput').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                verifyCode();
            }
        });

        // Initialisation au chargement
        document.addEventListener('DOMContentLoaded', async function() {
            // Vérifier le statut du serveur
            await checkServerStatus();
            
            // Obtenir le code actuel
            const todayCode = await getCurrentCode();
            document.getElementById('currentCode').textContent = todayCode;
            document.getElementById('todayCode').textContent = todayCode;
            document.getElementById('codeInput').focus();

            // Afficher les informations de debug dans la console
            console.log('📧 TIS Test Project - Email Version');
            console.log('=====================================');
            console.log('📅 Code du jour:', todayCode);
            console.log('🌐 Serveur disponible:', serverAvailable);
            console.log('📧 Version email active');
            console.log('=====================================');

            // Message d'accueil
            if (serverAvailable) {
                showMessage('🚀 Interface serveur chargée. Le serveur Node.js gère l\'envoi d\'emails.', 'info');
                
                // Tester la config email en arrière-plan
                setTimeout(async () => {
                    try {
                        const response = await fetch('/test-email-config');
                        const data = await response.json();
                        if (data.success) {
                            document.getElementById('recipientEmail').innerHTML = 
                                `📧 Service: ${data.service} | Utilisateur: ${data.user}`;
                        }
                    } catch (error) {
                        document.getElementById('recipientEmail').innerHTML = 
                            '📧 Configuration email requise';
                    }
                }, 1000);
            } else {
                showMessage('⚠️ Serveur non disponible. Fonctionnement en mode client uniquement.', 'info');
            }
        });

        // Protection contre la fermeture accidentelle
        window.addEventListener('beforeunload', function(e) {
            if (attempts > 0) {
                e.preventDefault();
                e.returnValue = '';
            }
        });