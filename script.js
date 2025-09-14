
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
  c.font = "48px Arial";
  c.fillStyle = "white";
  c.textAlign = "center";
  c.fillText("LOADING GAME", canvas.width / 2, canvas.height / 2 - 100);
  
  // Progress bar background
  const progressBarWidth = 400;
  const progressBarHeight = 20;
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
  c.font = "24px Arial";
  c.fillStyle = "white";
  c.fillText(Math.floor(loadingProgress) + "%", canvas.width / 2, canvas.height / 2 + 60);
  
  // Animated dots
  const dots = Math.floor(loadingAnimation) % 4;
  let dotText = "";
  for (let i = 0; i < dots; i++) {
    dotText += ".";
  }
  c.font = "36px Arial";
  c.fillText(dotText, canvas.width / 2, canvas.height / 2 + 100);
}

// Menu screen variables
let menuAnimationTime = 0;
let nameInput = "";
let showCursor = true;
let cursorBlinkTime = 0;

function drawMenuScreen() {
  c.clearRect(0, 0, canvas.width, canvas.height);
  menuAnimationTime += 0.02;
  cursorBlinkTime += 0.1;
  
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
  c.font = "64px Arial";
  c.fillStyle = "white";
  c.textAlign = "center";
  c.fillText("ADVENTURE GAME", canvas.width / 2, canvas.height / 2 - 150);
  
  // Player name label
  c.font = "32px Arial";
  c.fillStyle = "#00ff88";
  c.fillText("Enter your name:", canvas.width / 2, canvas.height / 2 - 60);
  
  // Name input box
  const inputBoxWidth = 400;
  const inputBoxHeight = 50;
  const inputBoxX = canvas.width / 2 - inputBoxWidth / 2;
  const inputBoxY = canvas.height / 2 - 25;
  
  // Input box background
  c.fillStyle = "rgba(255, 255, 255, 0.1)";
  c.fillRect(inputBoxX - 2, inputBoxY - 2, inputBoxWidth + 4, inputBoxHeight + 4);
  c.fillStyle = "rgba(0, 20, 40, 0.8)";
  c.fillRect(inputBoxX, inputBoxY, inputBoxWidth, inputBoxHeight);
  
  // Player name text
  c.font = "28px Arial";
  c.fillStyle = "white";
  c.textAlign = "left";
  const nameText = nameInput || "Player";
  c.fillText(nameText, inputBoxX + 15, inputBoxY + 32);
  
  // Blinking cursor
  if (Math.floor(cursorBlinkTime) % 2 === 0) {
    const textWidth = c.measureText(nameText).width;
    c.fillRect(inputBoxX + 15 + textWidth + 5, inputBoxY + 10, 2, 30);
  }
  
  // Instructions
  c.font = "24px Arial";
  c.fillStyle = "#cccccc";
  c.textAlign = "center";
  c.fillText("Type your name and press ENTER to start", canvas.width / 2, canvas.height / 2 + 80);
  c.fillText("Use WASD or Arrow Keys to move", canvas.width / 2, canvas.height / 2 + 120);
}

// Initial loading screen
drawLoadingScreen();

function random(number1, number2){
  return Math.round(Math.random() * (number2 - number1)) + number1;
}

