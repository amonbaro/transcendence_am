import { storeGameSession } from './games/registerGame.js';

const MIN_PLAYERS = 2;
const VERSUS_MAX = 4;
const TOURNAMENT_MAX = 10;
const LASTMANSTANDING_MAX = 4;
const BRICKBREAKER_MAX = 4;

document.getElementById('mode').addEventListener('change', updateOptions);
document.getElementById('addPlayer').addEventListener('click', addPlayer);
document.getElementById('removePlayer').addEventListener('click', removePlayer);
document.getElementById('maxScore').addEventListener('input', () => {
    document.getElementById('maxScoreValue').textContent = document.getElementById('maxScore').value;
});
document.getElementById('paddleSpeed').addEventListener('input', () => {
    document.getElementById('paddleSpeedValue').textContent = document.getElementById('paddleSpeed').value;
});
document.getElementById('paddleSize').addEventListener('input', () => {
    document.getElementById('paddleSizeValue').textContent = document.getElementById('paddleSize').value;
});
document.getElementById('ballSpeed').addEventListener('input', () => {
    document.getElementById('ballSpeedValue').textContent = document.getElementById('ballSpeed').value;
});
document.getElementById('ballAcceleration').addEventListener('input', () => {
    document.getElementById('ballAccelerationValue').textContent = document.getElementById('ballAcceleration').value;
});
document.getElementById('numBalls').addEventListener('input', () => {
    document.getElementById('numBallsValue').textContent = document.getElementById('numBalls').value;
});
document.getElementById('map').addEventListener('input', () => {
    document.getElementById('mapValue').textContent = document.getElementById('map').value;
});

function updateOptions() {
    const mode = document.getElementById('mode').value;
    const maxScoreField = document.getElementById('maxScore');
    document.getElementById('player-controls-wrapper').innerHTML = ''; 
    document.getElementById('player-key-wrapper').innerHTML = ''; 

    let initialPlayers = MIN_PLAYERS;
    let maxPlayers = getMaxPlayersForMode(mode);

    if (mode === 'brickBreaker') {
        maxScoreField.disabled = true;
        document.getElementById('maxScoreValue').textContent = 'N/A'; 
    } else {
        maxScoreField.disabled = false;
        document.getElementById('maxScoreValue').textContent = maxScoreField.value;
    }

    for (let i = 0; i < 2; i++) {
        addPlayerField(i);
    }

    updateAddPlayerButton();
    updateRemovePlayerButton();
}

function getPlayersToAddOrRemove(mode) {
    return (mode === 'versus' || mode === 'brickBreaker') ? 2 : 1;
}

function addPlayer() {
    const mode = document.getElementById('mode').value;
    const maxPlayers = getMaxPlayersForMode(mode);
    const playerFields = document.getElementsByClassName('player-control');

    let toAdd = getPlayersToAddOrRemove(mode);
    const currentPlayers = playerFields.length;
    
    for (let i = 0; i < toAdd; i++) {
        if (currentPlayers + i < maxPlayers) {
            if (currentPlayers + i >= 2 && mode === 'tournament') {
                addPlayerField(currentPlayers + i, true);
            } else {
                addPlayerField(currentPlayers + i);
            }
        }
    }

    updateAddPlayerButton();
    updateRemovePlayerButton();
}

function removePlayer() {
    const mode = document.getElementById('mode').value;
    const column1 = document.getElementById('column1');
    const column2 = document.getElementById('column2');
    const playerContainersCol1 = column1.getElementsByClassName('player-container');
    const playerContainersCol2 = column2.getElementsByClassName('player-container');
    
    let toRemove = getPlayersToAddOrRemove(mode);

    for (let i = 0; i < toRemove; i++) {
        if (playerContainersCol1.length + playerContainersCol2.length > MIN_PLAYERS) {
            if (playerContainersCol1.length > playerContainersCol2.length) {
                playerContainersCol1[playerContainersCol1.length - 1].remove();
            } else {
                playerContainersCol2[playerContainersCol2.length - 1].remove();
            }
        }
    }

    updateAddPlayerButton();
    updateRemovePlayerButton();
}

