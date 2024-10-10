document.addEventListener('DOMContentLoaded', async () =>
{
    const accessToken = localStorage.getItem('accessToken');
	const profileInfo = document.getElementById('profileInfo');
    
    if (!accessToken)
	{
        alert('Vous devez être connecté pour accéder à cette page.');
        window.location.href = 'login.html';
        return;
    }
    try
	{
        const response = await fetch('https://localhost:8000/api/user/profile/',
		{
            method: 'GET',
            headers:
			{
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok)
		{
            const errorText = await response.text();
            throw new Error(`Erreur lors de la récupération du profil: ${response.status} ${errorText}`);
        }
        const profileData = await response.json();
		profileInfo.innerHTML =
		`
			<img src="${profileData.profile_photo}" alt="Profile Photo" class="img-fluid rounded-circle" width="150" height="150">
			<p><strong>Nom :</strong> ${profileData.last_name}</p>
			<p><strong>Prénom :</strong> ${profileData.first_name}</p>
			<p><strong>Username :</strong> ${profileData.username}</p>
		`;
    }
	catch (error)
	{
        console.error('Erreur lors de la récupération des données du profil:', error);
        alert('Une erreur s\'est produite. Vérifiez la console pour plus de détails.');
		window.location.href = 'login.html';
    }
});
