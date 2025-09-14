const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files from the current directory
app.use(express.static('.'));

// Set cache control headers to prevent caching issues
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// Serve index.html for root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Game state
const gameState = {
  players: new Map(),
  projectiles: []
};

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.on('playerJoin', (playerData) => {
    const player = {
      id: socket.id,
      name: playerData.name || 'Player',
      x: Math.random() * 1500 + 250, // Random spawn position
      y: Math.random() * 1500 + 250,
      radius: 50,
      speed: 0,
      health: 100,
      score: 0
    };
    
    gameState.players.set(socket.id, player);
    
    // Send initial game state to new player
    socket.emit('gameInit', {
      playerId: socket.id,
      players: Array.from(gameState.players.values()),
      projectiles: gameState.projectiles
    });
    
    // Broadcast new player to others
    socket.broadcast.emit('playerJoined', player);
  });

  socket.on('playerMove', (moveData) => {
    const player = gameState.players.get(socket.id);
    if (player) {
      // Server-side movement validation
      const newX = Math.max(50, Math.min(1950, moveData.x));
      const newY = Math.max(50, Math.min(1950, moveData.y));
      
      player.x = newX;
      player.y = newY;
      player.speed = moveData.speed || 0;
      
      // Broadcast movement to other players
      socket.broadcast.emit('playerMoved', {
        id: socket.id,
        x: player.x,
        y: player.y,
        speed: player.speed
      });
    }
  });

  socket.on('playerShoot', (shootData) => {
    const player = gameState.players.get(socket.id);
    if (player) {
      const projectile = {
        id: uuidv4(),
        playerId: socket.id,
        x: shootData.x,
        y: shootData.y,
        dirX: shootData.dirX,
        dirY: shootData.dirY,
        speed: 8
      };
      
      gameState.projectiles.push(projectile);
      
      // Broadcast projectile to all players
      io.emit('projectileCreated', projectile);
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    gameState.players.delete(socket.id);
    
    // Remove projectiles from disconnected player
    gameState.projectiles = gameState.projectiles.filter(p => p.playerId !== socket.id);
    
    // Broadcast player disconnection
    socket.broadcast.emit('playerDisconnected', socket.id);
  });
});

// Simple game update loop for projectiles
setInterval(() => {
  // Update projectiles
  gameState.projectiles = gameState.projectiles.filter(projectile => {
    projectile.x += projectile.dirX * projectile.speed;
    projectile.y += projectile.dirY * projectile.speed;
    
    // Remove projectiles that are out of bounds
    return projectile.x > 0 && projectile.x < 2000 && 
           projectile.y > 0 && projectile.y < 2000;
  });
  
  // Broadcast updated projectiles
  if (gameState.projectiles.length > 0) {
    io.emit('projectilesUpdate', gameState.projectiles);
  }
}, 1000 / 30); // 30 FPS server update

const port = process.env.PORT || 5000;
server.listen(port, '0.0.0.0', () => {
    console.log(`Gunbattle.io server running at http://0.0.0.0:${port}`);
});