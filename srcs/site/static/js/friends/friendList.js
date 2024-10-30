document.addEventListener('DOMContentLoaded', async () => {
    const accessToken = localStorage.getItem('accessToken');
    const friendListContainerElement = document.getElementById('friendListContainer');

    if (!accessToken) {
        alert('Vous devez être connecté pour accéder à cette page.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const friendsResponse = await fetch('https://localhost:8000/api/friends/show-all-friends/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!friendsResponse.ok) {
            const errorText = await friendsResponse.text();
            throw new Error(`Erreur lors de la récupération des amis: ${friendsResponse.status} ${errorText}`);
        }

        const friendsData = await friendsResponse.json();

        if (friendsData.length > 0) {
            friendsData.forEach(friendEntry => {
                const friend = friendEntry.friend;
                const friendElement = document.createElement('div');
                friendElement.classList.add('card', 'mb-3', 'w-auto');

                friendElement.innerHTML = `
                    <div class="row g-0 align-items-center">
                        <div class="col-md-2">
                            <img src="${friend.profile_photo}" class="profile-photo" alt="${friend.username}">
                        </div>
                        <div class="col-md-8">
                            <div class="card-body">
                                <h5 class="card-title user-username">${friend.username}</h5>
                                <p class="card-text user-joined-date">Ami depuis : ${friendEntry.timestamp}</p>
                            </div>
                        </div>
                        <div class="col-md-2 d-flex flex-column align-items-center justify-content-center">
                            <button class="btn btn-light me-5 custom-size-btn d-flex justify-content-center align-items-center" data-friend-id="${friend.id}">
                                Détails
                            </button>
                        </div>
                    </div>
                `;
                friendListContainerElement.appendChild(friendElement);

                // Ajouter l'événement pour afficher les détails de l'ami
                friendElement.querySelector('.btn-light').addEventListener('click', () => {
                    showFriendDetails(friendEntry);
                });
            });
        } else {
            const noFriendsMessage = document.createElement('p');
            noFriendsMessage.textContent = "Vous n'avez pas encore d'amis.";
            friendListContainerElement.appendChild(noFriendsMessage);
        }

    } catch (error) {
        console.error('Erreur lors de la récupération des amis:', error);
        alert('Une erreur s\'est produite. Vérifiez la console pour plus de détails.');
    }
});

// friendList.js

// Fonction pour afficher les détails de l'ami dans le modal
function showFriendDetails(friendEntry) {
    const friend = friendEntry.friend;

    document.getElementById('friendDetailsModalLabel').innerHTML = `<strong>${friend.username}</strong>`;
    document.getElementById('friendProfilePhoto').src = friend.profile_photo;
    document.getElementById('friendFirstName').textContent = friend.first_name;
    document.getElementById('friendLastName').textContent = friend.last_name;
    document.getElementById('friendDateJoined').textContent = friend.date_joined;
    document.getElementById('friendLastLogin').textContent = friend.last_login;
    document.getElementById('friendSince').textContent = friendEntry.timestamp;

    // Charger les stats
    fetchFriendStats(friend.id);

    // Charger l'historique des parties
    fetchFriendMatchHistory(friend.id);

    const friendDetailsModal = new bootstrap.Modal(document.getElementById('friendDetailsModal'));
    friendDetailsModal.show();
}

// Fonction pour récupérer les statistiques de l'ami
async function fetchFriendStats(friendId) {
    const accessToken = localStorage.getItem('accessToken');

    try {
        const response = await fetch('https://localhost:8000/api/game/show-other-user-stats/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: friendId })
        });

        if (response.ok) {
            const stats = await response.json();
            displayFriendStats(stats);
        } else {
            console.error('Erreur lors de la récupération des stats de l\'ami');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des stats de l\'ami:', error);
    }
}

