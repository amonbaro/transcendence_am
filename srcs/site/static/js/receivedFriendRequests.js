document.addEventListener('DOMContentLoaded', async () => {
    const accessToken = localStorage.getItem('accessToken');
    const friendRequestsContainer = document.getElementById('friendRequests');

    if (!accessToken) {
        alert('Vous devez être connecté pour accéder à cette page.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('https://localhost:8000/api/friends/show-all-received-requests/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur lors de la récupération des demandes d'amis: ${response.status} ${errorText}`);
        }

        const requests = await response.json();
        if (requests.length === 0) {
            friendRequestsContainer.innerHTML = `<p>Aucune demande d'ami reçue.</p>`;
        } else {
            requests.forEach(request => {
                const requestElement = document.createElement('div');
                requestElement.classList.add('card', 'mb-3');
                requestElement.innerHTML = `
                    <div class="row g-0">
                        <div class="col-md-2">
                            <img src="${request.sender.profile_photo}" class="img-fluid rounded-start" alt="${request.sender.username}">
                        </div>
                        <div class="col-md-8">
                            <div class="card-body">
                                <h5 class="card-title">${request.sender.username}</h5>
                                <p class="card-text">Nom: ${request.sender.first_name} ${request.sender.last_name}</p>
                            </div>
                        </div>
                        <div class="col-md-2 d-flex align-items-center">
                            <button class="btn btn-success me-2 accept-friend-request-btn" data-user-id="${request.sender.id}">Accepter</button>
                            <button class="btn btn-danger decline-friend-request-btn" data-user-id="${request.sender.id}">Refuser</button>
                        </div>
                    </div>
                `;
                friendRequestsContainer.appendChild(requestElement);
            });

            // Gérer l'acceptation et le refus des demandes d'amis
            document.querySelectorAll('.accept-friend-request-btn').forEach(button => {
                button.addEventListener('click', async (event) => {
                    const userId = event.currentTarget.getAttribute('data-user-id');
                    await acceptFriendRequest(userId);
                });
            });

            document.querySelectorAll('.decline-friend-request-btn').forEach(button => {
                button.addEventListener('click', async (event) => {
                    const userId = event.currentTarget.getAttribute('data-user-id');
                    await declineFriendRequest(userId);
                });
            });
        }

    } catch (error) {
        console.error('Erreur lors de la récupération des demandes d\'amis:', error);
        alert('Une erreur s\'est produite. Vérifiez la console pour plus de détails.');
    }
});

// Fonction pour accepter une demande d'ami
async function acceptFriendRequest(userId) {
    const accessToken = localStorage.getItem('accessToken');
    try {
        const response = await fetch('https://localhost:8000/api/friends/accept-friend-request/', {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: userId })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur lors de l'acceptation de la demande d'ami: ${response.status} ${errorText}`);
        }

        alert('Demande d\'ami acceptée avec succès.');
        window.location.reload(); // Recharger la page après acceptation
    } catch (error) {
        console.error('Erreur lors de l\'acceptation de la demande d\'ami:', error);
    }
}

// Fonction pour refuser une demande d'ami
async function declineFriendRequest(userId) {
    const accessToken = localStorage.getItem('accessToken');
    try {
        const response = await fetch('https://localhost:8000/api/friends/decline-friend-request/', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: userId })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur lors du refus de la demande d'ami: ${response.status} ${errorText}`);
        }

        alert('Demande d\'ami refusée avec succès.');
        window.location.reload(); // Recharger la page après refus
    } catch (error) {
        console.error('Erreur lors du refus de la demande d\'ami:', error);
    }
}
