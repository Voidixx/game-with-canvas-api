const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const cookieParser = require('cookie-parser');
const { AuthService, authMiddleware, optionalAuthMiddleware } = require('./server/auth');
const { db } = require('./server/database');
const { users } = require('./shared/schema');
const GameStatsService = require('./server/game-stats');

const app = express();
const gameStats = new GameStatsService();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Socket.IO authentication middleware (supports both authenticated and guest users)
io.use(async (socket, next) => {
  try {
    const cookies = socket.request.headers.cookie;
    let token = null;
    
    if (cookies) {
      const cookieArr = cookies.split(';');
      const authCookie = cookieArr.find(cookie => cookie.trim().startsWith('auth_token='));
      if (authCookie) {
        token = authCookie.split('=')[1];
      }
    }
    
    // Also check authorization header
    if (!token && socket.request.headers.authorization) {
      token = socket.request.headers.authorization.replace('Bearer ', '');
    }
    
    // If we have a token, verify authenticated user
    if (token) {
      try {
        const decoded = authService.verifyToken(token);
        if (decoded) {
          const user = await authService.getUserById(decoded.userId);
          if (user) {
            socket.user = user;
            socket.isAuthenticated = true;
            return next();
          }
        }
      } catch (error) {
        console.log('Token verification failed, allowing as guest');
      }
    }
    
    // Allow guest connections - they'll provide username via playerJoin event
    socket.isAuthenticated = false;
    socket.user = null;
    next();
  } catch (error) {
    // Allow connection even if authentication fails - guest mode
    socket.isAuthenticated = false;
    socket.user = null;
    next();
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

// Authentication routes
const authService = new AuthService();

// Register endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const { user, token } = await authService.register(username, email, password);
    
    // Set HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({ user, token });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const { user, token } = await authService.login(username, password);
    
    // Set HTTP-only cookie
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.json({ user, token });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ message: 'Logged out successfully' });
});

