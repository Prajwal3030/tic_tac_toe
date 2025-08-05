class MultiplayerTicTacToe {
    constructor() {
        this.socket = io();
        this.roomCode = null;
        this.playerSymbol = null;
        this.isMyTurn = false;
        this.gameActive = false;
        this.scores = { X: 0, O: 0 };
        
        this.winningConditions = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ];
        
        this.initializeGame();
        this.setupSocketListeners();
    }
    
    initializeGame() {
        // DOM elements
        this.cells = document.querySelectorAll('[data-cell]');
        this.statusElement = document.getElementById('status');
        this.restartBtn = document.getElementById('restart-btn');
        this.resetScoreBtn = document.getElementById('reset-score-btn');
        this.leaveRoomBtn = document.getElementById('leave-room-btn');
        this.gameOverElement = document.getElementById('game-over');
        this.winnerTextElement = document.getElementById('winner-text');
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.scoreXElement = document.getElementById('score-x');
        this.scoreOElement = document.getElementById('score-o');
        
        // Multiplayer elements
        this.multiplayerSetup = document.getElementById('multiplayer-setup');
        this.createRoomBtn = document.getElementById('create-room-btn');
        this.joinRoomBtn = document.getElementById('join-room-btn');
        this.joinForm = document.getElementById('join-form');
        this.roomCodeInput = document.getElementById('room-code-input');
        this.joinSubmitBtn = document.getElementById('join-submit-btn');
        this.cancelJoinBtn = document.getElementById('cancel-join-btn');
        this.roomInfo = document.getElementById('room-info');
        this.roomCodeDisplay = document.getElementById('room-code-display');
        this.copyRoomBtn = document.getElementById('copy-room-btn');
        this.connectionStatus = document.getElementById('connection-status');
        this.statusDot = document.querySelector('.status-dot');
        this.statusText = document.getElementById('status-text');
        
        // Error modal
        this.errorModal = document.getElementById('error-modal');
        this.errorMessage = document.getElementById('error-message');
        this.errorOkBtn = document.getElementById('error-ok-btn');
        
        this.addEventListeners();
        this.updateStatus('Create or join a game to start playing!');
        this.updateScore();
    }
    
    setupSocketListeners() {
        // Connection events
        this.socket.on('connect', () => {
            this.updateConnectionStatus('Connected', 'connected');
        });
        
        this.socket.on('disconnect', () => {
            this.updateConnectionStatus('Disconnected', 'disconnected');
        });
        
        // Room events
        this.socket.on('roomCreated', ({ roomCode, symbol }) => {
            this.roomCode = roomCode;
            this.playerSymbol = symbol;
            this.showRoomInfo();
            this.updateStatus(`Room created! Share code: ${roomCode}`);
        });
        
        this.socket.on('gameStart', ({ players, currentPlayer, currentPlayerSymbol }) => {
            this.gameActive = true;
            this.isMyTurn = this.playerSymbol === currentPlayerSymbol;
            this.updateStatus(this.isMyTurn ? 'Your turn!' : 'Waiting for opponent...');
            this.enableGameControls();
        });
        
        this.socket.on('moveMade', ({ index, symbol, board, currentPlayer, currentPlayerSymbol }) => {
            console.log('[moveMade] index:', index, 'symbol:', symbol, 'board:', board, 'currentPlayer:', currentPlayer, 'currentPlayerSymbol:', currentPlayerSymbol, 'playerSymbol:', this.playerSymbol);
            this.updateBoard(board);
            this.isMyTurn = this.playerSymbol === currentPlayerSymbol;
            console.log('[moveMade] isMyTurn:', this.isMyTurn);
            this.updateStatus(this.isMyTurn ? 'Your turn!' : 'Waiting for opponent...');
        });
        
        this.socket.on('gameOver', ({ winner, board, scores, winningCells }) => {
            this.gameActive = false;
            this.updateBoard(board);
            this.scores = scores;
            this.updateScore();
            
            if (winningCells) {
                winningCells.forEach(index => {
                    this.cells[index].classList.add('winning');
                });
            }
            
            const message = winner ? `${winner} Wins!` : "It's a Draw!";
            this.showGameOver(message);
        });
        
        this.socket.on('gameRestarted', ({ board, currentPlayer }) => {
            this.updateBoard(board);
            this.gameActive = true;
            this.isMyTurn = currentPlayer === 0;
            this.updateStatus(this.isMyTurn ? 'Your turn!' : 'Waiting for opponent...');
            this.hideGameOver();
        });
        
        this.socket.on('scoresReset', ({ scores }) => {
            this.scores = scores;
            this.updateScore();
        });
        
        this.socket.on('playerDisconnected', () => {
            this.updateStatus('Opponent disconnected');
            this.gameActive = false;
        });
        
        this.socket.on('error', (message) => {
            this.showError(message);
        });
    }
    
    addEventListeners() {
        // Game board events
        this.cells.forEach((cell, index) => {
            cell.addEventListener('click', () => this.handleCellClick(index));
        });
        
        // Game control events
        this.restartBtn.addEventListener('click', () => this.restartGame());
        this.resetScoreBtn.addEventListener('click', () => this.resetScore());
        this.playAgainBtn.addEventListener('click', () => this.hideGameOver());
        this.leaveRoomBtn.addEventListener('click', () => this.leaveRoom());
        
        // Multiplayer events
        this.createRoomBtn.addEventListener('click', () => this.createRoom());
        this.joinRoomBtn.addEventListener('click', () => this.showJoinForm());
        this.joinSubmitBtn.addEventListener('click', () => this.joinRoom());
        this.cancelJoinBtn.addEventListener('click', () => this.hideJoinForm());
        this.copyRoomBtn.addEventListener('click', () => this.copyRoomCode());
        
        // Error modal
        this.errorOkBtn.addEventListener('click', () => this.hideError());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.joinForm.style.display !== 'none') {
                this.joinRoom();
            }
            if (e.key === 'Escape') {
                this.hideJoinForm();
                this.hideError();
                if (this.gameOverElement.classList.contains('show')) {
                    this.hideGameOver();
                }
            }
        });
    }
    
    createRoom() {
        this.socket.emit('createRoom');
        this.updateStatus('Creating room...');
    }
    
    showJoinForm() {
        this.joinForm.style.display = 'flex';
        this.roomCodeInput.focus();
    }
    
    hideJoinForm() {
        this.joinForm.style.display = 'none';
        this.roomCodeInput.value = '';
    }
    
    joinRoom() {
        const roomCode = this.roomCodeInput.value.trim().toUpperCase();
        if (roomCode.length === 6) {
            this.socket.emit('joinRoom', roomCode);
            this.updateStatus('Joining room...');
            this.hideJoinForm();
        } else {
            this.showError('Please enter a valid 6-character room code');
        }
    }
    
    showRoomInfo() {
        this.multiplayerSetup.style.display = 'none';
        this.roomInfo.style.display = 'block';
        this.roomCodeDisplay.textContent = this.roomCode;
        this.leaveRoomBtn.style.display = 'inline-block';
    }
    
    hideRoomInfo() {
        this.multiplayerSetup.style.display = 'block';
        this.roomInfo.style.display = 'none';
        this.leaveRoomBtn.style.display = 'none';
    }
    
    copyRoomCode() {
        navigator.clipboard.writeText(this.roomCode).then(() => {
            const originalText = this.copyRoomBtn.textContent;
            this.copyRoomBtn.textContent = 'Copied!';
            setTimeout(() => {
                this.copyRoomBtn.textContent = originalText;
            }, 2000);
        });
    }
    
    leaveRoom() {
        this.socket.emit('leaveRoom', this.roomCode);
        this.resetGame();
        this.hideRoomInfo();
        this.updateStatus('Create or join a game to start playing!');
    }
    
    updateConnectionStatus(text, className) {
        this.statusText.textContent = text;
        this.statusDot.className = `status-dot ${className}`;
    }
    
    handleCellClick(index) {
        if (!this.gameActive || !this.isMyTurn || this.cells[index].textContent !== '') {
            return;
        }
        
        // Add loading animation
        this.cells[index].classList.add('loading');
        
        // Send move to server
        this.socket.emit('makeMove', { roomCode: this.roomCode, index });
        
        setTimeout(() => {
            this.cells[index].classList.remove('loading');
        }, 150);
    }
    
    updateBoard(board) {
        this.cells.forEach((cell, index) => {
            cell.textContent = board[index];
            cell.classList.remove('x', 'o', 'winning');
            if (board[index]) {
                cell.classList.add(board[index].toLowerCase());
            }
        });
    }
    
    updateStatus(message) {
        this.statusElement.textContent = message;
    }
    
    updateScore() {
        this.scoreXElement.textContent = this.scores.X;
        this.scoreOElement.textContent = this.scores.O;
    }
    
    enableGameControls() {
        this.restartBtn.disabled = false;
        this.resetScoreBtn.disabled = false;
    }
    
    disableGameControls() {
        this.restartBtn.disabled = true;
        this.resetScoreBtn.disabled = true;
    }
    
    restartGame() {
        this.socket.emit('restartGame', this.roomCode);
    }
    
    resetScore() {
        this.socket.emit('resetScores', this.roomCode);
    }
    
    showGameOver(message) {
        this.winnerTextElement.textContent = message;
        this.gameOverElement.classList.add('show');
    }
    
    hideGameOver() {
        this.gameOverElement.classList.remove('show');
    }
    
    showError(message) {
        this.errorMessage.textContent = message;
        this.errorModal.classList.add('show');
    }
    
    hideError() {
        this.errorModal.classList.remove('show');
    }
    
    resetGame() {
        this.roomCode = null;
        this.playerSymbol = null;
        this.isMyTurn = false;
        this.gameActive = false;
        this.scores = { X: 0, O: 0 };
        
        this.updateBoard(['', '', '', '', '', '', '', '', '']);
        this.disableGameControls();
        this.updateScore();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MultiplayerTicTacToe();
}); 