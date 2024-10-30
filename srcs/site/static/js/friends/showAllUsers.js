document.addEventListener('DOMContentLoaded', async () => {
    const accessToken = localStorage.getItem('accessToken');
    const allUsersContainer = document.getElementById('allUsersContainer');
	const newFriendRequestIndicator = document.getElementById('newFriendRequestIndicator');

    if (!accessToken) {
        alert('Vous devez être connecté pour accéder à cette page.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const [usersResponse, friendsResponse, sentRequestsResponse, receivedRequestsResponse] = await Promise.all([
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
            }),
            fetch('https://localhost:8000/api/friends/show-all-sent-requests/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            }),
            fetch('https://localhost:8000/api/friends/show-all-received-requests/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            })
        ]);

        if (!usersResponse.ok || !friendsResponse.ok || !sentRequestsResponse.ok || !receivedRequestsResponse.ok) {
            throw new Error('Erreur lors de la récupération des données.');
        }

        const users = await usersResponse.json();
        const friendsData = await friendsResponse.json();
        const sentRequestsData = await sentRequestsResponse.json();
        const receivedRequestsData = await receivedRequestsResponse.json();

        const friendIds = new Set(friendsData.map(friendEntry => friendEntry.friend.id));
        const sentRequestIds = new Set(sentRequestsData.map(request => request.receiver.id));
        const receivedRequestIds = new Set(receivedRequestsData.map(request => request.sender.id));

        // Afficher le point jaune clignotant si des demandes d'amis ont été reçues
        if (receivedRequestsData.length > 0) {
            newFriendRequestIndicator.classList.remove('d-none');
        } else {
            newFriendRequestIndicator.classList.add('d-none');
        }

        // Trier les utilisateurs pour afficher d'abord ceux qui ont envoyé une demande, puis les autres par date de création de compte (plus récent au plus ancien)
        const sortedUsers = users.sort((a, b) => {
            if (receivedRequestIds.has(a.id) && !receivedRequestIds.has(b.id)) {
                return -1;
            }
            if (!receivedRequestIds.has(a.id) && receivedRequestIds.has(b.id)) {
                return 1;
            }
            return new Date(b.date_joined) - new Date(a.date_joined);
        });

        users.forEach(user => {
            if (friendIds.has(user.id)) {
                return;
            }

            const userElement = document.createElement('div');
            userElement.classList.add('card', 'mb-3', 'w-auto');
            userElement.innerHTML = `
                <div class="row g-0 align-items-center">
                    <div class="col-md-2">
                        <img src="${user.profile_photo}" class="profile-photo" alt="${user.username}">
                    </div>
                    <div class="col-md-8">
                        <div class="card-body">
                            <h5 class="card-title user-username">${user.username}</h5>
                            <p class="card-text user-joined-date">Membre depuis : ${user.date_joined}</p>
                        </div>
                    </div>
                    <div class="col-md-2 d-flex flex-column align-items-center justify-content-center" id="action-${user.id}">
                    </div>
                </div>
            `;
            allUsersContainer.appendChild(userElement);

            const actionContainer = document.getElementById(`action-${user.id}`);

            if (sentRequestIds.has(user.id)) {
                const cancelRequestButton = document.createElement('button');
                cancelRequestButton.textContent = 'Annuler';
                cancelRequestButton.classList.add('btn', 'btn-danger', 'me-5', 'custom-size-btn', 'd-flex', 'justify-content-center', 'align-items-center');
                cancelRequestButton.addEventListener('click', async () => await cancelFriendRequest(user.id));
                actionContainer.appendChild(cancelRequestButton);
            } else if (receivedRequestIds.has(user.id)) {
                const acceptButton = document.createElement('button');
                acceptButton.textContent = 'Accepter';
                acceptButton.classList.add('btn', 'btn-success', 'mb-2', 'me-5', 'custom-size-btn', 'd-flex', 'justify-content-center', 'align-items-center');
                acceptButton.addEventListener('click', async () => await acceptFriendRequest(user.id));

                const declineButton = document.createElement('button');
                declineButton.textContent = 'Refuser';
                declineButton.classList.add('btn', 'btn-danger', 'me-5', 'custom-size-btn', 'd-flex', 'justify-content-center', 'align-items-center');
                declineButton.addEventListener('click', async () => await declineFriendRequest(user.id));

                actionContainer.appendChild(acceptButton);
                actionContainer.appendChild(declineButton);
            } else {
                const addFriendButton = document.createElement('button');
                addFriendButton.textContent = 'Ajouter';
                addFriendButton.classList.add('btn', 'btn-primary', 'me-5', 'custom-size-btn', 'd-flex', 'justify-content-center', 'align-items-center');
                addFriendButton.addEventListener('click', async () => await sendFriendRequest(user.id));
                actionContainer.appendChild(addFriendButton);
            }
        });

    } catch (error) {
        console.error('Erreur lors de la gestion des utilisateurs et des amis:', error);
        alert('Une erreur s\'est produite. Vérifiez la console pour plus de détails.');
    }
});


// Fonction pour envoyer une demande d'ami
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
            body: JSON.stringify({ user_id: userId })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur lors de l'envoi de la demande d'ami: ${response.status} ${errorText}`);
        }

        alert('Demande d\'ami envoyée avec succès !');
        window.location.reload();

    } catch (error) {
        console.error('Erreur lors de l\'envoi de la demande d\'ami:', error);
        messageContainer.innerHTML = `<div class="alert alert-danger">Une erreur s'est produite lors de l'envoi de la demande d'ami.</div>`;
    }
}

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
        window.location.reload();
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
        window.location.reload();
    } catch (error) {
        console.error('Erreur lors du refus de la demande d\'ami:', error);
    }
}

// Fonction pour annuler une demande d'ami envoyée
async function cancelFriendRequest(userId) {
    const accessToken = localStorage.getItem('accessToken');
    try {
        const response = await fetch('https://localhost:8000/api/friends/cancel-friend-request/', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: userId })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur lors de l'annulation de la demande d'ami: ${response.status} ${errorText}`);
        }

        alert('Demande d\'ami annulée avec succès.');
        window.location.reload();
    } catch (error) {
        console.error('Erreur lors de l\'annulation de la demande d\'ami:', error);
    }
}