function addPlayerField(index, noControls = false) {
    const controlsWrapper = document.getElementById('player-controls-wrapper');
    let column;

    if (index % 2 === 0) {
        if (!document.getElementById('column1')) {
            column = document.createElement('div');
            column.classList.add('col-md-5', 'mx-auto');
            column.setAttribute('id', 'column1');
            controlsWrapper.appendChild(column);
        } else {
            column = document.getElementById('column1');
        }
    } else {
        if (!document.getElementById('column2')) {
            column = document.createElement('div');
            column.classList.add('col-md-5', 'mx-auto');
            column.setAttribute('id', 'column2');
            controlsWrapper.appendChild(column);
        } else {
            column = document.getElementById('column2');
        }
    }

    const playerContainer = document.createElement('div');
    playerContainer.classList.add('player-container', 'mt-5', 'mb-5', 'text-center');

    const playerTitle = document.createElement('h5');
    playerTitle.textContent = `Player ${index + 1}`;
    playerContainer.appendChild(playerTitle);

    const divPlayer = document.createElement('div');
    divPlayer.classList.add('player-control', 'mb-3');
    divPlayer.innerHTML = `
        <input type="text" class="form-control" id="player${index}" placeholder="Enter player name" autocomplete="off">
		<br>
		<button class="btn btn-outline-primary connect-btn" data-player-index="${index}" data-bs-toggle="modal" data-bs-target="#loginModal">Connect</button>
    `;
    playerContainer.appendChild(divPlayer);

    const mode = document.getElementById('mode').value;

    let upLabel = "Up Key";
    let downLabel = "Down Key";

    if (mode === 'brickBreaker' || (mode === 'lastManStanding' && index >= 2)) {
        upLabel = "Left Key";
        downLabel = "Right Key";
    }

    let touchTitle = "";
    if (mode === 'tournament') {
        if (index % 2 === 0) {
            touchTitle = "Left players";
        } else {
            touchTitle = "Right players";
        }
    }

    if (noControls) {
        column.appendChild(playerContainer);
        return;
    }

    const divKeys = document.createElement('div');
    divKeys.classList.add('player-controls', 'mb-3');

    if (mode === 'tournament') {
        const touchTitleElement = document.createElement('h5');
        touchTitleElement.textContent = touchTitle;
        touchTitleElement.classList.add('text-center', 'mt-3', 'mb-3');
        divKeys.appendChild(touchTitleElement);
    }

    divKeys.innerHTML += `
        <div class="mb-2 d-flex align-items-center mx-3">
            <label class="col-form-label text-start text-nowrap key-label">${upLabel} :</label>
            <div class="flex-grow-1 ms-4">
                <input type="text" class="form-control touch-field" id="player${index}Up" placeholder="Press a key" autocomplete="off">
            </div>
        </div>
        <div class="mb-2 d-flex align-items-center mx-3">
            <label class="col-form-label text-start text-nowrap key-label">${downLabel} :</label>
            <div class="flex-grow-1 ms-4">
                <input type="text" class="form-control touch-field" id="player${index}Down" placeholder="Press a key" autocomplete="off">
            </div>
        </div>
    `;
    playerContainer.appendChild(divKeys);

    if (mode === 'tournament') {
        column.appendChild(divKeys);
        column.appendChild(playerContainer);
    } else {
        playerContainer.appendChild(divKeys);
        column.appendChild(playerContainer);
    }

	document.getElementById(`player${index}Up`).addEventListener('keydown', function(event) {
		event.preventDefault();
		const key = event.key;
		let displayValue = key;
	
		// Vérification et conversion des flèches en icônes Unicode
		if (key === "ArrowUp") displayValue = "↑";
		else if (key === "ArrowDown") displayValue = "↓";
		else if (key === "ArrowLeft") displayValue = "←";
		else if (key === "ArrowRight") displayValue = "→";
	
		// Vérification pour n'autoriser que les lettres minuscules, chiffres, et flèches directionnelles
		if ((/^[a-z0-9]$/.test(key)) || ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].includes(key)) {
            if(event.key != 'Tab')
            {
			    this.value = displayValue; // Affiche l'icône
			    this.setAttribute('data-key', key); // Stocke la vraie touche dans un attribut data-key
            }
            else
            {
                event.preventDefault();
                document.getElementById(`player${index}Down`).focus(); // Passer au champ suivant (Down key)
            }
		} else {
			alert("Only lowercase letters, numbers, and arrow keys are allowed.");
		}
	});
	
	document.getElementById(`player${index}Down`).addEventListener('keydown', function(event) {
		event.preventDefault();
		const key = event.key;
		let displayValue = key;
	
		// Vérification et conversion des flèches en icônes Unicode
		if (key === "ArrowUp") displayValue = "↑";
		else if (key === "ArrowDown") displayValue = "↓";
		else if (key === "ArrowLeft") displayValue = "←";
		else if (key === "ArrowRight") displayValue = "→";
	
		// Vérification pour n'autoriser que les lettres minuscules, chiffres, et flèches directionnelles
		if ((/^[a-z0-9]$/.test(key)) || ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"].includes(key)) {
            if(event.key != 'Tab')
            {
			    this.value = displayValue; // Affiche l'icône
			    this.setAttribute('data-key', key); // Stocke la vraie touche dans un attribut data-key
            }
            else
            {
                event.preventDefault();
                if (mode == 'tournament')
                {
                    if(index == 0)
                        document.getElementById(`player${0}`).focus();
                    else
                        document.getElementById(`player${1}`).focus();
                }
                else
                {
                    const nextPlayer = document.getElementById(`player${index + 1}`);
                    if (nextPlayer) {
                        nextPlayer.focus(); // Passe au champ suivant (nom du joueur suivant)
                    }
                }
            }
		} else {
			alert("Only lowercase letters, numbers, and arrow keys are allowed.");
		}
	});
}

