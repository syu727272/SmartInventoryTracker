import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertFavoriteSchema, SearchParams } from "@shared/schema";
import { z } from "zod";
import { fetchEvents, fetchEventById } from "./perplexityApi";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import MemoryStore from "memorystore";

// Set up session store
const SessionStore = MemoryStore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up session middleware
  app.use(
    session({
      store: new SessionStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      secret: process.env.SESSION_SECRET || "tokyo-event-finder-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      },
    })
  );

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure passport local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "User is not registered" });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: "Incorrect password" });
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  // Serialize and deserialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Auth middleware
  const isAuthenticated = (req: Request, res: Response, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      // Log the request body for debugging
      console.log("Registration request body:", req.body);
      
      // Validate with more detailed error handling
      let userData;
      try {
        userData = insertUserSchema.parse(req.body);
      } catch (zodError) {
        if (zodError instanceof z.ZodError) {
          console.error("Validation error:", zodError.errors);
          return res.status(400).json({ 
            message: "Input validation failed", 
            errors: zodError.errors.map(err => ({
              path: err.path.join('.'),
              message: err.message
            }))
          });
        }
        throw zodError;
      }
      
      const { username, password } = userData;
      
      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        username,
        password: hashedPassword,
      });
      
      console.log("User created successfully:", { id: user.id, username: user.username });
      
      // Omit password from response
      const { password: _, ...userWithoutPassword } = user;
      
      // Log in the user
      req.login(user, (err) => {
        if (err) {
          console.error("Login after registration failed:", err);
          return res.status(500).json({ message: "Login failed after registration" });
        }
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ 
        message: "Server error during registration", 
        error: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Server error" });
      }
      if (!user) {
        return res.status(401).json({ message: info.message || "Invalid credentials" });
      }
      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: "Login failed" });
        }
        // Omit password from response
        const { password, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    // Omit password from response
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });

  // Districts routes
  app.get("/api/districts", async (_req, res) => {
    try {
      const districts = await storage.getAllDistricts();
      res.json(districts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch districts" });
    }
  });

  // Events routes
  app.get("/api/events", async (req, res) => {
    try {
      // クエリパラメータを取得
      const dateFrom = req.query.dateFrom as string;
      const dateTo = req.query.dateTo as string;
      const district = req.query.district as string | undefined;

      // 日付パラメータのバリデーション
      if (!dateFrom || !dateTo) {
        return res.status(400).json({ message: "dateFrom and dateTo are required" });
      }

      // 日付形式の確認（YYYY-MM-DD形式かどうか）
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateFrom) || !dateRegex.test(dateTo)) {
        return res.status(400).json({ message: "Invalid date format. Please use YYYY-MM-DD format." });
      }

      // 日付の範囲チェック（dateFromがdateToより前であること）
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      if (fromDate > toDate) {
        return res.status(400).json({ message: "dateFrom must be before or equal to dateTo" });
      }

      const searchParams: SearchParams = {
        dateFrom,
        dateTo,
        district,
      };

      console.log("Searching events with params:", searchParams);
      const events = await fetchEvents(searchParams);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const event = await fetchEventById(id);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error fetching event details:", error);
      res.status(500).json({ message: "Failed to fetch event details" });
    }
  });

  // Favorites routes
  app.get("/api/favorites", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites/:eventId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { eventId } = req.params;
      
      // Check if already favorited
      const existing = await storage.getFavorite(userId, eventId);
      if (existing) {
        return res.status(400).json({ message: "Event already in favorites" });
      }
      
      // Add favorite
      await storage.addFavorite({
        userId,
        eventId,
      });
      
      res.status(201).json({ message: "Added to favorites" });
    } catch (error) {
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites/:eventId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { eventId } = req.params;
      
      // Remove favorite
      await storage.removeFavorite(userId, eventId);
      
      res.json({ message: "Removed from favorites" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove favorite" });
    }
  });

  app.get("/api/favorites/check/:eventId", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { eventId } = req.params;
      
      const favorite = await storage.getFavorite(userId, eventId);
      
      res.json({ isFavorite: !!favorite });
    } catch (error) {
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
