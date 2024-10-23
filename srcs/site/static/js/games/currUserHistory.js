// currUserHistory.js

document.addEventListener('DOMContentLoaded', () => {
    const showHistoryBtn = document.getElementById('showHistoryBtn');
    const matchHistoryContainer = document.getElementById('matchHistoryContainer');

    showHistoryBtn.addEventListener('click', async () => {
        await fetchUserMatchHistory();
    });
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
    matchHistoryContainer.innerHTML = ''; // Clear previous content

    if (matches.length === 0) {
        matchHistoryContainer.innerHTML = '<p>Aucune partie jouée pour le moment.</p>';
        return;
    }

    const listContainer = document.createElement('ul');
    listContainer.classList.add('list-group');

    matches.forEach((match, index) => {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');

        // Afficher le mode et la date de la partie
        const matchInfo = document.createElement('div');
        matchInfo.textContent = `${match.mode} - ${match.date_played}`;

        // Appliquer la couleur en fonction du résultat
        if (match.result === 'win') {
            listItem.classList.add('list-group-item-success');
        } else {
            listItem.classList.add('list-group-item-danger');
        }

        // Bouton pour dérouler les détails
        const toggleButton = document.createElement('button');
        toggleButton.classList.add('btn', 'btn-secondary', 'btn-sm');
        toggleButton.textContent = 'Détails';
        toggleButton.setAttribute('data-bs-toggle', 'collapse');
        toggleButton.setAttribute('data-bs-target', `#matchDetails${index}`);

        // Conteneur pour les détails de la partie (caché par défaut)
        const detailsContainer = document.createElement('div');
        detailsContainer.classList.add('collapse', 'mt-2');
        detailsContainer.id = `matchDetails${index}`;

        // Ajouter les détails de la partie
        const detailsContent = document.createElement('div');
        detailsContent.classList.add('text-start');
        detailsContent.innerHTML = `
            <p><strong>Durée :</strong> ${match.duration}</p>
            <p><strong>Nombre de joueurs :</strong> ${match.number_of_players}</p>
        `;

        // Afficher les alias des gagnants
        if (match.result !== 'win') {
            detailsContent.innerHTML += `<p><strong>Gagnants :</strong> ${match.alias}</p>`;
        } else if (match.alias.includes(' & ')) {
            const otherWinners = match.alias.split(' & ').filter(alias => alias !== 'registered player 2');
            detailsContent.innerHTML += `<p><strong>Gagnants :</strong> ${otherWinners.join(', ')}</p>`;
        }

        detailsContainer.appendChild(detailsContent);
        listItem.appendChild(matchInfo);
        listItem.appendChild(toggleButton);
        listItem.appendChild(detailsContainer);

        listContainer.appendChild(listItem);
    });

    matchHistoryContainer.appendChild(listContainer);
}
