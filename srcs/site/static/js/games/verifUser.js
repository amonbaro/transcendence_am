document.addEventListener('DOMContentLoaded', () => {
    const loginSubmit = document.getElementById('loginSubmit');
    const loginModalElement = document.getElementById('loginModal');
    const loginModal = new bootstrap.Modal(loginModalElement);
    let verifiedUsers = new Map(); // Utilisation d'une Map pour stocker les IDs utilisateur avec les noms
    let usedUsernames = new Set(); // Ensemble pour stocker les noms d'utilisateur vérifiés ou déjà utilisés

    // Fonction de soumission du formulaire
    const submitLogin = async () => {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const playerIndex = document.getElementById('loginPlayerIndex').value;

		const updateVerifiedUsersInLocalStorage = () => {
			const verifiedUsersObject = Object.fromEntries(verifiedUsers); // Conversion de Map en objet pour stockage
			localStorage.setItem('verifiedUsers', JSON.stringify(verifiedUsersObject));
		};

        if (!email || !password) {
            alert('Veuillez entrer votre email et mot de passe.');
            return;
        }

        try {
            const response = await fetch('https://localhost:8000/api/user/verify-user-login/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erreur lors de la vérification de l'utilisateur: ${response.status} ${errorText}`);
            }

            const userData = await response.json();

            // Vérification si l'utilisateur est déjà utilisé pour un autre joueur
            if (verifiedUsers.has(userData.username)) {
                alert('Cet utilisateur est déjà connecté pour un autre joueur.');
                return;
            }

            // Met à jour le champ du joueur avec le nom d'utilisateur
            const playerInput = document.getElementById(`player${playerIndex}`);

            // Si un autre joueur est déjà dans ce champ, le retirer des ensembles
            const previousValue = playerInput.value;
            if (previousValue) {
                verifiedUsers.delete(previousValue); // Retirer l'utilisateur précédent de la Map des utilisateurs vérifiés
                usedUsernames.delete(previousValue); // Retirer de l'ensemble des noms utilisés
            }

            // Définir le nouveau joueur vérifié
            playerInput.value = userData.username;
            playerInput.disabled = true; // Empêche la modification du champ après la vérification
            verifiedUsers.set(userData.username, userData.id); // Ajouter l'utilisateur vérifié à la Map avec son ID
            usedUsernames.add(userData.username); // Ajouter à la liste des noms utilisés

			updateVerifiedUsersInLocalStorage();

            // Fermer la modale après une connexion réussie
            loginModal.hide();

        } catch (error) {
            console.error('Erreur lors de la connexion:', error);
            alert('Une erreur s\'est produite lors de la connexion. Vérifiez vos identifiants.');
        }
    };

    // Lorsque le bouton de connexion est cliqué dans la modale
    loginSubmit.addEventListener('click', submitLogin);

    // Permettre la soumission via la touche "Enter"
    document.getElementById('loginEmail').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            submitLogin();
        }
    });

    document.getElementById('loginPassword').addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            submitLogin();
        }
    });

    // Attacher les événements de clic sur tous les boutons "Connect"
    document.addEventListener('click', function (event) {
        if (event.target && event.target.classList.contains('connect-btn')) {
            const playerIndex = event.target.getAttribute('data-player-index');
            document.getElementById('loginPlayerIndex').value = playerIndex;
        }
    });

    // Ajouter un événement qui vide les champs "email" et "password" lorsque la modale se ferme
    loginModalElement.addEventListener('hidden.bs.modal', () => {
        document.getElementById('loginEmail').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginPlayerIndex').value = ''; // Réinitialise aussi l'index joueur
    });

    // Empêcher les noms d'invités de dupliquer un nom d'utilisateur vérifié
    document.addEventListener('input', (event) => {
        if (event.target && event.target.matches('[id^="player"]')) {
            const inputField = event.target;
            const playerName = inputField.value.trim();

            if (usedUsernames.has(playerName)) {
                alert('Ce nom est déjà utilisé par un joueur vérifié. Veuillez en choisir un autre.');
                inputField.value = ''; // Effacer le champ si le nom est déjà utilisé
            }
        }
    });

    // Exposer les utilisateurs vérifiés pour l'utiliser dans d'autres fichiers
    window.getVerifiedUsers = () => verifiedUsers;
});
