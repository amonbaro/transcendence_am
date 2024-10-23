document.addEventListener('DOMContentLoaded', async () => {
    const accessToken = localStorage.getItem('accessToken');
    const profileInfo = document.getElementById('profileInfo');
    
    if (!accessToken) {
        alert('Vous devez être connecté pour accéder à cette page.');
        window.location.href = 'login.html';
        return;
    }

    try {
        // Récupérer tous les utilisateurs et la liste des amis en parallèle
        const [usersResponse, friendsResponse] = await Promise.all([
            fetch('https://localhost:8000/api/user/show-all-users/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }),
            fetch('https://localhost:8000/api/friends/show-all-friends/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            })
        ]);

        if (!usersResponse.ok) {
            const errorText = await usersResponse.text();
            throw new Error(`Erreur lors de la récupération des utilisateurs: ${usersResponse.status} ${errorText}`);
        }

        if (!friendsResponse.ok) {
            const errorText = await friendsResponse.text();
            throw new Error(`Erreur lors de la récupération des amis: ${friendsResponse.status} ${errorText}`);
        }

        const users = await usersResponse.json();
        const friendsData = await friendsResponse.json();

        // Créer un ensemble (Set) des IDs des amis pour faciliter la comparaison
        const friendIds = new Set(friendsData.map(friendEntry => friendEntry.friend.id));

        // Afficher la liste des utilisateurs avec ou sans le bouton "Ajouter comme ami"
        users.forEach(user => {
            const userElement = document.createElement('div');
            userElement.classList.add('card', 'mb-3');
            userElement.innerHTML = `
                <div class="row g-0">
                    <div class="col-md-2">
                        <img src="${user.profile_photo}" class="img-fluid rounded-start" alt="${user.username}">
                    </div>
                    <div class="col-md-8">
                        <div class="card-body">
                            <h5 class="card-title">${user.username}</h5>
                            <p class="card-text">Nom: ${user.first_name} ${user.last_name}</p>
                            <p class="card-text">Membre depuis: ${user.date_joined}</p>
                        </div>
                    </div>
                    <div class="col-md-2 d-flex align-items-center">
                        ${friendIds.has(user.id) 
                            ? '<p class="text-success">Déjà ami</p>'  // Si l'utilisateur est déjà ami, afficher un message
                            : `<button class="btn btn-primary send-friend-request-btn" data-user-id="${user.id}">Ajouter comme ami</button>`}  <!-- Sinon afficher le bouton -->
                    </div>
                </div>
            `;
            profileInfo.appendChild(userElement);
        });

        // Ajouter les événements pour envoyer une demande d'ami
        document.querySelectorAll('.send-friend-request-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const userId = event.currentTarget.getAttribute('data-user-id'); // Récupère l'ID de l'utilisateur destinataire
                await sendFriendRequest(userId);
            });
        });

    } catch (error) {
        console.error('Erreur lors de la récupération des utilisateurs ou des amis:', error);
        alert('Une erreur s\'est produite. Vérifiez la console pour plus de détails.');
    }
});

// Fonction pour envoyer la demande d'ami
async function sendFriendRequest(userId) {
    const accessToken = localStorage.getItem('accessToken');
    const messageContainer = document.getElementById('messageContainer');

    try {
        const response = await fetch('https://localhost:8000/api/friends/send-friend-request/', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: userId }) // Envoi de l'ID du destinataire de la demande
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur lors de l'envoi de la demande d'ami: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        messageContainer.innerHTML = `<div class="alert alert-success">Demande d'ami envoyée avec succès à l'utilisateur !</div>`;

    } catch (error) {
        console.error('Erreur lors de l\'envoi de la demande d\'ami:', error);
        messageContainer.innerHTML = `<div class="alert alert-danger">Une erreur s'est produite lors de l'envoi de la demande d'ami.</div>`;
    }
}
