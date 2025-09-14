const { pgTable, serial, varchar, integer, boolean, timestamp, text, real } = require('drizzle-orm/pg-core');
const { relations } = require('drizzle-orm');

// Users table - core player accounts
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 100 }).unique(),
  password_hash: varchar('password_hash', { length: 255 }),
  coins: integer('coins').default(1000).notNull(), // Starting coins
  experience: integer('experience').default(0).notNull(),
  level: integer('level').default(1).notNull(),
  avatar_url: varchar('avatar_url', { length: 255 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  last_login: timestamp('last_login'),
  is_premium: boolean('is_premium').default(false).notNull(),
  battle_pass_level: integer('battle_pass_level').default(0).notNull(),
  battle_pass_exp: integer('battle_pass_exp').default(0).notNull()
});

// Game statistics table
const user_stats = pgTable('user_stats', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => users.id).notNull(),
  kills: integer('kills').default(0).notNull(),
  deaths: integer('deaths').default(0).notNull(),
  games_played: integer('games_played').default(0).notNull(),
  games_won: integer('games_won').default(0).notNull(),
  total_damage: integer('total_damage').default(0).notNull(),
  time_played: integer('time_played').default(0).notNull(), // in seconds
  highest_kill_streak: integer('highest_kill_streak').default(0).notNull(),
  total_coins_earned: integer('total_coins_earned').default(0).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Items/skins/weapons available in the shop
const items = pgTable('items', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).notNull(), // 'skin', 'weapon', 'emote', 'trail', 'hat'
  category: varchar('category', { length: 50 }).notNull(), // 'player_skin', 'weapon_skin', 'accessory'
  price: integer('price').notNull(),
  rarity: varchar('rarity', { length: 20 }).default('common').notNull(), // 'common', 'rare', 'epic', 'legendary'
  image_url: varchar('image_url', { length: 255 }),
  is_available: boolean('is_available').default(true).notNull(),
  is_battle_pass_exclusive: boolean('is_battle_pass_exclusive').default(false).notNull(),
  required_level: integer('required_level').default(1).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// User's purchased/unlocked items
const user_items = pgTable('user_items', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => users.id).notNull(),
  item_id: integer('item_id').references(() => items.id).notNull(),
  is_equipped: boolean('is_equipped').default(false).notNull(),
  acquired_at: timestamp('acquired_at').defaultNow().notNull(),
  acquired_method: varchar('acquired_method', { length: 50 }).default('purchase').notNull() // 'purchase', 'battle_pass', 'achievement'
});

// Weapons and their stats
const weapons = pgTable('weapons', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  damage: integer('damage').notNull(),
  fire_rate: real('fire_rate').notNull(), // shots per second
  reload_time: real('reload_time').notNull(), // in seconds
  magazine_size: integer('magazine_size').notNull(),
  projectile_speed: real('projectile_speed').notNull(),
  accuracy: real('accuracy').notNull(), // 0.0 to 1.0
  range: real('range').notNull(),
  unlock_level: integer('unlock_level').default(1).notNull(),
  unlock_cost: integer('unlock_cost').default(0).notNull(),
  is_starter_weapon: boolean('is_starter_weapon').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Game sessions
const game_sessions = pgTable('game_sessions', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => users.id).notNull(),
  game_mode_id: integer('game_mode_id').default(1).notNull(),
  kills: integer('kills').default(0).notNull(),
  deaths: integer('deaths').default(0).notNull(),
  damage_dealt: integer('damage_dealt').default(0).notNull(),
  survival_time: integer('survival_time').default(0).notNull(), // in seconds
  placement: integer('placement'), // final ranking in the game
  coins_earned: integer('coins_earned').default(0).notNull(),
  experience_earned: integer('experience_earned').default(0).notNull(),
  started_at: timestamp('started_at').defaultNow().notNull(),
  ended_at: timestamp('ended_at')
});

module.exports = {
  users,
  user_stats,
  items,
  user_items,
  weapons,
  game_sessions
};