function displayFriendStats(stats) {
    document.getElementById('friendTotalPlayed').textContent = stats.total_played;
    document.getElementById('friendWinPercentage').textContent = Math.floor((stats.total_wins / stats.total_played) * 100) || 0;

    const modeStatsTable = document.getElementById('friendModeStatsTable');
    modeStatsTable.innerHTML = `
        <tr><td>Versus</td><td>${stats.VS_wins}</td><td>${stats.VS_played - stats.VS_wins}</td></tr>
        <tr><td>Tournament</td><td>${stats.TN_wins}</td><td>${stats.TN_played - stats.TN_wins}</td></tr>
        <tr><td>Last Man Standing</td><td>${stats.LS_wins}</td><td>${stats.LS_played - stats.LS_wins}</td></tr>
        <tr><td>Brick Breaker</td><td>${stats.BB_wins}</td><td>${stats.BB_played - stats.BB_wins}</td></tr>
    `;
}

// Fonction pour récupérer l'historique de l'ami
async function fetchFriendMatchHistory(friendId) {
    const accessToken = localStorage.getItem('accessToken');
    const historyContainer = document.getElementById('friendMatchHistoryContainer');

    try {
        const response = await fetch('https://localhost:8000/api/game/show-other-user-match-history/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: friendId })
        });

        if (response.ok) {
            const history = await response.json();
            displayFriendMatchHistory(history);
        } else {
            console.error('Erreur lors de la récupération de l\'historique des parties de l\'ami');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'historique des parties de l\'ami:', error);
    }
}

// Fonction pour afficher l'historique de l'ami
function displayFriendMatchHistory(matches) {
    const historyContainer = document.getElementById('friendMatchHistoryContainer');
    historyContainer.innerHTML = '';

    if (matches.length === 0) {
        historyContainer.innerHTML = '<p>Aucune partie jouée pour le moment.</p>';
        return;
    }

    matches.forEach((match, index) => {
        const item = document.createElement('div');
        item.classList.add('card', 'mb-3', 'p-3', match.result === 'win' ? 'bg-success-subtle' : 'bg-danger-subtle');

        item.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <strong>${getModeText(match.mode)}</strong>
                <button class="btn ${match.result === 'win' ? 'btn-outline-success' : 'btn-outline-danger'} btn-sm" data-bs-toggle="collapse" data-bs-target="#friendMatchDetails${index}">
                    Détails
                </button>
            </div>
            <div class="text-muted">Joué le ${formatDate(match.date_played)}</div>
            <div id="friendMatchDetails${index}" class="collapse mt-2">
                <p><strong>Durée :</strong> ${match.duration}</p>
                <p><strong>Nombre de joueurs :</strong> ${match.number_of_players}</p>
                ${match.teammate ? `<p><strong>Coéquipier :</strong> ${match.teammate}</p>` : ''}
            </div>
        `;

        historyContainer.appendChild(item);
    });
}

// Helper functions to get mode text and format date
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
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}




// Fonction pour supprimer un ami
async function removeFriend(friendId) {
    const accessToken = localStorage.getItem('accessToken');
    const messageContainer = document.getElementById('messageContainer');

    try {
        const response = await fetch('https://localhost:8000/api/friends/unfriend/', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: friendId })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur lors de la suppression de l'ami: ${response.status} ${errorText}`);
        }

        alert('Ami supprimé avec succès');
        window.location.reload();

    } catch (error) {
        console.error('Erreur lors de la suppression de l\'ami:', error);
        messageContainer.innerHTML = `<div class="alert alert-danger">Une erreur s'est produite lors de la suppression de l'ami.</div>`;
    }
}

document.getElementById('removeFriendBtn').addEventListener('click', async (event) => {
    const friendId = event.target.getAttribute('data-friend-id');
    if (friendId) {
        const confirmation = confirm('Êtes-vous sûr de vouloir supprimer cet ami ?');
        if (confirmation) {
            await removeFriend(friendId);
            const friendDetailsModal = bootstrap.Modal.getInstance(document.getElementById('friendDetailsModal'));
            friendDetailsModal.hide();
        }
    }
});

