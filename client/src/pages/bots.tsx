import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Circle, AlertTriangle, Copy, Check } from "lucide-react";

const createBotSchema = z.object({
  botToken: z.string().min(10, "Bot token is required"),
  name: z.string().min(1, "Bot name is required"),
});

type CreateBotForm = z.infer<typeof createBotSchema>;

interface Bot {
  _id?: string;
  token: string;
  name: string;
  status: "online" | "offline";
  lastHeartbeat: number;
  createdAt: number;
}

export default function BotManagement() {
  const { toast } = useToast();
  const [bots, setBots] = useState<Bot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedBot, setSelectedBot] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const form = useForm<CreateBotForm>({
    resolver: zodResolver(createBotSchema),
    defaultValues: { botToken: "", name: "" },
  });

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = () => {
    const username = localStorage.getItem("username");
    setIsAdmin(username === "admin");
    if (username === "admin") {
      loadBots();
    } else {
      setIsLoading(false);
    }
  };

  const loadBots = async () => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("/api/bots", {
        headers: { "Authorization": `Bearer ${token}` },
      });
      if (res.ok) {
        setBots(await res.json());
      }
    } catch (error) {
      console.error("Failed to load bots");
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: CreateBotForm) => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch("/api/bots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      toast({ title: "✓ Bot Added", description: `Bot "${data.name}" registered successfully` });
      form.reset();
      loadBots();
    } catch (error: any) {
      toast({ title: "✗ Error", description: error.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedBot) return;

    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`/api/bots/${selectedBot}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete");

      toast({ title: "✓ Bot Removed" });
      setSelectedBot(null);
      loadBots();
    } catch (error: any) {
      toast({ title: "✗ Error", description: error.message, variant: "destructive" });
    }
  };

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
    toast({ title: "Copied!", description: "Bot token copied to clipboard" });
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black p-4 md:p-8 flex items-center justify-center">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse opacity-40"></div>
        </div>
        <Card className="border-red-500/30 bg-red-900/10 backdrop-blur max-w-md relative z-10">
          <CardHeader>
            <div className="flex gap-3 items-start">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <CardTitle className="text-red-300">Admin Only</CardTitle>
                <CardDescription className="text-red-200/70">Only admins can manage Discord bots</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-4 md:p-8">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse opacity-40"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse opacity-40"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10 space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-white">Discord Bot Management</h1>
          <p className="text-gray-400 mt-2">Host and manage multiple Discord bots with UID management slash commands</p>
        </div>

        <Card className="border-white/20 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Register New Bot</CardTitle>
            <CardDescription className="text-gray-400">Add a Discord bot token to host it here</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-md">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Bot Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="My UID Bot"
                          className="border-white/20 bg-white/5 text-white placeholder:text-white/40 h-10"
                          data-testid="input-bot-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="botToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/70">Bot Token</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="MTA5NzM5NTc..."
                          type="password"
                          className="border-white/20 bg-white/5 text-white placeholder:text-white/40 h-10 font-mono text-sm"
                          data-testid="input-bot-token"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className="text-red-400 text-xs" />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full bg-white text-black hover:bg-white/90 h-10 font-semibold"
                  data-testid="button-add-bot"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Register Bot
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="border-white/20 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-white">Active Bots ({bots.length})</CardTitle>
            <CardDescription className="text-gray-400">Manage your hosted Discord bots</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-gray-400">Loading bots...</div>
            ) : bots.length === 0 ? (
              <div className="text-center py-12 text-gray-400">No bots registered yet. Add your first bot above!</div>
            ) : (
              <div className="space-y-3">
                {bots.map((bot) => (
                  <div
                    key={bot.token}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border border-white/10 bg-gray-950/50 hover:border-white/30 transition-all gap-3"
                    data-testid={`bot-row-${bot.token}`}
                  >
                    <div className="flex-1 flex items-start sm:items-center gap-3">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${bot.status === "online" ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-medium text-white truncate">{bot.name}</p>
                        <p className="text-xs text-gray-500 font-mono truncate">{bot.token.substring(0, 30)}...</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <div className="text-right">
                        <p className={`text-xs font-medium ${bot.status === "online" ? "text-green-400" : "text-gray-400"}`}>
                          {bot.status === "online" ? "🟢 Online" : "⚫ Offline"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(bot.lastHeartbeat * 1000).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToken(bot.token)}
                          className="px-3 py-1.5 rounded bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30 transition-all text-xs text-blue-300 font-medium flex items-center gap-1"
                          title="Copy token"
                        >
                          {copiedToken === bot.token ? (
                            <>
                              <Check className="w-3 h-3" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              Copy
                            </>
                          )}
                        </button>
                        <AlertDialog open={selectedBot === bot.token} onOpenChange={(open) => !open && setSelectedBot(null)}>
                          <Button
                            onClick={() => setSelectedBot(bot.token)}
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white h-8 px-3"
                            data-testid={`button-delete-bot-${bot.token}`}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                          {selectedBot === bot.token && (
                            <AlertDialogContent className="border-white/20 bg-black backdrop-blur">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-white">Remove Bot</AlertDialogTitle>
                                <AlertDialogDescription className="text-gray-300">
                                  Are you sure you want to remove "{bot.name}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="border-white/20 text-white">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" data-testid="button-confirm-delete-bot">
                                  Remove Bot
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          )}
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-blue-500/30 bg-blue-900/10 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-blue-300">Available Slash Commands</CardTitle>
            <CardDescription className="text-blue-200/70">Your bots support these commands in Discord</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded bg-white/5 border border-white/10">
                <p className="text-white font-mono text-sm">/uid-add</p>
                <p className="text-gray-400 text-xs">Add a UID with custom hours (default 24h)</p>
              </div>
              <div className="p-3 rounded bg-white/5 border border-white/10">
                <p className="text-white font-mono text-sm">/uid-delete</p>
                <p className="text-gray-400 text-xs">Remove a UID from whitelist</p>
              </div>
              <div className="p-3 rounded bg-white/5 border border-white/10">
                <p className="text-white font-mono text-sm">/uid-view</p>
                <p className="text-gray-400 text-xs">View all UIDs in system with status</p>
              </div>
              <div className="p-3 rounded bg-white/5 border border-white/10">
                <p className="text-white font-mono text-sm">/uid-check</p>
                <p className="text-gray-400 text-xs">Check if a specific UID is whitelisted</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
