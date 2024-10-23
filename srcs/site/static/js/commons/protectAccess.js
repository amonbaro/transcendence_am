document.addEventListener('DOMContentLoaded', () =>
{
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken)
	{
        alert('Vous devez être connecté pour accéder à cette page.');
        window.location.href = 'login.html';
    }
});
