import { pgTable, serial, varchar, integer, boolean, timestamp, text, real, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table - core player accounts
export const users = pgTable('users', {
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
export const user_stats = pgTable('user_stats', {
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
export const items = pgTable('items', {
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
export const user_items = pgTable('user_items', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => users.id).notNull(),
  item_id: integer('item_id').references(() => items.id).notNull(),
  is_equipped: boolean('is_equipped').default(false).notNull(),
  acquired_at: timestamp('acquired_at').defaultNow().notNull(),
  acquired_method: varchar('acquired_method', { length: 50 }).default('purchase').notNull() // 'purchase', 'battle_pass', 'achievement'
});

// Weapons and their stats
export const weapons = pgTable('weapons', {
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

// Game modes
export const game_modes = pgTable('game_modes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  max_players: integer('max_players').notNull(),
  min_players: integer('min_players').notNull(),
  duration_minutes: integer('duration_minutes'),
  map_size: integer('map_size').default(2000).notNull(),
  respawn_enabled: boolean('respawn_enabled').default(true).notNull(),
  friendly_fire: boolean('friendly_fire').default(false).notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  coins_reward_base: integer('coins_reward_base').default(10).notNull(),
  experience_reward_base: integer('experience_reward_base').default(25).notNull()
});

// Battle pass seasons
export const battle_pass_seasons = pgTable('battle_pass_seasons', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  start_date: timestamp('start_date').notNull(),
  end_date: timestamp('end_date').notNull(),
  max_level: integer('max_level').default(100).notNull(),
  is_active: boolean('is_active').default(false).notNull(),
  premium_price: integer('premium_price').default(1000).notNull(), // coins
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Battle pass tiers and rewards
export const battle_pass_tiers = pgTable('battle_pass_tiers', {
  id: serial('id').primaryKey(),
  season_id: integer('season_id').references(() => battle_pass_seasons.id).notNull(),
  tier_level: integer('tier_level').notNull(),
  required_experience: integer('required_experience').notNull(),
  free_reward_type: varchar('free_reward_type', { length: 50 }), // 'coins', 'item', 'experience'
  free_reward_amount: integer('free_reward_amount'),
  free_reward_item_id: integer('free_reward_item_id').references(() => items.id),
  premium_reward_type: varchar('premium_reward_type', { length: 50 }),
  premium_reward_amount: integer('premium_reward_amount'),
  premium_reward_item_id: integer('premium_reward_item_id').references(() => items.id)
});

// User battle pass progress
export const user_battle_pass = pgTable('user_battle_pass', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => users.id).notNull(),
  season_id: integer('season_id').references(() => battle_pass_seasons.id).notNull(),
  current_tier: integer('current_tier').default(1).notNull(),
  current_experience: integer('current_experience').default(0).notNull(),
  is_premium: boolean('is_premium').default(false).notNull(),
  premium_purchased_at: timestamp('premium_purchased_at'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Purchase history
export const purchases = pgTable('purchases', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => users.id).notNull(),
  item_id: integer('item_id').references(() => items.id),
  purchase_type: varchar('purchase_type', { length: 50 }).notNull(), // 'item', 'battle_pass', 'coins'
  coins_spent: integer('coins_spent').notNull(),
  purchased_at: timestamp('purchased_at').defaultNow().notNull()
});

// Game sessions
export const game_sessions = pgTable('game_sessions', {
  id: serial('id').primaryKey(),
  user_id: integer('user_id').references(() => users.id).notNull(),
  game_mode_id: integer('game_mode_id').references(() => game_modes.id).notNull(),
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

// Relations
export const usersRelations = relations(users, ({ many, one }) => ({
  stats: one(user_stats),
  items: many(user_items),
  purchases: many(purchases),
  battlePassProgress: many(user_battle_pass),
  gameSessions: many(game_sessions)
}));

export const userStatsRelations = relations(user_stats, ({ one }) => ({
  user: one(users, {
    fields: [user_stats.user_id],
    references: [users.id]
  })
}));

export const itemsRelations = relations(items, ({ many }) => ({
  userItems: many(user_items),
  purchases: many(purchases)
}));

export const userItemsRelations = relations(user_items, ({ one }) => ({
  user: one(users, {
    fields: [user_items.user_id],
    references: [users.id]
  }),
  item: one(items, {
    fields: [user_items.item_id],
    references: [items.id]
  })
}));

export const battlePassSeasonsRelations = relations(battle_pass_seasons, ({ many }) => ({
  tiers: many(battle_pass_tiers),
  userProgress: many(user_battle_pass)
}));

export const battlePassTiersRelations = relations(battle_pass_tiers, ({ one }) => ({
  season: one(battle_pass_seasons, {
    fields: [battle_pass_tiers.season_id],
    references: [battle_pass_seasons.id]
  })
}));

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UserStats = typeof user_stats.$inferSelect;
export type InsertUserStats = typeof user_stats.$inferInsert;
export type Item = typeof items.$inferSelect;
export type InsertItem = typeof items.$inferInsert;
export type UserItem = typeof user_items.$inferSelect;
export type InsertUserItem = typeof user_items.$inferInsert;
export type Weapon = typeof weapons.$inferSelect;
export type InsertWeapon = typeof weapons.$inferInsert;
export type GameMode = typeof game_modes.$inferSelect;
export type BattlePassSeason = typeof battle_pass_seasons.$inferSelect;
export type BattlePassTier = typeof battle_pass_tiers.$inferSelect;
export type UserBattlePass = typeof user_battle_pass.$inferSelect;
export type Purchase = typeof purchases.$inferSelect;
export type GameSession = typeof game_sessions.$inferSelect;