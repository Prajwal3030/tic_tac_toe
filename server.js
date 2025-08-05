const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname, './')));

// Game state management
const games = new Map();

// Generate a random room code
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Create a new game
function createGame(roomCode) {
    return {
        id: roomCode,
        board: ['', '', '', '', '', '', '', '', ''],
        players: [],
        currentPlayer: 0,
        gameActive: true,
        scores: { X: 0, O: 0 },
        winningConditions: [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
            [0, 4, 8], [2, 4, 6] // Diagonals
        ]
    };
}

// Check if a player has won
function checkWin(board, winningConditions) {
    return winningConditions.some(condition => {
        const [a, b, c] = condition;
        return board[a] && board[a] === board[b] && board[a] === board[c];
    });
}

// Check if the game is a draw
function checkDraw(board) {
    return board.every(cell => cell !== '');
}

// Socket.io event handlers
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Create a new game room
    socket.on('createRoom', () => {
        const roomCode = generateRoomCode();
        const game = createGame(roomCode);
        games.set(roomCode, game);
        
        socket.join(roomCode);
        game.players.push({ id: socket.id, symbol: 'X' });
        
        socket.emit('roomCreated', { roomCode, symbol: 'X' });
        console.log(`Room created: ${roomCode}`);
    });

    // Join an existing game room
    socket.on('joinRoom', (roomCode) => {
        const game = games.get(roomCode);
        
        if (!game) {
            socket.emit('error', 'Room not found');
            return;
        }
        
        if (game.players.length >= 2) {
            socket.emit('error', 'Room is full');
            return;
        }
        
        socket.join(roomCode);
        game.players.push({ id: socket.id, symbol: 'O' });
        
        // Notify both players that the game can start
        io.to(roomCode).emit('gameStart', {
            players: game.players.map(p => ({ symbol: p.symbol })),
            currentPlayer: game.currentPlayer
        });
        
        console.log(`Player joined room: ${roomCode}`);
    });

    // Handle player moves
    socket.on('makeMove', ({ roomCode, index }) => {
        const game = games.get(roomCode);
        
        if (!game || !game.gameActive) return;
        
        // Check if it's the player's turn
        const playerIndex = game.players.findIndex(p => p.id === socket.id);
        if (playerIndex !== game.currentPlayer) return;
        
        // Check if the cell is empty
        if (game.board[index] !== '') return;
        
        // Make the move
        const symbol = game.players[playerIndex].symbol;
        game.board[index] = symbol;
        
        // Check for win
        if (checkWin(game.board, game.winningConditions)) {
            game.gameActive = false;
            game.scores[symbol]++;
            
            io.to(roomCode).emit('gameOver', {
                winner: symbol,
                board: game.board,
                scores: game.scores,
                winningCells: game.winningConditions.find(condition => {
                    const [a, b, c] = condition;
                    return game.board[a] && game.board[a] === game.board[b] && game.board[a] === game.board[c];
                })
            });
        }
        // Check for draw
        else if (checkDraw(game.board)) {
            game.gameActive = false;
            
            io.to(roomCode).emit('gameOver', {
                winner: null,
                board: game.board,
                scores: game.scores
            });
        }
        // Continue game
        else {
            game.currentPlayer = (game.currentPlayer + 1) % 2;
            
            io.to(roomCode).emit('moveMade', {
                index,
                symbol,
                board: game.board,
                currentPlayer: game.currentPlayer
            });
        }
    });

    // Restart game
    socket.on('restartGame', (roomCode) => {
        const game = games.get(roomCode);
        if (!game) return;
        
        game.board = ['', '', '', '', '', '', '', '', ''];
        game.currentPlayer = 0;
        game.gameActive = true;
        
        io.to(roomCode).emit('gameRestarted', {
            board: game.board,
            currentPlayer: game.currentPlayer
        });
    });

    // Reset scores
    socket.on('resetScores', (roomCode) => {
        const game = games.get(roomCode);
        if (!game) return;
        
        game.scores = { X: 0, O: 0 };
        
        io.to(roomCode).emit('scoresReset', { scores: game.scores });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        
        // Find and clean up games where this player was participating
        for (const [roomCode, game] of games.entries()) {
            const playerIndex = game.players.findIndex(p => p.id === socket.id);
            if (playerIndex !== -1) {
                game.players.splice(playerIndex, 1);
                
                if (game.players.length === 0) {
                    games.delete(roomCode);
                    console.log(`Room ${roomCode} deleted (no players left)`);
                } else {
                    io.to(roomCode).emit('playerDisconnected');
                }
                break;
            }
        }
    });
});

// API routes
app.get('/api/rooms', (req, res) => {
    const activeRooms = Array.from(games.keys()).map(roomCode => ({
        roomCode,
        players: games.get(roomCode).players.length
    }));
    res.json(activeRooms);
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} to play the game`);
}); 