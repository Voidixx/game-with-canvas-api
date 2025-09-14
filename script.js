
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Enhanced loading screen
let loadingProgress = 0;
let loadingAnimation = 0;

function drawLoadingScreen() {
  c.clearRect(0, 0, canvas.width, canvas.height);
  
  // Background gradient
  const gradient = c.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(1, '#16213e');
  c.fillStyle = gradient;
  c.fillRect(0, 0, canvas.width, canvas.height);
  
  // Animated loading dots
  loadingAnimation += 0.1;
  
  // Title
  c.font = `${getResponsiveFontSize(48)}px Arial`;
  c.fillStyle = "white";
  c.textAlign = "center";
  c.fillText("LOADING GAME", canvas.width / 2, canvas.height / 2 - getResponsiveSize(100));
  
  // Progress bar background
  const progressBarWidth = getResponsiveSize(400);
  const progressBarHeight = getResponsiveSize(20);
  const progressBarX = canvas.width / 2 - progressBarWidth / 2;
  const progressBarY = canvas.height / 2 - 10;
  
  c.fillStyle = "#333";
  c.fillRect(progressBarX - 2, progressBarY - 2, progressBarWidth + 4, progressBarHeight + 4);
  
  // Progress bar fill
  const progressFillWidth = (loadingProgress / 100) * progressBarWidth;
  const progressGradient = c.createLinearGradient(progressBarX, 0, progressBarX + progressBarWidth, 0);
  progressGradient.addColorStop(0, '#00ff88');
  progressGradient.addColorStop(1, '#00cc66');
  c.fillStyle = progressGradient;
  c.fillRect(progressBarX, progressBarY, progressFillWidth, progressBarHeight);
  
  // Progress percentage
  c.font = `${getResponsiveFontSize(24)}px Arial`;
  c.fillStyle = "white";
  c.fillText(Math.floor(loadingProgress) + "%", canvas.width / 2, canvas.height / 2 + getResponsiveSize(60));
  
  // Animated dots
  const dots = Math.floor(loadingAnimation) % 4;
  let dotText = "";
  for (let i = 0; i < dots; i++) {
    dotText += ".";
  }
  c.font = `${getResponsiveFontSize(36)}px Arial`;
  c.fillText(dotText, canvas.width / 2, canvas.height / 2 + getResponsiveSize(100));
}

// Menu screen variables
let menuAnimationTime = 0;
let nameInput = "";
let nameInputElement = null;
let nameInputContainer = null;

// Mobile thumbstick variables
let isTouchDevice = false;
let thumbstick = {
  baseX: 120,
  baseY: canvas.height - 120,
  stickX: 120,
  stickY: canvas.height - 120,
  baseRadius: 60,
  stickRadius: 25,
  isActive: false,
  touchId: null,
  maxDistance: 50
};

// Detect if device supports touch
function detectTouchDevice() {
  isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
}

detectTouchDevice();

// Mobile-responsive utilities
function getResponsiveFontSize(baseFontSize) {
  const minDimension = Math.min(canvas.width, canvas.height);
  const scaleFactor = minDimension / 800; // Base scale for 800px
  return Math.max(baseFontSize * scaleFactor, baseFontSize * 0.5); // Minimum 50% of base size
}

function getResponsiveSize(baseSize) {
  const minDimension = Math.min(canvas.width, canvas.height);
  const scaleFactor = minDimension / 800;
  return Math.max(baseSize * scaleFactor, baseSize * 0.6);
}

// Update thumbstick position on resize
function updateThumbstickPosition() {
  const margin = getResponsiveSize(120);
  thumbstick.baseX = margin;
  thumbstick.baseY = canvas.height - margin;
  thumbstick.stickX = thumbstick.baseX;
  thumbstick.stickY = thumbstick.baseY;
  thumbstick.baseRadius = getResponsiveSize(60);
  thumbstick.stickRadius = getResponsiveSize(25);
  thumbstick.maxDistance = getResponsiveSize(50);
}