// Get current user endpoint
app.get('/api/user', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// Get user stats endpoint
app.get('/api/stats', authMiddleware, async (req, res) => {
  try {
    const stats = await gameStats.getUserStats(req.user.id);
    if (stats) {
      res.json(stats);
    } else {
      res.status(404).json({ error: 'Stats not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Shop API endpoints
const { items, user_items, weapons } = require('./shared/schema');
const { sql, eq, and } = require('drizzle-orm');

// Get player balance
app.get('/api/player/balance', authMiddleware, async (req, res) => {
  try {
    res.json({ coins: req.user.coins });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get balance' });
  }
});

// Get shop items
app.get('/api/shop/items', async (req, res) => {
  try {
    const shopItems = await db.select()
      .from(items)
      .where(eq(items.is_available, true))
      .orderBy(items.price);
    res.json(shopItems);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get shop items' });
  }
});

// Purchase item
app.post('/api/shop/purchase', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.body;
    
    // Get item details
    const [item] = await db.select().from(items).where(eq(items.id, itemId)).limit(1);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Check if user already owns this item
    const [existingItem] = await db.select()
      .from(user_items)
      .where(and(eq(user_items.user_id, req.user.id), eq(user_items.item_id, itemId)))
      .limit(1);
    
    if (existingItem) {
      return res.status(400).json({ error: 'You already own this item' });
    }
    
    // Check if user has enough coins
    if (req.user.coins < item.price) {
      return res.status(400).json({ error: 'Not enough coins' });
    }
    
    // Deduct coins and add item to inventory
    const newBalance = req.user.coins - item.price;
    
    await db.update(users).set({ 
      coins: newBalance,
      updated_at: new Date()
    }).where(eq(users.id, req.user.id));
    
    await db.insert(user_items).values({
      user_id: req.user.id,
      item_id: itemId,
      acquired_at: new Date()
    });
    
    res.json({ success: true, newBalance });
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({ error: 'Purchase failed' });
  }
});

// Get player inventory
app.get('/api/player/inventory', authMiddleware, async (req, res) => {
  try {
    const inventory = await db.select({
      item_id: user_items.item_id,
      name: items.name,
      description: items.description,
      type: items.type,
      category: items.category,
      rarity: items.rarity,
      image_url: items.image_url,
      is_equipped: user_items.is_equipped,
      acquired_at: user_items.acquired_at
    })
    .from(user_items)
    .innerJoin(items, eq(user_items.item_id, items.id))
    .where(eq(user_items.user_id, req.user.id));
    
    // Get equipped items
    const equippedItems = {};
    inventory.filter(item => item.is_equipped).forEach(item => {
      equippedItems[item.category] = item.item_id;
    });
    
    res.json({ items: inventory, equipped: equippedItems });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get inventory' });
  }
});

// Equip item
app.post('/api/player/equip', authMiddleware, async (req, res) => {
  try {
    const { itemId } = req.body;
    
    // Get item details
    const [userItem] = await db.select({
      item_id: user_items.item_id,
      category: items.category
    })
    .from(user_items)
    .innerJoin(items, eq(user_items.item_id, items.id))
    .where(and(eq(user_items.user_id, req.user.id), eq(user_items.item_id, itemId)))
    .limit(1);
    
    if (!userItem) {
      return res.status(404).json({ error: 'Item not found in inventory' });
    }
    
    // Unequip all items in the same category
    await db.update(user_items)
      .set({ is_equipped: false })
      .where(and(
        eq(user_items.user_id, req.user.id),
        sql`item_id IN (SELECT id FROM items WHERE category = ${userItem.category})`
      ));
    
    // Equip the selected item
    await db.update(user_items)
      .set({ is_equipped: true })
      .where(and(eq(user_items.user_id, req.user.id), eq(user_items.item_id, itemId)));
    
    // Get updated equipped items
    const inventory = await db.select({
      item_id: user_items.item_id,
      category: items.category,
      is_equipped: user_items.is_equipped
    })
    .from(user_items)
    .innerJoin(items, eq(user_items.item_id, items.id))
    .where(and(eq(user_items.user_id, req.user.id), eq(user_items.is_equipped, true)));
    
    const equippedItems = {};
    inventory.forEach(item => {
      equippedItems[item.category] = item.item_id;
    });
    
    res.json({ success: true, equipped: equippedItems });
  } catch (error) {
    console.error('Equip error:', error);
    res.status(500).json({ error: 'Failed to equip item' });
  }
});

// Serve index.html for root route
app.get('/', optionalAuthMiddleware, (req, res) => {
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

  socket.on('playerJoin', async (playerData) => {
    let player;
    
    if (socket.isAuthenticated && socket.user) {
      // Authenticated user
      const user = socket.user;
      player = {
        id: socket.id,
        accountId: user.id, // Database user ID
        name: user.username, // Use authenticated username
        level: user.level,
        coins: user.coins,
        x: Math.random() * 1500 + 250, // Random spawn position
        y: Math.random() * 1500 + 250,
        radius: 50,
        speed: 0,
        health: 100,
        score: 0,
        alive: true,
        lastShot: 0,
        shootCooldown: 200,
        invulnerableUntil: 0,
        isGuest: false
      };

      // Start game session tracking for authenticated users
      await gameStats.startGameSession(socket.id, user.id);
    } else {
      // Guest user
      const guestName = playerData?.username || `Guest_${Math.floor(Math.random() * 9999)}`;
      player = {
        id: socket.id,
        accountId: null, // No database ID for guests
        name: guestName,
        level: 1,
        coins: 0,
        x: Math.random() * 1500 + 250, // Random spawn position
        y: Math.random() * 1500 + 250,
        radius: 50,
        speed: 0,
        health: 100,
        score: 0,
        alive: true,
        lastShot: 0,
        shootCooldown: 200,
        invulnerableUntil: 0,
        isGuest: true
      };

      // No session tracking for guests
      console.log(`Guest player joined: ${guestName}`);
    }
    
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

  socket.on('disconnect', async () => {
    console.log('Player disconnected:', socket.id);
    
    // End game session and cleanup stats only for authenticated users
    if (socket.isAuthenticated && socket.user) {
      const sessionResult = await gameStats.endGameSession(socket.id);
      if (sessionResult) {
        // Broadcast session results to player if they reconnect
        console.log(`Session ended for ${socket.id}: ${sessionResult.coinsEarned} coins, ${sessionResult.experienceEarned} XP`);
      }
    } else {
      console.log(`Guest player disconnected: ${socket.id}`);
    }
    
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
setInterval(async () => {
  const projectilesToRemove = [];
  
  // Update projectiles and check collisions
  for (let projectileIndex = 0; projectileIndex < gameState.projectiles.length; projectileIndex++) {
    const projectile = gameState.projectiles[projectileIndex];
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
        
        // Record damage dealt
        gameStats.recordDamage(projectile.playerId, damage);
        
        // Check if player is eliminated
        if (player.health <= 0) {
          player.health = 0;
          player.alive = false; // Mark as dead
          
          // Award points to shooter and record kill
          const shooter = gameState.players.get(projectile.playerId);
          if (shooter) {
            shooter.score += 100; // Points for elimination
          }
          
          // Record kill in database
          await gameStats.recordKill(projectile.playerId, playerId);
          
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
  }
  
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