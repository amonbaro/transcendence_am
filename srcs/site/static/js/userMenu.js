document.addEventListener('DOMContentLoaded', () =>
{
	const token = localStorage.getItem('accessToken');
	const userMenu = document.getElementById('userMenu');

	checkForMessage();

	if (token)
	{
		// If a user is connected
		userMenu.innerHTML =
		`
			<a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
				<img src="../../profile_photos/default/default-user-profile-photo.jpg" alt="User Menu" width="30" height="30" class="rounded-circle">
			</a>
			<ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
				<li><a class="dropdown-item" href="profile.html">Profile</a></li>
				<li><a class="dropdown-item" href="#" id="logoutBtn">Logout</a></li>
			</ul>
		`;
		document.getElementById('logoutBtn').addEventListener('click', async () =>
		{
			const refreshToken = localStorage.getItem('refreshToken');
			
			if (!refreshToken)
			{
				alert('Vous n\'êtes pas connecté.');
				window.location.href = '../index.html';
				return;
			}
			try
			{
				const response = await fetch('https://localhost:8000/api/user/logout/',
				{
					method: 'POST',
					headers:
					{
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({ refresh: refreshToken }),
				});
				if (!response.ok)
				{
					const errorText = await response.text();
					throw new Error(`Erreur lors de la déconnexion: ${response.status} ${errorText}`);
				}
				localStorage.removeItem('accessToken');
				localStorage.removeItem('refreshToken');
				localStorage.setItem('successMessage', 'Déconnexion réussie !')
				window.location.href = '../index.html';

			}
			catch (error)
			{
				console.error('Erreur lors de la déconnexion:', error);
				alert('Une erreur s\'est produite lors de la déconnexion. Vérifiez la console pour plus de détails.');
			}
		});
	}
	else
	{
		// If no user connected
		userMenu.innerHTML =
		`
			<a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
				<img src="../../profile_photos/default/default-user-profile-photo.jpg" alt="User Menu" width="30" height="30" class="rounded-circle">
			</a>
			<ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarDropdown">
				<li><a class="dropdown-item" href="register.html">Register</a></li>
				<li><a class="dropdown-item" href="login.html">Login</a></li>
			</ul>
		`;
	}
});