function drawThumbstick() {
  if (!isTouchDevice || currentGameState !== gameStates.PLAYING) return;
  
  c.save();
  
  // Base circle (outer ring)
  c.fillStyle = "rgba(255, 255, 255, 0.3)";
  c.strokeStyle = "rgba(255, 255, 255, 0.5)";
  c.lineWidth = 3;
  c.beginPath();
  c.arc(thumbstick.baseX, thumbstick.baseY, thumbstick.baseRadius, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  // Stick circle (inner control)
  const stickOpacity = thumbstick.isActive ? 0.8 : 0.6;
  c.fillStyle = `rgba(0, 255, 136, ${stickOpacity})`;
  c.strokeStyle = `rgba(0, 200, 100, ${stickOpacity})`;
  c.lineWidth = 2;
  c.beginPath();
  c.arc(thumbstick.stickX, thumbstick.stickY, thumbstick.stickRadius, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  
  c.restore();
}

function updatePlayerMovementFromThumbstick() {
  if (!thumbstick.isActive) {
    // Reset all movement when thumbstick is not active
    player.left = player.right = player.up = player.down = false;
    return;
  }
  
  const deltaX = thumbstick.stickX - thumbstick.baseX;
  const deltaY = thumbstick.stickY - thumbstick.baseY;
  const deadzone = 15; // Minimum movement threshold
  
  // Reset movement
  player.left = player.right = player.up = player.down = false;
  
  // Set movement based on thumbstick position (let physics handle speed)
  if (Math.abs(deltaX) > deadzone) {
    if (deltaX > 0) player.right = true;
    else player.left = true;
  }
  
  if (Math.abs(deltaY) > deadzone) {
    if (deltaY > 0) player.down = true;
    else player.up = true;
  }
}

function drawMenuScreen() {
  c.clearRect(0, 0, canvas.width, canvas.height);
  menuAnimationTime += 0.02;
  
  // Background gradient
  const gradient = c.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#0f3460');
  gradient.addColorStop(1, '#16537e');
  c.fillStyle = gradient;
  c.fillRect(0, 0, canvas.width, canvas.height);
  
  // Floating particles animation
  for (let i = 0; i < 20; i++) {
    const x = (Math.sin(menuAnimationTime + i) * 100) + canvas.width / 2;
    const y = (Math.cos(menuAnimationTime * 0.7 + i) * 50) + canvas.height / 2 - 200 + i * 10;
    c.fillStyle = `rgba(255, 255, 255, ${0.1 + Math.sin(menuAnimationTime + i) * 0.05})`;
    c.fillRect(x, y, 3, 3);
  }
  
  // Game title
  c.font = `${getResponsiveFontSize(64)}px Arial`;
  c.fillStyle = "white";
  c.textAlign = "center";
  c.fillText("GUNBATTLE.IO", canvas.width / 2, canvas.height / 2 - getResponsiveSize(150));
  
  // Player name label
  c.font = `${getResponsiveFontSize(32)}px Arial`;
  c.fillStyle = "#00ff88";
  c.fillText("Enter your name:", canvas.width / 2, canvas.height / 2 - getResponsiveSize(60));
  
  // Instructions
  c.font = `${getResponsiveFontSize(24)}px Arial`;
  c.fillStyle = "#cccccc";
  c.textAlign = "center";
  const instruction1Y = canvas.height / 2 + getResponsiveSize(100);
  const instruction2Y = canvas.height / 2 + getResponsiveSize(140);
  
  if (isTouchDevice) {
    c.fillText("Touch anywhere to start playing", canvas.width / 2, instruction1Y);
    c.fillText("Use the virtual joystick to move", canvas.width / 2, instruction2Y);
  } else {
    c.fillText("Press ENTER or click to start", canvas.width / 2, instruction1Y);
    c.fillText("Use WASD or Arrow Keys to move", canvas.width / 2, instruction2Y);
  }
}

// Initial loading screen
drawLoadingScreen();

function random(number1, number2){
  return Math.round(Math.random() * (number2 - number1)) + number1;
}

function remove(arr, str){
  if(arr.includes(str)) arr.splice(arr.indexOf(str), 1);
}

// Visual effects for collision system
let damageEffectTime = 0;
let eliminationMessages = [];
let killNotifications = [];

function showDamageEffect() {
  damageEffectTime = Date.now() + 300; // Show red flash for 300ms
}

function showEliminationMessage(message, isMyDeath) {
  eliminationMessages.push({
    text: message,
    time: Date.now() + 3000, // Show for 3 seconds
    isMyDeath: isMyDeath
  });
}

function showKillNotification() {
  killNotifications.push({
    text: "+100 ELIMINATION",
    time: Date.now() + 2000, // Show for 2 seconds
    y: 150 // Starting Y position
  });
}

const loadingImages = [
  {
    url: "images/grass.png",
    name: "grass",
    size: undefined
  },
  {
    url: "images/player.png",
    name: "player",
    size: undefined
  }
];



// Game states
const gameStates = {
  LOADING: 'loading',
  MENU: 'menu',
  PLAYING: 'playing'
};
let currentGameState = gameStates.LOADING;
let playerName = "";

// Multiplayer variables
let socket = null;
let myPlayerId = null;
let otherPlayers = new Map();
let projectiles = [];
let isConnected = false;

var e = 0;
const player = {
  x: 300,
  y: 300,
  prevX: 300,
  prevY: 300,
  left: false,
  right: false,
  up: false,
  down: false,
  radius: 50,
  speed: 0,
  maxSpeed: 5,
  acceleration: 0.5,
  friction: 0.8,
  moving: false,
  slowing: false,
  directions: [],
  health: 100,
  maxHealth: 100,
  score: 0,
  lastShot: 0,
  shootCooldown: 200
};
player.x = random(player.radius, 2000 - player.radius);
player.y = random(player.radius, 2000 - player.radius);


// Performance timing
var time = Date.now();
var fps = 0;
var FPS = 60;

// Fixed timestep simulation
const FIXED_TIMESTEP = 1000 / 60; // 60 FPS simulation
const MAX_FRAME_DELTA = 250; // Max catchup time
let lastFrameTime = Date.now();
let accumulatedTime = 0;

let menuAnimationId;

function showNameInput() {
  const container = document.getElementById('nameInputContainer');
  const input = document.getElementById('nameInput');
  if (!container || !input) return;
  
  nameInputContainer = container;
  nameInputElement = input;
  
  container.style.display = 'block';
  input.value = nameInput;
  // Focus with a small delay to ensure mobile keyboards open properly
  setTimeout(() => {
    input.focus();
  }, 100);
}

function hideNameInput() {
  const container = document.getElementById('nameInputContainer');
  const input = document.getElementById('nameInput');
  if (!container || !input) return;
  
  container.style.display = 'none';
  nameInput = input.value.trim();
}

function initializeMultiplayer() {
  socket = io();
  
  socket.on('connect', () => {
    console.log('Connected to server');
    isConnected = true;
    // Join the game with player name
    socket.emit('playerJoin', { name: playerName });
  });
  
  socket.on('gameInit', (data) => {
    myPlayerId = data.playerId;
    // Initialize other players
    data.players.forEach(p => {
      if (p.id !== myPlayerId) {
        otherPlayers.set(p.id, p);
      }
    });
    projectiles = data.projectiles || [];
  });
  
  socket.on('playerJoined', (playerData) => {
    otherPlayers.set(playerData.id, playerData);
  });
  
  socket.on('playerMoved', (moveData) => {
    const otherPlayer = otherPlayers.get(moveData.id);
    if (otherPlayer) {
      otherPlayer.x = moveData.x;
      otherPlayer.y = moveData.y;
      otherPlayer.speed = moveData.speed;
    }
  });
  
  socket.on('playerDisconnected', (playerId) => {
    otherPlayers.delete(playerId);
  });
  
  socket.on('projectileCreated', (projectile) => {
    projectiles.push(projectile);
  });
  
  socket.on('projectilesUpdate', (updatedProjectiles) => {
    projectiles = updatedProjectiles;
  });
  
  socket.on('playerHit', (hitData) => {
    if (hitData.playerId === myPlayerId) {
      // Update my health if I got hit
      player.health = hitData.health;
      
      // Show damage effect (screen flash)
      showDamageEffect();
    } else {
      // Update other player's health
      const otherPlayer = otherPlayers.get(hitData.playerId);
      if (otherPlayer) {
        otherPlayer.health = hitData.health;
      }
    }
  });
  
  socket.on('playerEliminated', (eliminationData) => {
    if (eliminationData.eliminatedId === myPlayerId) {
      // I was eliminated
      showEliminationMessage(`You were eliminated by ${eliminationData.shooterName}!`, true);
    } else {
      // Someone else was eliminated
      showEliminationMessage(`${eliminationData.eliminatedName} was eliminated by ${eliminationData.shooterName}!`, false);
      
      // Update shooter's score if it's me
      if (eliminationData.shooterId === myPlayerId) {
        player.score = (player.score || 0) + 100;
        showKillNotification();
      }
    }
  });
  
  socket.on('playerRespawned', (respawnData) => {
    if (respawnData.id === myPlayerId) {
      // I respawned
      player.x = respawnData.player.x;
      player.y = respawnData.player.y;
      player.health = respawnData.player.health;
    } else {
      // Update other player's respawn
      const otherPlayer = otherPlayers.get(respawnData.id);
      if (otherPlayer) {
        otherPlayer.x = respawnData.player.x;
        otherPlayer.y = respawnData.player.y;
        otherPlayer.health = respawnData.player.health;
      }
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    isConnected = false;
    otherPlayers.clear();
    projectiles = [];
  });
}

function startGame() {
  // Prevent multiple start triggers
  if (currentGameState !== gameStates.MENU) return;
  
  hideNameInput();
  currentGameState = gameStates.PLAYING;
  playerName = nameInput || "Player";
  if (menuAnimationId) {
    cancelAnimationFrame(menuAnimationId);
  }
  
  // Initialize multiplayer connection
  initializeMultiplayer();
  animate();
}

function animateMenu() {
  drawMenuScreen();
  menuAnimationId = requestAnimationFrame(animateMenu);
}

function initializeInputEvents() {
  const input = document.getElementById('nameInput');
  if (input) {
    input.addEventListener('input', () => {
      nameInput = input.value.trim();
    });
    
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        startGame();
      }
    });
  }
}

