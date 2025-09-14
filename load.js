const canvas = document.getElementById("canvas");
const c = canvas.getContext("2d");

const images = {};

let loadingAnimationId;

function loadImages(links){
  return new Promise((resolve, reject) => {
    var loadedNum = 0;
    
    // Start loading screen animation
    loadingAnimationId = requestAnimationFrame(animateLoadingScreen);
    
    links.forEach(img => {
      let image = new Image();
      images[img.name] = image;
      
      image.onload = () => {
        loadedNum += 1;
        loadingProgress = (loadedNum / links.length) * 100;
        
        if(loadedNum >= links.length){
          console.log("loaded");
          // Stop loading animation and transition to game
          setTimeout(() => {
            cancelAnimationFrame(loadingAnimationId);
            resolve();
          }, 500); // Small delay to show 100% completion
        }
      }
      
      // Set src after onload handler to prevent race condition
      image.src = img.url;
    });
  });
}

function animateLoadingScreen() {
  drawLoadingScreen();
  loadingAnimationId = requestAnimationFrame(animateLoadingScreen);
}

function addImage(name, x, y){
  c.drawImage(images[name], x, y)
}