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
    const token = await getValidToken();
    if (!token) return;

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

        console.log('Partie enregistrée avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de la partie :', error);
    }
}

async function sendTournamentSessionToAPI(sessionData) {
    const token = await getValidToken();
    if (!token) return;

    sessionData.session.mode = 'TN';
    const verifiedUsers = JSON.parse(localStorage.getItem('verifiedUsers')) || {};

    sessionData.players = sessionData.players.map(player => {
        if (player.user && !player.alias) {
            player.alias = Object.keys(verifiedUsers).find(key => verifiedUsers[key] === player.user) || player.user;
        }
        return player;
    });

    try {
        const response = await fetch('https://localhost:8000/api/game/register-tournament-session/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(sessionData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur lors de l'enregistrement du tournoi: ${response.status} ${errorText}`);
        }

        console.log('Tournoi enregistré avec succès');
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement du tournoi :', error);
    }
}


function isTokenExpired(token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
}

async function getValidToken() {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');

    if (!accessToken) {
        console.error("Access token is missing.");
        return null;
    }

    return isTokenExpired(accessToken) ? await refreshAccessToken(refreshToken) : accessToken;
}

export function storeGameSession() {
    const gameSessionOptions = JSON.parse(localStorage.getItem('gameOptions'));
    const verifiedUsers = JSON.parse(localStorage.getItem('verifiedUsers')) || {};

    if (gameSessionOptions) {
        const { mode, playerNames } = gameSessionOptions;

        const players = playerNames.map((name) => {
            const userId = verifiedUsers[name];
            return userId ? { user: userId } : { alias: name };
        });

        const sessionData = {
            session: { mode },
            players,
            start_date: new Date().toLocaleString(),
        };

        localStorage.setItem('gameSession', JSON.stringify(sessionData));
    }
}

export function registerGameWinner(winnerAlias) {
    const sessionData = JSON.parse(localStorage.getItem('gameSession'));
    if (sessionData) {
        const winners = winnerAlias.split(' & ').map(name => name.trim());
        
        if (winners.length === 2) {
            sessionData.winner1 = winners[0];
            sessionData.winner2 = winners[1];
        } else {
            sessionData.winner1 = winners[0];
            delete sessionData.winner2;
        }

        sendGameSessionToAPI(sessionData);
    }
}

export function registerTournamentWinner(finalWinnerAlias) {
    const sessionData = JSON.parse(localStorage.getItem('gameSession'));

    if (sessionData) {
        sessionData.winner1 = finalWinnerAlias;
        delete sessionData.winner2;

        sendTournamentSessionToAPI(sessionData);  // Appeler l'API de tournoi
    }
}
