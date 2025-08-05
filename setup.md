# Multiplayer Tic Tac Toe Setup Guide

## Prerequisites
- Node.js (version 14 or higher)
- npm (comes with Node.js)

## Installation Steps

### 1. Install Dependencies
Open your terminal in the project directory and run:
```bash
npm install
```

### 2. Start the Server
Run the development server:
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

### 3. Access the Game
Open your web browser and go to:
```
http://localhost:3000
```

## How to Play Multiplayer

### Creating a Game
1. Click "Create New Game"
2. A 6-character room code will be generated
3. Share this code with your friend

### Joining a Game
1. Click "Join Game"
2. Enter the 6-character room code from your friend
3. Click "Join"

### Playing the Game
- Players take turns automatically
- The game shows whose turn it is
- Win detection and score tracking work in real-time
- Use "Restart Game" to play again
- Use "Reset Score" to reset the score counter

## Features

### Real-time Multiplayer
- ✅ Live game synchronization
- ✅ Turn-based gameplay
- ✅ Real-time win detection
- ✅ Score tracking across games
- ✅ Room-based matchmaking

### User Experience
- ✅ Room code sharing with copy button
- ✅ Connection status indicator
- ✅ Error handling for invalid rooms
- ✅ Disconnection handling
- ✅ Responsive design for mobile

### Game Features
- ✅ Classic Tic Tac Toe rules
- ✅ Win highlighting
- ✅ Draw detection
- ✅ Score persistence during session
- ✅ Game restart functionality

## Deployment Options

### Local Development
- Perfect for testing with friends on the same network
- Use your computer's IP address to let others connect

### Cloud Deployment
For public hosting, consider:
- **Heroku**: Easy deployment with free tier
- **Railway**: Simple deployment
- **Render**: Free hosting for Node.js apps
- **Vercel**: Great for static + serverless

### Environment Variables
The server uses these default settings:
- Port: 3000 (can be changed with PORT environment variable)
- CORS: Enabled for all origins (development)

## Troubleshooting

### Common Issues

**"Cannot find module" errors**
- Run `npm install` to install dependencies

**Port already in use**
- Change the port in server.js or use a different port
- Kill the process using the port: `lsof -ti:3000 | xargs kill -9`

**Connection issues**
- Check if the server is running
- Verify the correct URL is being accessed
- Check firewall settings

**Socket.io connection errors**
- Ensure the Socket.io client library is loading
- Check browser console for errors

## File Structure
```
├── index.html          # Main game interface
├── styles.css          # Game styling
├── script.js           # Client-side game logic
├── server.js           # Backend server
├── package.json        # Dependencies and scripts
└── setup.md           # This file
```

## Next Steps

Once you have the basic multiplayer working, you could add:
- User authentication
- Persistent game history
- Multiple concurrent games
- Chat functionality
- Spectator mode
- Tournament brackets

Happy gaming! 🎮 