function shootProjectile(targetX, targetY) {
  const now = Date.now();
  if (now - player.lastShot < player.shootCooldown || !isConnected) return;
  
  player.lastShot = now;
  
  // Calculate direction from player to target
  const dirX = targetX - (canvas.width / 2);
  const dirY = targetY - (canvas.height / 2);
  const length = Math.sqrt(dirX * dirX + dirY * dirY);
  
  if (length > 0) {
    const normalizedDirX = dirX / length;
    const normalizedDirY = dirY / length;
    
    // Send shoot command to server
    socket.emit('playerShoot', {
      x: player.x,
      y: player.y,
      dirX: normalizedDirX,
      dirY: normalizedDirY
    });
  }
}

function updateGame(deltaTime) {
  // Update thumbstick movement before applying physics (reduces input lag)
  if (isTouchDevice && thumbstick.isActive) {
    updatePlayerMovementFromThumbstick();
  }
  
  // Store previous position for interpolation
  player.prevX = player.x;
  player.prevY = player.y;
  
  // Calculate movement direction vector
  let dx = 0, dy = 0;
  if (player.left) dx -= 1;
  if (player.right) dx += 1;
  if (player.up) dy -= 1;
  if (player.down) dy += 1;
  
  // Normalize movement vector to ensure consistent speed in all directions
  const vectorLength = Math.sqrt(dx * dx + dy * dy);
  if (vectorLength > 0) {
    dx = dx / vectorLength;
    dy = dy / vectorLength;
  }
  
  // Improved physics with acceleration/deceleration
  let targetSpeed = vectorLength > 0 ? player.maxSpeed : 0;
  
  // Smooth speed transition
  if (targetSpeed > player.speed) {
    player.speed = Math.min(player.speed + player.acceleration, targetSpeed);
  } else {
    player.speed = Math.max(player.speed * player.friction, 0);
  }

  // Apply movement with boundary checking
  const newX = player.x + dx * player.speed;
  const newY = player.y + dy * player.speed;
  
  if (newX - player.radius > 0 && newX + player.radius < 2000) {
    player.x = newX;
  }
  if (newY - player.radius > 0 && newY + player.radius < 2000) {
    player.y = newY;
  }
  
  // Send movement to server if connected
  if (isConnected && socket && (dx !== 0 || dy !== 0)) {
    socket.emit('playerMove', {
      x: player.x,
      y: player.y,
      speed: player.speed
    });
  }
}

