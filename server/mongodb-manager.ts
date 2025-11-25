import { MongoClient, Db, Collection } from "mongodb";
import bcryptjs from "bcryptjs";

const MONGODB_URI = "mongodb+srv://mohitsindhu122_db_user:wIhJ9x4i890SDIzk@uidbypass.v6khwik.mongodb.net/?retryWrites=true&w=majority&appName=uidbypass";
const DB_NAME = "uid_management";
const UIDS_COLLECTION = "uids";
const USERS_COLLECTION = "users";
const BOTS_COLLECTION = "discord_bots";

let db: Db | null = null;
let uidCollection: Collection | null = null;
let userCollection: Collection | null = null;
let botsCollection: Collection | null = null;

export async function connectMongoDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log("✅ Connected to MongoDB");
    db = client.db(DB_NAME);
    uidCollection = db.collection(UIDS_COLLECTION);
    userCollection = db.collection(USERS_COLLECTION);
    botsCollection = db.collection(BOTS_COLLECTION);
    
    // Create indexes
    await userCollection.createIndex({ username: 1 }, { unique: true });
    await botsCollection.createIndex({ token: 1 }, { unique: true });
    
    // Create default admin if not exists
    const adminExists = await userCollection.findOne({ username: "admin" });
    if (!adminExists) {
      const hashedPassword = await bcryptjs.hash("admin", 10);
      await userCollection.insertOne({ username: "admin", password: hashedPassword, role: "admin" });
      console.log("✅ Created default admin user");
    }
    
    return true;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    return false;
  }
}

export async function getUIDCollection() {
  if (!uidCollection) {
    await connectMongoDB();
  }
  return uidCollection;
}

export async function getUserCollection() {
  if (!userCollection) {
    await connectMongoDB();
  }
  return userCollection;
}

export async function getBotsCollection() {
  if (!botsCollection) {
    await connectMongoDB();
  }
  return botsCollection;
}

export interface UIDRecord {
  _id?: string;
  uid: string;
  expiry: number;
}

export interface UserRecord {
  _id?: string;
  username: string;
  password: string;
  role: "admin" | "user";
}

export interface BotRecord {
  _id?: string;
  token: string;
  name: string;
  status: "online" | "offline";
  lastHeartbeat: number;
  createdAt: number;
}

// User management
export async function createUser(username: string, password: string, role: "admin" | "user"): Promise<UserRecord> {
  const col = await getUserCollection();
  const existing = await col!.findOne({ username });
  if (existing) {
    throw new Error("User already exists");
  }
  
  if (!username || !password) {
    throw new Error("Username and password required");
  }
  
  const hashedPassword = await bcryptjs.hash(password, 10);
  const result = await col!.insertOne({ username, password: hashedPassword, role });
  return { _id: result.insertedId.toString(), username, password: hashedPassword, role };
}

export async function getUser(username: string): Promise<UserRecord | null> {
  const col = await getUserCollection();
  const user = await col!.findOne({ username });
  return user as UserRecord | null;
}

export async function verifyPassword(username: string, password: string): Promise<boolean> {
  const user = await getUser(username);
  if (!user) return false;
  return bcryptjs.compare(password, user.password);
}

export async function getUserRole(username: string): Promise<"admin" | "user" | null> {
  const user = await getUser(username);
  return user?.role || null;
}

// Bot management
export async function createBot(token: string, name: string): Promise<BotRecord> {
  const col = await getBotsCollection();
  const existing = await col!.findOne({ token });
  if (existing) {
    throw new Error("Bot token already registered");
  }
  
  const now = Math.floor(Date.now() / 1000);
  const result = await col!.insertOne({ token, name, status: "online", lastHeartbeat: now, createdAt: now });
  return { _id: result.insertedId.toString(), token, name, status: "online", lastHeartbeat: now, createdAt: now };
}

export async function getBot(token: string): Promise<BotRecord | null> {
  const col = await getBotsCollection();
  return col!.findOne({ token }) as Promise<BotRecord | null>;
}

export async function listBots(): Promise<BotRecord[]> {
  const col = await getBotsCollection();
  return col!.find({}).toArray() as Promise<BotRecord[]>;
}

export async function updateBotStatus(token: string, status: "online" | "offline"): Promise<void> {
  const col = await getBotsCollection();
  const now = Math.floor(Date.now() / 1000);
  await col!.updateOne({ token }, { $set: { status, lastHeartbeat: now } });
}

export async function deleteBot(token: string): Promise<boolean> {
  const col = await getBotsCollection();
  const result = await col!.deleteOne({ token });
  return result.deletedCount > 0;
}

// UID management
export async function addUID(uid: string, hours: number): Promise<UIDRecord> {
  const col = await getUIDCollection();
  const expiry = Math.floor(Date.now() / 1000) + hours * 3600;
  await col!.updateOne(
    { uid },
    { $set: { uid, expiry } },
    { upsert: true }
  );
  return { uid, expiry };
}

export async function removeUID(uid: string): Promise<boolean> {
  const col = await getUIDCollection();
  const result = await col!.deleteOne({ uid });
  return result.deletedCount > 0;
}

export async function getUID(uid: string): Promise<UIDRecord | null> {
  const col = await getUIDCollection();
  return col!.findOne({ uid }) as Promise<UIDRecord | null>;
}

export async function listAllUIDs(): Promise<UIDRecord[]> {
  const col = await getUIDCollection();
  return col!.find({}).toArray() as Promise<UIDRecord[]>;
}

export async function listActiveUIDs(): Promise<UIDRecord[]> {
  const col = await getUIDCollection();
  const now = Math.floor(Date.now() / 1000);
  return col!.find({ expiry: { $gt: now } }).toArray() as Promise<UIDRecord[]>;
}

export async function listExpiredUIDs(): Promise<UIDRecord[]> {
  const col = await getUIDCollection();
  const now = Math.floor(Date.now() / 1000);
  return col!.find({ expiry: { $lte: now } }).toArray() as Promise<UIDRecord[]>;
}

export async function cleanupExpiredUIDs(): Promise<number> {
  const col = await getUIDCollection();
  const now = Math.floor(Date.now() / 1000);
  const result = await col!.deleteMany({ expiry: { $lte: now } });
  return result.deletedCount;
}

export async function clearAllUIDs(): Promise<number> {
  const col = await getUIDCollection();
  const result = await col!.deleteMany({});
  return result.deletedCount;
}

export async function getStatistics(): Promise<{ total: number; active: number; expired: number }> {
  const col = await getUIDCollection();
  const now = Math.floor(Date.now() / 1000);
  const total = await col!.countDocuments({});
  const active = await col!.countDocuments({ expiry: { $gt: now } });
  const expired = total - active;
  return { total, active, expired };
}
