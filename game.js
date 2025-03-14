const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 750;
canvas.height = 500;

let playerImg = new Image();
playerImg.src = 'scott.png';

let bugImg = new Image();
bugImg.src = 'cake.png';

let player, bugs, score, lives, keys, bugInterval, playerName;
let gameStarted = false;
let gameEnded = false;

function initGame() {
    player = { x: 275, y: 400, w: 80, h: 80, speed: 8 };
    bugs = [];
    score = 0;
    lives = 3;
    keys = {};
    gameEnded = false;
    gameStarted = false;
}

keys = {};

document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

function collision(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
           a.y < b.y + b.h && a.y + a.h > b.y;
}

function spawnBugs() {
    bugInterval = setInterval(() => {
        if (!gameEnded) {
            bugs.push({ 
                x: Math.random() * (canvas.width - 100) + 50,  
                y: -40, 
                w: 35, h: 35,  
                speed: 3.9  
            });
        }
    }, 780);
}

function updateGame() {
    if (!gameStarted || gameEnded) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (keys['ArrowLeft'] && player.x > 0) player.x -= player.speed;
    if (keys['ArrowRight'] && player.x < canvas.width - player.w) player.x += player.speed;

    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(playerImg, player.x, player.y, player.w, player.h);

    bugs.forEach((bug, i) => {
        bug.y += bug.speed;
        ctx.drawImage(bugImg, bug.x, bug.y, bug.w, bug.h);

        if (collision(player, bug) && !gameEnded) {
            bugs.splice(i, 1);
            score++;
        } else if (bug.y > canvas.height) {
            bugs.splice(i, 1);
            lives--;
            if (lives <= 0) {
                gameOver();
                return;
            }
        }
    });

    ctx.fillStyle = '#4a4a4a';
    ctx.font = '18px Poppins, sans-serif';
    ctx.fillText(`Debugger: ${playerName}`, 10, 30);
    ctx.fillText(`Bugs Fixed: ${score}`, 10, 60);
    ctx.fillText(`System Stability: ${lives}`, 550, 30);

    requestAnimationFrame(updateGame);
}

function gameOver() {
    if (gameEnded) return;
    gameEnded = true;
    gameStarted = false;
    clearInterval(bugInterval);

    document.getElementById("finalScore").textContent = score;
    document.getElementById("gameOverPopup").style.display = "flex";

    submitScore();
}

// ✅ FIX: Close button now properly hides the popup
function closeGameOverPopup() {
    let popup = document.getElementById("gameOverPopup");
    if (popup) {
        popup.style.display = "none";
    }
}

function submitScore() {
    fetch(`https://sheetdb.io/api/v1/kcoq67xd8l372/search?Name=${encodeURIComponent(playerName)}`)
        .then(res => res.json())
        .then(entries => {
            if (entries.length === 0) {
                fetch('https://sheetdb.io/api/v1/kcoq67xd8l372', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: { Name: playerName, Score: score } })
                }).then(() => loadLeaderboard());
            } else if (score > parseInt(entries[0].Score)) {
                fetch(`https://sheetdb.io/api/v1/kcoq67xd8l372/Name/${encodeURIComponent(playerName)}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: { Score: score } })
                }).then(() => loadLeaderboard());
            } else {
                loadLeaderboard();
            }
        });
}

function loadLeaderboard() {
    fetch('https://sheetdb.io/api/v1/kcoq67xd8l372?sort_by=Score&sort_order=desc&limit=10')
        .then(res => res.json())
        .then(data => {
            const scores = document.getElementById('scores');
            scores.innerHTML = '';
            data.forEach((entry, i) => {
                let li = document.createElement('li');
                li.textContent = `${i + 1}. ${entry.Name}: ${entry.Score} BUGS FIXED`;
                scores.appendChild(li);
            });
        });
}

window.onload = function() {
    document.getElementById("namePopup").style.display = "flex";
};

function setPlayerName() {
    playerName = document.getElementById("playerNameInput").value.trim() || "Anonymous";
    document.getElementById("namePopup").style.display = "none";
    document.getElementById("instructionPopup").style.display = "flex";
}

function startGame() {
    document.getElementById("instructionPopup").style.display = "none";
    initGame();
    gameStarted = true;
    spawnBugs();
    updateGame();
    loadLeaderboard();
}
