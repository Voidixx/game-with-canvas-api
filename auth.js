// Authentication system for Gunbattle.io
class GameAuth {
  constructor() {
    this.user = null;
    this.token = null;
    this.isAuthenticated = false;
    this.isGuest = false;
    this.guestUsername = null;
    
    // DOM elements
    this.authContainer = null;
    this.loginForm = null;
    this.signupForm = null;
    this.guestForm = null;
    this.userInfo = null;
    this.authError = null;
    
    this.initializeElements();
    this.bindEvents();
    this.showMainMenu();
  }
  
  initializeElements() {
    this.authContainer = document.getElementById('authContainer');
    this.loginForm = document.getElementById('loginForm');
    this.signupForm = document.getElementById('signupForm');
    this.guestForm = document.getElementById('guestForm');
    this.userInfo = document.getElementById('userInfo');
    this.authError = document.getElementById('authError');
    
    // Login elements
    this.loginUsername = document.getElementById('loginUsername');
    this.loginPassword = document.getElementById('loginPassword');
    this.loginButton = document.getElementById('loginButton');
    
    // Signup elements
    this.signupUsername = document.getElementById('signupUsername');
    this.signupEmail = document.getElementById('signupEmail');
    this.signupPassword = document.getElementById('signupPassword');
    this.signupButton = document.getElementById('signupButton');
    
    // Guest elements
    this.guestUsernameInput = document.getElementById('guestUsername');
    this.guestButton = document.getElementById('guestButton');
    
    // User info elements
    this.userDisplayName = document.getElementById('userDisplayName');
    this.userLevel = document.getElementById('userLevel');
    this.userCoins = document.getElementById('userCoins');
    this.userXP = document.getElementById('userXP');
    this.userKD = document.getElementById('userKD');
    
    // Control elements
    this.showSignup = document.getElementById('showSignup');
    this.showLogin = document.getElementById('showLogin');
    this.showGuest = document.getElementById('showGuest');
    this.logoutButton = document.getElementById('logoutButton');
  }
  
