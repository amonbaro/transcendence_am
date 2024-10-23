// registerGame.js

function getGameModeCode(mode) {
    switch (mode.toLowerCase()) {
        case 'versus':
            return 'VS';
        case 'tournament':
            return 'TN';
        case 'lastmanstanding':
            return 'LS';
        case 'brickbreaker':
            return 'BB';
        default:
            return mode;
    }
}

async function sendGameSessionToAPI(sessionData) {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    // Vérifier le token d'accès avant d'envoyer la requête
    if (!accessToken) {
        console.error("Access token is missing.");
        return;
    }

    // Option de rafraîchissement du token si nécessaire
    let token = accessToken;
    if (isTokenExpired(accessToken)) {
        try {
            token = await refreshAccessToken(refreshToken);
            if (!token) throw new Error('Unable to refresh token.');
        } catch (error) {
            console.error('Erreur lors du rafraîchissement du token:', error);
            return;
        }
    }

    // Convertir le mode de jeu
    sessionData.session.mode = getGameModeCode(sessionData.session.mode);

    try {
        const response = await fetch('https://localhost:8000/api/game/register-game-session/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sessionData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur lors de l'enregistrement de la partie: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        console.log('Partie enregistrée avec succès :', result);
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la partie :', error);
    }
}

function isTokenExpired(token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
}

async function refreshAccessToken(refreshToken) {
    try {
        const response = await fetch('https://localhost:8000/api/user/token/refresh/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refresh: refreshToken }),
        });

        if (response.ok) {
            const data = await response.json();
            localStorage.setItem('accessToken', data.access);
            return data.access;
        }
    } catch (error) {
        console.error('Erreur lors du rafraîchissement du token:', error);
    }
    return null;
}

// Fonction pour stocker les données de la session de jeu au début
export function storeGameSession() {
    const gameSessionOptions = JSON.parse(localStorage.getItem('gameOptions'));
    const verifiedUsers = window.getVerifiedUsers();

    if (gameSessionOptions) {
        const { mode, playerNames } = gameSessionOptions;
        const players = playerNames.map((name) => {
            const userId = verifiedUsers.get(name);
            return userId ? { user: userId, alias: name } : { alias: name };
        });

        const sessionData = {
            session: { mode },
            players,
            start_date: new Date().toLocaleString(),
        };

        localStorage.setItem('gameSession', JSON.stringify(sessionData));
    }
}

// Fonction pour envoyer les données à l'API après la fin de la partie
export function registerGameWinner(winnerAlias) {
    const sessionData = JSON.parse(localStorage.getItem('gameSession'));
    if (sessionData) {
        // Vérifier si winnerAlias contient deux gagnants séparés par " & "
        const winners = winnerAlias.split(' & ').map(name => name.trim());
        
        if (winners.length === 2) {
            sessionData.winner_alias = winners[0];
            sessionData.winner_alias2 = winners[1];
        } else {
            sessionData.winner_alias = winners[0];
            // Supprimer le champ winner_alias2 s'il n'est pas nécessaire pour éviter l'erreur côté API
            delete sessionData.winner_alias2;
        }

        sendGameSessionToAPI(sessionData);
    }
}

