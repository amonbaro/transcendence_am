#!/bin/bash

# Demander à l'utilisateur de saisir un message de commit
read -p "commit : " commit_message

# Ajouter tous les fichiers modifiés et nouveaux
git add .

# Faire le commit avec le message saisi
git commit -m "$commit_message"

# Pousser les changements vers la branche master
git push origin startpoint

echo "Les changements ont été poussés sur la branche master avec le message : $commit_message"