function remove(arr, str){
  if(arr.includes(str)) arr.splice(arr.indexOf(str), 1);
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

var e = 0;
const player = {
  x: 300,
  y: 300,
  left: false,
  right: false,
  up: false,
  down: false,
  radius: 50,
  speed: 0,
  moving: false,
  // keyspressed: 0,
  slowing: false,
  directions: []
};
player.x = random(player.radius, 2000 - player.radius);
player.y = random(player.radius, 2000 - player.radius);

function gradual(from, to){
  return new Promise((resolve, reject) => {
    var num = 0.75;
    if(from > to) num = -num;
    var startTime = Date.now();
    var int = setInterval(() => {
      player.speed += num;
      if((player.speed >= to && from < to) || ((player.speed <= to || player.moving) && from > to) || Date.now() - startTime >= Math.abs(from - to) * 15 / Math.abs(num) || player.directions.length > 1){
        clearInterval(int);
        player.speed = to;
        resolve();
      }
    }, 15);
  })
}

var time = Date.now();
var fps = 0;
var FPS = 60;

let menuAnimationId;

function startGame() {
  currentGameState = gameStates.PLAYING;
  playerName = nameInput || "Player";
  if (menuAnimationId) {
    cancelAnimationFrame(menuAnimationId);
  }
  animate();
}

function animateMenu() {
  drawMenuScreen();
  menuAnimationId = requestAnimationFrame(animateMenu);
}

function animate(){
  if (currentGameState !== gameStates.PLAYING) return;
  
  c.font = "30px Arial";
  c.textAlign = "left";
  if(Date.now() - time >= 1000){
    time = Date.now();
    FPS = fps;
    // console.log(fps);
    fps = 0;
  }
  if(player.x - player.radius <= 0) player.left = false;
  if(player.x + player.radius >= 2000) player.right = false;
  if(player.y - player.radius <= 0) player.up = false;
  if(player.y + player.radius >= 2000) player.down = false;
  if(player.left) player.x -= player.speed;
  if(player.right) player.x += player.speed;
  if(player.up) player.y -= player.speed;
  if(player.down) player.y += player.speed;
  c.clearRect(0, 0, canvas.width, canvas.height);
  for(let i = canvas.width / 2; i <= canvas.width / 2 + 1500; i += 500){
    for(let j = canvas.height / 2; j <= canvas.height / 2 + 1500; j += 500){
      addImage("grass", i - player.x, j - player.y);
    }
  }
  addImage("player", canvas.width / 2 - player.radius, canvas.height / 2 - player.radius);
  
  // Display player name
  c.fillStyle = "white";
  c.fillText("Player: " + playerName, 20, 50);
  c.fillText("FPS: " + FPS, canvas.width - 200, 50);
  
  requestAnimationFrame(animate);
  fps++;
}

loadImages(loadingImages).then(() => {
  currentGameState = gameStates.MENU;
  animateMenu();
});


document.addEventListener("keydown", e => {
  // Menu input handling
  if (currentGameState === gameStates.MENU) {
    if (e.key === "Enter") {
      e.preventDefault();
      startGame();
    } else if (e.key === "Backspace") {
      e.preventDefault();
      nameInput = nameInput.slice(0, -1);
    } else if (e.key.length === 1 && nameInput.length < 20) {
      // Add regular characters to name input
      const allowedChars = /^[a-zA-Z0-9\s]$/;
      if (allowedChars.test(e.key)) {
        nameInput += e.key;
      }
    }
    return;
  }
  
  // Game movement handling
  if (currentGameState === gameStates.PLAYING) {
    e.preventDefault();
    if(player.slowing) return;
    
    if((e.key == "w" || e.key == "ArrowUp") && !player.up){
      player.up = true;
      if(!player.directions.length) gradual(0, 5);
      player.directions.push("up");
      player.moving = true;
      player.down = false;
      remove(player.directions, "down");
    } if((e.key == "a" || e.key == "ArrowLeft") && !player.left){
      player.left = true;
      if(!player.directions.length) gradual(0, 5);
      player.directions.push("left");
      player.moving = true;
      player.right = false;
      remove(player.directions, "right");
    } if((e.key == "s" || e.key == "ArrowDown") && !player.down){
      player.down = true;
      if(!player.directions.length) gradual(0, 5);
      player.directions.push("down");
      player.moving = true;
      player.up = false;
      remove(player.directions, "up");
    } if((e.key == "d" || e.key == "ArrowRight") && !player.right){
      player.right = true;
      if(!player.directions.length) gradual(0, 5);
      player.directions.push("right");
      player.moving = true;
      player.left = false;
      remove(player.directions, "left");
    }
    console.log(player.directions)
  }
});

document.addEventListener("keyup", e => {
  // Only handle keyup events during gameplay
  if (currentGameState !== gameStates.PLAYING) return;
  
  if((e.key == "w" || e.key == "ArrowUp") && player.up){
    remove(player.directions, "up");
    if(!player.directions.length){
      player.slowing = true;
      player.moving = false;
      gradual(5, 0).then(() => {
        player.up = false;
        player.slowing = false;
      });
    } else {
      player.up = false;
    }
  } if((e.key == "a" || e.key == "ArrowLeft") && player.left){
    remove(player.directions, "left");
    if(!player.directions.length){
      player.slowing = true;
      player.moving = false;
      gradual(5, 0).then(() => {
        player.left = false;
        player.slowing = false;
      });
    } else {
      player.left = false;
    }
    player.moving = false;
  } if((e.key == "s" || e.key == "ArrowDown") && player.down){
    remove(player.directions, "down");
    if(!player.directions.length){
      player.slowing = true;
      player.moving = false;
      gradual(5, 0).then(() => {
        player.down = false;
        player.slowing = false;
      });
    } else {
      player.down = false;
    }
  } if((e.key == "d" || e.key == "ArrowRight") && player.right){
    remove(player.directions, "right");
    if(!player.directions.length){
      player.slowing = true;
      player.moving = false;
      gradual(5, 0).then(() => {
        player.right = false;
        player.slowing = false;
      });
    } else {
      player.right = false;
    }
  }
});

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
})