const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { db } = require('./database');
const { users, user_stats } = require('../shared/schema');
const { eq } = require('drizzle-orm');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required for security');
}
const JWT_EXPIRES_IN = '7d';

class AuthService {
  // Generate JWT token
  generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return null;
    }
  }

  // Hash password
  async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  }

  // Compare password
  async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  // Register new user
  async register(username, email, password) {
    try {
      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (existingUser.length > 0) {
        throw new Error('Username already exists');
      }

      if (email) {
        const existingEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (existingEmail.length > 0) {
          throw new Error('Email already exists');
        }
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create new user
      const [newUser] = await db.insert(users).values({
        username,
        email: email || null,
        password_hash: hashedPassword,
        coins: 1000, // Starting coins
        experience: 0,
        level: 1,
        created_at: new Date(),
        updated_at: new Date()
      }).returning();

      // Create user stats record
      await db.insert(user_stats).values({
        user_id: newUser.id,
        kills: 0,
        deaths: 0,
        games_played: 0,
        games_won: 0,
        total_damage: 0,
        time_played: 0,
        highest_kill_streak: 0,
        total_coins_earned: 0,
        created_at: new Date(),
        updated_at: new Date()
      });

      // Generate token
      const token = this.generateToken(newUser.id);

      // Return user without password
      const { password_hash, ...userWithoutPassword } = newUser;
      return { user: userWithoutPassword, token };
    } catch (error) {
      throw error;
    }
  }

  // Login user
  async login(username, password) {
    try {
      // Find user
      const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (!user) {
        throw new Error('Invalid username or password');
      }

      // Check password
      const isValid = await this.comparePassword(password, user.password_hash);
      if (!isValid) {
        throw new Error('Invalid username or password');
      }

      // Update last login
      await db.update(users).set({ 
        last_login: new Date(),
        updated_at: new Date()
      }).where(eq(users.id, user.id));

      // Generate token
      const token = this.generateToken(user.id);

      // Return user without password
      const { password_hash, ...userWithoutPassword } = user;
      return { user: userWithoutPassword, token };
    } catch (error) {
      throw error;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) {
        return null;
      }
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      return null;
    }
  }
}

// Authentication middleware
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.auth_token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const authService = new AuthService();
    const decoded = authService.verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = await authService.getUserById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
  }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.auth_token || req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const authService = new AuthService();
      const decoded = authService.verifyToken(token);
      
      if (decoded) {
        const user = await authService.getUserById(decoded.userId);
        if (user) {
          req.user = user;
        }
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

module.exports = { AuthService, authMiddleware, optionalAuthMiddleware };