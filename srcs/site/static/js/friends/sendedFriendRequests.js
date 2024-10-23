document.addEventListener('DOMContentLoaded', async () => {
    const accessToken = localStorage.getItem('accessToken');
    const profileInfo = document.getElementById('profileInfo'); // Ou tout autre élément où afficher la liste
    const sentRequestsContainer = document.createElement('div'); // Conteneur pour les demandes envoyées
    sentRequestsContainer.id = 'sentRequestsList';

    if (!accessToken) {
        alert('Vous devez être connecté pour accéder à cette page.');
        window.location.href = 'login.html';
        return;
    }

    try {
        // Récupérer les demandes d'amis envoyées par le user connecté
        const sentRequestsResponse = await fetch('https://localhost:8000/api/friends/show-all-sent-requests/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            }
        });

        if (!sentRequestsResponse.ok) {
            const errorText = await sentRequestsResponse.text();
            throw new Error(`Erreur lors de la récupération des demandes envoyées: ${sentRequestsResponse.status} ${errorText}`);
        }

        const sentRequestsData = await sentRequestsResponse.json();

        // Si l'utilisateur n'a pas envoyé de demandes d'amis
        if (sentRequestsData.length === 0) {
            const noSentRequestsMessage = document.createElement('p');
            noSentRequestsMessage.textContent = "Vous n'avez pas encore envoyé de demandes d'amis.";
            sentRequestsContainer.appendChild(noSentRequestsMessage);
        } else {
            // Titre pour les demandes envoyées
            const sentRequestsTitle = document.createElement('h3');
            sentRequestsTitle.textContent = "Demandes d'amis envoyées :";
            sentRequestsContainer.appendChild(sentRequestsTitle);

            // Afficher la liste des demandes d'amis envoyées
            sentRequestsData.forEach(request => {
                const receiver = request.receiver;

                const requestCard = document.createElement('div');
                requestCard.classList.add('card', 'mb-3');

				requestCard.innerHTML = `
				<div class="row g-0">
					<div class="col-md-2">
						<img src="${receiver.profile_photo}" class="img-fluid rounded-start" alt="${receiver.username}">
					</div>
					<div class="col-md-8">
						<div class="card-body">
							<h5 class="card-title">${receiver.username}</h5>
							<p class="card-text">Nom: ${receiver.first_name} ${receiver.last_name}</p>
							<p class="card-text">Demande envoyée le: ${new Date(request.timestamp).toLocaleString()}</p>
						</div>
					</div>
					<div class="col-md-2 d-flex align-items-center">
						<button class="btn btn-danger cancel-friend-request-btn" data-receiver-id="${receiver.id}">Annuler</button>
					</div>
				</div>
			`;
			

                sentRequestsContainer.appendChild(requestCard);
            });
        }

        // Ajouter le conteneur des demandes envoyées dans la page
        profileInfo.appendChild(sentRequestsContainer);

        // Ajouter les événements pour annuler les demandes d'amis
		document.querySelectorAll('.cancel-friend-request-btn').forEach(button => {
			button.addEventListener('click', async (event) => {
				const receiverId = event.currentTarget.getAttribute('data-receiver-id'); // Récupère l'ID du destinataire
				await cancelFriendRequest(receiverId); // Appeler la fonction pour annuler la demande d'ami
			});
		});
		

    } catch (error) {
        console.error('Erreur lors de la récupération des demandes d\'amis envoyées:', error);
        alert('Une erreur s\'est produite lors de la récupération des demandes d\'amis envoyées.');
    }
});

// Fonction pour annuler une demande d'ami envoyée
async function cancelFriendRequest(receiverId) {  // Le paramètre doit être l'ID du destinataire, pas l'ID de la demande
    const accessToken = localStorage.getItem('accessToken');
    try {
        const response = await fetch('https://localhost:8000/api/friends/cancel-friend-request/', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user_id: receiverId }) // Envoyer l'ID du destinataire de la demande à annuler
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur lors de l'annulation de la demande d'ami: ${response.status} ${errorText}`);
        }

        alert('Demande d\'ami annulée avec succès.');
        window.location.reload(); // Recharger la page après l'annulation
    } catch (error) {
        console.error('Erreur lors de l\'annulation de la demande d\'ami:', error);
        alert('Une erreur s\'est produite lors de l\'annulation de la demande d\'ami.');
    }
}

