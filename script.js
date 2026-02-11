/**
 * Tic-Tac-Toe Game Logic with Minimax AI
 */

class TicTacToe {
    constructor() {
        this.board = Array(9).fill('');
        this.currentPlayer = 'X';
        this.isGameActive = true;
        this.gameMode = 'pvp'; // 'pvp' or 'pvc'
        this.humanPlayer = 'X';
        this.aiPlayer = 'O';

        // Win conditions (indices)
        this.winningConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
            [0, 4, 8], [2, 4, 6]             // Diagonals
        ];

        // DOM Elements
        this.cells = document.querySelectorAll('.cell');
        this.statusDisplay = document.getElementById('status-display');
        this.resetBtn = document.getElementById('reset-btn');
        this.pvpBtn = document.getElementById('pvp-btn');
        this.pvcBtn = document.getElementById('pvc-btn');
        this.modal = document.getElementById('winner-modal');
        this.modalMessage = document.getElementById('winner-message');
        this.winnerTitle = document.getElementById('winner-title');
        this.newGameBtn = document.getElementById('new-game-btn');

        this.init();
    }

    init() {
        this.cells.forEach(cell => cell.addEventListener('click', (e) => this.handleCellClick(e)));
        this.resetBtn.addEventListener('click', () => this.resetGame());
        this.newGameBtn.addEventListener('click', () => {
            this.toggleModal(false);
            this.resetGame();
        });

        // Mode switching
        this.pvpBtn.addEventListener('click', () => this.setMode('pvp'));
        this.pvcBtn.addEventListener('click', () => this.setMode('pvc'));

        this.updateStatus();
    }

    setMode(mode) {
        if (this.gameMode === mode) return;

        this.gameMode = mode;
        this.pvpBtn.classList.toggle('active', mode === 'pvp');
        this.pvcBtn.classList.toggle('active', mode === 'pvc');

        this.resetGame();
    }

    handleCellClick(e) {
        const clickedCell = e.target;
        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

        if (this.board[clickedCellIndex] !== '' || !this.isGameActive) {
            return;
        }

        // Prevent human from playing during AI's turn
        if (this.gameMode === 'pvc' && this.currentPlayer === this.aiPlayer) {
            return;
        }

        // Human move
        this.makeMove(clickedCellIndex, this.currentPlayer);

        // check result after human move
        if (this.isGameActive && this.gameMode === 'pvc' && this.currentPlayer === this.aiPlayer) {
            // Small delay for realism
            setTimeout(() => this.makeAiMove(), 500);
        }
    }

    makeMove(index, player) {
        this.board[index] = player;

        // Security Hardening: Use createElement instead of innerHTML to prevent XSS
        this.cells[index].innerHTML = ''; // Start clean
        const markSpan = document.createElement('span');
        markSpan.classList.add('mark');
        markSpan.textContent = player; // Safely sets text content
        this.cells[index].appendChild(markSpan);

        this.cells[index].classList.add(player.toLowerCase());

        const result = this.checkResult();

        if (result) {
            this.handleGameEnd(result);
        } else {
            this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
            this.updateStatus();
        }
    }

    checkResult() {
        let roundWon = false;
        let winningLine = [];

        for (let i = 0; i < this.winningConditions.length; i++) {
            const [a, b, c] = this.winningConditions[i];
            if (this.board[a] === '' || this.board[b] === '' || this.board[c] === '') {
                continue;
            }
            if (this.board[a] === this.board[b] && this.board[b] === this.board[c]) {
                roundWon = true;
                winningLine = [a, b, c];
                break;
            }
        }

        if (roundWon) {
            return { winner: this.currentPlayer, line: winningLine };
        }

        if (!this.board.includes('')) {
            return { winner: 'Draw' };
        }

        return null;
    }

    handleGameEnd(result) {
        this.isGameActive = false;

        if (result.winner === 'Draw') {
            this.statusDisplay.innerText = "平局!";
            this.showModal("平局", "旗鼓相当!");
        } else {
            this.statusDisplay.innerText = `玩家 ${result.winner} 获胜!`;
            this.highlightWinningCells(result.line);
            this.showModal("胜利!", `玩家 ${result.winner} 赢得了比赛!`);
        }
    }

    highlightWinningCells(line) {
        line.forEach(index => {
            this.cells[index].style.background = 'rgba(255, 255, 255, 0.2)';
            this.cells[index].style.boxShadow = '0 0 15px rgba(255,255,255,0.5)';
        });
    }

    updateStatus() {
        if (!this.isGameActive) return;

        if (this.gameMode === 'pvc' && this.currentPlayer === this.aiPlayer) {
            this.statusDisplay.innerText = "电脑正在思考...";
        } else {
            const playerLabel = this.currentPlayer;
            this.statusDisplay.innerText = `玩家 ${playerLabel} 的回合`;
        }
    }

    resetGame() {
        this.board = Array(9).fill('');
        this.isGameActive = true;
        this.currentPlayer = 'X';

        this.cells.forEach(cell => {
            cell.innerText = '';
            cell.classList.remove('x', 'o');
            cell.removeAttribute('data-content');
            cell.style.background = '';
            cell.style.boxShadow = '';
        });

        this.updateStatus();
    }

    toggleModal(show) {
        if (show) {
            this.modal.classList.remove('hidden');
        } else {
            this.modal.classList.add('hidden');
        }
    }

    showModal(title, msg) {
        this.winnerTitle.innerText = title;
        this.modalMessage.innerText = msg;
        setTimeout(() => this.toggleModal(true), 500); // Slight delay to see the board
    }

    // --- AI Logic (Minimax) ---

    makeAiMove() {
        if (!this.isGameActive) return;

        // Use Minimax to find the best move
        const bestMoveIndex = this.minimax(this.board, this.aiPlayer).index;
        this.makeMove(bestMoveIndex, this.aiPlayer);
    }

    // Minimax Algorithm
    minimax(newBoard, player) {
        // Available spots
        const availSpots = newBoard.map((val, idx) => val === '' ? idx : null).filter(val => val !== null);

        // Terminal states check
        if (this.checkWinState(newBoard, this.humanPlayer)) {
            return { score: -10 };
        } else if (this.checkWinState(newBoard, this.aiPlayer)) {
            return { score: 10 };
        } else if (availSpots.length === 0) {
            return { score: 0 };
        }

        // Collect all moves and their scores
        const moves = [];

        for (let i = 0; i < availSpots.length; i++) {
            const move = {};
            move.index = availSpots[i];

            // Try the move
            newBoard[availSpots[i]] = player;

            if (player === this.aiPlayer) {
                // Maximizing player (AI)
                const result = this.minimax(newBoard, this.humanPlayer);
                move.score = result.score;
            } else {
                // Minimizing player (Human)
                const result = this.minimax(newBoard, this.aiPlayer);
                move.score = result.score;
            }

            // Undo the move
            newBoard[availSpots[i]] = '';

            moves.push(move);
        }

        // Choose the best move
        let bestMove;
        if (player === this.aiPlayer) {
            let bestScore = -10000;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score > bestScore) {
                    bestScore = moves[i].score;
                    bestMove = i;
                }
            }
        } else {
            let bestScore = 10000;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score < bestScore) {
                    bestScore = moves[i].score;
                    bestMove = i;
                }
            }
        }

        return moves[bestMove];
    }

    // Helper for Minimax to check win state without modifying class state
    checkWinState(board, player) {
        for (let i = 0; i < this.winningConditions.length; i++) {
            const [a, b, c] = this.winningConditions[i];
            if (board[a] === player && board[b] === player && board[c] === player) {
                return true;
            }
        }
        return false;
    }
}

// Start the game
document.addEventListener('DOMContentLoaded', () => {
    new TicTacToe();
});
