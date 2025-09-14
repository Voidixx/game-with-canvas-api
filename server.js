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

// Set cache control headers to prevent caching issues
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// Serve static files from the current directory with proper cache headers
app.use(express.static('.', {
    setHeaders: (res) => {
        res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
    }
}));

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
      score: 0,
      alive: true,
      lastShot: 0,
      shootCooldown: 200,
      invulnerableUntil: 0
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
    if (player && player.alive) {
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
    const now = Date.now();
    if (player && player.alive && now - player.lastShot >= player.shootCooldown) {
      player.lastShot = now;
      
      // Server-authoritative shooting: use server player position and normalize direction
      let dirX = shootData.dirX || 0;
      let dirY = shootData.dirY || 0;
      const dirLength = Math.sqrt(dirX * dirX + dirY * dirY);
      
      // Reject invalid directions
      if (dirLength === 0 || isNaN(dirLength)) return;
      
      // Normalize direction to prevent speed hacks
      dirX = dirX / dirLength;
      dirY = dirY / dirLength;
      
      const projectile = {
        id: uuidv4(),
        playerId: socket.id,
        x: player.x, // Use server-side player position
        y: player.y, // Use server-side player position
        dirX: dirX,   // Normalized direction
        dirY: dirY,   // Normalized direction
        speed: 8,
        createdAt: now
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

// Collision detection function
function checkProjectilePlayerCollision(projectile, player) {
  const dx = projectile.x - player.x;
  const dy = projectile.y - player.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  return distance < player.radius; // Hit if projectile is within player radius
}

// Game update loop with collision detection
setInterval(() => {
  const projectilesToRemove = [];
  
  // Update projectiles and check collisions
  gameState.projectiles.forEach((projectile, projectileIndex) => {
    // Update projectile position
    projectile.x += projectile.dirX * projectile.speed;
    projectile.y += projectile.dirY * projectile.speed;
    
    // Check collision with all alive, non-invulnerable players (except the shooter)
    for (let [playerId, player] of gameState.players) {
      const currentTime = Date.now();
      if (playerId !== projectile.playerId && player.alive && 
          currentTime > player.invulnerableUntil && 
          checkProjectilePlayerCollision(projectile, player)) {
        // Hit detected! Apply damage
        const damage = 25; // Base damage per hit
        player.health -= damage;
        
        // Check if player is eliminated
        if (player.health <= 0) {
          player.health = 0;
          player.alive = false; // Mark as dead
          
          // Award points to shooter
          const shooter = gameState.players.get(projectile.playerId);
          if (shooter) {
            shooter.score += 100; // Points for elimination
          }
          
          // Send final hit with 0 health
          io.emit('playerHit', {
            playerId: playerId,
            damage: damage,
            health: 0,
            shooterId: projectile.playerId
          });
          
          // Broadcast player elimination
          io.emit('playerEliminated', {
            eliminatedId: playerId,
            eliminatedName: player.name,
            shooterId: projectile.playerId,
            shooterName: shooter ? shooter.name : 'Unknown',
            health: 0
          });
          
          // Reset eliminated player (respawn after brief delay)
          setTimeout(() => {
            player.health = 100;
            player.alive = true;
            player.x = Math.random() * 1500 + 250;
            player.y = Math.random() * 1500 + 250;
            player.invulnerableUntil = Date.now() + 2000; // 2 seconds spawn protection
            
            // Broadcast respawn
            io.emit('playerRespawned', {
              id: playerId,
              player: player
            });
          }, 1500); // 1.5 second respawn delay
        } else {
          // Broadcast hit event for damage
          io.emit('playerHit', {
            playerId: playerId,
            damage: damage,
            health: player.health,
            shooterId: projectile.playerId
          });
        }
        
        // Mark projectile for removal
        projectilesToRemove.push(projectileIndex);
        break; // Projectile can only hit one player
      }
    }
    
    // Remove projectiles that are out of bounds
    if (projectile.x <= 0 || projectile.x >= 2000 || projectile.y <= 0 || projectile.y >= 2000) {
      projectilesToRemove.push(projectileIndex);
    }
  });
  
  // Remove hit projectiles and out-of-bounds projectiles using Set to avoid duplicates
  const projectilesToRemoveSet = new Set(projectilesToRemove);
  gameState.projectiles = gameState.projectiles.filter((_, index) => !projectilesToRemoveSet.has(index));
  
  // Always broadcast updated projectiles (including empty array to clear client-side projectiles)
  io.emit('projectilesUpdate', gameState.projectiles);
}, 1000 / 30); // 30 FPS server update

const port = process.env.PORT || 5000;
server.listen(port, '0.0.0.0', () => {
    console.log(`Gunbattle.io server running at http://0.0.0.0:${port}`);
});