// Discord Bot Handler - Manages multiple bot instances
// This is a simplified version due to discord.js complexity

interface BotInstance {
  token: string;
  name: string;
  isRunning: boolean;
  lastHeartbeat: number;
}

const activeBots: Map<string, BotInstance> = new Map();

export function startBotInstance(token: string, name: string): { success: boolean; message: string } {
  if (activeBots.has(token)) {
    return { success: false, message: "Bot already registered" };
  }

  activeBots.set(token, {
    token,
    name,
    isRunning: true,
    lastHeartbeat: Date.now(),
  });

  console.log(`✅ Bot "${name}" started with token`);
  return { success: true, message: "Bot instance created" };
}

export function stopBotInstance(token: string): { success: boolean; message: string } {
  if (!activeBots.has(token)) {
    return { success: false, message: "Bot not found" };
  }

  const bot = activeBots.get(token)!;
  bot.isRunning = false;
  activeBots.delete(token);

  console.log(`⛔ Bot stopped`);
  return { success: true, message: "Bot stopped" };
}

export function heartbeatBot(token: string): { success: boolean; message: string } {
  const bot = activeBots.get(token);
  if (!bot) return { success: false, message: "Bot not found" };

  bot.lastHeartbeat = Date.now();
  return { success: true, message: "Heartbeat received" };
}

export function getAllBots(): BotInstance[] {
  return Array.from(activeBots.values());
}

export function getBotStatus(token: string): BotInstance | null {
  return activeBots.get(token) || null;
}
