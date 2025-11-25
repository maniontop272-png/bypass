import { z } from "zod";

// User schema for multi-user authentication
export const userSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  role: z.enum(["admin", "user"]).default("user"),
});

export const insertUserSchema = userSchema;

// UID Whitelist schema - simple MongoDB model
export const uidSchema = z.object({
  uid: z.string().min(1, "UID is required"),
  expiry: z.number().min(0, "Expiry timestamp must be valid"),
});

export const insertUidSchema = z.object({
  uid: z.string().min(1, "UID is required"),
  hours: z.number().min(1, "Hours must be at least 1").default(24),
});

// Login schema for simple auth
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Auth response
export const authResponseSchema = z.object({
  success: z.boolean(),
  token: z.string(),
  role: z.enum(["admin", "user"]),
  username: z.string(),
});

// Infer types
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UIDEntry = z.infer<typeof uidSchema>;
export type InsertUID = z.infer<typeof insertUidSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
