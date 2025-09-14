const { db } = require('./server/database');
const { items, weapons } = require('./shared/schema');

async function populateShopItems() {
  try {
    console.log('Populating shop items...');

    // Add weapons
    const weaponItems = [
      {
        name: 'Assault Rifle',
        description: 'High damage, medium fire rate weapon perfect for medium-range combat',
        type: 'weapon',
        category: 'weapons',
        price: 500,
        rarity: 'common',
        is_available: true,
        required_level: 1
      },
      {
        name: 'Sniper Rifle',
        description: 'Long-range precision weapon with devastating damage',
        type: 'weapon',
        category: 'weapons',
        price: 1200,
        rarity: 'rare',
        is_available: true,
        required_level: 5
      },
      {
        name: 'Rapid Fire SMG',
        description: 'High fire rate submachine gun for close combat',
        type: 'weapon',
        category: 'weapons',
        price: 800,
        rarity: 'common',
        is_available: true,
        required_level: 3
      },
      {
        name: 'Heavy Cannon',
        description: 'Extremely powerful weapon with slow reload',
        type: 'weapon',
        category: 'weapons',
        price: 2000,
        rarity: 'epic',
        is_available: true,
        required_level: 10
      }
    ];

    // Add player skins
    const skinItems = [
      {
        name: 'Stealth Skin',
        description: 'Dark tactical skin for covert operations',
        type: 'skin',
        category: 'skins',
        price: 300,
        rarity: 'common',
        is_available: true,
        required_level: 1
      },
      {
        name: 'Neon Glow',
        description: 'Bright neon skin that glows in the dark',
        type: 'skin',
        category: 'skins',
        price: 600,
        rarity: 'rare',
        is_available: true,
        required_level: 3
      },
      {
        name: 'Golden Warrior',
        description: 'Luxurious golden skin for elite players',
        type: 'skin',
        category: 'skins',
        price: 1500,
        rarity: 'epic',
        is_available: true,
        required_level: 8
      }
    ];

    // Add upgrades
    const upgradeItems = [
      {
        name: 'Speed Boost',
        description: 'Increases movement speed by 20%',
        type: 'upgrade',
        category: 'upgrades',
        price: 400,
        rarity: 'common',
        is_available: true,
        required_level: 2
      },
      {
        name: 'Health Pack',
        description: 'Increases maximum health by 25 points',
        type: 'upgrade',
        category: 'upgrades',
        price: 700,
        rarity: 'rare',
        is_available: true,
        required_level: 4
      },
      {
        name: 'Rapid Fire',
        description: 'Reduces shooting cooldown by 30%',
        type: 'upgrade',
        category: 'upgrades',
        price: 900,
        rarity: 'rare',
        is_available: true,
        required_level: 6
      }
    ];

    const allItems = [...weaponItems, ...skinItems, ...upgradeItems];

    // Insert items into database
    for (const item of allItems) {
      await db.insert(items).values(item).onConflictDoNothing();
    }

    // Add weapon stats
    const weaponStats = [
      {
        name: 'Assault Rifle',
        damage: 35,
        fire_rate: 5.0,
        reload_time: 2.5,
        magazine_size: 30,
        projectile_speed: 12.0,
        accuracy: 0.85,
        range: 800.0,
        unlock_level: 1,
        unlock_cost: 500,
        is_starter_weapon: false
      },
      {
        name: 'Sniper Rifle',
        damage: 85,
        fire_rate: 1.0,
        reload_time: 4.0,
        magazine_size: 5,
        projectile_speed: 20.0,
        accuracy: 0.98,
        range: 1500.0,
        unlock_level: 5,
        unlock_cost: 1200,
        is_starter_weapon: false
      },
      {
        name: 'Rapid Fire SMG',
        damage: 22,
        fire_rate: 8.0,
        reload_time: 1.8,
        magazine_size: 40,
        projectile_speed: 10.0,
        accuracy: 0.70,
        range: 500.0,
        unlock_level: 3,
        unlock_cost: 800,
        is_starter_weapon: false
      },
      {
        name: 'Heavy Cannon',
        damage: 120,
        fire_rate: 0.5,
        reload_time: 6.0,
        magazine_size: 1,
        projectile_speed: 8.0,
        accuracy: 0.95,
        range: 1000.0,
        unlock_level: 10,
        unlock_cost: 2000,
        is_starter_weapon: false
      },
      {
        name: 'Basic Blaster',
        damage: 25,
        fire_rate: 3.0,
        reload_time: 2.0,
        magazine_size: 20,
        projectile_speed: 8.0,
        accuracy: 0.75,
        range: 600.0,
        unlock_level: 1,
        unlock_cost: 0,
        is_starter_weapon: true
      }
    ];

    // Insert weapon stats
    for (const weapon of weaponStats) {
      await db.insert(weapons).values(weapon).onConflictDoNothing();
    }

    console.log('Shop populated successfully!');
    console.log(`Added ${allItems.length} items and ${weaponStats.length} weapons`);

  } catch (error) {
    console.error('Error populating shop:', error);
  }
}

populateShopItems().then(() => {
  console.log('Done!');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
