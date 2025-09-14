// Shop and Inventory Management
class ShopManager {
  constructor() {
    this.isShopOpen = false;
    this.isInventoryOpen = false;
    this.activeTab = 'weapons';
    this.shopItems = [];
    this.playerInventory = [];
    this.playerCoins = 0;
    this.playerEquipped = {};
    
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Shop button
    document.getElementById('shopButton')?.addEventListener('click', () => this.openShop());
    document.getElementById('shopClose')?.addEventListener('click', () => this.closeShop());
    
    // Inventory button
    document.getElementById('inventoryButton')?.addEventListener('click', () => this.openInventory());
    document.getElementById('inventoryClose')?.addEventListener('click', () => this.closeInventory());
    
    // Close modals when clicking outside
    document.getElementById('shopModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'shopModal') this.closeShop();
    });
    
    document.getElementById('inventoryModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'inventoryModal') this.closeInventory();
    });
    
    // Tab switching for shop
    document.querySelectorAll('.shop-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchShopTab(btn.dataset.category);
      });
    });
    
    // Tab switching for inventory
    document.querySelectorAll('.inventory-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchInventoryTab(btn.dataset.category);
      });
    });
    
    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeShop();
        this.closeInventory();
      }
    });
  }

  async openShop() {
    this.isShopOpen = true;
    document.getElementById('shopModal').style.display = 'block';
    
    // Update player coin balance
    await this.updatePlayerBalance();
    
    // Load shop items
    await this.loadShopItems();
    
    // Show current tab
    this.switchShopTab(this.activeTab);
  }

  closeShop() {
    this.isShopOpen = false;
    document.getElementById('shopModal').style.display = 'none';
  }

  async openInventory() {
    this.isInventoryOpen = true;
    document.getElementById('inventoryModal').style.display = 'block';
    
    // Load player inventory
    await this.loadPlayerInventory();
    
    // Show current tab
    this.switchInventoryTab(this.activeTab);
  }

  closeInventory() {
    this.isInventoryOpen = false;
    document.getElementById('inventoryModal').style.display = 'none';
  }

  switchShopTab(category) {
    this.activeTab = category;
    
    // Update tab buttons
    document.querySelectorAll('.shop-tabs .tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === category);
    });
    
    // Filter and display items
    this.displayShopItems(category);
  }

  switchInventoryTab(category) {
    this.activeTab = category;
    
    // Update tab buttons
    document.querySelectorAll('.inventory-tabs .tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === category);
    });
    
    // Filter and display items
    this.displayInventoryItems(category);
  }

  async updatePlayerBalance() {
    try {
      const response = await fetch('/api/player/balance');
      if (response.ok) {
        const data = await response.json();
        this.playerCoins = data.coins;
        document.getElementById('shopCoins').textContent = this.playerCoins;
        document.getElementById('userCoins').textContent = this.playerCoins;
      }
    } catch (error) {
      console.error('Error updating player balance:', error);
    }
  }

  async loadShopItems() {
    try {
      const response = await fetch('/api/shop/items');
      if (response.ok) {
        this.shopItems = await response.json();
      } else {
        console.error('Failed to load shop items');
      }
    } catch (error) {
      console.error('Error loading shop items:', error);
    }
  }

  async loadPlayerInventory() {
    try {
      const response = await fetch('/api/player/inventory');
      if (response.ok) {
        const data = await response.json();
        this.playerInventory = data.items;
        this.playerEquipped = data.equipped;
      } else {
        console.error('Failed to load player inventory');
      }
    } catch (error) {
      console.error('Error loading player inventory:', error);
    }
  }

  displayShopItems(category) {
    const container = document.getElementById('shopItems');
    const filteredItems = this.shopItems.filter(item => item.category === category);
    
    container.innerHTML = filteredItems.map(item => this.createShopItemHTML(item)).join('');
    
    // Add event listeners to buy buttons
    container.querySelectorAll('.buy-button').forEach(btn => {
      btn.addEventListener('click', () => this.purchaseItem(parseInt(btn.dataset.itemId)));
    });
  }

  displayInventoryItems(category) {
    const container = document.getElementById('inventoryItems');
    const filteredItems = this.playerInventory.filter(item => item.category === category);
    
    if (filteredItems.length === 0) {
      container.innerHTML = '<div style="text-align: center; color: rgba(255, 255, 255, 0.5); padding: 40px;">No items in this category</div>';
      return;
    }
    
    container.innerHTML = filteredItems.map(item => this.createInventoryItemHTML(item)).join('');
    
    // Add event listeners to equip buttons
    container.querySelectorAll('.equip-button').forEach(btn => {
      btn.addEventListener('click', () => this.equipItem(parseInt(btn.dataset.itemId)));
    });
  }

  createShopItemHTML(item) {
    const canAfford = this.playerCoins >= item.price;
    const isOwned = this.playerInventory.some(inv => inv.item_id === item.id);
    
    return `
      <div class="shop-item" data-item-id="${item.id}">
        <div class="item-name">${item.name}</div>
        <div class="item-description">${item.description}</div>
        ${this.createItemStatsHTML(item)}
        <div class="item-price">
          <span class="price">${item.price} coins</span>
        </div>
        <button class="buy-button" 
                data-item-id="${item.id}" 
                ${!canAfford || isOwned ? 'disabled' : ''}>
          ${isOwned ? 'OWNED' : (canAfford ? 'BUY' : 'NOT ENOUGH COINS')}
        </button>
      </div>
    `;
  }

  createInventoryItemHTML(item) {
    const isEquipped = this.playerEquipped[item.category] === item.item_id;
    
    return `
      <div class="inventory-item ${isEquipped ? 'equipped' : ''}" data-item-id="${item.item_id}">
        <div class="item-name">${item.name}</div>
        <div class="item-description">${item.description}</div>
        ${this.createItemStatsHTML(item)}
        <button class="equip-button ${isEquipped ? 'equipped' : ''}" 
                data-item-id="${item.item_id}" 
                ${isEquipped ? 'disabled' : ''}>
          ${isEquipped ? 'EQUIPPED' : 'EQUIP'}
        </button>
      </div>
    `;
  }

  createItemStatsHTML(item) {
    if (!item.damage && !item.fire_rate && !item.accuracy && !item.range) {
      return '';
    }
    
    return `
      <div class="item-stats">
        ${item.damage ? `<div class="stat-item"><span class="stat-label">Damage:</span><span class="stat-value">${item.damage}</span></div>` : ''}
        ${item.fire_rate ? `<div class="stat-item"><span class="stat-label">Fire Rate:</span><span class="stat-value">${item.fire_rate}/s</span></div>` : ''}
        ${item.accuracy ? `<div class="stat-item"><span class="stat-label">Accuracy:</span><span class="stat-value">${item.accuracy}%</span></div>` : ''}
        ${item.range ? `<div class="stat-item"><span class="stat-label">Range:</span><span class="stat-value">${item.range}</span></div>` : ''}
      </div>
    `;
  }

  async purchaseItem(itemId) {
    try {
      const response = await fetch('/api/shop/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ itemId })
      });

      const result = await response.json();
      
      if (response.ok) {
        // Update player balance
        this.playerCoins = result.newBalance;
        document.getElementById('shopCoins').textContent = this.playerCoins;
        document.getElementById('userCoins').textContent = this.playerCoins;
        
        // Refresh shop items to show "OWNED" status
        this.displayShopItems(this.activeTab);
        
        // Show success message
        this.showMessage('Purchase successful!', 'success');
      } else {
        this.showMessage(result.error || 'Purchase failed', 'error');
      }
    } catch (error) {
      console.error('Error purchasing item:', error);
      this.showMessage('Network error during purchase', 'error');
    }
  }

  async equipItem(itemId) {
    try {
      const response = await fetch('/api/player/equip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ itemId })
      });

      const result = await response.json();
      
      if (response.ok) {
        // Update equipped items
        this.playerEquipped = result.equipped;
        
        // Refresh inventory display
        this.displayInventoryItems(this.activeTab);
        
        // Show success message
        this.showMessage('Item equipped!', 'success');
      } else {
        this.showMessage(result.error || 'Failed to equip item', 'error');
      }
    } catch (error) {
      console.error('Error equipping item:', error);
      this.showMessage('Network error while equipping', 'error');
    }
  }

  showMessage(message, type = 'info') {
    // Create a temporary message element
    const messageEl = document.createElement('div');
    messageEl.className = `shop-message ${type}`;
    messageEl.textContent = message;
    messageEl.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 2000;
      padding: 15px 20px;
      border-radius: 5px;
      color: white;
      font-weight: bold;
      background: ${type === 'success' ? '#00aa44' : type === 'error' ? '#aa0044' : '#0066aa'};
      opacity: 0;
      transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(messageEl);
    
    // Animate in
    setTimeout(() => messageEl.style.opacity = '1', 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      messageEl.style.opacity = '0';
      setTimeout(() => document.body.removeChild(messageEl), 300);
    }, 3000);
  }
}

// Initialize shop manager when DOM is ready
let shopManager;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    shopManager = new ShopManager();
  });
} else {
  shopManager = new ShopManager();
}