  bindEvents() {
    // Form switching
    this.showSignup?.addEventListener('click', () => this.switchToSignup());
    this.showLogin?.addEventListener('click', () => this.switchToLogin());
    this.showGuest?.addEventListener('click', () => this.switchToGuest());
    
    // Authentication buttons
    this.loginButton?.addEventListener('click', () => this.login());
    this.signupButton?.addEventListener('click', () => this.signup());
    this.guestButton?.addEventListener('click', () => this.playAsGuest());
    this.logoutButton?.addEventListener('click', () => this.logout());
    
    // Enter key handling
    this.loginPassword?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.login();
    });
    
    this.signupPassword?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.signup();
    });
    
    this.guestUsernameInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.playAsGuest();
    });
  }
  
  switchToSignup() {
    this.hideAllForms();
    this.signupForm.style.display = 'block';
    this.hideError();
    this.signupUsername?.focus();
  }
  
  switchToLogin() {
    this.hideAllForms();
    this.loginForm.style.display = 'block';
    this.hideError();
    this.loginUsername?.focus();
  }
  
  switchToGuest() {
    this.hideAllForms();
    this.guestForm.style.display = 'block';
    this.hideError();
    this.guestUsernameInput?.focus();
  }
  
  hideAllForms() {
    this.loginForm.style.display = 'none';
    this.signupForm.style.display = 'none';
    if (this.guestForm) this.guestForm.style.display = 'none';
  }
  
  showError(message) {
    this.authError.textContent = message;
    this.authError.style.display = 'block';
  }
  
  hideError() {
    this.authError.style.display = 'none';
  }
  
  async checkAuthStatus() {
    try {
      const response = await fetch('/api/user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        this.setUser(data.user);
        this.hideAuthForm();
        if (window.gameInitialized) {
          window.initializeGame();
        }
        return true;
      }
    } catch (error) {
      console.log('No valid session found');
    }
    
    return false;
  }
  
  showMainMenu() {
    this.checkAuthStatus().then(authenticated => {
      if (!authenticated) {
        this.showAuthForm();
      }
    });
  }
  
  async login() {
    const username = this.loginUsername.value.trim();
    const password = this.loginPassword.value;
    
    if (!username || !password) {
      this.showError('Please enter both username and password');
      return;
    }
    
    this.loginButton.textContent = 'LOGGING IN...';
    this.loginButton.disabled = true;
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        this.setUser(data.user, data.token);
        this.hideAuthForm();
        // Initialize game with authenticated user
        this.hideAuthForm();
        if (window.gameInitialized) {
          window.initializeGame();
        }
      } else {
        this.showError(data.error || 'Login failed');
      }
    } catch (error) {
      this.showError('Network error. Please try again.');
    }
    
    this.loginButton.textContent = 'LOGIN';
    this.loginButton.disabled = false;
  }
  
  async signup() {
    const username = this.signupUsername.value.trim();
    const email = this.signupEmail.value.trim();
    const password = this.signupPassword.value;
    
    if (!username || !password) {
      this.showError('Username and password are required');
      return;
    }
    
    if (password.length < 6) {
      this.showError('Password must be at least 6 characters long');
      return;
    }
    
    this.signupButton.textContent = 'SIGNING UP...';
    this.signupButton.disabled = true;
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email: email || null, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        this.setUser(data.user, data.token);
        this.hideAuthForm();
        // Initialize game with authenticated user
        this.hideAuthForm();
        if (window.gameInitialized) {
          window.initializeGame();
        }
      } else {
        this.showError(data.error || 'Signup failed');
      }
    } catch (error) {
      this.showError('Network error. Please try again.');
    }
    
    this.signupButton.textContent = 'SIGN UP';
    this.signupButton.disabled = false;
  }
  
  async logout() {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.log('Logout error:', error);
    }
    
    this.clearUser();
    this.clearGuest();
    this.showAuthForm();
    
    // Disconnect from game if connected
    if (window.socket) {
      window.socket.disconnect();
    }
    
    // Force page reload to ensure complete logout
    setTimeout(() => {
      window.location.reload();
    }, 500);
  }
  
  setUser(user, token = null) {
    this.user = user;
    this.token = token;
    this.isAuthenticated = true;
    
    // Update user info display
    this.userDisplayName.textContent = user.username;
    this.userLevel.textContent = user.level;
    this.userCoins.textContent = user.coins;
    this.userXP.textContent = user.experience;
    
    // Calculate K/D ratio (we'll get stats later)
    this.userKD.textContent = '0.0';
    
    this.updateUserInfoDisplay();
  }
  
  clearUser() {
    this.user = null;
    this.token = null;
    this.isAuthenticated = false;
  }
  
  clearGuest() {
    this.isGuest = false;
    this.guestUsername = null;
  }
  
  playAsGuest() {
    const username = this.guestUsernameInput?.value?.trim();
    
    if (!username || username.length < 3) {
      this.showError('Guest username must be at least 3 characters long');
      return;
    }
    
    if (username.length > 20) {
      this.showError('Username must be 20 characters or less');
      return;
    }
    
    // Set up guest user
    this.isGuest = true;
    this.guestUsername = username;
    this.user = {
      id: null,
      username: username,
      level: 1,
      coins: 0,
      experience: 0
    };
    
    // Update display
    this.userDisplayName.textContent = username + ' (Guest)';
    this.userLevel.textContent = '1';
    this.userCoins.textContent = '0';
    this.userXP.textContent = '0';
    this.userKD.textContent = '0.0';
    
    // Hide shop and inventory for guests
    const shopButton = document.getElementById('shopButton');
    const inventoryButton = document.getElementById('inventoryButton');
    if (shopButton) shopButton.style.display = 'none';
    if (inventoryButton) inventoryButton.style.display = 'none';
    
    this.hideAuthForm();
    
    // Initialize game
    if (window.gameInitialized) {
      window.initializeGame();
    }
  }
  
  updateUserInfoDisplay() {
    if ((this.isAuthenticated && this.user) || this.isGuest) {
      this.userInfo.style.display = 'block';
    } else {
      this.userInfo.style.display = 'none';
    }
  }
  
  showAuthForm() {
    this.authContainer.style.display = 'block';
    this.hideError();
    // Default to guest form
    this.hideAllForms();
    if (this.guestForm) {
      this.guestForm.style.display = 'block';
      setTimeout(() => this.guestUsernameInput?.focus(), 100);
    } else {
      this.loginForm.style.display = 'block';
      setTimeout(() => this.loginUsername?.focus(), 100);
    }
  }
  
  hideAuthForm() {
    this.authContainer.style.display = 'none';
    this.updateUserInfoDisplay();
  }
  
  getAuthToken() {
    return this.token;
  }
  
  getUser() {
    return this.user;
  }
  
  isGuestUser() {
    return this.isGuest;
  }
  
  canAccessShop() {
    return this.isAuthenticated && !this.isGuest;
  }
  
  updateUserStats(stats) {
    if (stats && this.isAuthenticated) {
      const kd = stats.deaths > 0 ? (stats.kills / stats.deaths).toFixed(1) : stats.kills.toFixed(1);
      this.userKD.textContent = kd;
    }
  }
  
  updateUserCoins(coins) {
    if (this.isAuthenticated && this.user) {
      this.user.coins = coins;
      this.userCoins.textContent = coins;
    }
  }
  
  updateUserXP(experience, level) {
    if (this.isAuthenticated && this.user) {
      this.user.experience = experience;
      this.user.level = level;
      this.userXP.textContent = experience;
      this.userLevel.textContent = level;
    }
  }
}

// Global auth instance
window.gameAuth = new GameAuth();