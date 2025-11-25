import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, insertUidSchema } from "@shared/schema";
import * as mongoManager from "./mongodb-manager";
import * as discordBot from "./discord-bot";

interface SessionData {
  username: string;
  token: string;
  role: "admin" | "user";
}

const sessions: Map<string, SessionData> = new Map();

function generateToken(): string {
  return Math.random().toString(36).slice(2);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Login endpoint
  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const isValid = await storage.verifyPassword(credentials.username, credentials.password);
      
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const role = await mongoManager.getUserRole(credentials.username);
      const token = generateToken();
      sessions.set(token, { username: credentials.username, token, role: role || "user" });
      
      res.json({ 
        success: true, 
        token, 
        role: role || "user",
        username: credentials.username 
      });
    } catch (error) {
      res.status(400).json({ error: "Invalid request" });
    }
  });

  // Create user endpoint (admin only)
  app.post("/api/auth/create-user", async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      const session = sessions.get(token || "");
      
      if (!session || session.role !== "admin") {
        return res.status(403).json({ error: "Only admins can create users" });
      }
      
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }
      
      await storage.createUser(username, password, "user");
      res.json({ success: true, message: "User created successfully" });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create user" });
    }
  });

  // Middleware to verify token
  const verifyToken = (req: any, res: any, next: any) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token || !sessions.has(token)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.session = sessions.get(token);
    next();
  };

  // Get all UIDs
  app.get("/api/uids", verifyToken, async (req, res) => {
    try {
      const uids = await storage.listAllUIDs();
      const now = Math.floor(Date.now() / 1000);
      
      const uidsWithStatus = uids.map(uid => ({
        ...uid,
        status: uid.expiry > now ? "active" : "expired",
        remainingHours: uid.expiry > now ? Math.ceil((uid.expiry - now) / 3600) : 0,
        expiryDate: new Date(uid.expiry * 1000).toISOString(),
      }));
      
      res.json(uidsWithStatus);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch UIDs" });
    }
  });

  // Get active UIDs only
  app.get("/api/uids/active", verifyToken, async (req, res) => {
    try {
      const uids = await storage.listActiveUIDs();
      const now = Math.floor(Date.now() / 1000);
      
      const uidsWithStatus = uids.map(uid => ({
        ...uid,
        status: "active",
        remainingHours: Math.ceil((uid.expiry - now) / 3600),
        expiryDate: new Date(uid.expiry * 1000).toISOString(),
      }));
      
      res.json(uidsWithStatus);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch active UIDs" });
    }
  });

  // Add new UID
  app.post("/api/uids", verifyToken, async (req, res) => {
    try {
      const { uid, hours } = req.body;
      if (!uid || !hours) {
        return res.status(400).json({ error: "UID and hours required" });
      }
      
      // Check if UID already exists
      const existing = await storage.getUID(uid);
      if (existing) {
        return res.status(409).json({ error: "UID already exists" });
      }
      
      const result = await storage.addUID(uid, hours);
      res.json({
        ...result,
        status: "active",
        remainingHours: hours,
        expiryDate: new Date(result.expiry * 1000).toISOString(),
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to add UID" });
    }
  });

  // Update UID expiry
  app.patch("/api/uids/:uid", verifyToken, async (req, res) => {
    try {
      const { uid } = req.params;
      const hours = req.body.hours || 24;
      
      const result = await storage.addUID(uid, hours);
      const now = Math.floor(Date.now() / 1000);
      
      res.json({
        ...result,
        status: result.expiry > now ? "active" : "expired",
        remainingHours: result.expiry > now ? Math.ceil((result.expiry - now) / 3600) : 0,
        expiryDate: new Date(result.expiry * 1000).toISOString(),
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to update UID" });
    }
  });

  // Delete UID
  app.delete("/api/uids/:uid", verifyToken, async (req, res) => {
    try {
      const { uid } = req.params;
      const success = await storage.removeUID(uid);
      
      if (!success) {
        return res.status(404).json({ error: "UID not found" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to delete UID" });
    }
  });

  // Cleanup expired UIDs
  app.post("/api/cleanup", verifyToken, async (req, res) => {
    try {
      const count = await storage.cleanupExpiredUIDs();
      res.json({ success: true, deletedCount: count });
    } catch (error: any) {
      res.status(500).json({ error: error.message || "Failed to cleanup" });
    }
  });

  // Get statistics
  app.get("/api/stats", verifyToken, async (req, res) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch statistics" });
    }
  });

  // Bot management endpoints
  app.post("/api/bots", async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      const session = sessions.get(token || "");
      if (!session || session.role !== "admin") {
        return res.status(403).json({ error: "Only admins can manage bots" });
      }

      const { botToken, name } = req.body;
      if (!botToken || !name) {
        return res.status(400).json({ error: "Bot token and name required" });
      }

      const bot = await mongoManager.createBot(botToken, name);
      
      // Initialize Discord bot in background (don't wait for it)
      console.log(`[ROUTE] Bot registered, starting Discord connection in background...`);
      discordBot.initializeBot(botToken, name).then((result) => {
        console.log(`[ROUTE] Bot init result:`, result);
      }).catch((err) => {
        console.error(`[ROUTE] Bot init error:`, err);
      });

      res.json({ success: true, bot });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to create bot" });
    }
  });

  app.get("/api/bots", async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      const session = sessions.get(token || "");
      if (!session || session.role !== "admin") {
        return res.status(403).json({ error: "Only admins can view bots" });
      }

      const bots = await mongoManager.listBots();
      // Enhance each bot with real connection status
      const enrichedBots = bots.map(bot => {
        const realStatus = discordBot.getBotStatus(bot.token);
        return {
          ...bot,
          realStatus: realStatus.status,
          isConnected: realStatus.isConnected
        };
      });
      res.json(enrichedBots);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch bots" });
    }
  });

  app.delete("/api/bots/:token", async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      const session = sessions.get(token || "");
      if (!session || session.role !== "admin") {
        return res.status(403).json({ error: "Only admins can delete bots" });
      }

      const success = await mongoManager.deleteBot(req.params.token);
      if (!success) return res.status(404).json({ error: "Bot not found" });

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/bots/:token/status", async (req, res) => {
    try {
      const { status } = req.body;
      await mongoManager.updateBotStatus(req.params.token, status);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Diagnostic endpoint - check actual bot connection status
  app.get("/api/bots/status/check", async (req, res) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      const session = sessions.get(token || "");
      if (!session || session.role !== "admin") {
        return res.status(403).json({ error: "Admin only" });
      }

      const bots = await mongoManager.listBots();
      const statusInfo = bots.map(bot => {
        const realStatus = discordBot.getBotStatus(bot.token);
        return {
          name: bot.name,
          token: bot.token.substring(0, 20) + "...",
          dbStatus: bot.status,
          actualStatus: realStatus.connected ? "CONNECTED" : "DISCONNECTED",
          realStatus: realStatus,
          lastUpdate: new Date(realStatus.lastUpdate).toLocaleString()
        };
      });

      res.json({ bots: statusInfo, allBots: discordBot.getAllBots() });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
