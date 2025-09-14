// Global game initialization function for auth integration
window.initializeGame = function() {
  if (typeof window.currentGameState !== 'undefined' && 
      window.currentGameState === window.gameStates.MENU && 
      (window.isUserAuthenticated() || (window.gameAuth && window.gameAuth.isGuestUser()))) {
    window.startGame();
  }
};

// Mark game as ready for initialization
document.addEventListener('DOMContentLoaded', function() {
  window.gameInitialized = true;
});