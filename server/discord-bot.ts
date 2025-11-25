import { Client, GatewayIntentBits, REST, Routes, CommandInteraction, EmbedBuilder } from "discord.js";
import * as mongoManager from "./mongodb-manager";

interface BotInstance {
  token: string;
  name: string;
  client: Client;
  isConnected: boolean;
  heartbeatInterval?: NodeJS.Timeout;
  reconnectAttempts: number;
}

const activeBots: Map<string, BotInstance> = new Map();
const MAX_RECONNECT_ATTEMPTS = 5;
const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export async function initializeBot(token: string, name: string) {
  console.log(`\n[BOT-INIT] Starting: "${name}"`);
  console.log(`[BOT-INIT] Token: ${token.substring(0, 25)}...`);

  if (activeBots.has(token)) {
    console.log(`[BOT-INIT] Already running`);
    return { success: false, message: "Bot already running" };
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.DirectMessages,
    ],
  });

  const botData: BotInstance = { token, name, client, isConnected: false, reconnectAttempts: 0 };
  activeBots.set(token, botData);

  return new Promise<{ success: boolean; message: string }>((resolve) => {
    let resolved = false;

    const cleanup = (msg: string, success: boolean) => {
      if (!resolved) {
        resolved = true;
        if (!success) {
          if (botData.heartbeatInterval) clearInterval(botData.heartbeatInterval);
          activeBots.delete(token);
          client.removeAllListeners();
          try {
            client.destroy();
          } catch (e) {}
        }
        resolve({ success, message: msg });
      }
    };

    // Start heartbeat when connected
    const startHeartbeat = () => {
      if (botData.heartbeatInterval) clearInterval(botData.heartbeatInterval);
      
      botData.heartbeatInterval = setInterval(async () => {
        if (botData.isConnected) {
          console.log(`[BOT-HEARTBEAT] "${name}" - ✅ ONLINE`);
        }
      }, HEARTBEAT_INTERVAL);
    };

    // Error handlers
    client.on("error", (err) => {
      console.error(`[BOT-ERROR] ${err.message}`);
      if (!botData.isConnected) {
        cleanup(`Error: ${err.message}`, false);
      }
    });

    client.on("shardError", (err) => {
      console.error(`[BOT-SHARD-ERROR] ${err.message}`);
    });

    client.on("disconnect", async () => {
      console.log(`[BOT-DISCONNECT] Bot disconnected, attempting reconnect...`);
      botData.isConnected = false;
      
      if (botData.heartbeatInterval) clearInterval(botData.heartbeatInterval);
      
      // Try to reconnect
      if (botData.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        botData.reconnectAttempts++;
        console.log(`[BOT-RECONNECT] Attempt ${botData.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
        
        setTimeout(() => {
          if (!botData.isConnected) {
            console.log(`[BOT-RECONNECT] Reconnecting...`);
            client.login(token).catch(err => console.error(`[BOT-RECONNECT-FAILED] ${err.message}`));
          }
        }, 5000);
      } else {
        console.error(`[BOT-RECONNECT-FAILED] Max reconnect attempts reached`);
      }

      mongoManager.updateBotStatus(token, "offline").catch(console.error);
    });

    client.on("warn", (msg) => {
      console.warn(`[BOT-WARN] ${msg}`);
    });

    // READY EVENT
    client.once("ready", async () => {
      console.log(`✅ [BOT-ONLINE] Bot ready!`);
      console.log(`   User: ${client.user?.username}#${client.user?.discriminator}`);
      console.log(`   ID: ${client.user?.id}`);

      botData.isConnected = true;
      botData.reconnectAttempts = 0;

      // Start heartbeat
      startHeartbeat();

      try {
        await registerCommands(token, client.user!.id);
        console.log(`✅ [BOT-COMMANDS] Registered`);
      } catch (err: any) {
        console.error(`[BOT-COMMANDS-ERROR] ${err.message}`);
      }

      try {
        await mongoManager.updateBotStatus(token, "online");
        console.log(`✅ [BOT-DB] Updated to online`);
      } catch (err: any) {
        console.error(`[BOT-DB-ERROR] ${err.message}`);
      }

      cleanup("Bot online", true);
    });

    // Resume event (for when connection resumes)
    client.on("resume", () => {
      console.log(`[BOT-RESUME] Connection resumed`);
      if (!botData.isConnected) {
        botData.isConnected = true;
        botData.reconnectAttempts = 0;
        startHeartbeat();
        mongoManager.updateBotStatus(token, "online").catch(console.error);
      }
    });

    // INTERACTION HANDLER
    client.on("interactionCreate", async (interaction: CommandInteraction) => {
      if (!interaction.isChatInputCommand()) return;

      console.log(`[CMD] @${interaction.user.username} -> /${interaction.commandName}`);

      const embed = new EmbedBuilder()
        .setColor(0x000000)
        .setFooter({ text: `UID Whitelist | ${name}` });

      try {
        if (interaction.commandName === "uid-add") {
          const uid = interaction.options.getString("uid");
          const hours = interaction.options.getNumber("hours") || 24;

          await mongoManager.addUID(uid!, hours);
          embed
            .setTitle("✅ UID Added")
            .setDescription(`\`${uid}\` added for **${hours}h**`)
            .setColor(0x00ff00);
          console.log(`[CMD-SUCCESS] Added: ${uid}`);
        } else if (interaction.commandName === "uid-delete") {
          const uid = interaction.options.getString("uid");
          const success = await mongoManager.removeUID(uid!);

          if (success) {
            embed
              .setTitle("✅ Deleted")
              .setDescription(`\`${uid}\` removed`)
              .setColor(0x00ff00);
            console.log(`[CMD-SUCCESS] Deleted: ${uid}`);
          } else {
            embed
              .setTitle("❌ Not Found")
              .setDescription(`\`${uid}\` not in system`)
              .setColor(0xff0000);
            console.log(`[CMD-FAIL] Not found: ${uid}`);
          }
        } else if (interaction.commandName === "uid-view") {
          const uids = await mongoManager.listAllUIDs();
          const now = Math.floor(Date.now() / 1000);

          embed.setTitle(`📋 All UIDs (${uids.length})`).setColor(0x0099ff);

          if (uids.length > 0) {
            uids.slice(0, 10).forEach((u) => {
              const remaining = Math.ceil((u.expiry - now) / 3600);
              const status = u.expiry > now ? "🟢" : "⚫";
              embed.addFields({
                name: u.uid,
                value: `${status} ${remaining}h left`,
                inline: false,
              });
            });
          }
          console.log(`[CMD-SUCCESS] Listed: ${uids.length} UIDs`);
        } else if (interaction.commandName === "uid-check") {
          const uid = interaction.options.getString("uid");
          const found = await mongoManager.getUID(uid!);
          const now = Math.floor(Date.now() / 1000);

          if (found && found.expiry > now) {
            const remaining = Math.ceil((found.expiry - now) / 3600);
            embed
              .setTitle("✅ Whitelisted")
              .setDescription(`\`${uid}\` ACTIVE • ${remaining}h`)
              .setColor(0x00ff00);
            console.log(`[CMD-SUCCESS] Check: ${uid} ACTIVE`);
          } else if (found) {
            embed
              .setTitle("⏰ Expired")
              .setDescription(`\`${uid}\` expired`)
              .setColor(0xffaa00);
            console.log(`[CMD-SUCCESS] Check: ${uid} EXPIRED`);
          } else {
            embed
              .setTitle("❌ Not Found")
              .setDescription(`\`${uid}\` not whitelisted`)
              .setColor(0xff0000);
            console.log(`[CMD-SUCCESS] Check: ${uid} NOT FOUND`);
          }
        }

        await interaction.reply({ embeds: [embed] });
      } catch (error: any) {
        console.error(`[CMD-ERROR] ${error.message}`);
        embed
          .setTitle("❌ Error")
          .setDescription(error.message)
          .setColor(0xff0000);
        try {
          await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (e) {
          console.error(`[CMD-REPLY-ERROR]`, e);
        }
      }
    });

    // LOGIN
    console.log(`[BOT-LOGIN] Calling client.login()...`);
    client.login(token).catch((err: any) => {
      console.error(`[BOT-LOGIN-FAILED] ${err.message}`);
      cleanup(`Login failed: ${err.message}`, false);
    });

    // 60 second timeout for initial connection
    setTimeout(() => {
      if (!botData.isConnected && !resolved) {
        console.error(`[BOT-TIMEOUT] No ready event after 60 seconds`);
        cleanup("Connection timeout", false);
      }
    }, 60000);
  });
}

async function registerCommands(token: string, clientId: string) {
  const rest = new REST().setToken(token);

  const commands = [
    {
      name: "uid-add",
      description: "Add a UID to whitelist",
      options: [
        { name: "uid", description: "UID to add", type: 3, required: true },
        {
          name: "hours",
          description: "Valid hours",
          type: 10,
          required: false,
        },
      ],
    },
    {
      name: "uid-delete",
      description: "Delete a UID from whitelist",
      options: [
        { name: "uid", description: "UID to delete", type: 3, required: true },
      ],
    },
    {
      name: "uid-view",
      description: "View all UIDs",
    },
    {
      name: "uid-check",
      description: "Check if UID is whitelisted",
      options: [
        { name: "uid", description: "UID to check", type: 3, required: true },
      ],
    },
  ];

  await rest.put(Routes.applicationCommands(clientId), { body: commands });
}

export function getBotStatus(token: string) {
  const bot = activeBots.get(token);
  return {
    isConnected: bot?.isConnected ?? false,
    name: bot?.name ?? "Unknown",
    status: bot?.isConnected ? "online" : "offline"
  };
}

export async function stopBot(token: string) {
  const bot = activeBots.get(token);
  if (!bot) return { success: false, message: "Bot not found" };

  try {
    if (bot.heartbeatInterval) clearInterval(bot.heartbeatInterval);
    await bot.client.destroy();
    activeBots.delete(token);
    await mongoManager.updateBotStatus(token, "offline");
    console.log(`[BOT-STOP] "${bot.name}" stopped`);
    return { success: true, message: `Bot "${bot.name}" stopped` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export function getAllActiveBots() {
  return Array.from(activeBots.values()).map(bot => ({
    name: bot.name,
    token: bot.token,
    isConnected: bot.isConnected,
    status: bot.isConnected ? "online" : "offline"
  }));
}

// Auto-reconnect all saved bots on server startup
export async function autoReconnectBots() {
  console.log(`\n[BOT-AUTOSTART] Loading saved bots from database...`);
  try {
    const bots = await mongoManager.listBots();
    console.log(`[BOT-AUTOSTART] Found ${bots.length} bots to reconnect`);

    for (const bot of bots) {
      console.log(`[BOT-AUTOSTART] Reconnecting: ${bot.name}`);
      initializeBot(bot.token, bot.name).catch(err => {
        console.error(`[BOT-AUTOSTART-ERROR] Failed to reconnect ${bot.name}: ${err.message}`);
      });
      await new Promise(r => setTimeout(r, 2000));
    }
  } catch (error: any) {
    console.error(`[BOT-AUTOSTART-ERROR] ${error.message}`);
  }
}
