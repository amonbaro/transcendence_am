document.addEventListener('DOMContentLoaded', async () => {
    const accessToken = localStorage.getItem('accessToken');
    const profileInfo = document.getElementById('profileInfoContainer');
    const userFirstName = document.getElementById('userFirstName');
	const userLastName = document.getElementById('userLastName');
    const userUsername = document.getElementById('userUsername');
	const profilePhoto = document.getElementById('profilePhoto');
    const editOverlay = document.querySelector('.edit-overlay');
    const changePasswordBtn = document.getElementById('changePasswordBtn');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const passwordChangeMessage = document.getElementById('passwordChangeMessage');

    if (!accessToken) {
        alert('Vous devez être connecté pour accéder à cette page.');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch('https://localhost:8000/api/user/profile/', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erreur lors de la récupération du profil: ${response.status} ${errorText}`);
        }

        const profileData = await response.json();
        profilePhoto.src = profileData.profile_photo;
        userFirstName.textContent = profileData.first_name;
        userLastName.textContent = profileData.last_name;
        userUsername.textContent = profileData.username;
    } catch (error) {
        console.error('Erreur lors de la récupération des données du profil:', error);
        alert('Une erreur s\'est produite. Vérifiez la console pour plus de détails.');
        window.location.href = 'login.html';
    }

	// Afficher la pop-up au clic sur l'overlay
	editOverlay.addEventListener('click', () => {
		alert('EDIT PP OK');
	});

    // Ouvrir le modal lors du clic sur le bouton "Changer le mot de passe"
    changePasswordBtn.addEventListener('click', () => {
        const changePasswordModal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
        changePasswordModal.show();
    });

    // Gestion de la soumission du formulaire de changement de mot de passe
    changePasswordForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        if (newPassword !== confirmNewPassword) {
            passwordChangeMessage.innerHTML = '<div class="alert alert-danger">Les nouveaux mots de passe ne correspondent pas.</div>';
            return;
        }

        try {
            const response = await fetch('https://localhost:8000/api/user/change-password/', {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword,
                    new_password2: confirmNewPassword,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Erreur lors du changement de mot de passe: ${response.status} ${errorText}`);
            }

            const result = await response.json();
            passwordChangeMessage.innerHTML = `<div class="alert alert-success">${result.detail}</div>`;
            changePasswordForm.reset();

            // Fermer le modal après 2 secondes
            setTimeout(() => {
                const changePasswordModal = bootstrap.Modal.getInstance(document.getElementById('changePasswordModal'));
                changePasswordModal.hide();
                passwordChangeMessage.innerHTML = ''; // Effacer les messages
            }, 2000);

        } catch (error) {
            console.error('Erreur lors du changement de mot de passe:', error);
            passwordChangeMessage.innerHTML = '<div class="alert alert-danger">Une erreur s\'est produite lors du changement de mot de passe.</div>';
        }
    });
});
