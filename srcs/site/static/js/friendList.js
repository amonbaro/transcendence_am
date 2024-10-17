document.addEventListener('DOMContentLoaded', async () => {
    const accessToken = localStorage.getItem('accessToken');
    const profileInfo = document.getElementById('profileInfo'); // Élément de la page où les informations d'amis seront affichées
    const friendListContainer = document.createElement('div'); // Conteneur pour la liste des amis
    friendListContainer.id = 'friendList';

    if (!accessToken) {
        alert('Vous devez être connecté pour accéder à cette page.');
        window.location.href = 'login.html';
        return;
    }

    try {
        // Récupérer la liste des amis via l'API
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

        // Afficher la section des amis seulement si l'utilisateur a des amis
        if (friendsData.length > 0) {
            const friendSectionTitle = document.createElement('h3');
            friendSectionTitle.textContent = "Amis :";
            friendListContainer.appendChild(friendSectionTitle);

            friendsData.forEach(friendEntry => {
                const friend = friendEntry.friend;
                const friendDiv = document.createElement('div');
                friendDiv.classList.add('friend-entry', 'd-flex', 'align-items-center', 'mb-3');

                const friendImage = document.createElement('img');
                friendImage.src = friend.profile_photo;
                friendImage.alt = "Friend's profile photo";
                friendImage.classList.add('img-fluid', 'rounded-circle', 'me-3');
                friendImage.width = 50;
                friendImage.height = 50;

                const friendInfo = document.createElement('div');
                friendInfo.innerHTML = `
                    <p><strong>${friend.first_name} ${friend.last_name}</strong> (${friend.username})</p>
                `;

                const removeFriendButton = document.createElement('button');
                removeFriendButton.textContent = 'Supprimer';
                removeFriendButton.classList.add('btn', 'btn-danger', 'ms-auto');
                removeFriendButton.setAttribute('data-friend-id', friend.id); // Attacher l'ID de l'ami pour la suppression

                // Ajouter un événement de suppression au clic du bouton
                removeFriendButton.addEventListener('click', async (event) => {
                    const friendId = event.target.getAttribute('data-friend-id');
                    await removeFriend(friendId); // Appeler la fonction pour supprimer l'ami
                });

                friendDiv.appendChild(friendInfo);
                friendDiv.appendChild(removeFriendButton);
                friendListContainer.appendChild(friendDiv);
            });

            // Ajouter le conteneur des amis dans la page
            profileInfo.appendChild(friendListContainer);
        } else {
            const noFriendsMessage = document.createElement('p');
            noFriendsMessage.textContent = "Vous n'avez pas encore d'amis.";
            profileInfo.appendChild(noFriendsMessage);
        }

    } catch (error) {
        console.error('Erreur lors de la récupération des amis:', error);
        alert('Une erreur s\'est produite. Vérifiez la console pour plus de détails.');
        window.location.href = 'login.html';
    }
});

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
            body: JSON.stringify({ user_id: friendId }) // Envoyer l'ID de l'ami à supprimer
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur lors de la suppression de l'ami: ${response.status} ${errorText}`);
        }

        // Actualiser la page après la suppression de l'ami
        alert('Ami supprimé avec succès');
        window.location.reload();

    } catch (error) {
        console.error('Erreur lors de la suppression de l\'ami:', error);
        messageContainer.innerHTML = `<div class="alert alert-danger">Une erreur s'est produite lors de la suppression de l'ami.</div>`;
    }
}