function renderGame(interpolationFactor) {
  // Clear canvas
  c.clearRect(0, 0, canvas.width, canvas.height);
  
  // Interpolate player position for smooth rendering
  const renderX = player.prevX + (player.x - player.prevX) * interpolationFactor;
  const renderY = player.prevY + (player.y - player.prevY) * interpolationFactor;
  
  // Render background tiles with camera offset
  for(let i = canvas.width / 2; i <= canvas.width / 2 + 1500; i += 500){
    for(let j = canvas.height / 2; j <= canvas.height / 2 + 1500; j += 500){
      addImage("grass", i - renderX, j - renderY);
    }
  }
  
  // Render other players
  otherPlayers.forEach(otherPlayer => {
    const otherX = canvas.width / 2 + (otherPlayer.x - renderX);
    const otherY = canvas.height / 2 + (otherPlayer.y - renderY);
    
    if (otherX > -100 && otherX < canvas.width + 100 && otherY > -100 && otherY < canvas.height + 100) {
      // Draw other player using the same sprite as main player
      addImage("player", otherX - otherPlayer.radius, otherY - otherPlayer.radius);
      
      // Draw other player name
      c.fillStyle = "white";
      c.font = `${getResponsiveFontSize(16)}px Arial`;
      c.textAlign = "center";
      c.fillText(otherPlayer.name, otherX, otherY - otherPlayer.radius - 30);
      
      // Draw other player health bar
      const healthBarWidth = otherPlayer.radius * 1.5;
      const healthBarHeight = 8;
      const healthBarX = otherX - healthBarWidth / 2;
      const healthBarY = otherY - otherPlayer.radius - 20;
      
      // Health bar background
      c.fillStyle = "rgba(255, 0, 0, 0.7)";
      c.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
      
      // Health bar fill (handle 0 health correctly)
      const health = (otherPlayer.health ?? 100);
      const healthPercent = Math.max(0, Math.min(1, health / 100));
      c.fillStyle = healthPercent > 0.5 ? "rgba(0, 255, 0, 0.8)" : 
                    healthPercent > 0.25 ? "rgba(255, 255, 0, 0.8)" : "rgba(255, 0, 0, 0.8)";
      c.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
    }
  });
  
  // Render projectiles
  projectiles.forEach(projectile => {
    const projX = canvas.width / 2 + (projectile.x - renderX);
    const projY = canvas.height / 2 + (projectile.y - renderY);
    
    if (projX > -50 && projX < canvas.width + 50 && projY > -50 && projY < canvas.height + 50) {
      c.fillStyle = "#ffff00";
      c.beginPath();
      c.arc(projX, projY, 3, 0, Math.PI * 2);
      c.fill();
    }
  });
  
  // Render main player
  addImage("player", canvas.width / 2 - player.radius, canvas.height / 2 - player.radius);
  
  // Display UI
  c.fillStyle = "white";
  c.font = `${getResponsiveFontSize(30)}px Arial`;
  c.textAlign = "left";
  const uiMargin = getResponsiveSize(20);
  const uiHeight = getResponsiveSize(50);
  c.fillText("Player: " + playerName, uiMargin, uiHeight);
  
  // Health bar
  const healthBarWidth = getResponsiveSize(200);
  const healthBarHeight = getResponsiveSize(20);
  const healthBarX = uiMargin;
  const healthBarY = uiHeight + getResponsiveSize(10);
  
  c.fillStyle = "red";
  c.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
  c.fillStyle = "green";
  c.fillRect(healthBarX, healthBarY, (player.health / player.maxHealth) * healthBarWidth, healthBarHeight);
  
  c.textAlign = "right";
  c.fillText("FPS: " + FPS, canvas.width - uiMargin, uiHeight);
  c.fillText("Players: " + (otherPlayers.size + 1), canvas.width - uiMargin, uiHeight + getResponsiveSize(40));
  c.fillText("Score: " + player.score, canvas.width - uiMargin, uiHeight + getResponsiveSize(80));
  
  // Connection status
  c.fillStyle = isConnected ? "green" : "red";
  c.fillText(isConnected ? "Connected" : "Disconnected", canvas.width - uiMargin, uiHeight + getResponsiveSize(120));
  
  // Draw damage effect (red screen flash)
  if (damageEffectTime > Date.now()) {
    c.fillStyle = "rgba(255, 0, 0, 0.3)";
    c.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  // Draw elimination messages
  const currentTime = Date.now();
  eliminationMessages = eliminationMessages.filter(msg => msg.time > currentTime);
  eliminationMessages.forEach((msg, index) => {
    c.font = `${getResponsiveFontSize(32)}px Arial`;
    c.textAlign = "center";
    c.fillStyle = msg.isMyDeath ? "#ff4444" : "#ffff44";
    const messageY = canvas.height / 2 - 100 + (index * 40);
    c.fillText(msg.text, canvas.width / 2, messageY);
  });
  
  // Draw kill notifications
  killNotifications = killNotifications.filter(notif => notif.time > currentTime);
  killNotifications.forEach((notif, index) => {
    c.font = `${getResponsiveFontSize(28)}px Arial`;
    c.textAlign = "center";
    c.fillStyle = "#00ff88";
    const notifY = notif.y + (index * 35);
    c.fillText(notif.text, canvas.width / 2, notifY);
  });
  
  // Draw mobile thumbstick
  drawThumbstick();
}

function animate(){
  if (currentGameState !== gameStates.PLAYING) return;
  
  const currentTime = Date.now();
  let frameTime = currentTime - lastFrameTime;
  lastFrameTime = currentTime;
  
  // Clamp frame time to prevent spiral of death
  frameTime = Math.min(frameTime, MAX_FRAME_DELTA);
  accumulatedTime += frameTime;
  
  // FPS counter
  if(currentTime - time >= 1000){
    time = currentTime;
    FPS = fps;
    fps = 0;
  }
  
  // Fixed timestep updates
  while (accumulatedTime >= FIXED_TIMESTEP) {
    updateGame(FIXED_TIMESTEP);
    accumulatedTime -= FIXED_TIMESTEP;
  }
  
  // Interpolated rendering
  const interpolationFactor = accumulatedTime / FIXED_TIMESTEP;
  renderGame(interpolationFactor);
  
  requestAnimationFrame(animate);
  fps++;
}

function initGame() {
  currentGameState = gameStates.MENU;
  updateThumbstickPosition(); // Initialize responsive thumbstick sizing
  initializeInputEvents(); // Set up input event listeners
  showNameInput(); // Show the HTML input overlay
  animateMenu();
}

loadImages(loadingImages).then(() => {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGame);
  } else {
    initGame();
  }
}).catch(error => {
  console.error('Failed to load game assets:', error);
});


