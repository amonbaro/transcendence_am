// currUserHistory.js (modifié)

document.addEventListener('DOMContentLoaded', () => {
    const historyContainerLink = document.querySelector('[href="#matchHistoryContainer"]');
    historyContainerLink.addEventListener('click', fetchUserMatchHistory);
});

async function fetchUserMatchHistory() {
    const accessToken = localStorage.getItem('accessToken');
    const matchHistoryContainer = document.getElementById('matchHistoryContainer');

    if (!accessToken) {
        matchHistoryContainer.innerHTML = '<p class="text-danger">Vous devez être connecté pour voir votre historique.</p>';
        return;
    }

    try {
        const response = await fetch('https://localhost:8000/api/game/show-current-user-match-history/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const matchHistory = await response.json();
            displayMatchHistory(matchHistory);
        } else {
            matchHistoryContainer.innerHTML = '<p class="text-danger">Impossible de récupérer l\'historique des parties.</p>';
        }
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique des parties :', error);
        matchHistoryContainer.innerHTML = '<p class="text-danger">Erreur lors de la récupération de l\'historique des parties.</p>';
    }
}

function displayMatchHistory(matches) {
    const matchHistoryContainer = document.getElementById('matchHistoryContainer');
    matchHistoryContainer.innerHTML = ''; // Efface le contenu précédent

    if (matches.length === 0) {
        matchHistoryContainer.innerHTML = '<p>Aucune partie jouée pour le moment.</p>';
        return;
    }

    matches.forEach((match, index) => {
        const matchCard = document.createElement('div');
        matchCard.classList.add('card', 'mb-3', 'w-auto'); // Style de carte pour chaque fiche
        matchCard.style.border = "1px solid";
        matchCard.style.backgroundColor = `var(${match.result === 'win' ? '--bs-success-bg-subtle' : '--bs-danger-bg-subtle'})`;
        matchCard.style.borderColor = `var(${match.result === 'win' ? '--bs-success-border-subtle' : '--bs-danger-border-subtle'})`;

        // Convertir le mode en texte complet
        const modeText = getModeText(match.mode);

        matchCard.innerHTML = `
            <div class="row g-0 align-items-center">
                <div class="col-md-8 d-flex flex-column justify-content-center">
                    <div class="card-body">
                        <h5 class="card-title">${modeText}</h5>
						<p class="card-text user-joined-date">${formatDate(match.date_played)}</p>
                    </div>
                </div>
                <div class="col-md-4 d-flex align-items-center justify-content-center">
                    <button class="btn ${match.result === 'win' ? 'btn-outline-success' : 'btn-outline-danger'}" data-bs-toggle="collapse" data-bs-target="#matchDetails${index}">
                        Détails
                    </button>
                </div>
            </div>
            <div id="matchDetails${index}" class="collapse">
                <!-- Détails supplémentaires affichés en accordéon -->
                <div class="card-body d-flex flex-column justify-content-center">
                    <p><strong>Durée :</strong> ${match.duration}</p>
                    <p><strong>Nombre de joueurs :</strong> ${match.number_of_players}</p>
                    ${match.teammate ? `<p><strong>Coéquipier :</strong> ${match.teammate}</p>` : ''}
                </div>
            </div>
        `;

        matchHistoryContainer.appendChild(matchCard);
    });
}

// Helper functions
function getModeText(mode) {
    switch (mode) {
        case 'VS':
            return 'Versus';
        case 'LS':
            return 'Last Man Standing';
        case 'BB':
            return 'Brick Breaker';
        case 'TN':
            return 'Tournament';
        default:
            return mode;
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}
