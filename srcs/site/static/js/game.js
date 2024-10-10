// jeu.js

import { main } from '../game/games.js';

document.addEventListener("DOMContentLoaded", () => {
    // Charger les options de jeu depuis localStorage
    const gameOptions = JSON.parse(localStorage.getItem('gameOptions'));

    // Vérifier si les options existent avant de lancer le jeu
    if (gameOptions) {
        const { mode, playerNames, playerKeys, maxScore, paddleSpeed, paddleSize, bounceMode, ballSpeed, ballAcceleration, numBalls, map } = gameOptions;

        // Appeler la fonction main avec les options de jeu et les touches des joueurs
        main(
            mode,                           // Mode de jeu
            playerNames,                    // Noms des joueurs (déjà un tableau)
            playerKeys,                     // Touches des joueurs (tableau)
            parseInt(maxScore),             // Score maximum
            parseInt(paddleSpeed),          // Vitesse des paddles
            parseInt(paddleSize),           // Taille des paddles
            bounceMode,                     // Mode rebond
            parseInt(ballSpeed),            // Vitesse de la balle
            parseInt(ballAcceleration),     // Accélération de la balle
            parseInt(numBalls),             // Nombre de balles
            parseInt(map)                   // Carte
        );
    } else {
        alert("No game options found!");
    }
});

// Gestion du clic sur le bouton "Back to Menu"
document.getElementById('backButton').addEventListener('click', () => {
    window.location.href = '../index.html';
});
