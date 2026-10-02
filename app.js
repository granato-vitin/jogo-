```javascript
const canvas = document.getElementById("tetris");
const ctx = canvas.getContext("2d");

const scoreElement = document.getElementById("score");
const linesElement = document.getElementById("lines");
const levelElement = document.getElementById("level");

const gameOverScreen = document.getElementById("game-over");
const finalScore = document.getElementById("final-score");

const restartButton = document.getElementById("restart");
const restartGameButton = document.getElementById("restart-game");

// ===============================
// CONFIGURAÇÕES
// ===============================

const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

canvas.width = COLS * BLOCK_SIZE;
canvas.height = ROWS * BLOCK_SIZE;

// ===============================
// CORES DAS PEÇAS
// ===============================

const COLORS = [
    null,
    "#00ffff", // I
    "#ffff00", // O
    "#aa00ff", // T
    "#00ff55", // S
    "#ff3333", // Z
    "#3366ff", // J
    "#ff9900"  // L
];

// ===============================
// PEÇAS DO TETRIS
// ===============================

const PIECES = {

    I: [
        [1, 1, 1, 1]
    ],

    O: [
        [2, 2],
        [2, 2]
    ],

    T: [
        [0, 3, 0],
        [3, 3, 3]
    ],

    S: [
        [0, 4, 4],
        [4, 4, 0]
    ],

    Z: [
        [5, 5, 0],
        [0, 5, 5]
    ],

    J: [
        [6, 0, 0],
        [6, 6, 6]
    ],

    L: [
        [0, 0, 7],
        [7, 7, 7]
    ]
};

// ===============================
// ESTADO DO JOGO
// ===============================

let board;
let player;

let score = 0;
let lines = 0;
let level = 1;

let dropCounter = 0;
let dropInterval = 800;

let lastTime = 0;

let gameOver = false;
let paused = false;

// ===============================
// CRIA TABULEIRO
// ===============================

function createBoard() {

    return Array.from(
        { length: ROWS },
        () => Array(COLS).fill(0)
    );

}

// ===============================
// DESENHA QUADRADO
// ===============================

function drawBlock(x, y, color) {

    ctx.fillStyle = COLORS[color];

    ctx.fillRect(
        x * BLOCK_SIZE,
        y * BLOCK_SIZE,
        BLOCK_SIZE,
        BLOCK_SIZE
    );

    // Borda

    ctx.strokeStyle = "#111";

    ctx.lineWidth = 2;

    ctx.strokeRect(
        x * BLOCK_SIZE,
        y * BLOCK_SIZE,
        BLOCK_SIZE,
        BLOCK_SIZE
    );

    // Brilho

    ctx.fillStyle = "rgba(255,255,255,0.18)";

    ctx.fillRect(
        x * BLOCK_SIZE + 3,
        y * BLOCK_SIZE + 3,
        BLOCK_SIZE - 6,
        5
    );

}

// ===============================
// DESENHA TABULEIRO
// ===============================

function drawBoard() {

    ctx.fillStyle = "#050505";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    for (let y = 0; y < ROWS; y++) {

        for (let x = 0; x < COLS; x++) {

            if (board[y][x]) {

                drawBlock(
                    x,
                    y,
                    board[y][x]
                );

            }

        }

    }

}

// ===============================
// DESENHA PEÇA
// ===============================

function drawPlayer() {

    player.matrix.forEach((row, y) => {

        row.forEach((value, x) => {

            if (value) {

                drawBlock(
                    player.x + x,
                    player.y + y,
                    value
                );

            }

        });

    });

}

// ===============================
// DESENHA TUDO
// ===============================

function draw() {

    drawBoard();

    drawPlayer();

}

// ===============================
// COLISÃO
// ===============================

function collide(board, player) {

    const matrix = player.matrix;

    const pos = player;

    for (let y = 0; y < matrix.length; y++) {

        for (let x = 0; x < matrix[y].length; x++) {

            if (
                matrix[y][x] !== 0 &&
                (
                    board[y + pos.y] === undefined ||
                    board[y + pos.y][x + pos.x] === undefined ||
                    board[y + pos.y][x + pos.x] !== 0
                )
            ) {

                return true;

            }

        }

    }

    return false;

}

// ===============================
// MESCLA PEÇA COM TABULEIRO
// ===============================

function merge() {

    player.matrix.forEach((row, y) => {

        row.forEach((value, x) => {

            if (value) {

                board[y + player.y][x + player.x] = value;

            }

        });

    });

}

// ===============================
// LIMPA LINHAS
// ===============================

function clearLines() {

    let cleared = 0;

    outer:

    for (let y = ROWS - 1; y >= 0; y--) {

        for (let x = 0; x < COLS; x++) {

            if (board[y][x] === 0) {

                continue outer;

            }

        }

        board.splice(y, 1);

        board.unshift(
            Array(COLS).fill(0)
        );

        y++;

        cleared++;

    }

    if (cleared > 0) {

        const points = [
            0,
            100,
            300,
            500,
            800
        ];

        score += points[cleared] * level;

        lines += cleared;

        level = Math.floor(lines / 10) + 1;

        dropInterval =
            Math.max(
                100,
                800 - (level - 1) * 60
            );

        updateScore();

    }

}

// ===============================
// ATUALIZA PLACAR
// ===============================

function updateScore() {

    scoreElement.textContent = score;

    linesElement.textContent = lines;

    levelElement.textContent = level;

}

// ===============================
// NOVA PEÇA
// ===============================

function playerReset() {

    const pieces = Object.keys(PIECES);

    const type =
        pieces[
            Math.floor(
                Math.random() * pieces.length
            )
        ];

    player.matrix =
        PIECES[type].map(row => [...row]);

    player.y = 0;

    player.x =
        Math.floor(
            COLS / 2 -
            player.matrix[0].length / 2
        );

    if (collide(board, player)) {

        gameOver = true;

        finalScore.textContent = score;

        gameOverScreen.classList.remove("hidden");

    }

}

// ===============================
// MOVIMENTAÇÃO
// ===============================

function playerMove(direction) {

    if (gameOver || paused) return;

    player.x += direction;

    if (collide(board, player)) {

        player.x -= direction;

    }

}

// ===============================
// QUEDA
// ===============================

function playerDrop() {

    if (gameOver || paused) return;

    player.y++;

    if (collide(board, player)) {

        player.y--;

        merge();

        clearLines();

        playerReset();

    }

    dropCounter = 0;

}

// ===============================
// QUEDA RÁPIDA
// ===============================

function hardDrop() {

    if (gameOver || paused) return;

    while (!collide(board, player)) {

        player.y++;

    }

    player.y--;

    merge();

    clearLines();

    playerReset();

    dropCounter = 0;

}

// ===============================
// ROTAÇÃO
// ===============================

function rotate(matrix, direction) {

    for (
        let y = 0;
        y < matrix.length;
        y++
    ) {

        for (
            let x = 0;
            x < y;
            x++
        ) {

            [
                matrix[x][y],
                matrix[y][x]
            ] =
            [
                matrix[y][x],
                matrix[x][y]
            ];

        }

    }

    if (direction > 0) {

        matrix.forEach(row => row.reverse());

    } else {

        matrix.reverse();

    }

}

// ===============================
// ROTACIONAR JOGADOR
// ===============================

function playerRotate(direction) {

    if (gameOver || paused) return;

    const oldX = player.x;

    const oldMatrix =
        player.matrix.map(row => [...row]);

    rotate(player.matrix, direction);

    let offset = 1;

    while (collide(board, player)) {

        player.x += offset;

        offset =
            -(offset + (offset > 0 ? 1 : -1));

        if (Math.abs(offset) > player.matrix[0].length) {

            player.matrix = oldMatrix;

            player.x = oldX;

            return;

        }

    }

}

// ===============================
// PAUSAR
// ===============================

function togglePause() {

    if (gameOver) return;

    paused = !paused;

}

// ===============================
// CONTROLES
// ===============================

document.addEventListener("keydown", event => {

    switch (event.key) {

        case "ArrowLeft":

            playerMove(-1);

            break;

        case "ArrowRight":

            playerMove(1);

            break;

        case "ArrowDown":

            playerDrop();

            break;

        case "ArrowUp":

            playerRotate(1);

            break;

        case " ":

            event.preventDefault();

            hardDrop();

            break;

        case "p":

        case "P":

            togglePause();

            break;

    }

});

// ===============================
// LOOP DO JOGO
// ===============================

function update(time = 0) {

    const deltaTime =
        time - lastTime;

    lastTime = time;

    if (!paused && !gameOver) {

        dropCounter += deltaTime;

        if (dropCounter > dropInterval) {

            playerDrop();

        }

    }

    draw();

    requestAnimationFrame(update);

}

// ===============================
// REINICIAR
// ===============================

function restartGame() {

    board = createBoard();

    score = 0;

    lines = 0;

    level = 1;

    dropInterval = 800;

    dropCounter = 0;

    gameOver = false;

    paused = false;

    gameOverScreen.classList.add("hidden");

    updateScore();

    playerReset();

}

// ===============================
// BOTÕES
// ===============================

restartButton.addEventListener(
    "click",
    restartGame
);

restartGameButton.addEventListener(
    "click",
    restartGame
);

// ===============================
// INICIAR JOGO
// ===============================

player = {
    x: 0,
    y: 0,
    matrix: null
};

restartGame();

update();
```
