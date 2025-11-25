import { type UIDEntry, type User } from "@shared/schema";
import * as mongoManager from "./mongodb-manager";

export interface IStorage {
  // User management
  createUser(username: string, password: string, role: "admin" | "user"): Promise<User>;
  getUser(username: string): Promise<User | null>;
  verifyPassword(username: string, password: string): Promise<boolean>;
  
  // UID management
  addUID(uid: string, hours: number): Promise<UIDEntry>;
  removeUID(uid: string): Promise<boolean>;
  getUID(uid: string): Promise<UIDEntry | null>;
  listAllUIDs(): Promise<UIDEntry[]>;
  listActiveUIDs(): Promise<UIDEntry[]>;
  listExpiredUIDs(): Promise<UIDEntry[]>;
  cleanupExpiredUIDs(): Promise<number>;
  clearAllUIDs(): Promise<number>;
  getStatistics(): Promise<{ total: number; active: number; expired: number }>;
}

export class MongoDBStorage implements IStorage {
  // User management
  async createUser(username: string, password: string, role: "admin" | "user"): Promise<User> {
    return mongoManager.createUser(username, password, role);
  }

  async getUser(username: string): Promise<User | null> {
    return mongoManager.getUser(username);
  }

  async verifyPassword(username: string, password: string): Promise<boolean> {
    return mongoManager.verifyPassword(username, password);
  }

  // UID management
  async addUID(uid: string, hours: number): Promise<UIDEntry> {
    return mongoManager.addUID(uid, hours);
  }

  async removeUID(uid: string): Promise<boolean> {
    return mongoManager.removeUID(uid);
  }

  async getUID(uid: string): Promise<UIDEntry | null> {
    return mongoManager.getUID(uid);
  }

  async listAllUIDs(): Promise<UIDEntry[]> {
    const uids = await mongoManager.listAllUIDs();
    return uids.map(u => ({ uid: u.uid, expiry: u.expiry }));
  }

  async listActiveUIDs(): Promise<UIDEntry[]> {
    const uids = await mongoManager.listActiveUIDs();
    return uids.map(u => ({ uid: u.uid, expiry: u.expiry }));
  }

  async listExpiredUIDs(): Promise<UIDEntry[]> {
    const uids = await mongoManager.listExpiredUIDs();
    return uids.map(u => ({ uid: u.uid, expiry: u.expiry }));
  }

  async cleanupExpiredUIDs(): Promise<number> {
    return mongoManager.cleanupExpiredUIDs();
  }

  async clearAllUIDs(): Promise<number> {
    return mongoManager.clearAllUIDs();
  }

  async getStatistics(): Promise<{ total: number; active: number; expired: number }> {
    return mongoManager.getStatistics();
  }
}

export const storage = new MongoDBStorage();