function updateAddPlayerButton() {
    const mode = document.getElementById('mode').value;
    const maxPlayers = getMaxPlayersForMode(mode);
    const playerFields = document.getElementsByClassName('player-control');

    if (playerFields.length >= maxPlayers) {
        document.getElementById('addPlayer').style.display = 'none';
    } else {
        document.getElementById('addPlayer').style.display = 'inline';
    }
}

function updateRemovePlayerButton() {
    const playerFields = document.getElementsByClassName('player-control');
    if (playerFields.length <= MIN_PLAYERS) {
        document.getElementById('removePlayer').style.display = 'none';
    } else {
        document.getElementById('removePlayer').style.display = 'inline';
    }
}

function getMaxPlayersForMode(mode) {
    switch (mode) {
        case 'versus':
        case 'brickBreaker':
            return VERSUS_MAX;
        case 'tournament':
            return TOURNAMENT_MAX;
        case 'lastManStanding':
            return LASTMANSTANDING_MAX;
        default:
            return 4;
    }
}

updateOptions();

document.getElementById('startGame').addEventListener('click', () => {
    const mode = document.getElementById('mode').value;
    const playerFields = document.getElementsByClassName('player-control');
    const usedKeys = new Set();
    const usedNames = new Set();

    let allFieldsValid = true;

    for (let i = 0; i < playerFields.length; i++) {
        const playerName = document.getElementById(`player${i}`).value.trim();

        let upKey = '';
        let downKey = '';

        if (mode !== 'tournament' || i < 2) {
            upKey = document.getElementById(`player${i}Up`).getAttribute('data-key') || document.getElementById(`player${i}Up`).value.trim();
            downKey = document.getElementById(`player${i}Down`).getAttribute('data-key') || document.getElementById(`player${i}Down`).value.trim();
        }

        if (!playerName || (mode !== 'tournament' && (!upKey || !downKey))) {
            allFieldsValid = false;
            alert(`Player ${i + 1} must have a name and keys assigned!`);
            break;
        }

        if (usedNames.has(playerName)) {
            allFieldsValid = false;
            alert(`The name '${playerName}' is already used by another player. Please choose a different name.`);
            break;
        }

        if (mode !== 'tournament' || i < 2) {
            if (upKey === downKey) {
                allFieldsValid = false;
                alert(`Player ${i + 1} cannot have the same key for both Up and Down.`);
                break;
            }

            if (usedKeys.has(upKey)) {
                allFieldsValid = false;
                alert(`The key '${upKey}' is already assigned to another player.`);
                break;
            }
            if (usedKeys.has(downKey)) {
                allFieldsValid = false;
                alert(`The key '${downKey}' is already assigned to another player.`);
                break;
            }

            usedKeys.add(upKey);
            usedKeys.add(downKey);
        }

        usedNames.add(playerName);
    }

    if (allFieldsValid) {
        const playerNames = [];
        const playerKeys = [];
        for (let i = 0; i < playerFields.length; i++) {
            const playerName = document.getElementById(`player${i}`).value;

            let upKey = '';
            let downKey = '';

            if (mode !== 'tournament' || i < 2) {
                upKey = document.getElementById(`player${i}Up`).getAttribute('data-key') || document.getElementById(`player${i}Up`).value;
                downKey = document.getElementById(`player${i}Down`).getAttribute('data-key') || document.getElementById(`player${i}Down`).value;
            }

            playerNames.push(playerName);
            playerKeys.push([upKey, downKey]);
        }

        const maxScore = document.getElementById('maxScore').value;
        const paddleSpeed = document.getElementById('paddleSpeed').value;
        const paddleSize = document.getElementById('paddleSize').value;
        const bounceMode = document.getElementById('bounceMode').checked;
        const ballSpeed = document.getElementById('ballSpeed').value;
        const ballAcceleration = document.getElementById('ballAcceleration').value;
        const numBalls = document.getElementById('numBalls').value;
        const map = document.getElementById('map').value;

        localStorage.setItem('gameOptions', JSON.stringify({
            mode, playerNames, playerKeys, maxScore, paddleSpeed, paddleSize, bounceMode, ballSpeed, ballAcceleration, numBalls, map
        }));

        storeGameSession();
        window.location.href = 'game.html';
    }
});

function resetToDefault() {
    document.getElementById('maxScore').value = 10;
    document.getElementById('maxScoreValue').textContent = 10;

    document.getElementById('paddleSpeed').value = 5;
    document.getElementById('paddleSpeedValue').textContent = 5;

    document.getElementById('paddleSize').value = 100;
    document.getElementById('paddleSizeValue').textContent = 100;

    document.getElementById('bounceMode').checked = true;

    document.getElementById('ballSpeed').value = 5;
    document.getElementById('ballSpeedValue').textContent = 5;

    document.getElementById('ballAcceleration').value = 1;
    document.getElementById('ballAccelerationValue').textContent = 1;

    document.getElementById('numBalls').value = 1;
    document.getElementById('numBallsValue').textContent = 1;

    document.getElementById('map').value = 1;
    document.getElementById('mapValue').textContent = 1;
}

document.getElementById('defaultSetting').addEventListener('click', resetToDefault);

document.addEventListener('DOMContentLoaded', () => {
    const accessToken = localStorage.getItem('accessToken');
    const matchmakingSection = document.getElementById('matchmakingSection');

    if (!accessToken && matchmakingSection) {
        matchmakingSection.style.display = 'none';
    }
});
