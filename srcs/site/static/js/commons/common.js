// Générique pour afficher un message de succès ou d'erreur
function showMessage(message, type = 'success', containerId = 'messageContainer')
{
    const messageContainer = document.getElementById(containerId);
    if (messageContainer)
	{
        messageContainer.innerHTML =
		`
            <div class="alert alert-${type}" role="alert">
                ${message}
            </div>
        `;
        // Faire disparaître le message après 2 secondes
        setTimeout(() =>
		{
            messageContainer.innerHTML = '';
        }, 2000);
    }
}

// Vérifier et afficher un message stocké dans localStorage
function checkForMessage(containerId = 'messageContainer')
{
    const successMessage = localStorage.getItem('successMessage');
    if (successMessage)
	{
        showMessage(successMessage, 'success', containerId);
        localStorage.removeItem('successMessage'); // Supprimer le message après affichage
    }
}