document.addEventListener("keydown", e => {
  // Menu input handling
  if (currentGameState === gameStates.MENU) {
    if (e.key === "Enter" && e.target.tagName !== 'INPUT') {
      e.preventDefault();
      startGame();
    }
    return;
  }
  
  // Game movement handling
  if (currentGameState === gameStates.PLAYING) {
    e.preventDefault();
    
    if((e.key == "w" || e.key == "ArrowUp") && !player.up){
      player.up = true;
      player.directions.push("up");
      player.down = false;
      remove(player.directions, "down");
    } else if((e.key == "a" || e.key == "ArrowLeft") && !player.left){
      player.left = true;
      player.directions.push("left");
      player.right = false;
      remove(player.directions, "right");
    } else if((e.key == "s" || e.key == "ArrowDown") && !player.down){
      player.down = true;
      player.directions.push("down");
      player.up = false;
      remove(player.directions, "up");
    } else if((e.key == "d" || e.key == "ArrowRight") && !player.right){
      player.right = true;
      player.directions.push("right");
      player.left = false;
      remove(player.directions, "left");
    }
  }
});

document.addEventListener("keyup", e => {
  // Only handle keyup events during gameplay
  if (currentGameState !== gameStates.PLAYING) return;
  
  if((e.key == "w" || e.key == "ArrowUp") && player.up){
    remove(player.directions, "up");
    player.up = false;
  } else if((e.key == "a" || e.key == "ArrowLeft") && player.left){
    remove(player.directions, "left");
    player.left = false;
  } else if((e.key == "s" || e.key == "ArrowDown") && player.down){
    remove(player.directions, "down");
    player.down = false;
  } else if((e.key == "d" || e.key == "ArrowRight") && player.right){
    remove(player.directions, "right");
    player.right = false;
  }
});

