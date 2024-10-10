async function refreshAccessToken()
{
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken)
	{
        alert('Session expirée, veuillez vous reconnecter.');
        window.location.href = 'login.html';
        return;
    }
    try
	{
        const response = await fetch('https://localhost:8000/api/token/refresh/',
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
            throw new Error(`Erreur lors du rafraîchissement du token: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        const newAccessToken = result.access;

        if (newAccessToken)
		{
            localStorage.setItem('accessToken', newAccessToken);
            console.log('Token d\'accès rafraîchi avec succès');
        }
		else
		{
            throw new Error('Aucun nouveau token d\'accès reçu');
        }
    }
	catch (error)
	{
        console.error('Erreur lors du rafraîchissement du token:', error);
        alert('Une erreur s\'est produite lors de la mise à jour de la session. Veuillez vous reconnecter.');
        window.location.href = 'login.html';
    }
}
