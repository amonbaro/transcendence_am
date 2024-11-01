document.addEventListener('DOMContentLoaded', fetchUserStats);

async function fetchUserStats() {
    const accessToken = localStorage.getItem('accessToken');
    const statsContainer = document.getElementById('statsContainer');
    const totalPlayedElement = document.getElementById('totalPlayed');
    const winPercentageElement = document.getElementById('winPercentage');
    const modeStatsTable = document.getElementById('modeStatsTable');

    if (!accessToken) {
        statsContainer.innerHTML = '<p class="text-danger">Vous devez être connecté pour voir vos statistiques.</p>';
        return;
    }

    try {
        const response = await fetch('https://localhost:8000/api/game/show-current-user-stats/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const stats = await response.json();

            // Calcul du pourcentage de victoires
            const totalWins = stats.total_wins;
            const totalPlayed = stats.total_played;
            const winPercentage = totalPlayed ? Math.floor((totalWins / totalPlayed) * 100) : 0;

            // Affichage des statistiques globales
            totalPlayedElement.textContent = totalPlayed;
            winPercentageElement.textContent = winPercentage;

            // Insertion des statistiques par mode dans le tableau
            const modes = ['VS', 'TN', 'LS', 'BB'];
            modeStatsTable.innerHTML = modes.map(mode => {
                const played = stats[`${mode}_played`] || 0;
                const wins = stats[`${mode}_wins`] || 0;
                const losses = played - wins;
                return `
                    <tr>
                        <td>${getModeText(mode)}</td>
                        <td>${wins}</td>
                        <td>${losses}</td>
                    </tr>
                `;
            }).join('');
        } else {
            statsContainer.innerHTML = '<p class="text-danger">Impossible de récupérer les statistiques.</p>';
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques :', error);
        statsContainer.innerHTML = '<p class="text-danger">Erreur lors de la récupération des statistiques.</p>';
    }
}

function getModeText(mode) {
    switch (mode) {
        case 'VS':
            return 'Versus';
        case 'TN':
            return 'Tournament';
        case 'LS':
            return 'Last Man Standing';
        case 'BB':
            return 'Brick Breaker';
        default:
            return mode;
    }
}
