document.addEventListener('DOMContentLoaded', () =>
{
    const form = document.getElementById('registrationForm');
	const passwordHelpBlock = document.getElementById('passwordHelpBlock');

    // Pour afficher une erreur sous un champ
    function showError(field, message)
	{
        // Ajouter une classe pour entourer le champ en rouge
        field.classList.add('is-invalid');
        // Créer un élément pour afficher le message d'erreur
        let errorElement = field.nextElementSibling;
        if (!errorElement || !errorElement.classList.contains('invalid-feedback'))
		{
            errorElement = document.createElement('div');
            errorElement.classList.add('invalid-feedback');
            field.parentNode.appendChild(errorElement);
        }
        errorElement.textContent = message;
    }

    // Pour enlever les erreurs d'un champ
    function clearError(field)
	{
        field.classList.remove('is-invalid');
        const errorElement = field.nextElementSibling;
        if (errorElement && errorElement.classList.contains('invalid-feedback'))
		{
            errorElement.remove();
        }
    }

    // Pour changer la couleur du texte d'aide du mot de passe
    function togglePasswordHelp(isValid)
	{
        if (isValid)
		{
            passwordHelpBlock.classList.remove('text-danger'); // Retirer la couleur rouge si valide
        }
		else
		{
            passwordHelpBlock.classList.add('text-danger'); // Ajouter la couleur rouge si invalide
        }
    }

    // Pour valider le mot de passe
    function validatePassword(password, firstName, lastName, email, username)
	{
        let isValid = true;
        let errorMessages = [];

        // Règle 1: Au moins 12 caractères
        if (password.length < 12)
		{
            errorMessages.push('At least 12 characters');
            isValid = false;
        }

        // Règle 2: Ne doit pas contenir le prénom, le nom de famille, l'email ou le nom d'utilisateur
        const lowerPassword = password.toLowerCase();
        if
		(
            lowerPassword.includes(firstName.toLowerCase()) ||
            lowerPassword.includes(lastName.toLowerCase()) ||
            lowerPassword.includes(email.toLowerCase()) ||
            lowerPassword.includes(username.toLowerCase())
        )
		{
            errorMessages.push("Can't be your first name, last name, email, or username");
            isValid = false;
        }

        // Règle 3: Doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar)
		{
            errorMessages.push('Must contain uppercase, lowercase, numeric, and special character');
            isValid = false;
        }

        // Mettre à jour le texte d'aide du mot de passe avec les erreurs
        if (!isValid)
		{
            passwordHelpBlock.innerHTML = errorMessages.join('<br>'); // Mettre à jour les messages d'erreur
            togglePasswordHelp(false); // Mettre le texte en rouge
        }
		else
		{
            passwordHelpBlock.innerHTML = "Must contain at least 12 characters<br>With: uppercase, lowercase, numeric, and special character<br>Can't be: your first name, last name, or email";
            togglePasswordHelp(true); // Remettre la couleur par défaut si le mot de passe est valide
        }

        return isValid;
    }

    // Validation des champs avant de soumettre le formulaire
    function validateForm()
	{
        let isValid = true;

        // prénom et nom
        const firstName = document.getElementById('first_name');
        const lastName = document.getElementById('last_name');
        if (firstName.value.trim() === '')
		{
            showError(firstName, 'First name is required.');
            isValid = false;
        }
		else
		{
            clearError(firstName);
        }

        if (lastName.value.trim() === '')
		{
            showError(lastName, 'Last name is required.');
            isValid = false;
        }
		else
		{
            clearError(lastName);
        }

        // email
        const email = document.getElementById('email');
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(email.value))
		{
            showError(email, 'Invalid email address.');
            isValid = false;
        }
		else
		{
            clearError(email);
        }

        // username
        const username = document.getElementById('username');
        if (username.value.trim() === '')
		{
            showError(username, 'Username is required.');
            isValid = false;
        }
		else
		{
            clearError(username);
        }

        // mot de passe et confirmation
        const password = document.getElementById('password').value;
        const password2 = document.getElementById('password2').value;
        const passwordValid = validatePassword(password, firstName.value, lastName.value, email.value, username.value);

        if (!passwordValid)
		{
            isValid = false;
        }

        if (password !== password2)
		{
            showError(document.getElementById('password2'), 'Passwords do not match.');
            isValid = false;
        }
		else
		{
            clearError(document.getElementById('password2'));
        }

        return isValid;
    }

    form.addEventListener('submit', async (event) =>
	{
        event.preventDefault(); // Empêche l'envoi normal du formulaire

        // Validation du formulaire
        if (!validateForm())
		{
            return; // Ne pas soumettre si le formulaire n'est pas valide
        }

        const formData = new FormData(form);

        try
		{
            console.log('Envoi des données:', formData);

            const response = await fetch('https://localhost:8000/api/user/register/',
			{
                method: 'POST',
                headers: {},
                mode: 'cors',
                body: formData,
            });

            if (!response.ok)
			{
                const errorText = await response.text();
                throw new Error(`Erreur HTTP: ${response.status} ${errorText}`);
            }

            const result = await response.json();
            console.log('Réponse du serveur:', result);
			localStorage.setItem('successMessage', 'Inscription réussie !');
            window.location.href = '../html/login.html';
        }
		catch (error)
		{
            console.error('Erreur:', error);
            alert('Une erreur s\'est produite. Vérifiez la console pour plus de détails.');
        }
    });
});
