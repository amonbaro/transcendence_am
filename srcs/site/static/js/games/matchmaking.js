document.addEventListener('DOMContentLoaded', () => {
    const accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
        console.log("Utilisateur non connecté. Matchmaking désactivé.");
        return; // Arrête l'exécution du script si l'utilisateur n'est pas connecté
    }

    // Code existant de matchmaking.js
    const matchmakingButton = document.getElementById('matchmakingButton');
    matchmakingButton.addEventListener('click', loadMatchmaking);

    initializeMatchmakingButton();
});

async function initializeMatchmakingButton() {
    const friends = await fetchFriends();
    const userStats = await fetchUserStats();

    if (userStats) {
        const userWinPercentage = calculateWinPercentage(userStats);
        document.getElementById('userWinPercentageText').textContent = `Mon pourcentage de victoire : ${userWinPercentage}%`;
    }

    const matchmakingButton = document.getElementById('matchmakingButton');

    if (friends.length === 0) {
        // Si l'utilisateur n'a pas d'amis, ajuster le bouton pour rediriger vers la page d'ajout d'amis
        matchmakingButton.textContent = "Ajouter des amis";
        matchmakingButton.onclick = () => {
            window.location.href = 'profile.html?showAllUsers=true';
        };
    } else {
        matchmakingButton.onclick = loadMatchmaking;
    }
}

// Fonction pour récupérer les statistiques de l'utilisateur
async function fetchUserStats() {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return null;

    try {
        const response = await fetch('https://localhost:8000/api/game/show-current-user-stats/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        if (response.ok) return await response.json();
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques utilisateur :', error);
    }
    return null;
}

// Fonction pour récupérer la liste des amis
async function fetchFriends() {
    const accessToken = localStorage.getItem('accessToken');

    try {
        const response = await fetch('https://localhost:8000/api/friends/show-all-friends/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        if (response.ok) return await response.json();
    } catch (error) {
        console.error('Erreur lors de la récupération des amis :', error);
    }
    return [];
}

// Calcul du pourcentage de victoires global
function calculateWinPercentage(stats) {
    const played = stats.total_played || 0;
    const wins = stats.total_wins || 0;
    return played ? Math.floor((wins / played) * 100) : 0;
}

async function loadMatchmaking() {
    const friends = await fetchFriendsWithStats();
    const userStats = await fetchUserStats();

    if (userStats && friends.length) {
        const sortedFriends = sortFriendsByWinPercentage(friends, userStats);
        displaySortedFriends(sortedFriends, userStats);
    } 
	else {
        console.error("Impossible de récupérer les statistiques de l'utilisateur ou des amis.");
    }
}

// Fonction pour récupérer les statistiques de chaque ami
async function fetchFriendsWithStats() {
    const accessToken = localStorage.getItem('accessToken');
    const friendsData = await fetchFriends();

    if (!friendsData || !friendsData.length) return [];

    return await Promise.all(friendsData.map(async (friendEntry) => {
        const friend = friendEntry.friend;
        const stats = await fetchFriendStats(friend.id);
        return stats ? { ...friend, stats } : null;
    })).then(friends => friends.filter(friend => friend !== null));
}

// Fonction pour récupérer les statistiques d'un ami donné
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

        if (response.ok) return await response.json();
    } catch (error) {
        console.error('Erreur lors de la récupération des stats de l\'ami :', error);
    }
    return null;
}

// Fonction de tri des amis par rapport aux statistiques de l'utilisateur, basé sur le pourcentage de victoires global
function sortFriendsByWinPercentage(friends, userStats) {
    const userWinPercentage = calculateWinPercentage(userStats);
    return friends.map(friend => {
        const friendWinPercentage = calculateWinPercentage(friend.stats);
        const difference = Math.abs(userWinPercentage - friendWinPercentage);
        const totalPlayed = friend.stats.total_played || 0;
        return { ...friend, winPercentage: friendWinPercentage, difference, totalPlayed };
    }).sort((a, b) => {
        if (a.difference !== b.difference) return a.difference - b.difference;
        return b.totalPlayed - a.totalPlayed;
    });
}

// Affichage des amis triés dans l'accordéon
function displaySortedFriends(sortedFriends, userStats) {
    const friendList = document.getElementById('friendMatchmakingList');
    friendList.innerHTML = ''; // Réinitialise la liste

    sortedFriends.forEach(friend => {
        const friendWinPercentage = friend.winPercentage;
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
        listItem.innerHTML = `
            <span><strong>${friend.username}</strong> - Global Win Rate: ${friendWinPercentage}%</span>
        `;
        friendList.appendChild(listItem);
    });
}