// Click handler for desktop menu and shooting
canvas.addEventListener("click", e => {
  if (currentGameState === gameStates.MENU && !isTouchDevice) {
    startGame();
  } else if (currentGameState === gameStates.PLAYING) {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    shootProjectile(clickX, clickY);
  }
});

// Touch event handlers for mobile thumbstick, menu, and shooting
canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  
  // Handle menu screen touch - only start if not touching the input area
  if (currentGameState === gameStates.MENU) {
    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const touchY = e.touches[0].clientY - rect.top;
    
    // Check if touch is near the input area (center of screen)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const inputAreaSize = 200; // Rough area around the input
    
    if (Math.abs(touchX - centerX) > inputAreaSize || Math.abs(touchY - centerY) > inputAreaSize) {
      startGame();
    }
    return;
  }
  
  // Handle shooting for touches outside thumbstick area
  if (currentGameState === gameStates.PLAYING && isTouchDevice) {
    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const touchY = e.touches[0].clientY - rect.top;
    
    // Check if touch is not on thumbstick
    const distance = Math.sqrt(
      (touchX - thumbstick.baseX) ** 2 + (touchY - thumbstick.baseY) ** 2
    );
    
    if (distance > thumbstick.baseRadius) {
      shootProjectile(touchX, touchY);
      return;
    }
  }
  
  if (currentGameState !== gameStates.PLAYING || !isTouchDevice) return;
  
  for (let touch of e.changedTouches) {
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    const touchY = touch.clientY - rect.top;
    
    // Check if touch is within thumbstick base
    const distance = Math.sqrt(
      (touchX - thumbstick.baseX) ** 2 + (touchY - thumbstick.baseY) ** 2
    );
    
    if (distance <= thumbstick.baseRadius && !thumbstick.isActive) {
      thumbstick.isActive = true;
      thumbstick.touchId = touch.identifier;
      thumbstick.stickX = touchX;
      thumbstick.stickY = touchY;
    }
  }
}, { passive: false });

