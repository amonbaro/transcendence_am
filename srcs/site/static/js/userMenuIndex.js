document.addEventListener('DOMContentLoaded', async () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userMenu = document.getElementById('userMenu');

    // Fonction pour supprimer les tokens invalides du localStorage
    function clearTokens() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
    }

    // Si des tokens sont présents, on vérifie leur validité
    if (accessToken) {
        try {
            // Étape 1: Vérification du token avec l'API /token/verify/
            const verifyResponse = await fetch('https://localhost:8000/api/user/token/verify/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: accessToken }), // Vérification du token
            });

            if (!verifyResponse.ok) {
                // Si la vérification échoue, on supprime les tokens et redirige l'utilisateur
                clearTokens();
                alert('Session expirée. Veuillez vous reconnecter.');
                window.location.href = 'index.html';
                return;
            }

            // Étape 2: Vérification que l'utilisateur existe encore avec l'API /user/profile/
            const profileResponse = await fetch('https://localhost:8000/api/user/profile/', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!profileResponse.ok) {
                // Si l'utilisateur n'existe plus (404 ou 401), on supprime les tokens
                clearTokens();
                alert('Votre compte a été supprimé ou vous n\'êtes plus connecté.');
                window.location.href = 'index.html';
                return;
            }

        } catch (error) {
            // En cas d'erreur réseau ou autre, on supprime les tokens et redirige
            clearTokens();
            console.error('Erreur lors de la vérification des tokens ou du profil:', error);
            window.location.href = 'index.html';
            return;
        }
    }

    checkForMessage();

    if (accessToken) {
        // Si un utilisateur est connecté
        userMenu.innerHTML =
            `
            <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <img src="../../profile_photos/default/default-user-profile-photo.jpg" alt="User Menu" width="30" height="30" class="rounded-circle">
            </a>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                <li><a class="dropdown-item" href="html/profile.html">Profile</a></li>
                <li><a class="dropdown-item" href="#" id="logoutBtn">Logout</a></li>
            </ul>
        `;

        document.getElementById('logoutBtn').addEventListener('click', async () => {
            if (!refreshToken) {
                alert('Vous n\'êtes pas connecté.');
                window.location.href = 'index.html';
                return;
            }

            try {
                const response = await fetch('https://localhost:8000/api/user/logout/', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({ refresh: refreshToken }),
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Erreur lors de la déconnexion: ${response.status} ${errorText}`);
                }

                // Suppression des tokens après déconnexion
                clearTokens();
                localStorage.setItem('successMessage', 'Déconnexion réussie !');
                window.location.href = 'index.html';

            } catch (error) {
                console.error('Erreur lors de la déconnexion:', error);
                alert('Une erreur s\'est produite lors de la déconnexion. Vérifiez la console pour plus de détails.');
            }
        });
    } else {
        // Si aucun utilisateur n'est connecté
        userMenu.innerHTML =
            `
            <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <img src="../../profile_photos/default/default-user-profile-photo.jpg" alt="User Menu" width="30" height="30" class="rounded-circle">
            </a>
            <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
                <li><a class="dropdown-item" href="html/register.html">Register</a></li>
                <li><a class="dropdown-item" href="html/login.html">Login</a></li>
            </ul>
        `;
    }
});
