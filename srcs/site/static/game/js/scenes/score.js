import { registerGameWinner } from '../../../js/games/registerGame.js';

export class Score {
    constructor(langue, ctx, font, gameArea, player1Name = 'Player 1', player2Name = 'Player 2', player3Name = 'Player 3', player4Name = 'Player 4') {
        this.ctx = ctx;
        this.font = font;
        this.gameArea = gameArea;
        this.player1Name = player1Name;
        this.player2Name = player2Name;
        this.player3Name = player3Name;
        this.player4Name = player4Name;
        this.player1Score = 0;
        this.player2Score = 0;
        this.player3Score = 0;
        this.player4Score = 0;
        this.finalTournamentScore = []; //[[player1, score1], [player2, score2], ...]
        this.langue = langue
    }

    incrementPlayer1Score() {
        this.player1Score += 1;
    }

    incrementPlayer2Score() {
        this.player2Score += 1;
    }

    reset() {
        this.player1Score = 0;
        this.player2Score = 0;
    }

    drawFlat(text, px, color, align, x, y, angle = 0) {
        this.ctx.save(); // Sauvegarder l'état actuel du contexte
    
        // Définir les propriétés du texte
        this.ctx.font = `${px}px ${this.font.family}`;
        this.ctx.fillStyle = color;
        this.ctx.textAlign = align;
    
        // Déplacer le contexte au point (x, y)
        this.ctx.translate(x, y);
    
        // Appliquer la rotation
        this.ctx.rotate(angle * Math.PI / 180);
    
        // Dessiner le texte à l'origine (0, 0) car le contexte est déjà déplacé
        this.ctx.fillText(text, 0, 0);
    
        this.ctx.restore(); // Restaurer l'état initial du contexte
    }
    
    drawTitle(gameTitle) {
        this.ctx.font = `30px ${this.font.family}`;
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(gameTitle, this.ctx.canvas.width / 2, 50);
    }

    drawSubtitle(gameSubtitle, maxScore) {
        this.ctx.font = `20px ${this.font.family}`;
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(gameSubtitle + maxScore, this.ctx.canvas.width / 2, 80);
    }

    drawEnd(winningPlayer, secondWinningPlayer = null) {
        this.ctx.font = `30px ${this.font.family}`;
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';

        let sentence;
        let sentence2; 
        if (this.langue == 0) {
            sentence = 'just won the game!';
            sentence2 = 'also won the game!';
        }
        else if (this.langue == 1) {
            sentence = 'vien de gagner la partie!';
            sentence2 = 'a aussi gagné la partie!';
        }

        let winnerName = '';
        let secondWinnerName = '';

        if (winningPlayer === 1) {
            winnerName = this.player1Name;
            this.ctx.fillText(`${this.player1Name} ` + sentence, this.ctx.canvas.width / 2, this.ctx.canvas.width / 2 - 50);
        } else if (winningPlayer === 2) {
            winnerName = this.player2Name;
            this.ctx.fillText(`${this.player2Name} ` + sentence, this.ctx.canvas.width / 2, this.ctx.canvas.width / 2 - 50);
        } else if (winningPlayer === 3) {
            winnerName = this.player3Name;
            this.ctx.fillText(`${this.player3Name} ` + sentence, this.ctx.canvas.width / 2, this.ctx.canvas.width / 2 - 50);
        } else if (winningPlayer === 4) {
            winnerName = this.player4Name;
            this.ctx.fillText(`${this.player4Name} ` + sentence, this.ctx.canvas.width / 2, this.ctx.canvas.width / 2 - 50);
        }

        if (secondWinningPlayer === 1) {
            secondWinnerName = this.player1Name;
        } else if (secondWinningPlayer === 2) {
            secondWinnerName = this.player2Name;
        } else if (secondWinningPlayer === 3) {
            secondWinnerName = this.player3Name;
        } else if (secondWinningPlayer === 4) {
            secondWinnerName = this.player4Name;
        }

        if (secondWinnerName) {
            this.ctx.fillText(`${secondWinnerName} ` + sentence2, this.ctx.canvas.width / 2, this.ctx.canvas.width / 2 - 20);
            registerGameWinner(`${winnerName} & ${secondWinnerName}`);
        } else {
            registerGameWinner(winnerName);
        }
    }

    drawScore() {
        this.ctx.font = `30px ${this.font.family}`;
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';

        this.ctx.fillText(`${this.player1Name}: ${this.player1Score}`, this.ctx.canvas.width / 4, 120);
        this.ctx.fillText(`${this.player2Name}: ${this.player2Score}`, (3 * this.ctx.canvas.width / 4), 120);
    }

    drawTournamentScore(wins, round, activePlayers) {
        const startX = this.gameArea.gameX + this.gameArea.gameWidth / 2;
        let startY = this.gameArea.gameY + this.gameArea.gameHeight + 40;
    
        this.ctx.font = `20px ${this.font.family}`;
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';

        let sentence;
        if (this.langue == 0)
            sentence = 'wins';
        else if (this.langue == 1)
            sentence = 'a gagné';


        this.ctx.fillText(`Round ${round}`, startX, startY);
        startY += 30;

        this.finalTournamentScore = [];
    
        for (const [player, winCount] of Object.entries(wins)) {
            if (activePlayers.includes(player)) {
                this.ctx.fillText(`${player}: ${winCount} ` + sentence, startX, startY);
            } else {
                this.ctx.fillText(`${player}: ${winCount} ` + sentence, startX, startY); 
                this.ctx.beginPath();
                this.ctx.moveTo(startX - 60, startY - 10);
                this.ctx.lineTo(startX + 60, startY - 10);
                this.ctx.strokeStyle = 'white';
                this.ctx.stroke();
            }

            this.finalTournamentScore.push([player, winCount]);

            startY += 30; // Espace entre les lignes
        }
    }

    drawTournamentEnd(winner) {
        this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        this.ctx.font = `50px ${this.font.family}`;
        this.ctx.fillStyle = 'white';
        this.ctx.textAlign = 'center';

        let sentence;
        let sentence2; 
        if (this.langue == 0) {
            sentence = 'wins the tournament!';
            sentence2 = 'rounds win';
        }
        else if (this.langue == 1) {
            sentence = 'a gagné le tournoi!';
            sentence2 = 'rounds gagnés';
        }

        this.ctx.fillText(`${winner} ` + sentence, this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);

        this.finalTournamentScore.sort((a, b) => b[1] - a[1]); 


        const scoreboard = document.getElementById('scoreboard');
        scoreboard.innerHTML = `<h3>Score</h3>`;
        this.finalTournamentScore.forEach(([player, winCount]) => {
            const playerScore = document.createElement('p');
            playerScore.textContent = `${player}: ${winCount} ` + sentence2;
            scoreboard.appendChild(playerScore);
        });
    }
}