canvas.addEventListener("touchmove", e => {
  e.preventDefault();
  if (currentGameState !== gameStates.PLAYING || !isTouchDevice || !thumbstick.isActive) return;
  
  for (let touch of e.changedTouches) {
    if (touch.identifier === thumbstick.touchId) {
      const rect = canvas.getBoundingClientRect();
      const touchX = touch.clientX - rect.left;
      const touchY = touch.clientY - rect.top;
      
      // Calculate distance from base
      const deltaX = touchX - thumbstick.baseX;
      const deltaY = touchY - thumbstick.baseY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Constrain stick within max distance
      if (distance <= thumbstick.maxDistance) {
        thumbstick.stickX = touchX;
        thumbstick.stickY = touchY;
      } else {
        // Keep stick at edge of allowed area
        const angle = Math.atan2(deltaY, deltaX);
        thumbstick.stickX = thumbstick.baseX + Math.cos(angle) * thumbstick.maxDistance;
        thumbstick.stickY = thumbstick.baseY + Math.sin(angle) * thumbstick.maxDistance;
      }
    }
  }
}, { passive: false });

canvas.addEventListener("touchend", e => {
  e.preventDefault();
  if (!isTouchDevice) return;
  
  for (let touch of e.changedTouches) {
    if (touch.identifier === thumbstick.touchId) {
      thumbstick.isActive = false;
      thumbstick.touchId = null;
      thumbstick.stickX = thumbstick.baseX;
      thumbstick.stickY = thumbstick.baseY;
      
      // Stop player movement when thumbstick is released
      player.left = player.right = player.up = player.down = false;
      player.speed = 0;
    }
  }
}, { passive: false });

canvas.addEventListener("touchcancel", e => {
  e.preventDefault();
  if (!isTouchDevice) return;
  
  for (let touch of e.changedTouches) {
    if (touch.identifier === thumbstick.touchId) {
      thumbstick.isActive = false;
      thumbstick.touchId = null;
      thumbstick.stickX = thumbstick.baseX;
      thumbstick.stickY = thumbstick.baseY;
      
      // Stop player movement when thumbstick is canceled
      player.left = player.right = player.up = player.down = false;
      player.speed = 0;
    }
  }
}, { passive: false });

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  updateThumbstickPosition();
})